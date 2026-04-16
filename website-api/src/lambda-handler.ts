import serverless from "serverless-http"
import { service } from "./app-service.js"

let handler: any

export const lambdaHandler = async (event: any, context: any) => {
    if (!handler) {
        handler = serverless(service.app)
    }

    return handler(event, context)
}
