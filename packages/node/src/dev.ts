import cp from "child_process"
import fs from "fs"
import shelljs from "shelljs"
import os from "os"

export class dev {
    run() {
        cp.exec("yarn nodemon")

        process.chdir(os.tmpdir())

        if (fs.existsSync("./ws-scrcpy/package.json")) {
            shelljs.exec("cd ws-scrcpy && git pull")
        } else {
            shelljs.exec("git clone https://github.com/NetrisTV/ws-scrcpy.git")
        }

        shelljs.exec("cd ws-scrcpy && yarn && yarn start")
    }
}

new dev().run()

