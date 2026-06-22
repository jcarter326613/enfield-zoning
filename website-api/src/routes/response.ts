import express, { CookieOptions } from "express"

import { Authentication, Instance as AuthInstance } from "../services/authentication.js"

export class Response {
    private jsonContent: any | null = null
    private stringContent: any | null = null
    private fileContent: any | null = null
    private fileName: string | null = null
    private headers: Record<string, string> = {}
    private cookies: ResponseCookie[] = []
    private neededNewAuthToken: string | null = null
    private needClearAuthToken: boolean = false
    private statusCode: number | null = null

    setHeader(name: string, value: string) {
        this.headers[name] = value
        return this
    }

    setJson(obj: any) {
        this.jsonContent = obj
        return this
    }

    setFile(obj: any, fileName: string) {
        this.fileContent = obj
        this.fileName = fileName
        return this
    }

    setCookie(cookie: ResponseCookie) {
        this.cookies.push(cookie)
    }

    setGenerateAuthToken(userId: string | null) {
        if (userId == null) {
            this.needClearAuthToken = true
        } else {
            this.neededNewAuthToken = userId
        }
    }

    setStatusCode(code: number) {
        this.statusCode = code
    }

    async populateResponse(
        request: express.Request,
        response: express.Response
    ) {
        if (this.statusCode != null) {
            response.status(this.statusCode)
        }

        for (let header of Object.keys(this.headers)) {
            response.append(header, this.headers[header])
        }

        if (this.needClearAuthToken) {
            response.clearCookie(Authentication.AUTHORIZATION_COOKIE_NAME)
        } else if (this.neededNewAuthToken != null) {
            const accessToken = await AuthInstance.generateAuthenticationToken(this.neededNewAuthToken)
            response.cookie(
                Authentication.AUTHORIZATION_COOKIE_NAME,
                accessToken,
                {
                    httpOnly: true,
                    secure: true,
                    sameSite: "lax",
                    maxAge: 1000 * 60 * 60 * 24 * Authentication.MAX_DAYS_REFRESH_TOKEN_AGE
                }
            )
        }

        for (let cookie of this.cookies) {
            response.cookie(cookie.name, cookie.value, cookie.options)
        }
        
        if (this.stringContent != null) {
            response.send(this.stringContent)
        } else if (this.jsonContent != null) {
            response.json(this.jsonContent)
        } else if (this.fileContent != null && this.fileName != null) {
            response.attachment(this.fileName)
            response.send(this.fileContent)
        } else {
            response.end()
        }

        return response
    }
}

export type ResponseCookie = {
    name: string,
    value: string,
    options: CookieOptions
}