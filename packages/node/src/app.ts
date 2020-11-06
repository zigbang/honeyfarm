import shell from "shelljs"
import cp from "child_process"
import iosDevice from 'node-ios-device'
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
	
	async run () {
		shell.config.silent = true
		commander
			.option('--endpoint <endpoint>', 'Setting endpoint')
			.option('--appiumPort <appiumPort>', 'Setting appium port')
			.option('--maxDevices <maxDevices>', 'Setting max devices count')
			.action(() => {
				this.endpoint = commander.endpoint || this.endpoint
				this.appiumDefaultPort = commander.appiumPort || this.appiumDefaultPort
				this.maxDevices = commander.maxDevices || this.maxDevices
			})
			.parse(process.argv)

		this.api = new API(this.endpoint)

		this.init()

		await this.updateDeviceStatus()
	}

	private init() {
		for(let i = 0; i < this.maxDevices; i++){
			this.portMap[this.appiumDefaultPort + i] = "FREE"
		}

		if (process.platform === "darwin") this.isMacMachine = true
	}

	private async updateDeviceStatus() {
		const onlineSerials = this.getOnlineSerials()
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
				const checkAppiumServer = shell.exec(`lsof -i :${resource.port} -t`).stdout

				if (!checkAppiumServer) this.startAppiumServer(key, resource.port, resource.wdaPort)
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

	private getOnlineSerials() {
		let serials = {}
		if (this.isMacMachine) {
			iosDevice.list().map((device: IOSDeviceInfo) => { serials[device.udid] = "ios" })
			this.getOnlineSimulator().map((device: IOSDeviceInfo) => { serials[device.udid] = "ios" })
		} 
		
		const devices = shell.exec("adb devices | grep -v devices").stdout
		const onlineDevices = devices.match(/(\w+-?\w+?)\tdevice$/gm) || []

		onlineDevices.map((device: string) => { serials[device.replace("\tdevice", "")] = "android" })

		return serials
	}

	private getOnlineSimulator(): IOSDeviceInfo[] {
		const result :IOSDeviceInfo[] = []
		
		const data = shell.exec(`xcrun simctl list devices --json`)
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
				const devicelist = iosDevice.list().concat(this.getOnlineSimulator())
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
				const platformVersion = shell.exec(`adb -s ${serial} shell getprop ro.build.version.release`).stdout.replace("\n", "").trim()
				const webviewVersion = shell.exec(`adb -s ${serial}  shell dumpsys package com.android.chrome | grep versionName`)
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
			await this.api.registerDeviceStatus(device.port, device.platform, device.version, serial, device.name, device.wdaPort, device.mjpegServerPort, device.type)
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

			const appiumPID = shell.exec(`lsof -n -i4TCP:${port} | grep node |  awk '{print $2}'`)
			cp.exec(`kill -9 ${appiumPID}`)
		} catch (e) {
			Logger.error(e)
		}
	}
}

new node().run()