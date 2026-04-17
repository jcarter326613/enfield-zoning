import cookieParser from "cookie-parser"
import cors from "cors"
import express, { Express } from "express"
import expressWinston from "express-winston"
import http from "http"
import winston from "winston"

import { RouteBase } from "./routes/route-base.js"

const loggerOptions: expressWinston.LoggerOptions = {
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
        winston.format.json(),
        //winston.format.prettyPrint(),
        //winston.format.colorize({ all: true })
    ),
};

export class Service {
    readonly app: Express

    constructor(routes: (new (app: express.Application) => RouteBase<any>)[]) {
        this.app = express()
        this.app.use(cookieParser())
        this.app.get('/*', function(req, res, next){ 
            res.setHeader('Last-Modified', (new Date()).toUTCString());
            next(); 
        });

        this.app.use(express.json())
        this.app.use(expressWinston.logger(loggerOptions))

        routes.forEach(x => {
            return new x(this.app)
        })
    }

    start(initFunc: () => Promise<void>) {
        const port = 8080

        return new Promise<void>(async (resolve) => {
            await initFunc()
            this.app.listen(port, async () => { 
                console.log(`Server running on ${port}...`) 
                resolve()
            })
        })
    }
}