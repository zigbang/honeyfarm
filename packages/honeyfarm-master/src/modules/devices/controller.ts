import { BadRequestException, Controller, Get, Post, Req, Res } from "@nestjs/common"
import { Request, Response } from "express"

import SessionRouter, { DeviceState } from "../../util/SessionRouter"

interface Device {
	port: string
	platform: "android" | "ios"
	version: string,
	udid?: string,
	name?: string,
	wdaPort?: string,
	mjpegServerPort?: string,
	type?: "real" | "simulator" | "emulator"
}

@Controller()
export class DevicesController {
	@Post("/register")
	async registerDevice(@Req() req: Request, @Res() res: Response) {
		const body = req.body as Device

		if(!body.port || !body.platform || !body.version) throw new BadRequestException("Malformed data")

		const clientAddr = this.getClientAddr(req)
		const addr = `${clientAddr}:${body.port}`

		const deviceResource: DeviceState = {
			platform: body.platform,
			version: body.version,
			status: "FREE",
			udid: body.udid,
			name: body.name,
			wdaPort: body.wdaPort,
			mjpegServerPort: body.mjpegServerPort,
			type: body.type
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
}
