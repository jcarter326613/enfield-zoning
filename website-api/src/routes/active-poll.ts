import express from "express"

import { Poll } from "@enfield-zoning/website-api-dto"

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
        this.setupGet<void>("/active-poll/:id", this.controller.index)
        this.setupPost<Poll.CastVote>("/active-poll/:id/cast-vote", this.controller.castVote, HttpStatusCode.ACCEPTED)
        this.setupGet<void>("/active-poll/:id/discussion", this.controller.getDiscussionComments)
        this.setupPost<Poll.CreateDiscussionCommentRequest>(
            "/active-poll/:id/discussion",
            this.controller.createDiscussionComment,
            HttpStatusCode.CREATED
        )
    }
}
