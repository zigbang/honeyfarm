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
	udid?: string,
	name?: string,
	showInDashboard?: boolean
}

export interface Device extends DeviceConfig {
	port?: string
	platform: "android" | "ios"
	version: string,
	wdaPort?: string,
	mjpegServerPort?: string,
	type?: "real" | "simulator" | "emulator",
	batteryLevel: number
}

export interface DeviceState extends Device {
	status: DeviceStatus
}
export interface BatteryConfig {
	status: "on" | "off",
	threshold: {
		max?: number,
		min?: number
	}
}
