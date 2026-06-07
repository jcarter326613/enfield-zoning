import express from "express"

import { RouteBase } from "./route-base.js"
import { Account as AccountController } from "../controllers/account.js"
import { HttpStatusCode } from "../http-status-code.js"
import { Account as AccountDto } from "@enfield-zoning/website-api-dto"

export class Account extends RouteBase<AccountController>
{
    constructor(app: express.Application)
    {
        super(app, new AccountController())
        this.initialize()
    }

    private initialize()
    {
        this.setupGet<void>("/authstatus", this.controller.authstatus)
        this.setupPost<AccountDto.AccountCreateRequest>("/account/create", this.controller.create, HttpStatusCode.OK)
        this.setupPost<AccountDto.LoginRequest>("/account/login", this.controller.startLogin, HttpStatusCode.OK)
        this.setupPost<AccountDto.CompleteLoginRequest>("/account/complete-login", this.controller.completeLogin, HttpStatusCode.OK)
    }
}
