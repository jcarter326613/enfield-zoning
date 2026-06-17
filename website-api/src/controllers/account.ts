import "../services/dotenv.js"

import { MailtrapClient } from "mailtrap"

import { Account as AccountDto } from "@enfield-zoning/website-api-dto"

import { HttpError } from "../exceptions/http-error.js"
import { HttpStatusCode } from "../http-status-code.js"
import { ControllerParameters } from "../routes/route-base.js"
import { User as UserService } from "../services/user.js"
import { Response } from "../routes/response.js"

const DOMAIN = process.env.DOMAIN

export class Account {
    readonly userService: UserService
    readonly msLoginTokenTimeout = 5 * 60 * 1000
    readonly mailtrapClient: MailtrapClient

    constructor() {
        this.userService = new UserService

        const mailtrapToken = process.env.MAILTRAP_TOKEN
        if (mailtrapToken == null) {
            console.error("Mailtrap token not supplied.")
            throw new Error("Mailtrap token not supplied.")
        }
        this.mailtrapClient = new MailtrapClient({
            token: mailtrapToken,
        });
    }

    public async authstatus(args: ControllerParameters<void>): Promise<AccountDto.AuthStatus> {
        return {
            isLoggedIn: args.loggedInUserId != null,
            isAdmin: args.loggedInUserIsAdmin ?? false,
        }
    }

    public async create(args: ControllerParameters<AccountDto.AccountCreateRequest>): Promise<Response> {
        // Create a user
        const result = await this.userService.createUser(args.body)
        const response = new Response()

        if (result) {
            // Return an auth token with the new userid
            const response = new Response()
            const responseDto: AccountDto.AccountCreateResponse = {
                success: true,
                isDuplicate: false,
            }
            response.setGenerateAuthToken(result)
            response.setJson(responseDto)
        } else {
            const responseDto: AccountDto.AccountCreateResponse = {
                success: false,
                isDuplicate: true,
            }
            response.setJson(responseDto)
        }
        
        return response
    }

    public async startLogin(args: ControllerParameters<AccountDto.LoginRequest>): Promise<AccountDto.LoginResponse> {
        const email = args.body.email
        const userId = await this.userService.getUserIdByEmail(email)
        const redirectUrl = args.body.redirectUrl

        if (userId == null) {
            return {
                emailSent: false,
                throttled: false,
                notFound: true,
            }
        } else {
            const loginTokenDto = await this.userService.getLoginToken(userId)
            const nowEpoch = (new Date()).getTime()
            if (
                loginTokenDto != null &&
                loginTokenDto.issuedEpoch > nowEpoch - this.msLoginTokenTimeout
            ) {
                return {
                    emailSent: false,
                    throttled: true,
                    notFound: false,
                }
            } else {
                const key = await this.userService.createLoginToken({
                    userId: userId,
                    redirectUrl: redirectUrl ?? "/"
                })
                await this.sendLoginEmail({
                    email: email, 
                    userId: userId, 
                    key: key
                })
                return {
                    emailSent: true,
                    throttled: false,
                    notFound: false,
                }
            }
        }
    }

    public async completeLogin(args: ControllerParameters<AccountDto.CompleteLoginRequest>): 
        Promise<Response> 
    {
        const userId = args.body.userId
        const key = args.body.token
        const loginTokenDto = await this.userService.getLoginToken(userId)
        const nowEpoch = (new Date()).getTime()
        if (
            loginTokenDto != null &&
            loginTokenDto.issuedEpoch > nowEpoch - this.msLoginTokenTimeout &&
            loginTokenDto.key == key
        ) {
            const response = new Response
            const responseDto: AccountDto.CompleteLoginResponse = {
                redirectUrl: loginTokenDto.redirectUrl
            }
            response.setGenerateAuthToken(userId)
            response.setJson(responseDto)

            try {
                await this.userService.useLoginToken(userId)
            } catch (e: any) {
            }

            return response
        } else {
            throw new HttpError(HttpStatusCode.UNAUTHORIZED, "The supplied token was not valid.")
        }
    }

    public async logout(args: ControllerParameters<void>): Promise<Response> {
        const response = new Response
        response.setGenerateAuthToken(null)
        return response
    }

    public async submitIdentity(args: ControllerParameters<AccountDto.SubmitIdentity>): Promise<void> {
        if (args.loggedInUserId == null) {
            throw new HttpError(HttpStatusCode.UNAUTHORIZED, "You must be logged in to set your identity")
        }

        await this.userService.setProvidedIdentity({
            userId: args.loggedInUserId,
            ...args.body
        })
    }

    private async sendLoginEmail(args: {
        email: string,
        userId: string,
        key: string,
    }) {
        const loginLink = `${DOMAIN}/complete-sign-in?u=${args.userId}&t=${args.key}`

        const sender = {
            email: "noreply@enfieldnhzoning.org",
            name: "Enfield NH Zoning",
        }
        const recipients = [{
            email: args.email,
        }]

        await this.mailtrapClient.send({
            from: sender,
            to: recipients,
            subject: "Enfield NH Zoning Login",
            html: `To complete the login process, click the link below.<br /><br /><a href="${loginLink}">Complete Login</a>
                <br /><br />If the link does not work, you can set your browser to the following URL: ${loginLink}`,
            text: `To complete the login process, please visit the following url in your browser:\r\n\r\n${loginLink}`,
            category: "Integration Test",
        })
    }
}