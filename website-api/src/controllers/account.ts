import { MailtrapClient } from "mailtrap"

import { Account as AccountDto } from "@enfield-zoning/website-api-dto"

import { HttpError } from "../exceptions/http-error.js"
import { HttpStatusCode } from "../http-status-code.js"
import { ControllerParameters } from "../routes/route-base.js"
import { User as UserService } from "../services/user.js"
import { Response } from "../routes/response.js"

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
            isLoggedIn: args.loggedInUserId != null
        }
    }

    public async create(args: ControllerParameters<AccountDto.AccountCreateModel>): Promise<Response> {
        // Create a user
        const result = await this.userService.createUser(args.body)

        if (result) {
            // Return an auth token with the new userid
            const response = new Response()
            response.setGenerateAuthToken(result)
            return response
        } else {
            // Fail the creation with a "User already exists" error.
            throw new HttpError(HttpStatusCode.DUPLICATE, "The supplied email address is already in use.")
        }
    }

    public async startLogin(args: ControllerParameters<AccountDto.LoginRequest>): Promise<AccountDto.LoginResponse> {
        const email = args.body.email
        const userId = await this.userService.getUserIdByEmail(email)

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
                await this.sendLoginEmail(email, userId)
                return {
                    emailSent: true,
                    throttled: false,
                    notFound: false,
                }
            }
        }
    }

    private async sendLoginEmail(email: string, userId: string) {
        const sender = {
            email: "noreply@enfieldnhzoning.org",
            name: "Enfield NH Zoning",
        }
        const recipients = [{
            email: email,
        }]

        await this.mailtrapClient.send({
            from: sender,
            to: recipients,
            subject: "You are awesome!",
            text: "Congrats for sending test email with Mailtrap!",
            category: "Integration Test",
        })
    }
}