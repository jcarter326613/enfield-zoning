import express from "express"

import { RouteBase } from "./route-base.js"
import { ActivePoll as ActivePollController } from "../controllers/active-poll.js"
import { HttpStatusCode } from "../http-status-code.js"

export class ActivePoll extends RouteBase<ActivePollController>
{
    constructor(app: express.Application)
    {
        super(app, new ActivePollController())
        this.initialize()
    }

    private initialize()
    {
        this.setupGet<void>("/active-poll", this.controller.index)
    }
}
