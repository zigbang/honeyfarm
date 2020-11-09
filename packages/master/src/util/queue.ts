import SessionRouter from "./SessionRouter"

export class Queue {
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