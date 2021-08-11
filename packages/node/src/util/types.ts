export type PortStatus = "FREE" | "USED"
export type DeviceType = "real" | "simulator" | "emulator"
export interface IOSDeviceInfo  {
	udid: string
	name: string
	productVersion: string
	type?: DeviceType
	productType?: string
}

export interface ResourceType {
	platform: string
	version: string
	port: string
	webviewVersion?: string
	name?: string
	wdaPort?: string
	mjpegServerPort?: string
	type?: DeviceType
	batteryLevel?: number
}

export const iPhone_TYPE = {
	"iPhone5,1" : "iPhone 5",
	"iPhone5,2" : "iPhone 5",
	"iPhone5,3" : "iPhone 5C",
	"iPhone5,4" : "iPhone 5C",
	"iPhone6,1" : "iPhone 5S",
	"iPhone6,2" : "iPhone 5S",
	"iPhone7,1" : "iPhone 6 Plus",
	"iPhone7,2" : "iPhone 6",
	"iPhone8,1" : "iPhone 6s",
	"iPhone8,2" : "iPhone 6s Plus",
	"iPhone8,4" : "iPhone SE",
	"iPhone9,1" : "iPhone 7",
	"iPhone9,2" : "iPhone 7 Plus",
	"iPhone9,3" : "iPhone 7",
	"iPhone9,4" : "iPhone 7 Plus",
	"iPhone10,1" : "iPhone 8",
	"iPhone10,2" : "iPhone 8 Plus",
	"iPhone10,3" : "iPhone X",
	"iPhone10,4" : "iPhone 8",
	"iPhone10,5" : "iPhone 8 Plus",
	"iPhone10,6" : "iPhone X",
	"iPhone11,2" : "iPhone XS",
	"iPhone11,4" : "iPhone XS Max",
	"iPhone11,6" : "iPhone XS Max",
	"iPhone11,8" : "iPhone XR",
	"iPhone12,1" : "iPhone 11",
	"iPhone12,3" : "iPhone 11 Pro",
	"iPhone12,5" : "iPhone 11 Pro Max",
	"iPhone12,8" : "iPhone SE 2nd Gen"
}

export interface DeviceGroupType {
	is_bind_controller: boolean,
	name: string
	controller_endpoint?: string
	devices: string[]
}

export interface ResourceDictionaryType {
	[serialNo: string]: ResourceType
}

export interface PairType {
	first: number
	second: number
}