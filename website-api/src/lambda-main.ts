// Read in the environment
import * as dotenv from "dotenv"
dotenv.config({
    path: [
        `.env.${process.env.ENVIRONMENT?.toLowerCase() ?? "local"}`,
        `.env`,
    ]
})

// Setup logging
import winston from "winston"
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.json(),
    ),
    transports: [new winston.transports.Console()],
    exceptionHandlers: [new winston.transports.Console()],
    rejectionHandlers: [new winston.transports.Console()],
});
console.log = (...args) => logger.info.call(logger, args)
console.info = (...args) => logger.info.call(logger, args)
console.debug = (...args) => logger.debug.call(logger, args)
console.warn = (...args) => logger.warn.call(logger, args)
console.error = (...args) => logger.error.call(logger, args)

// Continue with the actual program
import * as http from 'http'

import { lambdaHandler } from "./lambda-handler.js"

console.info("Service object created")

console.info(`Environment = ${process.env.ENVIRONMENT}`)
console.info(`Env = ${process.env.ENV}`)
console.info(`Node Env = ${process.env.NODE_ENV}`)


class Main {
    private awsLambdaHost: string | null = null
    private awsLambdaPort: string | null = null
    private awsLambdaRequestId: string | null = null

    constructor() {
        let awsLambdaEndpoint = process.env.AWS_LAMBDA_RUNTIME_API ?? null
        if (awsLambdaEndpoint?.length == 0) {
            awsLambdaEndpoint = null
        }

        if (awsLambdaEndpoint != null) {
            const colonIndex = awsLambdaEndpoint.indexOf(":")
            if (colonIndex < 0) {
                this.awsLambdaHost = awsLambdaEndpoint
                this.awsLambdaPort = "80"
            } else {
                this.awsLambdaHost = awsLambdaEndpoint.substring(0, colonIndex)
                this.awsLambdaPort = awsLambdaEndpoint.substring(colonIndex + 1)
            }
        } else {
            throw new Error("Missing awsLambdaEndpoint")
        }
    }

    run() {
        void new Promise<void>(async (resolve) => {
            console.debug(`In lambda loop`)
            while(true) {
                await new Promise<void>((httpResolve) => {
                    http.request({
                        host: this.awsLambdaHost,
                        port: this.awsLambdaPort,
                        path: "/2018-06-01/runtime/invocation/next"
                    }, (response) => {
                        this.awsLambdaRequestId = response.headers["lambda-runtime-aws-request-id"]?.toString() ?? null
                        let dataText = ""
                        response.on("data", (data) => {
                            dataText += data
                        })
                        response.on("end", async () => {
                            console.debug(`Recieved event text ${dataText}`)
                            let event = JSON.parse(dataText)
                            let result = lambdaHandler(event, {})

                            const clientRequest = http.request({
                                host: this.awsLambdaHost,
                                port: this.awsLambdaPort,
                                path: `/2018-06-01/runtime/invocation/${this.awsLambdaRequestId}/response`,
                                method: "POST"
                            }, (response2) => {
                                response2.on("data", (data) => {})
                                response2.on("end", () => {
                                    httpResolve()
                                })
                            })
                              
                            let resultText = JSON.stringify(result)
                            clientRequest.write(resultText)
                            clientRequest.end()
                        })
                    }).end()
                })
            }
        })
    }
}

console.debug("Creating main loop")
console.debug(`Initial region: ${process.env.AWS_DEFAULT_REGION}`)
const main = new Main()
main.run()
console.debug("Main loop running")