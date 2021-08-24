import Logger from "./logger"
import { DeviceGroupType, BMS_CMD, TimerState, MODE_NAME } from "./util/types"
import BMS from "./bms"

enum STATE {
	IDLE = "IDLE",
	RUNNING = "RUNNING",
	STOP = "STOP",
	TERMINATE = "TERMINATE",
	WAIT = "WAIT",
	ERROR = "ERROR",
	SHUTTING_DOWN = "SHUTTING_DOWN",
}

export default class Timer {

	private flag_timers = false;
	private enabled_timers_ = {};
	private device_groups_: DeviceGroupType[] = [];
	private device_groups_buffer: DeviceGroupType[] = [];

	private readonly CLOCK_TERM = 15 * 60 * 1000 // 15m
	private readonly DEFAULT_CHARGE_TERM = 120 * 60 * 1000; // 120m, 2h
	private readonly ERROR_WAIT_TERM = 30 * 60 * 1000 // 30m

	constructor(device_groups: DeviceGroupType[]) {
		this.set_device_groups_(device_groups);
		this.clockTimers()
		const time_handle_ = setInterval(() => {
			this.clockTimers()
		}, this.CLOCK_TERM)
	}

	private findDeviceGroup(groupName: string) {
		const filteredList = this.get_device_groups_().filter(dg => { return dg.name === groupName });
		return filteredList.length < 1 ? null : filteredList[0];
	}

	private getTimerTerm(groupName: string) {
		const dg = this.findDeviceGroup(groupName);
		if (null === dg || false === dg.hasOwnProperty("mode")) {
			Logger.warn(`getTimerTerm(): mode is undefined in device_group.json. timer for ${groupName} would be end.`)
			return null;
		} else if (MODE_NAME.TIMER !== dg.mode.name) {
			Logger.warn(`getTimerTerm(): mode.name is not "timer" in device_group.json. timer for ${groupName} would be end.`)
			return null;
		} else if (false === dg.mode.hasOwnProperty("option")) {
			Logger.warn(`getTimerTerm(): mode.option is undefined. Instead, default term:${this.DEFAULT_CHARGE_TERM}(s) would be used.`)
			return this.DEFAULT_CHARGE_TERM;
		} else if (false === dg.mode.option.hasOwnProperty("timer_term")) {
			Logger.warn(`getTimerTerm(): mode.option.timer_term is undefined. Instead, default term:${this.DEFAULT_CHARGE_TERM}(s) would be used.`)
			return this.DEFAULT_CHARGE_TERM;
		} else if (dg.mode.option.hasOwnProperty("timer_term")) {
			let rawTerm = dg.mode.option.timer_term;
			if (Number.isSafeInteger(rawTerm) && rawTerm >= 1 && rawTerm <= 10) {
				//Logger.info(`timer.ts - getTimerTerm(): Timer term is set as ${rawTerm}(min) for "${groupName}".`)
				return rawTerm * 60 * 60 * 1000;//(ms -> hour)
			} else {
				Logger.warn(`getTimerTerm(): ${rawTerm} is not safe integer(Float, too large or zero). Instead, default term:${this.DEFAULT_CHARGE_TERM}(s) would be used for "${groupName}".`)
				return this.DEFAULT_CHARGE_TERM;
			}
		} else {
			Logger.warn(`getTimerTerm(): Invalid action - stop the timer for ${groupName}`)
			return null;
		}

	}

	public watchEnableTimers(groups?: DeviceGroupType[]) {
		if (groups) {
			this.set_device_groups_(groups)
		}
		this.get_device_groups_().forEach(group => {
			if (false === group.hasOwnProperty("name")) {
				return;
			} else if (!group.hasOwnProperty("mode") || !group.mode.hasOwnProperty("name") || group.mode.name !== "timer") {
				//timer 있으면 -> 제거 / 없으면 -> don`t care
				if (true === this.enabled_timers_.hasOwnProperty(group.name)) {
					//stop -> terminate loop 태우기.
					let timer = this.enabled_timers_[group.name];
					if (false === [STATE.TERMINATE, STATE.SHUTTING_DOWN, undefined].includes(timer.state)) {
						timer.state = STATE.STOP;
					}
				}
				return;
			} else if ("timer" === group.mode.name) {
				//enabled_timers_에 없으면 -> 초기화 / 있으면 -> don`t care
				if (false === this.enabled_timers_.hasOwnProperty(group.name)) {
					this.enabled_timers_[group.name] = { "state": STATE.IDLE };
				}
			}
		})
		if (0 < Object.keys(this.enabled_timers_).length) {
			this.flag_timers = true;
		} else {
			//None of controllers needs a timer. Put down the flag. 
			this.flag_timers = false;
		}
	}

	private clockTimers() {
		if (false === this.flag_timers) {
			return;
		}
		const timerEnabledGroupNames = Object.keys(this.enabled_timers_);
		timerEnabledGroupNames.forEach(gn => {
			const deviceGroup = this.findDeviceGroup(gn)
			if (null === deviceGroup) {
				Logger.error(`clockTimers() - error: device group "${gn}" is not found.`)
				delete this.enabled_timers_[gn]
				return;
			}
			let state = this.enabled_timers_[gn].state
			if (state === undefined) {
				Logger.error(`clockTimers() - error: State of timer for ${gn} is undefined, so this timer would be removed from enabled_timers_`)
				delete this.enabled_timers_[gn]
				return;
			}
			Logger.info(`clockTimers() - timer "${gn}": ${state}`)
			if (STATE.RUNNING === state || STATE.WAIT === state || STATE.SHUTTING_DOWN === state) {
				// don`t add any task while running, waiting for error resolving
			} else if (STATE.IDLE === state) {
				// run timer
				this.runTimer(deviceGroup);
			} else if (STATE.ERROR === state) {
				this.handleErrorTimer(deviceGroup)
			} else if (STATE.STOP === state) {
				//start to clear clocks
				this.stopTimer(gn)
			} else if (STATE.TERMINATE === state) {
				// start terminating 
				//remove this groupname from enabled_timers_
				this.terminateTimer(deviceGroup)
			}
		})
	}

	private async runTimer(group: DeviceGroupType) {
		let term
		let status
		let timerInfo = this.enabled_timers_[group.name]
		if (!timerInfo || !timerInfo.state) {
			Logger.error(`Timer Initialization Error: Timer for ${group.name} is undefined. This timer will be put into error cycle.\n`)
			timerInfo = { "state": STATE.ERROR };
			return;
		}
		timerInfo.state = STATE.WAIT
		const res = await BMS.operateBatteryCommand(group.controller_endpoint, BMS_CMD.POWER_STATUS)

		if (res && res.data && res.data.hasOwnProperty("POWER")) {
			status = res.data.POWER
			term = this.getTimerTerm(group.name)
			if (null === term) {
				Logger.error(`runTimer() - Timer mode or option arguments are missing. This timer(${group.name}) will be stopped.\n`)
				timerInfo.state = STATE.STOP;
				return;
			}
			//'OFF' === status ? this.DISCHARGE_TERM : this.CHARGE_TERM
		} else {
			if (false === [STATE.STOP, STATE.TERMINATE, STATE.SHUTTING_DOWN].includes(timerInfo.state)) {
				Logger.error(`runTimer() - Timer error during checking the power status for ${group.name}. This timer will be put into error cycle.\n`)
				timerInfo.state = STATE.ERROR
			}
			return;
		}
		timerInfo.timeout = setTimeout(async () => {
			const res = await BMS.operateBatteryCommand(group.controller_endpoint, BMS_CMD.POWER_TOGGLE)
			if (res && res.data && res.data.hasOwnProperty("POWER")) {
				this.idleTimer(group.name);
				timerInfo.state = STATE.IDLE
			} else {
				if (false === [STATE.STOP, STATE.TERMINATE, STATE.SHUTTING_DOWN].includes(timerInfo.state)) {
					Logger.error(`runTimer() - Timer error during power toggling for ${group.name}. This timer will be put into error cycle.\n`)
					timerInfo.state = STATE.ERROR
				}
			}
		}, term)
		Logger.info(`runTimer() - Timer for ${group.name} is set up.(${timerInfo.timeout})\n`)
		timerInfo.state = STATE.RUNNING
	}
	private idleTimer(groupName: string) {
		const timer = this.enabled_timers_[groupName]
		if (undefined === timer) {
			Logger.info(`idleTimer() - The timer for ${groupName} have already deleted from the list "enabled_timers_".`);
			return;
		}
		clearTimeout(timer.timeout)
		delete this.enabled_timers_[groupName].timeout
		return;
	}

	private stopTimer(groupName: string) {
		let timerInfo = this.enabled_timers_[groupName];
		if (undefined === timerInfo) {
			Logger.info(`stopTimer() - The timer for ${groupName} is undefined in the object "enabled_timers_".`);
			return;
		}
		Logger.info(`stopTimer() - STOPPING: ${timerInfo.timeout}`)

		clearTimeout(timerInfo.timeout)
		delete timerInfo.timeout

		timerInfo.state = STATE.TERMINATE
		return;
	}

	private async terminateTimer(group: DeviceGroupType) {
		const gn = group.name;
		const timerInfo = this.enabled_timers_[gn];
		timerInfo.state = STATE.SHUTTING_DOWN
		const res = await BMS.operateBatteryCommand(group.controller_endpoint, BMS_CMD.POWER_ON)
		if (res && res.data && res.data.hasOwnProperty("POWER")) {
			Logger.info(`terminateTimer() - Successfully turned power on before timer for ${gn} terminated\n`)
			delete this.enabled_timers_[gn]
		} else {
			Logger.error(`terminateTimer() - Failed to turn power on for "${gn}". It may need to be turned on manually, or the devices can be discharged. \n`)
			// anyway, terminate this timer without any state change.
			delete this.enabled_timers_[gn]
		}
		// delete the group name in enabled_timers_ list
	}
	private handleErrorTimer(group: DeviceGroupType) {
		//에러가 발생한 controller는 일정 clock 동안 bms 관련 어떠한 동작도 시키지 않는다. 
		//그렇다고 아예 대상에서 제거하면 단순 에러가 발생할 때마다 허니팜 노드를 재실행해야 하므로, ERROR_WAIT_TERM이 지나면 재동작의 기회를 부여한다.
		const gn = group.name;
		const timerInfo = this.enabled_timers_[gn];
		timerInfo.state = STATE.WAIT
		Logger.warn(`handleErrorTimer() - After ${this.ERROR_WAIT_TERM}, timer for "${gn}" controller would be started. \n`)
		if (timerInfo.timeout) {
			clearTimeout(timerInfo.timeout)
			delete timerInfo.timeout
		}
		timerInfo.timeout = setTimeout(() => {
			Logger.warn(`handleErrorTimer() - Error wait time is done, and "${gn}" controller would be started. \n`)
			clearTimeout(timerInfo.timeout)
			delete timerInfo.timeout
			this.enabled_timers_[gn].state = STATE.IDLE
		}, this.ERROR_WAIT_TERM)
	}
	public set_device_groups_(groups: DeviceGroupType[]) {
		this.device_groups_ = [...groups];
	}
	public get_device_groups_() {
		this.device_groups_buffer = [...this.device_groups_];
		return this.device_groups_buffer;
	}
	public get_enabled_timers_() {
		let rst: TimerState[] = []
		Object.keys(this.enabled_timers_).forEach((groupName) => {
			let dg = this.findDeviceGroup(groupName)
			rst.push({
				controller_name: groupName,
				state: this.enabled_timers_[groupName].state,
				timeout: this.enabled_timers_[groupName].timeout ?
					{
						_idleTimeout: this.enabled_timers_[groupName].timeout._idleTimeout,
						_idleStart: this.enabled_timers_[groupName].timeout._idleStart
					} : null,
			})
		})
		return rst;
	}
}
