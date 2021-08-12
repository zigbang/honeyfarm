import { Logger } from "@nestjs/common"
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
		//If environment vars are defined, use them.
		console.log(`[env variables]\nstatus: ${process.env.BMS_STATUS}/max: ${process.env.BMS_THRESHOLD_MAX}/min: ${process.env.BMS_THRESHOLD_MIN}`)
		if (process.env.BMS_STATUS || process.env.BMS_THRESHOLD_MAX || process.env.BMS_THRESHOLD_MIN) {
			this.setBatteryControlInfoByEnv()
		} else {
			//else use Yaml
			this.updateBatteryControlInfo(true)
			let cronReadBatteryConfig = setInterval(() => this.updateBatteryControlInfo(false), 300_000)
		}
	}
	async getBatteryControlInfo(): Promise<BatteryConfig> {
		let rst: BatteryConfig | undefined;
		rst = await this.cacheManager.get('batteryInfo')
		if (!rst) {
			// return default one when failed to get data from cacheManager
			Logger.log(`Fail to read the cached data. Instead, return default data`, 'BatteryService', false);
			return this.batteryControlInfo
		}
		return rst;
	}

	private async updateBatteryControlInfo(init?: boolean) {
		//Read From file
		const newBci = await this.readConfigYaml();
		const pastBci = this.batteryControlInfo;
		if (!init && JSON.stringify(newBci) === JSON.stringify(pastBci)) {
			//pass update logic when unchanged
			return;
		} else {
			//update
			this.batteryControlInfo = await this.cacheManager.set('batteryInfo', newBci);
			Logger.log(`"batteryConfig.yaml" is updated:\n${JSON.stringify(this.batteryControlInfo, null, 6)}`, 'BatteryService', false);
		}
	}

	private async setBatteryControlInfoByEnv() {
		let newBci: BatteryConfig = this.batteryControlInfo;
		let status = process.env.BMS_STATUS
		let maxStr = process.env.BMS_THRESHOLD_MAX
		let minStr = process.env.BMS_THRESHOLD_MIN
		let yamlFlag = status && maxStr && minStr
		if (status === "on" || status === "off") {
			newBci.status = status;
		}
		if (maxStr) {
			try {
				let max = Number.parseInt(maxStr);
				newBci.threshold.max = max
			} catch (e) {
				Logger.error("Fail to parse integer from given process.env.BMS_THRESHOLD_MAX. Instead, assign the default value.", e, "BatteryService", false)
			}
		}
		if (!minStr) {
		} else {
			try {
				let min = Number.parseInt(minStr);
				newBci.threshold.min = min
			} catch (e) {
				Logger.error("Fail to parse integer from given process.env.BMS_THRESHOLD_MIN. Instead, assign the default value.", e, "BatteryService", false)
			}
		}
		this.batteryControlInfo = await this.cacheManager.set('batteryInfo', newBci);
		Logger.log(`Configure BMS from environment variable:\n${JSON.stringify(this.batteryControlInfo, null, 6)}`, 'BatteryService', false);
	}

	private async readConfigYaml() {
		//test ecs environment variables
		if (fs.existsSync(`${process.cwd()}/conf/batteryConfig.yaml`)) {
			try {
				return yaml.load(fs.readFileSync(`${process.cwd()}/conf/batteryConfig.yaml`))
			} catch (e) {
				console.log(e)
				return undefined
			}
		} else {
			return undefined
		}
	}


}

