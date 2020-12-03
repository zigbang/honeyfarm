import { BadRequestException, Controller, Get, Post, Req, Res } from "@nestjs/common"
import { Request, Response } from "express"

import SessionRouter from "../../util/SessionRouter"
import { DeviceState, Device, DeviceConfig } from "../../util/types"
import { FromJson } from "../../util/getDeviceConfig"

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
			onlyUseDashboard: deviceConfig.onlyUseDashboard
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
	getDevices() {
		return SessionRouter.lsResource()
	}

	private getClientAddr(req: Request) {
		return req.headers["x-forwarded-for"] || req.connection.remoteAddress?.replace("::ffff:", "") || ""
	}

	private async getDeviceConfig(udid?: string) {
		try {
			const deviceConfig = await FromJson()

			if (deviceConfig) {
				const value = Object.entries<DeviceConfig>(deviceConfig).filter(([key, value]) => {return key === udid}).map(([key, value]) => { return value })

				if (value && value.length > 0) {
					return { name: value[0].name, onlyUseDashboard: value[0].onlyUseDashboard ?  value[0].onlyUseDashboard : false}
				}
			}

		} catch (e) {
			console.log("getDeviceConfig error", e)
		
		}

		return { name: udid, onlyUseDashboard: false}
	} 
}
