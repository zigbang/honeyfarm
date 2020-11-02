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

export const app = express()
app.use(bodyParser.json({ limit: "100mb" }))
app.use("/wd/hub/session/*/*", proxy((...args) => SessionRouter.router(...args), {
	reqBodyEncoding: undefined,
	proxyReqPathResolver: (...args) => SessionRouter.pathResolver(...args),
	userResDecorator: (...args) => SessionRouter.userResDecorator(...args)
}))
app.get("/", (req, res) => {
	res.send("Healty!")
})

const adapter = new ExpressAdapter(app)

@Module({
	imports: [],
	controllers: [SessionController, DevicesController],
	providers: []
})
class AppModule { }

async function bootstrap() {
	const context = await NestFactory.create(AppModule, adapter)
	await context.init()
	return context
}

bootstrap() // bootstrap을 등록하기 위함 그냥 bootstrap도 될듯 