import { NotFoundException } from "@nestjs/common"
import { Request, Response } from "express"

type DeviceStatus = "FREE" | "PENDING" | "RUNNING"

//확정상의 문제를 고려할 필요함 nanosql2 - readme에 명시 필요
export interface DeviceState {
	name?: string,
	platform: "android" | "ios",
	version: string,
	status: DeviceStatus,
	udid?: string,
	wdaPort?: string,
	mjpegServerPort?: string,
	type?: "real" | "simulator" | "emulator"
}

const reqTimeout = 6 * 60 * 1000

class SessionRouter {
	private static readonly resources: { [host: string]: DeviceState } = {}

	private readonly routeMap: { [session: string]: string } = {}

	private readonly commandRunTimeMap: { [session: string]: number } = {}
	private commandIntervalTime?: NodeJS.Timeout = undefined
	private newCommandTime = 0

	private readonly checkNodeDeviceTimeMap: { [session: string]: number } = {}
	private checkNodeDeviceTimer?: NodeJS.Timeout = undefined
	private readonly checkNodeDeviceTime = 60 * 1000

	lsResource() {
		return Object.keys(SessionRouter.resources).length > 0 ? SessionRouter.resources : undefined
	}

	findIp(platform: string, udid: string, version?: string) {
		if(udid) {
			const resource = Object.entries(SessionRouter.resources)
			.filter(([key, value]) => value.status === "FREE")
			.filter(([key, value]) => value.platform.toLowerCase() === platform.toLowerCase())
			.filter(([key, value]) => value.udid === udid)
			.find(([key, value]) => {
					if (!version) { return true }
					if (version === "*") { return true }
					const regexPattern = new RegExp(`${version}`, "g")
					return value.version.match(regexPattern)
				})

			return resource && resource[0]
		} else {
			const resource = Object.entries(SessionRouter.resources)
			.filter(([key, value]) => value.status === "FREE")
			.filter(([key, value]) => value.platform.toLowerCase() === platform.toLowerCase())
			.find(([key, value]) => {
					if (!version) { return true }
					if (version === "*") { return true }
					const regexPattern = new RegExp(`${version}`, "g")
					return value.version.match(regexPattern)
				})
			return resource && resource[0]
		}
	}

	findUDID(ip: string) {
		return SessionRouter.resources[ip].udid
	}

	findVersion(ip: string) {
		return SessionRouter.resources[ip].version
	}

	findName(ip: string) {
		return SessionRouter.resources[ip].name
	}

	findWDAPort(ip: string) {
		return SessionRouter.resources[ip].wdaPort
	}
	findmjpegServerPort(ip: string) {
		return SessionRouter.resources[ip].mjpegServerPort
	}

	findIpWithSession(session: string) {
		return `http://${this.routeMap[session]}`
	}

	setStatus(ip: string, status: DeviceStatus) {
		const resource =  SessionRouter.resources[ip]
		if (resource  && resource.status) {
			SessionRouter.resources[ip].status= status
		}
	}

	onSessionCreated(session: string, ip: string) {
		console.log(`Session Created ${session} with ${ip}`)
		this.routeMap[session] = ip
		this.commandRunTimeMap[session] = Date.now().valueOf()

		if (!this.commandIntervalTime) {
			this.commandIntervalTime = setInterval(() => {
				this.checkCommandWaitTime()
			}, 10000)
		}
	}

	onSessionDeleted(session: string, ip: string) {
		console.log(`Session Deleted ${session} ip ${ip}`)
		this.setStatus(ip.replace("http://", ""), "FREE")
		delete this.routeMap[session]
		delete this.commandRunTimeMap[session]

		if (Object.keys(this.commandRunTimeMap).length === 0 && this.commandIntervalTime) {
			clearInterval(this.commandIntervalTime)
			this.commandIntervalTime = undefined
		}

	}

	setNewCommandTimeOut(time: number) {
		if (time * 1000 > this.newCommandTime || Object.keys(this.routeMap).length == 0) {
			this.newCommandTime = time * 1000
		}
	}

	updateDeviceResource(addr: string, resource: DeviceState) {
		SessionRouter.resources[addr] = resource
		console.log("updateDeviceResource",  SessionRouter.resources)
	}

	deleteDeviceResource(addr: string) {
		delete SessionRouter.resources[addr]
		console.log("deleteDeviceResource",  SessionRouter.resources)
	}

	findDeviceResource(ip: string, platform: string, version: string, udid?: string): boolean {
		console.log("findDeviceResource", SessionRouter.resources)

		if (!this.checkNodeDeviceTimer) {
			this.checkNodeDeviceTimer = setInterval(() => {
				this.checkNodeDevice()
			}, this.checkNodeDeviceTime)
		}

		const result = Object.entries(SessionRouter.resources).some(([key, value]) => {
			return key === ip &&
				value.platform === platform &&
				value.version === version &&
				(!udid || value.udid === udid)
		})

		if (result) {
			this.checkNodeDeviceTimeMap[ip] = Date.now().valueOf()
		}

		return result

	}

	router(userReq: Request) {
		const session = userReq.originalUrl.match(/\/wd\/hub\/session\/((\d|\w|\-)*)\//)

		if (!session) {
			throw new NotFoundException()
		}
		userReq.setTimeout(reqTimeout)
		this.commandRunTimeMap[session[1]] = Date.now().valueOf()
		return this.routeMap[session[1]]
	}

	pathResolver(userReq: Request) {
		return userReq.originalUrl
	}

	userResDecorator(
		proxyRes: Response,
		// tslint:disable-next-line: no-any
		proxyResData: Buffer,
		userReq: Request,
		userRes: Response
	) {
		if (userReq.path === "/wd/hub/session") {
			console.error("Unreachable Code!!!!!!")
		}

		return proxyResData
	}

	private checkCommandWaitTime() {
		for (const [session, value] of Object.entries(this.commandRunTimeMap)) {
			const currentTime = Date.now().valueOf()

			if(currentTime - value > this.newCommandTime) {
				const ip = this.findIpWithSession(session)
				this.onSessionDeleted(session, ip)
			}
		}
	}

	// https://github.com/zigbang/zbee/issues/45
	// 일정시간(현재 60초)마다 돌면서 현재 노드에서 신호를 보내지 않는 단말 제거
	//  - 각 노드에서 10초 마다 단말을 갱신하기 위해 현재 단말 정보를 마스터로 보내고 마스터에서는 그 정보에 해당하는 단말이 있는지 여부를 보냄
	//  - 이때 각 단말의 ID( ip와 port)를 키로하는 오브젝트를 만들어서 현재 시간을 계속 갱신함
	//  - 만약 노드가 종료 되었다면 단말의 업데이트를 위한 정보를 보내지 않으므로 일정 시간 후 그 단말 정보를 삭제함
	private checkNodeDevice() {
		for (const [ip, value] of Object.entries(this.checkNodeDeviceTimeMap)) {
			const currentTime = Date.now().valueOf()

			if (currentTime - value > this.checkNodeDeviceTime) {
				this.deleteDeviceResource(ip)
				delete this.checkNodeDeviceTimeMap[ip]
			}

			if (Object.keys(this.checkNodeDeviceTimeMap).length === 0 && this.checkNodeDeviceTimer) {
				clearInterval(this.checkNodeDeviceTimer)
				this.checkNodeDeviceTimer = undefined
			}
		}
	}
}

export default new SessionRouter()
