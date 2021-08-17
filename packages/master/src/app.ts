import { Module, CacheModule } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { ExpressAdapter } from "@nestjs/platform-express"
import * as bodyParser from "body-parser"
import proxy from "express-http-proxy"
import ejs from "ejs"
// tslint:disable-next-line:  match-default-export-name
import express from "express"
const cors = require("cors")

import { DevicesController } from "./modules/devices/controller"
import { SessionController } from "./modules/session/controller"
import { DashboardController } from "./modules/dashboard/controller"
import SessionRouter from "./util/SessionRouter"
import { ipfilter } from "./util/ipFilter"

export const app = express()

@Module({
	imports: [
		CacheModule.register({ ttl: 0 }),
	],
	controllers: [SessionController, DevicesController, DashboardController],
	providers: []
})
class AppModule { }

async function bootstrap() {
	const adapter = new ExpressAdapter(app)
	const context = await NestFactory.create(AppModule, adapter)
	app.set("views", __dirname)
	app.set("view engine", "ejs")
	app.engine("html", ejs.renderFile)
	context.use(cors())
	context.use(bodyParser.json({ limit: "100mb" }))
	context.use(ipfilter())
	context.use("/wd/hub/session/*/*", proxy((...args) => SessionRouter.router(...args), {
		reqBodyEncoding: undefined,
		proxyReqPathResolver: (...args) => SessionRouter.pathResolver(...args),
		userResDecorator: (...args) => SessionRouter.userResDecorator(...args)
	}))

	await context.init()
	return context
}

bootstrap()