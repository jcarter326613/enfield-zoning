import express from "express"

import { Response } from "./response.js"
import { TypedRequest } from "./typed-request.js"
import { HttpError } from "../exceptions/http-error.js"
import { HttpStatusCode } from "../http-status-code.js"

export class RouteBase<T>
{
    private app: express.Application
    controller: T

    constructor(app: express.Application, controller: T)
    {
        this.app = app
        this.controller = controller
    }

    protected setupGet<B>(
        path: string, 
        controller: (args: ControllerParameters<B>) => any)
    {
        this.app.get(path, async (request: TypedRequest<B>, response: express.Response) => 
            this.callController<B>(request, response, HttpStatusCode.OK, controller))
    }

    protected setupPost<B>(
        path: string, 
        controller: (args: ControllerParameters<B>) => any,
        successCode: HttpStatusCode)
    {
        this.app.post(path, async (request: TypedRequest<B>, response: express.Response) => 
            this.callController<B>(request, response, successCode, controller))
    }

    private async callController<B>(
        request: TypedRequest<B>, 
        response: express.Response,
        successCode: number,
        controller: (args: ControllerParameters<B>) => Response | any)
    {
        try
        {
            let result = await controller.call(this.controller, {
                params: request.params,
                query: request.query,
                body: request.body,
                ips: request.ips,
                ip: request.ip ?? "",
            })
            response.status(successCode)
            if (result instanceof Response) {
                return await result.populateResponse(request, response)
            } else {
                return response.json(result)
            }
        }
        catch (e: any)
        {
            let statusCode: number
            if (e instanceof HttpError) {
                statusCode = e.statusCode
                if (statusCode >= 500) {
                    console.error(e)
                } else {
                    console.warn(e)
                }
            } else {
                statusCode = 500
                console.error(e)
            }

            const message = e?.message ?? e
            return response.status(statusCode).json({errorMessage: message});
        }
    }
}

export type ControllerParameters<B> = {
    params: Record<string, string>,
    query: Record<string, string>, 
    body: B, 
    ips: string[],
    ip: string,
}