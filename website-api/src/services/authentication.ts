import express from "express"
import jwt from "fast-jwt"

import { 
    SSMClient,
    GetParameterCommand
} from "@aws-sdk/client-ssm"

import { HttpError } from "../exceptions/http-error.js"
import { HttpStatusCode } from "../http-status-code.js"
import { S3Writer } from "./s3-writer.js"

export class Authentication
{
    static readonly ACCESS_TOKEN_SECRET = "/enfieldnhzoning/website-api/access-token"
    static readonly REFRESH_TOKEN_SECRET = "/enfieldnhzoning/website-api/refresh-token"
    static readonly AUTHORIZATION_COOKIE_NAME = "X-ENFIELDNHZONING-AUTHORIZATION"
    static readonly REFRESH_TOKEN_PATH = "v1/refreshTokens"
    static readonly MAX_DAYS_REFRESH_TOKEN_AGE = 60

    private isInitialized: boolean = false

    private accessTokenSigner: (payload: jwt.SignerPayload) => string
    private accessTokenVerifier: (token: jwt.Bufferable) => unknown
    private refreshTokenSigner: (payload: jwt.SignerPayload) => string
    private refreshTokenVerifier: (token: jwt.Bufferable) => unknown
    private decoder: (token: jwt.Bufferable) => unknown

    private s3Writter: S3Writer

    constructor()
    {
        this.s3Writter = new S3Writer
    }

    public async generateAuthenticationToken(userId: string)
    {
        // Validate the inputs
        await this.initialize()
        
        // Create a new refresh token, which is stored on S3
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + Authentication.MAX_DAYS_REFRESH_TOKEN_AGE)
        const refreshTokenId = await this.s3Writter.writeJsonFileToS3<RefreshFileContents>({
            userId: userId,
            expiresAt: expirationDate.getTime()
        }, Authentication.REFRESH_TOKEN_PATH, {
            addUniqueSuffix: true
        })

        const refreshTokenContents: RefreshContents = {
            a: refreshTokenId,
            b: userId
        }
        const signedRefreshToken = this.refreshTokenSigner(refreshTokenContents) 

        // Create a new access token
        const accessTokenContents: AuthContents = {
            a: userId,
            b: signedRefreshToken,
            c: undefined
        }
        return this.accessTokenSigner(accessTokenContents) 
    }

    public async verifyAuthentication(req: express.Request): Promise<{
        newTokenNeeded: boolean,
        userId: string
    }> {
        // Initialize
        await this.initialize()

        // Get the auth cookie
        if (req.cookies == null) {
            console.debug("Missing cookies when trying to authenticate")
            throw new HttpError(HttpStatusCode.UNAUTHORIZED, "Invalid token")
        }
        const authCookie = req.cookies[Authentication.AUTHORIZATION_COOKIE_NAME] ?? req.cookies[Authentication.AUTHORIZATION_COOKIE_NAME.toLowerCase()]
        if (authCookie == null) {
            console.debug(`Missing auth cookie when trying to authenticate ${JSON.stringify(req.cookies)}`)
            throw new HttpError(HttpStatusCode.UNAUTHORIZED, "Invalid token")
        }
        
        // Extract the token data
        const promise = new Promise<{
            newTokenNeeded: boolean,
            userId: string
        }>(async (resolve, reject) => {
            let authContents: any = null
            try {
                authContents = this.accessTokenVerifier(authCookie)
            } catch (e: any) {}
            const authContentsCast = authContents as AuthContents | null
            if (authContentsCast?.c !== undefined) {
                console.debug("Restriction key not undefined")
                reject(new HttpError(HttpStatusCode.UNAUTHORIZED, "Invalid token"))
                return
            }
            if (authContentsCast?.a != null) {
                resolve({
                    newTokenNeeded: false,
                    userId: authContentsCast.a
                })
                return
            } else {
                const decodedAuthCookie = this.decoder(authCookie) as AuthContents | null
                if (decodedAuthCookie != null) {
                    const refreshToken = decodedAuthCookie.b
                    const userId = decodedAuthCookie.a
                    if (refreshToken != null && userId != null) {
                        try {
                            const success = await this.exerciseRefreshToken(refreshToken, userId)
                            if (success) {
                                resolve({
                                    newTokenNeeded: true,
                                    userId: userId
                                })
                                return
                            }
                        } catch (e: any) {
                            console.debug(`Rejection exercising token ${e}`)
                            reject(e)
                            return
                        }
                    }
                }
                reject(new HttpError(HttpStatusCode.UNAUTHORIZED, "Invalid token"))
            }
        }).catch((reason) => {
            console.debug(`Error verifying auth ${reason}`)
            throw reason
        })

        return promise
    }

    private async exerciseRefreshToken(
        refreshToken: string, 
        userId: string
    ): Promise<boolean> {
        // Decode the refreshToken (must be properly signed and not expired)
        const refreshTokenExtracted = await new Promise<RefreshContents | null>((resolve) => {
            let refreshContents: any = null
            try {
                refreshContents = this.refreshTokenVerifier(refreshToken)
            } catch (e: any) {}
            const refreshContentsCast = refreshContents as RefreshContents
            if (refreshContentsCast != null) {
                resolve(refreshContentsCast)
            } else {
                resolve(null)
            }
        })
        if (refreshTokenExtracted == null) {
            throw new HttpError(HttpStatusCode.UNAUTHORIZED, "Invalid token")
        }

        // Check that the userid in the refresh token matches the user id from the auth token
        if (refreshTokenExtracted.b == null || refreshTokenExtracted.b != userId) {
            throw new HttpError(HttpStatusCode.UNAUTHORIZED, "Invalid token")
        }

        // Check that the s3 id is present
        if (refreshTokenExtracted.a == null) {
            throw new HttpError(HttpStatusCode.UNAUTHORIZED, "Invalid token")
        }

        // Check that s3 has this refresh token recorded and that it isn't expirationDate
        const filePath = `${Authentication.REFRESH_TOKEN_PATH}/${refreshTokenExtracted.a}`
        const fileContents = await this.s3Writter.readJsonFileFromS3<RefreshFileContents>(filePath)
        const nowEpoch = (new Date()).getTime()
        if (
            fileContents?.userId == userId &&
            (fileContents?.expiresAt ?? 0) > nowEpoch
        ) {
            return true
        } else {
            return false
        }
    }

    private async initialize()
    {
        if (!this.isInitialized) {
            const accessTokenSecret = await this.getKey("/enfieldnhzoning/website-api/access-token")
            const refreshTokenSecret = await this.getKey("/enfieldnhzoning/website-api/refresh-token")
            if (accessTokenSecret == null || refreshTokenSecret == null || 
                accessTokenSecret.length == 0 || refreshTokenSecret.length == 0)
            {
                throw new Error("Access token secret not defined")
            }

            this.accessTokenSigner = jwt.createSigner({
                key: accessTokenSecret,
                expiresIn: "30m"
            })
            this.refreshTokenSigner = jwt.createSigner({
                key: refreshTokenSecret,
                expiresIn: `${Authentication.MAX_DAYS_REFRESH_TOKEN_AGE}d`
            })
            this.decoder = jwt.createDecoder()
            this.accessTokenVerifier = jwt.createVerifier({
                key: accessTokenSecret
            })
            this.refreshTokenVerifier = jwt.createVerifier({
                key: refreshTokenSecret
            })

            this.isInitialized = true
        }
    }

    private async getKey(path: string): Promise<string> {
        try {
            const ssmClient = new SSMClient({region: process.env.AWS_DEFAULT_REGION})
            const parameter = await ssmClient.send(new GetParameterCommand({
                Name: path,
                WithDecryption: true
            }))
            if (parameter.Parameter?.Value == null) {
                throw new Error("Encryption key is blank")
            }
            const retVal = parameter.Parameter?.Value
            if (retVal == null) {
                throw new Error(`Uable to load key ${path}.  Value was null`)
            }
            return retVal
        } catch (e: any) {
            console.error(`Unable to load encryption key ${e}`)
            throw e
        }
    }
}

export const Instance = new Authentication

type AuthContents = {
    a: string | undefined    //userId
    b: string | undefined    //refreshToken
    c: string | undefined    //restriction key
}

type RefreshContents = {
    a: string | undefined    //refresh id
    b: string | undefined    //userId
}

type RefreshFileContents = {
    userId: string
    expiresAt: number
}