import Axios from "axios"

import Logger from "./logger"

export default class HoneyFramAPI {
    private SERVER_ADDRESS

    constructor(address: string) {
        this.SERVER_ADDRESS = address

        Logger.info(`Honey Farm Master ADDRESS: ${this.SERVER_ADDRESS}`)
    }

    public async registerDeviceStatus(port: string, platform: string, version: string, udid?: string, name?: string, wdaPort?: string, mjpegServerPort?: string, type?: string) {
		try {
			await Axios.post(`${this.SERVER_ADDRESS}/register`, {
					port,
					platform,
					version,
					udid,
					name,
					wdaPort,
					mjpegServerPort,
					type
            }, {
                headers: {
                    "Content-Type" : "application/json"
                }
			})
			
			return true
		} catch(e) {
			Logger.error(`Cannot Post: ${this.SERVER_ADDRESS}/register`)
			Logger.error(e)
		}
		return false	
	}

	public async deregisterDeviceStatus(port: string) {
		try {
			await Axios.post(`${this.SERVER_ADDRESS}/deregister`, {
					"port" : port
            }, {
                headers: {
                    "Content-Type" : "application/json"
                }
			})
			return true
		} catch(e) {
			Logger.error(`Cannot Post: ${this.SERVER_ADDRESS}/deregister`)
			Logger.error(e)
		}
		return false
	}

	public async getDevice(port: string, platform: string, version: string, udid?: string): Promise<boolean> {
		try {
			const result = await Axios.post(`${this.SERVER_ADDRESS}/device`, {
				port,
				platform,
				version,
				udid,
            })

			return result.data as boolean
		} catch(e) {
			Logger.error(`Cannot Post: ${this.SERVER_ADDRESS}/device`)
			Logger.error(e)
		}
		return false
	}
}
