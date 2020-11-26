import * as cheerio from "cheerio"
import * as fs from "fs"
import SessionRouter from "./util/SessionRouter"
import { DeviceState } from "./util/types"

export async function main() {
    const output = await html_editor()
    fs.writeFileSync(__dirname + "/dashboard.html", output)
}
export async function html_editor() {
    const htmlPath = __dirname + "/dashboard_template.html"
    const data = SessionRouter.lsResource() as { [key: string]: DeviceState }
    const wsPort = 8000

    let $ = cheerio.load(fs.readFileSync(htmlPath, { encoding: "utf8" }))
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
    return $.html()
}