import shell from "shelljs"
import fs from "fs"

export class deploy {
    run() {
        const curruentPath = process.cwd()
        console.log(curruentPath)
        //node build
        shell.exec("yarn build")
        
        //ws build
        process.chdir("../../../")

        if (fs.existsSync("./ws-scrcpy/package.json")) {
            shell.exec("cd ws-scrcpy && git pull")
        } else {
            shell.exec("git clone https://github.com/NetrisTV/ws-scrcpy.git")
        }

        shell.exec("cd ws-scrcpy && yarn && yarn dist")

        //copy ws dist
        shell.cp("-fr", "./ws-scrcpy/dist/public", `${curruentPath}/dist`)
        shell.cp("-fr", "./ws-scrcpy/dist/server", `${curruentPath}/dist`)

        // npm publish
        process.chdir(curruentPath)
        //shell.exec("npm publish")

    }
}

new deploy().run()