import shelljs from "shelljs"

export class deploy {
    run() {
        //기존 파일 삭제
        shelljs.rm("-rf", "dist")
        //tsc
        shelljs.exec("tsc")

        //next build
        shelljs.exec("yarn build")

        // npm publish
        shelljs.exec("npm publish")

    }
}

new deploy().run()