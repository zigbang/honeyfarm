import Logger from "./logger"
import { DeviceGroupType, BMS_CMD } from "./util/types"
import BMS from "./bms"

enum STATE {
	IDLE = "IDLE",
	RUNNING = "RUNNING",
	STOP = "STOP",
	TERMINATE = "TERMINATE",
	BUSY = "BUSY",
	ERROR = "ERROR",
	ERROR_WAIT = "ERROR_WAIT",
}

export default class Timer {

	private flag_timers = false;
	private enabled_timers_ = {};
	private device_groups_: DeviceGroupType[] = [];

	private readonly CLOCK_TERM = 5_000 // 1 * 60 * 1000
	private readonly CHARGE_TERM: number = 15_000//1 * 60 * 1000;	// 2h
	private readonly DISCHARGE_TERM: number = 20_000// 2 * 60 * 1000;	// 4h
	private readonly ERROR_WAIT_TERM: number = 40_000 // 15 * 60 * 1000;	// 4h

	constructor(device_groups: DeviceGroupType[]) {
		this.device_groups_ = device_groups
		this.clockTimers()
		const time_handle_ = setInterval(() => {
			this.clockTimers()
		}, this.CLOCK_TERM)

	}

	private findDeviceGroup(groupName: string) {
		return this.device_groups_.filter(dg => { return dg.name === groupName })[0];
	}

	public watchEnableTimers(groups?: DeviceGroupType[]) {
		if (groups) {
			this.set_device_groups_(groups)
		}
		this.device_groups_.forEach(group => {
			if (true === group.enable_timer) {
				//timer 없으면 -> 초기화 / 있으면 -> don`t care
				if (false === this.enabled_timers_.hasOwnProperty(group.name)) {
					this.enabled_timers_[group.name] = { "state": STATE.IDLE };
				}
			} else {
				//timer 있으면 -> 제거 / 없으면 -> don`t care
				if (true === this.enabled_timers_.hasOwnProperty(group.name)) {
					//stop -> terminate loop 태우기.
					const timer = this.enabled_timers_[group.name];
					if (undefined !== timer) {
						this.enabled_timers_[group.name]["state"] = STATE.STOP;
					}
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

			let state = this.enabled_timers_[gn]["state"]
			if (state === undefined) {
				Logger.error(`manageTimers error: State of timer for ${gn} is undefined`)
				return;
			}
			//Logger.info(JSON.stringify(state))
			Logger.info(`State of timer for ${gn} is ${state}`)
			if (STATE.RUNNING === state || STATE.ERROR_WAIT === state || STATE.BUSY === state) {
				// don`t add any task while running, waiting for error resolving, stopping or terminating
			} else if (STATE.IDLE === state) {
				// run timer
				this.runTimer(deviceGroup);
				this.enabled_timers_[gn]["state"] = STATE.RUNNING
			} else if (STATE.STOP === state) {
				//start to clear clocks
				this.stopTimer(gn)
			} else if (STATE.TERMINATE === state) {
				// start terminating 
				//remove this groupname from enabled_timers_
				this.terminateTimer(deviceGroup)
			} else if (STATE.ERROR === state) {
				this.handleErrorTimer(deviceGroup)
			}
		})
	}

	private async runTimer(group: DeviceGroupType) {
		let term
		let status
		const res = await BMS.operateBatteryCommand(group.controller_endpoint, BMS_CMD.POWER_STATUS)
		if (res && res.data && res.data.hasOwnProperty("POWER")) {
			status = res.data["POWER"]
			term = 'OFF' === status ? this.DISCHARGE_TERM : this.CHARGE_TERM
		} else {
			Logger.error(`Timer error during checking the power status for ${group.name}. This timer will be terminated.\n`)
			this.enabled_timers_[group.name]["state"] = STATE.ERROR
			//	this.stopTimer(group.name)
			return;
		}
		this.enabled_timers_[group.name]["timeout"] = setTimeout(async () => {
			const res = await BMS.operateBatteryCommand(group.controller_endpoint, BMS_CMD.POWER_TOGGLE)
			if (res && res.data && res.data.hasOwnProperty("POWER")) {
				this.idleTimer(group.name);
				this.enabled_timers_[group.name]["state"] = STATE.IDLE
			} else {
				Logger.error(`Timer error during power toggling for ${group.name}. This timer will be terminated.\n`)
				//start termination
				this.enabled_timers_[group.name]["state"] = STATE.ERROR
			}
		}, term)
		Logger.info(`RUNNING:${this.enabled_timers_[group.name]["timeout"]}`)
	}
	private idleTimer(groupName: string) {
		const timer = this.enabled_timers_[groupName]
		if (undefined === timer) {
			Logger.info(`The timer for ${groupName} have already deleted from the list "enabled_timers_".`);
			return;
		}
		clearTimeout(timer["timeout"])
		delete this.enabled_timers_[groupName].timeout
		return;
	}

	private stopTimer(groupName: string) {
		this.enabled_timers_[groupName]["state"] = STATE.BUSY
		const timer = this.enabled_timers_[groupName]
		if (undefined === timer) {
			Logger.info(`The timer for ${groupName} is undefined in the object "enabled_timers_".`);
			return;
		}
		Logger.info(`STOPPING: ${this.enabled_timers_[groupName]["timeout"]}`)
		clearTimeout(timer["timeout"])
		delete this.enabled_timers_[groupName].timeout
		this.enabled_timers_[groupName]["state"] = STATE.TERMINATE
		return;
	}

	private async terminateTimer(group: DeviceGroupType) {
		this.enabled_timers_[group.name]["state"] = STATE.BUSY
		let gn = group.name;
		const res = await BMS.operateBatteryCommand(group.controller_endpoint, BMS_CMD.POWER_ON)
		if (res && res.data && res.data.hasOwnProperty("POWER")) {
			Logger.info(`Successfully turned power on before timer for ${group.name} terminated\n`)
		} else {
			Logger.error(`Timer error during turn power on for ${group.name}. It may need to turn on this controller manually, or the devices can be discharged. \n`)
			this.enabled_timers_[group.name]["state"] = STATE.ERROR
			//alarm
		}
		// delete the group name in enabled_timers_ list
		delete this.enabled_timers_[gn]
	}
	private handleErrorTimer(group: DeviceGroupType) {
		//에러가 발생한 controller는 일정 clock 동안 bms 관련 어떠한 동작도 시키지 않는다. 
		//그렇다고 아예 대상에서 제거하면 단순 에러가 발생할 때마다 허니팜 노드를 재실행해야 하므로, ERROR_WAIT_TERM이 지나면 재동작의 기회를 부여한다.
		this.enabled_timers_[group.name]["state"] = STATE.ERROR_WAIT
		Logger.info(`After ${this.ERROR_WAIT_TERM}, timer for "${group.name}" controller would be started. \n`)
		setTimeout(() => {
			this.enabled_timers_[group.name]["state"] = STATE.IDLE
			Logger.info(`Error wait time is done, and "${group.name}" controller would be started. \n`)
		}, this.ERROR_WAIT_TERM)
	}
	public set_device_groups_(groups: DeviceGroupType[]) {
		this.device_groups_ = groups;
	}
}
