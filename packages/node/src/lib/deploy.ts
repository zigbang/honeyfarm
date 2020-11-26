import shell from "shelljs"

export class deploy {
    run() {
        //node build
        shell.exec("yarn build")
        
        //ws build
        process.chdir("./src/ws-scrcpy")
        console.log(shell.pwd())
        shell.exec("yarn dist")
        
        //copy ws dist
        shell.cp("-fr", "./dist/public", "../../dist")
        shell.cp("-fr", "./dist/server", "../../dist")
        //shell.exec("yarn clean")

        // npm publish
        process.chdir("../../")
        console.log(shell.pwd())
    }
}

new deploy().run()