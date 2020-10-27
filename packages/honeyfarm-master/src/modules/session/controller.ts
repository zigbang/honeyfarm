import { Controller, Delete, NotFoundException, Param, Post, Req, Res, Session } from "@nestjs/common"
import Axios from "axios"
import { Request, Response } from "express"

import SessionRouter from "../../util/SessionRouter"

interface DesiredCapabilities {
	platformName: string
	"appium:deviceName": string
	"appium:platformVersion": string
	"appium:newCommandTimeout": number
	"appium:udid": string
	wdaLocalPort: string
	mjpegServerPort: string
}

@Controller()
export class SessionController {
	@Post("/wd/hub/session")
	async createSession(@Req() req: Request, @Res() res: Response) {
		const body = req.body as { desiredCapabilities: DesiredCapabilities }
		const desiredCapabilities = body.desiredCapabilities

		if (!desiredCapabilities) {
			throw new NotFoundException("No DesiredCapabilities")
		}

		const platform = desiredCapabilities.platformName
		const version = desiredCapabilities["appium:platformVersion"]
		const newCommandTimeout = desiredCapabilities["appium:newCommandTimeout"] || 60
		let udid: string | undefined = desiredCapabilities["appium:udid"]
		let ip: string | undefined = SessionRouter.findIp(platform, udid, version)

		if (!ip) {
			const result = await new Queue().register(platform, udid, version)
			if (!result) {
				throw new NotFoundException(`Cannot Find Matching IP for paltform:${platform} version:${version}`)
			} else {
				ip = result
			}
		}

		// 동일한 node에 version이 같거나 startwith가 같은 단말이 여러 대 있을 경우 기존에 동작 여부와는 별개로 가장 처음에 매핑 되는 단말을 선택하기 때문에 이슈가 발생
		// ex) zbee에서 version 7로 요청시 7.1.1 7.1.2 모두 선택 가능 하기 때문에 기존에 4723 port가 7.1.1 단말을 사용 중 이더라도 4724 port가 동일한 단말을 사용 하려고 할수 있음
		// 그래서 appium:udid(android device serial) 사용해서 특정한 단말을 선택하는 코드 추가
		udid = udid ? udid : SessionRouter.findUDID(ip)
		if (udid && req && req.body) {
			// tslint:disable-next-line: no-unsafe-any
			req.body.desiredCapabilities = { ...req.body.desiredCapabilities,  "appium:udid": udid }
		}

		const wdaLocalPort = SessionRouter.findWDAPort(ip)
		if (wdaLocalPort && req && req.body) {
			// tslint:disable-next-line: no-unsafe-any
			req.body.desiredCapabilities = { ...req.body.desiredCapabilities , wdaLocalPort: wdaLocalPort }
		}

		const mjpegServerPort = SessionRouter.findmjpegServerPort(ip)
		if (mjpegServerPort && req && req.body) {
			req.body.desiredCapabilities = { ...req.body.desiredCapabilities , mjpegServerPort: mjpegServerPort}
		}

		// zbee에서 platform version을 *로 보낸걸 그대로 appium에 쏘면 에러가 발생해서 선택된 ip의 version을 가져와서 추가해줌
		const versionFromIp = SessionRouter.findVersion(ip)
		if (version && req && req.body) {
			// tslint:disable-next-line: no-unsafe-any
			req.body.desiredCapabilities = { ...req.body.desiredCapabilities,  "appium:platformVersion": versionFromIp }
			// tslint:disable-next-line: no-unsafe-any
			req.body.capabilities.alwaysMatch = { ...req.body.capabilities.alwaysMatch,  "appium:platformVersion": versionFromIp }
		}

		// ios의 경우 device name이 필수이기 때문에 node에서 전달하는 device name을 가져옴
		const deviceName = SessionRouter.findName(ip)
		if (deviceName && req && req.body) {
			// tslint:disable-next-line: no-unsafe-any
			req.body.desiredCapabilities = { ...req.body.desiredCapabilities,  "appium:deviceName": deviceName }
			// tslint:disable-next-line: no-unsafe-any
			req.body.capabilities.alwaysMatch = { ...req.body.capabilities.alwaysMatch,  "appium:deviceName": deviceName }
		}

		try {
			SessionRouter.setStatus(ip, "PENDING")

			console.log(`Creating Session: http://${ip}${req.path}`)

			const response = await Axios.post<{ value: { sessionId: string } }>(`http://${ip}${req.path}`, {
				...req.body
			}, {
				headers: {
					...req.headers
				}
			})

			SessionRouter.setNewCommandTimeOut(newCommandTimeout)
			SessionRouter.onSessionCreated(response.data.value.sessionId, ip)

			SessionRouter.setStatus(ip, "RUNNING")

			const headers = response.headers as { [key: string]: string }
			for (const [key, value] of Object.entries(headers)) {
				res.set(key, value)
			}
			res.send(response.data)
		} catch (e) {
			console.error("createSession error : " , e)
			SessionRouter.deleteDeviceResource(ip)
			throw new NotFoundException()
		}
	}

	@Delete("/wd/hub/session/:session")
	async deleteSession(@Req() req: Request, @Res() res: Response, @Param("session") session: string) {
		const ip = SessionRouter.findIpWithSession(session)
		console.log(`DeleteSession: ${ip}${req.path}`)

		if (!ip) {
			throw new NotFoundException(`No IP found for session: ${session}`)
		}

		try {
			const response = await Axios.delete(`${ip}${req.path}`,  {
				headers: {
					...req.headers
				}
			})
			console.log(`DeleteSession response: ${response}`)
			const headers = response.headers as { [key: string]: string }
			for (const [key, value] of Object.entries(headers)) {
				res.set(key, value)
			}
			res.send(response.data)
			SessionRouter.onSessionDeleted(session, ip)
		} catch (e) {
			console.error("deleteSession error : ", e)
			SessionRouter.onSessionDeleted(session, ip)
			SessionRouter.deleteDeviceResource(ip)
			throw new NotFoundException("Error on session Delete")
		}
	}
}

class Queue {
	private queue: {platform: string, udid: string, version: string, resolve: (value?: string) => void, time: number}[] = []

	constructor() {
		setInterval(() => { this.looper() }, 1000)
	}

	async register(platform: string, udid: string, version: string): Promise<string | undefined> {
		const result: string | undefined = await new Promise((resolve) => {
			this.queue.push({ platform, version, udid, resolve, time: Date.now() })
		})

		return result
	}

	private looper() {
		try {
			const now = Date.now()

		const INTERVAL = 90 * 1000
		const expiredItems = this.queue.filter((q) => q.time >= now + INTERVAL)
		for (const expired of expiredItems) {
			expired.resolve(undefined)
		}

		const validItems = this.queue.filter((q) => q.time < now + INTERVAL)
		for (const q of validItems) {
			const ip = SessionRouter.findIp(q.platform, q.udid, q.version)
			if (ip && !!q.resolve) {
				q.resolve(ip)
				delete q.resolve
				return
			}
		}

		this.queue = validItems.filter((q) => !!q.resolve)
		} catch (error) {
			console.error("Queue looper", error)
		}

	}
}
