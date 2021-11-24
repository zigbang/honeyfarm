import Axios from "axios"
import { TimerState } from "./util/types"
import Logger from "./logger"

export default class HoneyFramAPI {
	private SERVER_ADDRESS

	constructor(address: string) {
		this.SERVER_ADDRESS = address

		Logger.info(`Honey Farm Master ADDRESS: ${this.SERVER_ADDRESS}`)
	}

	public async updateDeviceStatus(port: string, stat) {

		try {
			await Axios.put(`${this.SERVER_ADDRESS}/update`, { port, ...stat }, {
				headers: {
					"Content-Type": "application/json"
				}
			})

			return true
		} catch (e) {
			Logger.error(`Cannot Put: ${this.SERVER_ADDRESS}/update`)
			Logger.error(e)
		}
		return false
	}

	public async registerDeviceStatus(port: string, platform: string, version: string, udid?: string, name?: string, wdaPort?: string, mjpegServerPort?: string, type?: string, batteryLevel?: number) {
		try {
			let portStr = port.toString();
			let versionStr = version.toString();
			await Axios.post(`${this.SERVER_ADDRESS}/register`, {
				portStr,
				platform,
				versionStr,
				udid,
				name,
				wdaPort,
				mjpegServerPort,
				type,
				batteryLevel
			}, {
				headers: {
					"Content-Type": "application/json"
				}
			})

			return true
		} catch (e) {
			Logger.error(`Cannot Post: ${this.SERVER_ADDRESS}/register`)
			Logger.error(e)
		}
		return false
	}

	public async deregisterDeviceStatus(port: string) {
		try {
			let portStr = port.toString();
			await Axios.post(`${this.SERVER_ADDRESS}/deregister`, {
				"port": portStr
			}, {
				headers: {
					"Content-Type": "application/json"
				}
			})
			return true
		} catch (e) {
			Logger.error(`Cannot Post: ${this.SERVER_ADDRESS}/deregister`)
			Logger.error(e)
		}
		return false
	}

	public async getDevice(port: string, platform: string, version: string, udid?: string): Promise<boolean> {
		try {
			let portStr = port.toString();
			let versionStr = version.toString();
			const result = await Axios.post(`${this.SERVER_ADDRESS}/device`, {
				portStr,
				platform,
				versionStr,
				udid,
			})

			return result.data as boolean
		} catch (e) {
			Logger.error(`Cannot Post: ${this.SERVER_ADDRESS}/device`)
			Logger.error(e)
		}
		return false
	}

	public async getBatteryChargeRule() {
		try {
			const result = await Axios.get(`${this.SERVER_ADDRESS}/battery`)
			return result.data
		}
		catch (e) {
			Logger.error(`Cannot Post: ${this.SERVER_ADDRESS}/battery`)
			Logger.error(e)
		}
	}

	public async postBmsTimerState(timerStates: TimerState[]) {
		try {
			//console.log(timerStates)
			const result = await Axios.post(`${this.SERVER_ADDRESS}/bms/timer`, {
				timerStates: timerStates
			})
			return result.data
		}
		catch (e) {
			Logger.error(`Cannot Post: ${this.SERVER_ADDRESS}/bms/timer`)
			Logger.error(e)
		}
	}
}
