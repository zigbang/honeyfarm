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
    const node_ip = "localhost:8000"
    // const node_ip = "192.168.99.37:8000" 
    let $ = cheerio.load(fs.readFileSync(htmlPath, { encoding: "utf8" }))
    const data = SessionRouter.lsResource() as { [key: string]: { platform: string, version: string, status: string, udid: string}}
    Object.entries(data).filter(([key, value]) => {
        if(value.platform === "android") {
            const view_container_html = `
            <div class="view_container">
                <text class="view_title">${value.udid} (${value.status})</text>
                <iframe height="800px" width="550px" src="http://${node_ip}/#!action=stream&udid=${value.udid}&decoder=broadway&ip=${node_ip}&port=8000&query=%3Faction%3Dproxy%26remote%3Dtcp%253A8886%26udid%3D${value.udid}" frameBorder="0"></iframe>
            </div>
            `
            $(view_container_html).appendTo($(".page_container"))
        }
    })
    return $.html()
}