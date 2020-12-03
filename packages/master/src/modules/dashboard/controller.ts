import { Controller, Get, Post, Req, Res } from "@nestjs/common"
import { Request, Response } from "express"
import * as cheerio from "cheerio"
import * as fs from "fs"

import SessionRouter from "../../util/SessionRouter"
import { DeviceState } from "../../util/types"

@Controller()
export class DashboardController {
	@Get("/dashboard")
	async getDashboard(@Req() req: Request, @Res() res: Response) {
		await this.makeDashboardHtml()
		res.render(`${process.cwd()}/dashboard.html`)
	}

	private async makeDashboardHtml() {
		const htmlPath = `${process.cwd()}/dashboard_template.html`
		const data = SessionRouter.lsResource() as { [key: string]: DeviceState }
		const wsPort = 8000
	
		const $ = cheerio.load(fs.readFileSync(htmlPath, { encoding: "utf8" }))
		Object.entries(data).filter(([key, value]) => {
			const nodeAddress = key.split(":")[0]
			if(value.platform === "android" && nodeAddress) {
				const view_container_html = `
				<div class="view_container">
					<div class="title_view">
						<text class="title">${value.name} (${value.status})</text>
					</div>
					<iframe height="750px" width="500px" src="http://${nodeAddress}:${wsPort}/#!action=stream&udid=${value.udid}&decoder=broadway&ip=${nodeAddress}&port=${wsPort}&query=%3Faction%3Dproxy%26remote%3Dtcp%253A8886%26udid%3D${value.udid}" frameBorder="0"></iframe>
				</div>
				`
				$(view_container_html).appendTo($(".page_container"))
			}
		})

		fs.writeFileSync(`${process.cwd()}/dashboard.html`, $.html())
	}
}
