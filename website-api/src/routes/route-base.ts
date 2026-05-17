import express from "express"

import { Response } from "./response.js"
import { TypedRequest } from "./typed-request.js"
import { HttpError } from "../exceptions/http-error.js"
import { HttpStatusCode } from "../http-status-code.js"
import { Authentication } from "../services/authentication.js"

export class RouteBase<T>
{
    private app: express.Application
    private authentication: Authentication
    controller: T

    constructor(app: express.Application, controller: T)
    {
        this.app = app
        this.controller = controller
        this.authentication = new Authentication
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
        // Perform the auth first
        let authId: string | undefined
        let needNewAuthToken = false
        try {
            const authResults = await this.authentication.verifyAuthentication(request)
            authId = authResults.userId
            needNewAuthToken = authResults.newTokenNeeded
        } catch (e: any) {}

        // Now run the command
        let responseObj = new Response()
        try
        {
            let result = await controller.call(this.controller, {
                params: request.params,
                query: request.query,
                body: request.body,
                ips: request.ips,
                ip: request.ip ?? "",
                loggedInUserId: authId
            })
            response.status(successCode)

            if (result instanceof Response) {
                responseObj = result
            } else {
                responseObj.setJson(result)
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
            return response.status(statusCode).json({errorMessage: message})
        }

        // Try to return the object.  If this fails, just do a stripped down 500 error
        if (needNewAuthToken && authId != null) {
            responseObj.setGenerateAuthToken(authId)
        }
        try {
            await responseObj.populateResponse(request, response)
        } catch (e: any) {
            console.error(e)
            const message = e?.message ?? e
            response.status(500).json({errorMessage: message})
        }
    }
}

export type ControllerParameters<B> = {
    params: Record<string, string>,
    query: Record<string, string>, 
    body: B,
    ips: string[],
    ip: string,
    loggedInUserId: string | undefined,
}