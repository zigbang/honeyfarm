import shelljs from "shelljs"
import cp from "child_process"
import commander from "commander"

import Logger from "./logger"
import API from "./api"
import { ResourceType, PortStatus, IOSDeviceInfo, iPhone_TYPE } from "./util/types"


export class node {
	private api: API
	private resources: { [serialNo: string]: ResourceType } = {}
	private maxDevices = 16
	private portMap: {[port: string]: PortStatus}= {}
	private isMacMachine = false
	private appiumDefaultPort = 4724
	private endpoint = "http://localhost:4723"
	private readonly wdaDefaultPort = 8101
	private readonly mjpegServerDefaultPort = 9101
	private iosDevice = undefined
	
	async run () {
		shelljs.config.silent = true
		commander
			.option('--endpoint <endpoint>', 'Setting endpoint')
			.option('--appiumBeginPort <appiumBeginPort>', 'Setting appium Begin port')
			.action(() => {
				this.endpoint = commander.endpoint || this.endpoint
				this.appiumDefaultPort = commander.appiumPort || this.appiumDefaultPort
			})
			.parse(process.argv)

		this.api = new API(this.endpoint)

		await this.init()

		await this.updateDeviceStatus()
	}

	private async init() {
		for(let i = 0; i < this.maxDevices; i++){
			this.portMap[this.appiumDefaultPort + i] = "FREE"
		}

		if (process.platform === "darwin") { 
			this.isMacMachine = true
			this.iosDevice = await this.getIosDeviceList()
			
			console.log(await this.iosDevice)
		}
	}

	private async getIosDeviceList() {
		return new Promise((resolve, reject) => {
			const nid = require("node-ios-device")
			nid.devices((err, devices) => {
				if(err) {
					reject(err)
				}
				else {
					resolve(devices)
				}
			})
		})
		
	}

	private async updateDeviceStatus() {
		const onlineSerials = await this.getOnlineSerials()
		Logger.info(`Discovered Devices: ${JSON.stringify(onlineSerials)}`)

		// 현재 등록된 디바이스 중 연결되지 않는 디바이스 제거
		await Promise.all(Object.keys(this.resources)
			.filter((serial) => !Object.keys(onlineSerials).includes(serial))
			.map(async (serial) => { await this.removeDevice(serial) })
		)
		
		// 현재 연결된 디바이스 중 클라이언트에 등록되지 않았을 경우
		await Promise.all(Object.entries<"ios" | "android">(onlineSerials).map(async ([key, value]) => {
			if (!this.resources[key]) {
				await this.addDeviceToLocal(key, value)
			} else {
				//테스트 중 appium server 죽는 이슈가 있는데 아직 정확한 원인을 알지 못해서 주기적으로 살리는 코드 추가
				const resource = this.resources[key]
				const checkAppiumServer = shelljs.exec(`lsof -i :${resource.port} -t`).stdout

				if (!checkAppiumServer) this.startAppiumServer(key, resource.port, resource.wdaPort)
			}

			if(value === "android") {
				this.updateBatteryLevel(key)
			}
		}))

		// 클라이언트에 등록된 디바이스 중 서버에 등록되지 않은 경우
		const unregisteredDevices = await Promise.all(
			Object.entries(this.resources).map(async ([serial, device]) => {
				const exist = await this.api.getDevice(device.port, device.platform, device.version, serial)
				if (!exist) {
					return serial
				} else {
					return undefined
				}
			})
		)

		await Promise.all(unregisteredDevices.map(async (serial) => {
			if (serial) {
				await this.addDeviceToServer(serial)
			}
		}))

		setTimeout(async () => {
			await this.updateDeviceStatus()
		}, 10000)
	}

	private async updateBatteryLevel(udid: string) {

		let remaining = -1
		let batteryLevel = shelljs.exec(`adb -s ${udid} shell dumpsys battery | grep level`).stdout
		if(batteryLevel.includes("level")) {
			let vals = batteryLevel.split(":")
			if(vals.length === 2) {
				remaining = parseInt(vals[1])
			}
		}

		this.resources[udid].batteryLevel = remaining
		const port = this.resources[udid].port
		console.log("batteryLevel : ", this.resources[udid])

		await this.api.updateDeviceStatus(port, {
			batteryLevel: remaining
		})
	}

	private async getOnlineSerials() {
		let serials = {}
		if (this.isMacMachine) {
			this.iosDevice = await this.getIosDeviceList()
			this.iosDevice.map((device: IOSDeviceInfo) => { serials[device.udid] = "ios" })
			this.getOnlineSimulator().map((device: IOSDeviceInfo) => { serials[device.udid] = "ios" })
		} 
		
		const devices = shelljs.exec("adb devices | grep -v devices").stdout
		const onlineDevices = devices.match(/(\w+-?\w+?)\tdevice$/gm) || []

		onlineDevices.map((device: string) => { serials[device.replace("\tdevice", "")] = "android" })

		return serials
	}

	private getOnlineSimulator(): IOSDeviceInfo[] {
		const result :IOSDeviceInfo[] = []
		
		const data = shelljs.exec(`xcrun simctl list devices --json`)
		const deviceList = JSON.parse(data.toString()) as { devices: {} }
		for (const [version, devices] of Object.entries(deviceList.devices)) {
			if (!version.includes("iOS")) {
				continue
			}
			for(const device of devices as { state: string, name: string, udid: string }[]) {
				if (device.state === "Booted") {
					const versionRex = version?.match(/\w+-\d+-\d+/g)
					result.push({
						udid: device.udid, 
						name: device.name, 
						productVersion: versionRex? versionRex[0].replace("iOS-","").replace("-",".") : "",
						type: "simulator"})
				}
			}
		}

		return result
	}

	private async addDeviceToLocal(serial: string, platform: "android" | "ios") {

		if(platform === "ios") {
			this.iosDevice = await this.getIosDeviceList()
		}
		const result = Object.entries(this.portMap).find(([port, status]) => status === "FREE")
		if (!result) {
			Logger.error(`All Ports Already in USED`)
			return
		}

		const [port, _] = result

		const wdaPort = this.wdaDefaultPort + Number(port) - this.appiumDefaultPort
		const mjpegServerPort = this.mjpegServerDefaultPort + Number(port) - this.appiumDefaultPort

		try {
			this.startAppiumServer(serial, port, wdaPort.toString())
			
			if (platform === "ios") {
				
				const devicelist = this.iosDevice.concat(this.getOnlineSimulator())
				const deviceInfo: IOSDeviceInfo = devicelist.filter((device: IOSDeviceInfo) => {return device.udid === serial})
				const name = deviceInfo[0]?.productType ? iPhone_TYPE[deviceInfo[0].productType] : deviceInfo[0].name

				this.resources[serial] = {
					platform,
					version: deviceInfo[0].productVersion,
					port,
					name: name,
					wdaPort: `${wdaPort}`,
					mjpegServerPort: `${mjpegServerPort}`,
					type: deviceInfo[0].type
				}
			} else {
				const platformVersion = shelljs.exec(`adb -s ${serial} shell getprop ro.build.version.release`).stdout.replace("\n", "").trim()
				const webviewVersion = shelljs.exec(`adb -s ${serial}  shell dumpsys package com.android.chrome | grep versionName`)
				.stdout.split("\n")[0]
				.replace("versionName=","")
				.match(/\d+\.\d+\.\d+/)[0]
				
				this.resources[serial] = {
					platform,
					version: platformVersion,
					port,
					webviewVersion
				}
			}
			
			this.portMap[port] = "USED"
			
			Logger.info(`Add Device(Local) ${serial} to Port ${port}`)
		} catch (e){
			Logger.error(`Error while Add Device to Local. Removing ${serial}`)
			Logger.error(e)
			this.removeDevice(serial)
		}
	}

	private startAppiumServer(serial: string, port: string, wdaPort: string) {
		try {
			Logger.info(`Starting Appium Server with Port:${port}`)
			const appiumOptions = ["-p", `${port}`, "--webdriveragent-port", `${wdaPort}`, "--relaxed-security"]
			const appium = cp.spawn("appium", appiumOptions, { detached: true })
			
			appium.stdout.on("data", (data) => {
				Logger.info(data)
			})
		} catch(e) {
			Logger.error(`Error while Add Device to Local. Removing ${serial}`)
			Logger.error(e)
			this.removeDevice(serial)
		}
	}

	private async addDeviceToServer(serial: string) {
		const device = this.resources[serial]
		
		if (!device) {
			Logger.error(`Trying to Add Device that are not registerd to local ${serial}`)
			return
		}

		try {
			Logger.info(`Adding Device(Server) ${serial} to Port ${device.port}`)
			await this.api.registerDeviceStatus(device.port, device.platform, device.version, serial, device.name, device.wdaPort, device.mjpegServerPort, device.type, device.batteryLevel)
			Logger.info(`Added Device(Server) ${serial} to Port ${device.port}`)
		} catch (e) {
			Logger.error(`Error while Add Device to Server`)
			Logger.error(e)
		}
	}

	private async removeDevice(serial: string) {
		try {
			const port = this.resources[serial].port

			Logger.warn(`Remove Device: ${serial} from port: ${port}`)
			await this.api.deregisterDeviceStatus(port)

			delete this.resources[serial]
			this.portMap[port] = "FREE"

			const appiumPID = shelljs.exec(`lsof -n -i4TCP:${port} | grep node |  awk '{print $2}'`)
			cp.exec(`kill -9 ${appiumPID}`)
		} catch (e) {
			Logger.error(e)
		}
	}
}

new node().run()