import express from "express"

import { RouteBase } from "./route-base.js"
import { Home as HomeController } from "../controllers/home.js"
import { HttpStatusCode } from "../http-status-code.js"

export class Home extends RouteBase<HomeController>
{
    constructor(app: express.Application)
    {
        super(app, new HomeController())
        this.initialize()
    }

    private initialize()
    {
        this.setupGet<void>("/home", this.controller.index)
    }
}
