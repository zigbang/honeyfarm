import axios from "axios"
import Logger from "./logger"
import fs from "fs"
import path from "path"
import { DeviceGroupType, ResourceDictionaryType, PairType } from "./util/types"
import Timer from "./timer"
export default class BMS {

	private readonly SYNC_TERM: number = 15 * 60 * 10//00;	// 15min
	private readonly DEVICE_GROUP_PATH: string = "/conf/device_group.json";

	private timer_handle_ = null;
	private device_groups_: DeviceGroupType[] = [];
	private batteryLevelRange_: PairType = { first: 10, second: 100 };
	public timer: Timer

	constructor() {
		this.timer = new Timer(this.device_groups_);

		this.loadDeviceGroup()
		this.timer.watchEnableTimers()
		this.timer_handle_ = setInterval(() => {
			this.loadDeviceGroup()
			this.timer.watchEnableTimers(this.device_groups_)
		}, this.SYNC_TERM)

	}

	public setBatteryChargeLevelRange(min: number, max: number) {
		this.batteryLevelRange_ = { first: min, second: max }
	}

	private loadDeviceGroup(): void {
		const ABS_PATH = path.resolve() + this.DEVICE_GROUP_PATH;
		if (fs.existsSync(ABS_PATH)) {
			let data = fs.readFileSync(ABS_PATH, { encoding: 'utf-8' });
			try {
				let dg_data = JSON.parse(data);
				this.device_groups_ = dg_data["groups"]
			}
			catch (e) {
				Logger.error("invalid device_group.json file. check your configuration first!")
				Logger.error(e)
				clearInterval(this.timer_handle_);
			}
		}
		else {
			Logger.info("there is no device_group.json file.")
		}
	}

	private async operateBatterySwitch(endpoint: string, turn_on: boolean) {

		const command = turn_on ? "Power on" : "Power off"
		let query_str = `${endpoint}cm?cmnd=${command}`
		Logger.info(`operateBatterySwitch : endpoint=${endpoint} , turn_on=${turn_on}}`);

		try {
			let res = await axios.get(query_str);
			Logger.info(`sonoff response: ` + JSON.stringify(res.data));
		}
		catch (e) {
			Logger.error("operateBatterySwitch failed")
			Logger.error(e)
		}
	}

	public checkBatteryStatus(resources: ResourceDictionaryType): void {

		this.device_groups_.filter((group: DeviceGroupType) => group.is_bind_controller).forEach((group: DeviceGroupType) => {

			if (false === group.hasOwnProperty("devices") || 0 === group.devices.length) {
				Logger.warn(`checkBatteryStatus - invalid device group info. check your configuration. group_name:${group.name}`);
				return;
			}
			let count_exceed_max = 0;
			for (let i = 0; i < group.devices.length; i++) {

				const udid = group.devices[i];
				if (resources.hasOwnProperty(udid) && resources[udid].batteryLevel) {
					const battery_lv = resources[udid].batteryLevel;
					if (battery_lv <= this.batteryLevelRange_.first) {
						this.operateBatterySwitch(group.controller_endpoint, true)
						break;
					}
					else if (battery_lv >= this.batteryLevelRange_.second) {
						count_exceed_max++;
					}
				}
			}
			if (count_exceed_max > 0 && count_exceed_max === group.devices.length) {
				this.operateBatterySwitch(group.controller_endpoint, false)
			}
		});

	}

	static async operateBatteryCommand(endpoint: string, command: string) {
		let res = null;
		let query_str = `${endpoint}cm?cmnd=${command}`
		Logger.info(`operateBatteryCommand : endpoint=${endpoint}, command=${command}`);
		try {
			res = await axios.get(query_str);
			Logger.info(`sonoff response: ` + JSON.stringify(res.data));
		}
		catch (e) {
			Logger.error("operateBatteryCommand failed")
			Logger.error(e)
		}
		return res;
	}
}
