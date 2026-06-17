import express from "express"

import { Admin as AdminDto } from "@enfield-zoning/website-api-dto"

import { Admin as AdminController } from "../controllers/admin.js"
import { HttpStatusCode } from "../http-status-code.js"
import { RouteBase } from "./route-base.js"

export class Admin extends RouteBase<AdminController> {
    constructor(app: express.Application) {
        super(app, new AdminController())
        this.initialize()
    }

    private initialize() {
        this.setupGet<void>("/admin/comments", this.controller.getComments)
        this.setupPost<AdminDto.ApproveCommentRequest>("/admin/comments/approve", this.controller.approveComment, HttpStatusCode.OK_NO_CONTENT)
        this.setupPost<AdminDto.RejectCommentRequest>("/admin/comments/reject", this.controller.rejectComment, HttpStatusCode.OK_NO_CONTENT)
    }
}
