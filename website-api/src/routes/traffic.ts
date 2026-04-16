import express from "express"

import { RouteBase } from "./route-base.js"
import { Traffic as TrafficController } from "../controllers/traffic.js"
import { HttpStatusCode } from "../http-status-code.js"

export class Traffic extends RouteBase<TrafficController>
{
    constructor(app: express.Application)
    {
        super(app, new TrafficController())
        this.initialize()
    }

    private initialize()
    {
        this.setupPost<void>("/traffic/:page", this.controller.traffic, HttpStatusCode.OK)
    }
}
