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
		res.render(`${__dirname}/dashboard.html`)
	}

	private async makeDashboardHtml() {
		const htmlPath = `${__dirname}/dashboard_template.html`
		const data = SessionRouter.lsResource() as { [key: string]: DeviceState }
		const wsPort = 8000
	
		const $ = cheerio.load(fs.readFileSync(htmlPath, { encoding: "utf8" }))

		Object.entries(data).filter(([key, value]) => {
			const nodeAddress = key.split(":")[0]
			const status = value.showInDashboard ? "DASHBOARD" : value.status
			if(value.platform === "android" && nodeAddress) {
				const view_container_html = `
				<div class="view_container">
					<div class="title_view">
						<text class="title">${value.name} (${status})</text>
					</div>
					<iframe height="750px" width="500px" src="http://${nodeAddress}:8000/#!action=stream&udid=${value.udid}&player=mse&ws=ws%3A%2F%2F${nodeAddress}%3A8000%2F%3Faction%3Dproxy-adb%26remote%3Dtcp%253A8886%26udid%3D${value.udid}" frameBorder="0"></iframe>
				</div>
				`
				$(view_container_html).appendTo($(".page_container"))
			}
		})

		fs.writeFileSync(`${__dirname}/dashboard.html`, $.html())
	}
}
