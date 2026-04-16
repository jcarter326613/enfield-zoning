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
import { service } from "./app-service.js"

console.info("Service object created")

void service.start(async () => {
    console.info(`Environment = ${process.env.ENVIRONMENT}`)
    console.info(`Env = ${process.env.ENV}`)
    console.info(`Node Env = ${process.env.NODE_ENV}`)
})

console.info("Start called")