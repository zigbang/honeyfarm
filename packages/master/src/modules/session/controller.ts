import { Controller, Delete, NotFoundException, Param, Post, Req, Res, Get } from "@nestjs/common"
import Axios from "axios"
import { Request, Response } from "express"
import SessionRouter from "../../util/SessionRouter"
import { DesiredCapabilities} from "../../util/types"
import { Queue } from "../../util/queue"

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
		let remoteAppiumAddress: string | undefined = SessionRouter.findIp(platform, udid, version)

		if (!remoteAppiumAddress) {
			const result = await new Queue().register(platform, udid, version)
			if (!result) {
				throw new NotFoundException(`Cannot Find Matching IP for paltform:${platform} version:${version}`)
			} else {
				remoteAppiumAddress = result
			}
		}

		// 동일한 node에 version이 같거나 startwith가 같은 단말이 여러 대 있을 경우 기존에 동작 여부와는 별개로 가장 처음에 매핑 되는 단말을 선택하기 때문에 이슈가 발생
		// ex) zbee에서 version 7로 요청시 7.1.1 7.1.2 모두 선택 가능 하기 때문에 기존에 4723 port가 7.1.1 단말을 사용 중 이더라도 4724 port가 동일한 단말을 사용 하려고 할수 있음
		// 그래서 appium:udid(android device serial) 사용해서 특정한 단말을 선택하는 코드 추가
		udid = udid ? udid : SessionRouter.findUDID(remoteAppiumAddress)

		if (udid && req && req.body) {
			// tslint:disable-next-line: no-unsafe-any
			req.body.desiredCapabilities = { ...req.body.desiredCapabilities,  "appium:udid": udid }
		}

		const wdaLocalPort = SessionRouter.findWDAPort(remoteAppiumAddress)
		if (wdaLocalPort && req && req.body) {
			// tslint:disable-next-line: no-unsafe-any
			req.body.desiredCapabilities = { ...req.body.desiredCapabilities , wdaLocalPort: wdaLocalPort }
		}

		const mjpegServerPort = SessionRouter.findmjpegServerPort(remoteAppiumAddress)
		if (mjpegServerPort && req && req.body) {
			req.body.desiredCapabilities = { ...req.body.desiredCapabilities , mjpegServerPort: mjpegServerPort}
		}

		// zbee에서 platform version을 *로 보낸걸 그대로 appium에 쏘면 에러가 발생해서 선택된 ip의 version을 가져와서 추가해줌
		const versionFromIp = SessionRouter.findVersion(remoteAppiumAddress)
		if (version && req && req.body) {
			// tslint:disable-next-line: no-unsafe-any
			req.body.desiredCapabilities = { ...req.body.desiredCapabilities,  "appium:platformVersion": versionFromIp }
			// tslint:disable-next-line: no-unsafe-any
			req.body.capabilities.alwaysMatch = { ...req.body.capabilities.alwaysMatch,  "appium:platformVersion": versionFromIp }
		}

		// ios의 경우 device name이 필수이기 때문에 node에서 전달하는 device name을 가져옴
		const deviceName = SessionRouter.findName(remoteAppiumAddress)
		if (deviceName && req && req.body) {
			// tslint:disable-next-line: no-unsafe-any
			req.body.desiredCapabilities = { ...req.body.desiredCapabilities,  "appium:deviceName": deviceName }
			// tslint:disable-next-line: no-unsafe-any
			req.body.capabilities.alwaysMatch = { ...req.body.capabilities.alwaysMatch,  "appium:deviceName": deviceName }
		}

		try {
			SessionRouter.setStatus(remoteAppiumAddress, "PENDING")

			console.log(`Creating Session: http://${remoteAppiumAddress}${req.path}`)

			const response = await Axios.post<{ value: { sessionId: string } }>(`http://${remoteAppiumAddress}${req.path}`, {
				...req.body
			}, {
				headers: {
					...req.headers
				},
				timeout: 10 * 60 * 1000
			})

			SessionRouter.setNewCommandTimeOut(newCommandTimeout)
			SessionRouter.onSessionCreated(response.data.value.sessionId, remoteAppiumAddress)

			SessionRouter.setStatus(remoteAppiumAddress, "RUNNING")

			const headers = response.headers as { [key: string]: string }
			for (const [key, value] of Object.entries(headers)) {
				res.set(key, value)
			}
			res.send(response.data)
		} catch (e) {
			console.error("createSession error : " , e)
			SessionRouter.deleteDeviceResource(remoteAppiumAddress)
			throw new NotFoundException()
		}
	}

	@Delete("/wd/hub/session/:session")
	async deleteSession(@Req() req: Request, @Res() res: Response, @Param("session") session: string) {
		const remoteAppiumAddress = SessionRouter.findIpWithSession(session)
		console.log(`DeleteSession: ${remoteAppiumAddress}${req.path}`)

		if (!remoteAppiumAddress) {
			throw new NotFoundException(`No IP found for session: ${session}`)
		}

		try {
			const response = await Axios.delete(`${remoteAppiumAddress}${req.path}`,  {
				headers: {
					...req.headers
				},
				timeout: 10 * 60 * 1000
			})
			console.log(`DeleteSession response: ${response}`)
			const headers = response.headers as { [key: string]: string }
			for (const [key, value] of Object.entries(headers)) {
				res.set(key, value)
			}
			res.send(response.data)
			SessionRouter.onSessionDeleted(session, remoteAppiumAddress)
		} catch (e) {
			console.error("deleteSession error : ", e)
			SessionRouter.onSessionDeleted(session, remoteAppiumAddress)
			SessionRouter.deleteDeviceResource(remoteAppiumAddress)
			throw new NotFoundException("Error on session Delete")
		}
	}

	@Get("/")
	async getStatus(@Req() req: Request, @Res() res: Response) {
		res.send("Healty!!!!")
	}
}

