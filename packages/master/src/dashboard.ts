import * as cheerio from "cheerio"
import * as fs from "fs"
import SessionRouter from "./util/SessionRouter"
import Axios from "axios"

export async function main() {
    const output = await html_editor()
    fs.writeFileSync(__dirname + "/dashboard.html", output)
}
export async function html_editor() {
    const htmlPath = __dirname + "/dashboard_template.html"
    // const req = await Axios.get(`http://honey.zigbang.io/devices`)
    // const data = req.data as { [key: string]: { platform: string, version: string, status: string, udid: string}}
    const data = SessionRouter.lsResource() as { [key: string]: { platform: string, version: string, status: string, udid: string}}
    const node_address = {ip: "192.168.99.37", port: "8000"}
    // const node_address = {ip: "localhost", port: "8000"}
    let $ = cheerio.load(fs.readFileSync(htmlPath, { encoding: "utf8" }))
    Object.entries(data).filter(([key, value]) => {
        if(value.platform === "android") {
            const view_container_html = `
            <div class="view_container">
                <div class="title_view">
                    <text class="title">${value.udid} (${value.status})</text>
                </div>
                <iframe height="750px" width="500px" src="http://${node_address.ip}:${node_address.port}/#!action=stream&udid=${value.udid}&decoder=broadway&ip=${node_address.ip}&port=${node_address.port}&query=%3Faction%3Dproxy%26remote%3Dtcp%253A8886%26udid%3D${value.udid}" frameBorder="0"></iframe>
            </div>
            `
            $(view_container_html).appendTo($(".page_container"))
        }
    })
    return $.html()
}

main()