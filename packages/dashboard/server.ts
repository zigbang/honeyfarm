import { argsParser } from "./src/utils"
const { createServer } = require('http')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const dir = argsParser(process.argv, "--dir")
const app = next({ dev, dir})
const handle = app.getRequestHandler()

async function bootstrap() {
    
    app.prepare().then(() => {
        createServer((req, res) => {
            handle(req, res)
        }).listen(3000, (err) => {
            if (err) throw err
            console.log('> Ready on http://localhost:3000')
        })
    })
}

bootstrap()

export {}
