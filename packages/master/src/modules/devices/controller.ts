import { BadRequestException, Controller, Get, Post, Req, Res } from "@nestjs/common"
import { Request, Response } from "express"

import SessionRouter from "../../util/SessionRouter"
import { DeviceState, Device, DeviceConfig } from "../../util/types"
import { FromJson } from "../../util/getConfig"

@Controller()
export class DevicesController {
	@Post("/register")
	async registerDevice(@Req() req: Request, @Res() res: Response) {
		const body = req.body as Device

		if(!body.port || !body.platform || !body.version) throw new BadRequestException("Malformed data")

		const clientAddr = this.getClientAddr(req)
		const addr = `${clientAddr}:${body.port}`

		const deviceConfig: DeviceConfig = await this.getDeviceConfig(body.udid)

		const deviceResource: DeviceState = {
			platform: body.platform,
			version: body.version,
			status: "FREE",
			udid: body.udid,
			name: body.name ? body.name : deviceConfig.name,
			wdaPort: body.wdaPort,
			mjpegServerPort: body.mjpegServerPort,
			type: body.type,
			showInDashboard: deviceConfig.showInDashboard
		}

		SessionRouter.updateDeviceResource(addr, deviceResource)
		res.send()
	}

	@Post("/deregister")
	async deresgisterDevice(@Req() req: Request, @Res() res: Response) {
		const body = req.body as Device
		if(!body.port) throw new BadRequestException("Malformed data")

		const clientAddr = this.getClientAddr(req)
		const addr = `${clientAddr}:${body.port}`

		SessionRouter.deleteDeviceResource(addr)
		res.send()
	}

	@Post("/device")
	async getDevice(@Req() req: Request): Promise<Boolean> {
		const body = req.body as Device
		if(!body.port || !body.platform || !body.version) throw new BadRequestException("Malformed data")

		const clientAddr = this.getClientAddr(req)
		const addr = `${clientAddr}:${body.port}`

		const result = SessionRouter.findDeviceResource(addr, body.platform, body.version)
		return result
	}

	@Get("/devices")
	getDevices(@Req() req: Request) {
		const devices = SessionRouter.lsResource()

		if (devices && !req?.body?.all) {
			const testableDevices: {[key: string]: {}} = {}

			Object.entries<DeviceConfig>(devices)
				.filter(([key, value])=> { return !value.showInDashboard })
				.map(([key, value]) => { testableDevices[key] = value })

			return testableDevices
		} else {
			return devices
		}
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
						return { name: device.name, showInDashboard: device.showInDashboard ?  device.showInDashboard : false} 
					}
				}
			}

		} catch (e) {
			console.log("getDeviceConfig error", e)
		
		}

		return { name: udid, showInDashboard: false}
	} 
}
