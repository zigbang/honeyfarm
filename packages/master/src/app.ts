import { Module } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { ExpressAdapter } from "@nestjs/platform-express"
import * as bodyParser from "body-parser"
import proxy from "express-http-proxy"

// tslint:disable-next-line:  match-default-export-name
import express from "express"

import { DevicesController } from "./modules/devices/controller"
import { SessionController } from "./modules/session/controller"
import SessionRouter from "./util/SessionRouter"
import { ipfilter } from "./util/ipFilter"

export const app = express()

@Module({
	imports: [],
	controllers: [SessionController, DevicesController],
	providers: []
})
class AppModule { }

async function bootstrap() {
	const adapter = new ExpressAdapter(app)
	const context = await NestFactory.create(AppModule, adapter)

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