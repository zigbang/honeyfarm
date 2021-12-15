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
		let rst;
		try {
			rst = await Axios.put(`${this.SERVER_ADDRESS}/update`, { port, ...stat }, {
				headers: {
					"Content-Type": "application/json"
				}
			})
			if ('ok' !== rst.data.result_code) {
				throw new Error(`updateDeviceStatus(): Failed/\n\t${JSON.stringify(rst.data)}`)
			}
			return true
		} catch (e) {
			Logger.error(`Cannot Put: ${this.SERVER_ADDRESS}/update`)
			Logger.error(e)
		}
		return false
	}

	public async registerDeviceStatus(port: string, platform: string, version: string, udid?: string, name?: string, wdaPort?: string, mjpegServerPort?: string, type?: string, batteryLevel?: number) {
		let rst;
		try {
			rst = await Axios.post(`${this.SERVER_ADDRESS}/register`, {
				port: port.toString(),
				platform,
				version: version.toString(),
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
			if ('ok' !== rst.data.result_code) {
				throw new Error(`registerDeviceStatus(): Failed/\n\t${JSON.stringify(rst.data)}`)
			}
			return true
		} catch (e) {
			Logger.error(`Cannot Post: ${this.SERVER_ADDRESS}/register`)
			Logger.error(e)
		}
		return false
	}

	public async deregisterDeviceStatus(port: string) {
		let rst;
		try {
			let portStr = port.toString();
			rst = await Axios.post(`${this.SERVER_ADDRESS}/deregister`, {
				port: portStr
			}, {
				headers: {
					"Content-Type": "application/json"
				}
			})
			if ('ok' !== rst.data.result_code) {
				throw new Error(`deregisterDeviceStatus(): Failed/\n\t${JSON.stringify(rst.data)}`)
			}

			return true
		} catch (e) {
			Logger.error(`Cannot Post: ${this.SERVER_ADDRESS}/deregister`)
			Logger.error(e)
		}
		return false
	}

	public async getDevice(port: string, platform: string, version: string, udid?: string): Promise<boolean> {
		let rst;
		try {
			let portStr = port.toString();
			let versionStr = version.toString();
			rst = await Axios.post(`${this.SERVER_ADDRESS}/device`, {
				port: portStr,
				platform,
				version: versionStr,
				udid,
			})
			if ('ok' !== rst.data.result_code) {
				throw new Error(`getDevice(): Failed/\n\t${JSON.stringify(rst.data)}`)
			}
			return true;
		} catch (e) {
			Logger.error(`Cannot Post: ${this.SERVER_ADDRESS}/device`)
			Logger.error(e)
		}
		return false
	}

	public async getBatteryChargeRule() {
		try {
			const rst = await Axios.get(`${this.SERVER_ADDRESS}/bms/info`)
			if ('ok' !== rst.data.result_code) {
				throw new Error(`updateDeviceStatus(): Failed/\n\t${JSON.stringify(rst.data)}`)
			}
			return rst.data.data[0]
		}
		catch (e) {
			Logger.error(`Cannot Get: ${this.SERVER_ADDRESS}/bms/info`)
			Logger.error(e)
		}
	}

	public async postBmsTimerState(timerStates: TimerState[]) {
		try {
			const rst = await Axios.post(`${this.SERVER_ADDRESS}/bms/timer`, {
				timerStates: timerStates
			})
			if ('ok' !== rst.data.result_code) {
				throw new Error(`updateDeviceStatus(): Failed/\n\t${JSON.stringify(rst.data)}`)
			}
			// console.log(rst.data)
			return rst.data
		}
		catch (e) {
			Logger.error(`Cannot Post: ${this.SERVER_ADDRESS}/bms/timer`)
			Logger.error(e)
		}
	}
}
