import express, { CookieOptions } from "express"

export class Response {
    private jsonContent: any | null = null
    private stringContent: any | null = null
    private fileContent: any | null = null
    private fileName: string | null = null
    private headers: Record<string, string> = {}
    private cookies: ResponseCookie[] = []
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