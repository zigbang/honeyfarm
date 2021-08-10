import axios from "axios"
import Logger from "./logger"
import fs from "fs"
import path from "path"
import { DeviceGroupType, ResourceDictionaryType, PairType } from "./util/types"

export default class BMS {

	private readonly SYNC_TERM: number = 15 * 60 * 1000;	// 15min
	private readonly DEVICE_GROUP_PATH: string = "/conf/device_group.json";

	private timer_handle_ = null;
	private device_groups_: DeviceGroupType[] = [];

	private batteryLevelRange_: PairType = { first: 10, second: 100 };
	constructor() {
		this.loadDeviceGroup()

		this.timer_handle_ = setInterval(() => this.loadDeviceGroup(), this.SYNC_TERM)
	}

	private loadDeviceGroup(): void {
		const ABS_PATH = path.resolve() + this.DEVICE_GROUP_PATH;
		if(fs.existsSync(ABS_PATH)) {
			let data = fs.readFileSync(ABS_PATH, { encoding: 'utf-8'});
			try {
				let dg_data = JSON.parse(data);
				this.device_groups_ = dg_data["groups"]
			}
			catch(e) {
				console.log("invalid device_group.json file. check your configuration first!");
				clearInterval(this.timer_handle_);
			}
		}
		else {
			console.log("no-file")
		}
	}

	private fetchBatterySwtichStatus() {
		// todo
	}

	private operateBatterySwitch(endpoint: string, turnOn: boolean) {

		// todo
	}

	public checkBatteryStatus(resourcesa: ResourceDictionaryType): void {
		
		let resources = {
			"R3CM80H4A8E": {
				batteryLevel: 55
			},
			"ce071717e10a9f1f047e": {
				batteryLevel: 55
			},
			"R3CN90NZ2SK": {
				batteryLevel: 55
			}
		}
		this.device_groups_.forEach((group: DeviceGroupType) => {

			console.log("group ", group.name);
			let count_exceed_max = 0;
			for(let i=0;i<group.devices.length;i++) {
				
				const udid = group.devices[i];
				if(resources.hasOwnProperty(udid) && resources[udid].batteryLevel) {
					const battery_lv = resources[udid].batteryLevel;
					if(battery_lv <= this.batteryLevelRange_.first) {
						console.log("turn on power")

						break;
					}
					else if(battery_lv >= this.batteryLevelRange_.second) {
						count_exceed_max++;
					}
				}
			}
			if(count_exceed_max > 0 && count_exceed_max === group.devices.length) {
				console.log("turn off power");
			}
		});
	}

} 