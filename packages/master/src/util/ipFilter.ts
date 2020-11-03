import * as express from "express"
import * as fs from "fs"
const IpFilter = require("express-ipfilter-secured").IpFilter
const routerIpfilter = express.Router()

export const ipfilter = () => {
    let ipfilterJson = null
    try {
        if(fs.existsSync("./ipfilter.json")) {
            ipfilterJson = JSON.parse(
                fs.readFileSync("./ipfilter.json").toString("utf8")
            )
    
            for (const data of ipfilterJson.filters) {
                const dataOtions = { ...ipfilterJson.options, ...data.options }
                routerIpfilter.use(data.url,
                    (req: express.Request, res: express.Response, next: express.NextFunction) => {
                        res.setHeader("Surrogate-Control", "no-store")
                        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
                        res.setHeader("Pragma", "no-cache")
                        res.setHeader("Expires", "0")
                    IpFilter(data.ips, dataOtions )(req, res, next)
                })
            }
        }
    } catch {}

    return routerIpfilter
}