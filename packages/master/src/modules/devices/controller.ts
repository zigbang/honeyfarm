import { BadRequestException, Controller, Get, Post, Req, Res } from "@nestjs/common"
import { Request, Response } from "express"

import SessionRouter from "../../util/SessionRouter"
import { DeviceState, Device } from "../../util/types"
import { getSheet } from "../../util/spreadsheet"

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
			name: body.name ? body.name : await this.getDeviceName(body.udid),
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

	private async getDeviceName(udid?: string) {
		try {
			const sheet = await getSheet()
			if (sheet) {
				const rows = await sheet.getRows()
				const name = rows.filter(row => { return row.udid === udid })
				return name && name.length > 0 && name[0].name
			}
		} catch (e) {
			console.log("getDeviceName error", e)
		
		}

		return udid
	} 
}
