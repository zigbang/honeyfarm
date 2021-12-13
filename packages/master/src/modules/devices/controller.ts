import { BadRequestException, Controller, Get, Inject, Post, Put, Req, Res, CACHE_MANAGER, Logger, Param } from "@nestjs/common"

import { Request, Response } from "express"
import { Cache } from "cache-manager"

import SessionRouter from "../../util/SessionRouter"
import { DeviceState, Device, DeviceConfig, BatteryConfig } from "../../util/types"
import { FromJson } from "../../util/getConfig"
import { BatteryService } from "./battery.service"
@Controller()
export class DevicesController {
	private batteryService: BatteryService;

	constructor(@Inject(CACHE_MANAGER) cacheManager: Cache) {
		this.batteryService = new BatteryService(cacheManager);
	}

	@Put("/update")
	async updateDevice(@Req() req: Request, @Res() res: Response) {

		const body = req.body

		const clientAddr = this.getClientAddr(req)
		const addr = `${clientAddr}:${body.port}`

		let deviceResource = SessionRouter.getDeviceResource(addr)
		if (!deviceResource) {
			console.log("cannot find device resource : ", addr)
		}
		else {
			deviceResource.batteryLevel = body.batteryLevel
			const updatedResouce = Object.assign(deviceResource, body)
			SessionRouter.updateDeviceResource(addr, updatedResouce)
		}
		res.send()

		console.log(`updateDevice : ${addr}`, body)
	}

	@Post("/register")
	async registerDevice(@Req() req: Request, @Res() res: Response) {
		const body = req.body as Device

		if (!body.port || !body.platform || !body.version) throw new BadRequestException("Malformed data")

		const clientAddr = this.getClientAddr(req)
		const addr = `${clientAddr}:${body.port}`

		const deviceConfig: DeviceConfig = await this.getDeviceConfig(body.udid)

		const deviceResource: DeviceState = {
			platform: body.platform,
			version: body.version,
			status: "FREE",
			batteryLevel: body.batteryLevel,
			udid: body.udid,
			name: body.name ? body.name : deviceConfig.name,
			wdaPort: body.wdaPort,
			mjpegServerPort: body.mjpegServerPort,
			type: body.type,
			showInDashboard: deviceConfig.showInDashboard
		}

		SessionRouter.updateDeviceResource(addr, deviceResource)
		res.send()

		console.log("registerDevice : ", addr)
	}

	@Post("/deregister")
	async deresgisterDevice(@Req() req: Request, @Res() res: Response) {
		const body = req.body as Device
		if (!body.port) throw new BadRequestException("Malformed data")

		const clientAddr = this.getClientAddr(req)
		const addr = `${clientAddr}:${body.port}`

		SessionRouter.deleteDeviceResource(addr)
		res.send()
	}

	@Post("/device")
	async getDevice(@Req() req: Request): Promise<Boolean> {
		const body = req.body as Device
		if (!body.port || !body.platform || !body.version) throw new BadRequestException("Malformed data")

		const clientAddr = this.getClientAddr(req)
		const addr = `${clientAddr}:${body.port}`

		const result = SessionRouter.findDeviceResource(addr, body.platform, body.version)
		return result
	}

	@Get("/devices")
	getDevices(@Req() req: Request) {
		const devices = SessionRouter.lsResource()

		if (devices && !req?.query?.all) {
			const testableDevices: { [key: string]: {} } = {}

			Object.entries<DeviceConfig>(devices)
				.filter(([key, value]) => { return !value.showInDashboard })
				.map(([key, value]) => { testableDevices[key] = value })

			return testableDevices
		} else {
			return devices
		}
	}
	@Get("/battery")
	async getBatteryInfo(@Req() req: Request) {
		const rst = await this.batteryService.getBatteryControlInfo()
		return rst
	}

	@Get("/battery/:item")
	async getBatteryInfoItem(@Req() req: Request, @Param() params: { item: keyof BatteryConfig }) {
		const rst = await this.batteryService.getBatteryControlInfo()
		return rst[params.item];
	}

	@Get("/bms/timer")
	getBmsTimer(@Req() req: Request) {
		const rst = this.batteryService.getBmsTimerStates()
		return rst;
	}

	@Post("/bms/timer")
	async postBmsTimer(@Req() req: Request, @Res() res: Response) {
		//const rst = await this.batteryService.getBatteryControlInfo()
		try { this.batteryService.updateBmsTimerStates(req.body) }
		catch (e) {
			res.status(400).send({ "result_code": "fail", "description": "error occurred", "data": e })
		}
		res.status(200).send({ "result_code": "ok", "description": "Successfully update BMS Timer." })
	}

	private getClientAddr(req: Request) {
		return req.headers["x-forwarded-for"] || req.connection.remoteAddress?.replace("::ffff:", "") || ""
	}

	private async getDeviceConfig(udid?: string) {
		try {
			const config = await FromJson()

			if (config && config["devices"]) {
				const devices: DeviceConfig[] = config["devices"]

				for (const device of devices) {
					if (device.udid === udid) {
						return { name: device.name, showInDashboard: device.showInDashboard ? device.showInDashboard : false }
					}
				}
			}

		} catch (e) {
			console.log("getDeviceConfig error", e)

		}

		return { name: udid, showInDashboard: false }
	}
}

