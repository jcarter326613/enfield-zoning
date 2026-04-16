import { lambdaHandler } from "./lambda-handler.js"

async function main() {
    const event = {
        httpMethod: "GET",
        path: "/health",
        headers: {},
        queryStringParameters: null,
        pathParameters: null,
        body: null,
        isBase64Encoded: false,
        requestContext: {},
    }

    const context = {}

    const result = await lambdaHandler(event, context)
    console.log(JSON.stringify(result, null, 4))
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})