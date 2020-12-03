export type DeviceStatus = "FREE" | "PENDING" | "RUNNING"

export interface DesiredCapabilities {
	platformName: string
	"appium:deviceName": string
	"appium:platformVersion": string
	"appium:newCommandTimeout": number
	"appium:udid": string
	wdaLocalPort: string
	mjpegServerPort: string
}

export interface DeviceConfig {
	name?: string,
	onlyUseDashboard?: boolean
}

export interface Device extends DeviceConfig {
	port?: string
	platform: "android" | "ios"
	version: string,
	udid?: string,
	wdaPort?: string,
	mjpegServerPort?: string,
	type?: "real" | "simulator" | "emulator"
}

export interface DeviceState extends Device {
	status: DeviceStatus
}
