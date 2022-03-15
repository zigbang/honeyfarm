import shelljs from "shelljs"
import fs from "fs"
import os from "os"

export class deploy {
    run() {
        const curruentPath = process.cwd()
        //node build
        shelljs.exec("npm run build")

        //ws build
        process.chdir(os.tmpdir())

        if (fs.existsSync("./ws-scrcpy/package.json")) {
            shelljs.exec("cd ws-scrcpy && git pull")
        } else {
            shelljs.exec("git clone https://github.com/NetrisTV/ws-scrcpy.git")
        }

        shelljs.exec("cd ws-scrcpy && npm install && npm run dist")

        //copy ws dist
        shelljs.cp("-fr", "./ws-scrcpy/dist/public", `${curruentPath}/dist`)
        shelljs.cp("-fr", "./ws-scrcpy/dist/server", `${curruentPath}/dist`)

        // npm publish
        process.chdir(curruentPath)
        shelljs.exec("npm publish --@zigbang:registry=https://registry.npmjs.org")
    }
}

new deploy().run()