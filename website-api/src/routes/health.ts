import express from "express"

import { RouteBase } from "./route-base.js"
import { Health as HealthController } from "../controllers/health.js"
import { HttpStatusCode } from "../http-status-code.js"

export class Health extends RouteBase<HealthController>
{
    constructor(app: express.Application)
    {
        super(app, new HealthController())
        this.initialize()
    }

    private initialize()
    {
        this.setupPost<void>("/health/", this.controller.health, HttpStatusCode.OK)
    }
}
