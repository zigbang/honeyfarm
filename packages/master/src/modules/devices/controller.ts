import { BadRequestException, Controller, Get, Inject, Post, Put, Req, Res, CACHE_MANAGER, Logger, Param } from "@nestjs/common"

import { Request, Response } from "express"
import { Cache } from "cache-manager"

import SessionRouter from "../../util/SessionRouter"
import { ResponseBody, ResponseBodyBuilder } from "../../util/responseBody"
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
		let updatedResouce;
		let deviceResource = SessionRouter.getDeviceResource(addr)
		if (!deviceResource) {
			console.log("cannot find device resource : ", addr)
			res.send(
				new ResponseBodyBuilder()
					.set_result_code("fail")
					.set_description(`Cannot find device resource of ${addr}`)
					.build()
			)
			return;
		}
		else {
			deviceResource.batteryLevel = body.batteryLevel
			updatedResouce = Object.assign(deviceResource, body)
			SessionRouter.updateDeviceResource(addr, updatedResouce)
			res.send(
				new ResponseBodyBuilder()
					.set_result_code("ok")
					.set_description(`The Device is updated, whose endpoint is ${addr}`)
					.set_data([Object.assign(body, { endpoint: addr })])
					.build()
			)
		}

		console.log(`updateDevice : ${addr}`, body)
	}

	@Post("/register")
	async registerDevice(@Req() req: Request, @Res() res: Response) {
		const body = req.body as Device

		if (!body.port || !body.platform || !body.version) {
			res.send(
				new ResponseBodyBuilder()
					.set_result_code("fail")
					.set_description(`Required fields are missed.`)
					.set_data([Object.assign(body)])
					.build()
			)
			throw new BadRequestException("Malformed data")
		}

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
		res.send(
			new ResponseBodyBuilder()
				.set_result_code("ok")
				.set_description(`The Device is registered, whose endpoint is ${addr}`)
				.set_data([Object.assign(body, { endpoint: addr })])
				.build()
		)

		console.log("registerDevice : ", addr)
	}

	@Post("/deregister")
	async deresgisterDevice(@Req() req: Request, @Res() res: Response) {
		const body = req.body as Device
		if (!body.port) {
			res.send(
				new ResponseBodyBuilder()
					.set_result_code("fail")
					.set_description(`Required fields are missed.`)
					.set_data([body])
					.build()
			)
			throw new BadRequestException("Malformed data")
		}

		const clientAddr = this.getClientAddr(req)
		const addr = `${clientAddr}:${body.port}`

		SessionRouter.deleteDeviceResource(addr)
		res.send(
			new ResponseBodyBuilder()
				.set_result_code("ok")
				.set_description(`The Device is deregistered, whose endpoint was ${addr}`)
				.set_data([Object.assign(body, { endpoint: addr })])
				.build()
		)
	}

	@Post("/device")
	async getDevice(@Req() req: Request, @Res() res: Response) {
		//: Promise<Boolean> {
		const body = req.body as Device
		if (!body.port || !body.platform || !body.version) {
			res.send(
				new ResponseBodyBuilder()
					.set_result_code("fail")
					.set_description(`Required fields are missed.`)
					.set_data([body])
					.build()
			)
			throw new BadRequestException("Malformed data")
		}

		const clientAddr = this.getClientAddr(req)
		const addr = `${clientAddr}:${body.port}`

		const result = SessionRouter.findDeviceResource(addr, body.platform, body.version)
		// console.log(result)
		if (true === result) {
			res.send(
				new ResponseBodyBuilder()
					.set_result_code("ok")
					.set_description(`Success to get device information.`)
					.set_data([Object.assign(body, { result: result, endpoint: addr })])
					.build()
			)
		} else {
			res.send(
				new ResponseBodyBuilder()
					.set_result_code("fail")
					.set_description(`The requested device is not available.`)
					.set_data([Object.assign(body, { endpoint: addr })])
					.build()
			)
		}
		return result
	}

	@Get("/devices")
	getDevices(@Req() req: Request) {
		const devices = SessionRouter.lsResource()

		if (devices && !req?.query?.all) {
			//const testableDevices: { [key: string]: {} } = {}
			const testableDevices: Array<any> = []

			Object.entries<DeviceConfig>(devices)
				.filter(([key, value]) => { return !value.showInDashboard })
				.map(([key, value]) => {
					testableDevices.push(Object.assign(value, { endpoint: key }))
					return;
				})
			return testableDevices
		} else {
			return devices
		}
	}
	@Get("/bms/info")
	async getBatteryInfo(@Req() req: Request, @Res() res: Response) {
		const rst = await this.batteryService.getBatteryControlInfo()
		res.send(
			new ResponseBodyBuilder()
				.set_result_code("ok")
				.set_description(`batteryControlInfo`)
				.set_data([rst])
				.build()
		)
		//return rst
	}

	@Get("/bms/timer")
	getBmsTimer(@Req() req: Request, @Res() res: Response) {
		const rst = this.batteryService.getBmsTimerStates()
		res.send(
			new ResponseBodyBuilder()
				.set_result_code("ok")
				.set_description(`batteryControlInfo`)
				.set_data([rst])
				.build()
		)
		//return rst;
	}

	@Post("/bms/timer")
	async postBmsTimer(@Req() req: Request, @Res() res: Response) {
		//const rst = await this.batteryService.getBatteryControlInfo()
		let rst;
		try { rst = this.batteryService.updateBmsTimerStates(req.body) }
		catch (e) {
			//res.status(400).send({ "result_code": "fail", "description": "error occurred", "data": e })
			res.status(400).send(
				new ResponseBodyBuilder()
					.set_result_code("fail")
					.set_description(`Error occurred during updating bms-timer-state.`)
					.set_data([e])
					.build()
			)
		}
		// res.status(200).send({ "result_code": "ok", "description": "Successfully update BMS Timer." })
		res.status(200).send(
			new ResponseBodyBuilder()
				.set_result_code("ok")
				.set_description(`Successfully update BMS Timer.`)
				.set_data(rst ? rst : [])
				.build()
		)
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

