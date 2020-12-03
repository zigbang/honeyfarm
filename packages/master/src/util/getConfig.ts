import * as fs from "fs"

export async function FromJson() {
    if(fs.existsSync(`${process.cwd()}/config.json`)) {
        try {
            return require(`${process.cwd()}/config.json`) 
        } catch (e) {
            return undefined
        }
    } else {
        return undefined
    }
}
