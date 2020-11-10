import cp from "child_process"

cp.exec("yarn nodemon")
cp.exec("cd src/ws-scrcpy && yarn && yarn start")