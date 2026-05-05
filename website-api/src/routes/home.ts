import express from "express"

import { RouteBase } from "./route-base.js"
import { Traffic as TrafficController } from "../controllers/home.js"
import { HttpStatusCode } from "../http-status-code.js"

export class Home extends RouteBase<TrafficController>
{
    constructor(app: express.Application)
    {
        super(app, new HomeController())
        this.initialize()
    }

    private initialize()
    {
        this.setupGet<void>("/home", this.controller.traffic, HttpStatusCode.OK)
    }
}
