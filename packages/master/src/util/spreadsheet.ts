import  { GoogleSpreadsheet } from "google-spreadsheet"
import * as fs from "fs"

export async function getSheet() {
    if(fs.existsSync("./googleauth.json")) {
        try {
            const auth = require("./googleauth.json") 
            const doc = new GoogleSpreadsheet(auth["spread_id"])
            await doc.useServiceAccountAuth(auth)
            await doc.loadInfo()
            const sheet = doc.sheetsById["0"]
            return sheet
        } catch (e) {
            return undefined
        }
    } else {
        return undefined
    }

}
