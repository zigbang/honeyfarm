import * as fs from "fs"

export async function FromJson() {
    if(fs.existsSync(`${process.cwd()}/deviceconfig.json`)) {
        try {
            return require(`${process.cwd()}/deviceconfig.json`) 
        } catch (e) {
            return undefined
        }
    } else {
        return undefined
    }
}
