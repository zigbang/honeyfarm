import cp from "child_process"
import fs from "fs"
import shell from "shelljs"

export class dev {
    run() {
        cp.exec("yarn nodemon")
        process.chdir("../../../")
        if (fs.existsSync("./ws-scrcpy/package.json")) {
            shell.exec("cd ws-scrcpy && git pull")
        } else {
            shell.exec("git clone https://github.com/NetrisTV/ws-scrcpy.git")
        }
        shell.exec("cd ws-scrcpy && yarn && yarn start")
    }
}

new dev().run()

