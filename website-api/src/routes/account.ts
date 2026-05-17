import express from "express"

import { RouteBase } from "./route-base.js"
import { Account as AccountController } from "../controllers/account.js"
import { HttpStatusCode } from "../http-status-code.js"
import { AccountCreateModel } from "@enfield-zoning/website-api-dto"

export class Account extends RouteBase<AccountController>
{
    constructor(app: express.Application)
    {
        super(app, new AccountController())
        this.initialize()
    }

    private initialize()
    {
        this.setupPost<AccountCreateModel>("/account/create", this.controller.create, HttpStatusCode.OK_NO_CONTENT)
    }
}
