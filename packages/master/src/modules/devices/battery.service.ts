import { Inject, CACHE_MANAGER, Logger } from "@nestjs/common"
import * as fs from "fs"
import { Cache } from "cache-manager"
import { BatteryConfig } from "../../util/types"

const yaml = require('js-yaml')

export class BatteryService {
	private batteryControlInfo: BatteryConfig = {
		status: "on",
		threshold: {
			max: 80,
			min: 20
		},
	}
	constructor(private cacheManager: Cache) {
		this.updateBatteryControlInfo()
		let cronReadBatteryConfig = setInterval(() => this.updateBatteryControlInfo(), 300_000)
	}
	async getBatteryControlInfo(): Promise<BatteryConfig> {
		let rst: BatteryConfig | undefined;
		rst = await this.cacheManager.get('batteryInfo')
		if (!rst) {
			// return default one when failed to get data from cacheManager
			Logger.log(`Fail to read the cached data. Instead, return default data`, 'BatteryService');
			return this.batteryControlInfo
		}
		return rst;
	}

	private async updateBatteryControlInfo() {
		//Read From file
		const newBci = await this.readConfigYaml();
		const pastBci = this.batteryControlInfo;
		if (JSON.stringify(newBci) === JSON.stringify(pastBci)) {
			//pass update logic when unchanged
			return;
		} else {
			//update
			this.batteryControlInfo = await this.cacheManager.set('batteryInfo', newBci);
			Logger.log(`"batteryConfig.yaml" is updated:\n${JSON.stringify(this.batteryControlInfo, null, 6)}`, 'BatteryService');
		}

	}

	private async readConfigYaml() {
		//test ecs environment variables

		if (fs.existsSync(`${process.cwd()}/conf/batteryConfig.yaml`)) {
			try {
				return yaml.load(fs.readFileSync(`${process.cwd()}/conf/batteryConfig.yaml`))
			} catch (e) {
				return undefined
			}
		} else {
			return undefined
		}
	}


}

