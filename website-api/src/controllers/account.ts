import { HttpError } from "../exceptions/http-error.js"
import { HttpStatusCode } from "../http-status-code.js"
import { ControllerParameters } from "../routes/route-base.js"
import { User as UserService } from "../services/user.js"
import { Response } from "../routes/response.js"
import { AccountCreateModel } from "@enfield-zoning/website-api-dto"

export class Account {
    readonly userService: UserService

    constructor() {
        this.userService = new UserService
    }

    public async create(args: ControllerParameters<AccountCreateModel>): Promise<Response> {
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
}