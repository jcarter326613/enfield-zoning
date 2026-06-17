import "../services/dotenv.js"

import { MailtrapClient } from "mailtrap"

import { Admin as AdminDto } from "@enfield-zoning/website-api-dto"

import { ActivePoll, ActivePollDto, DiscussionCommentDto } from "./active-poll.js"
import { AllCardsDto, Home } from "./home.js"
import { HttpError } from "../exceptions/http-error.js"
import { HttpStatusCode } from "../http-status-code.js"
import { ControllerParameters } from "../routes/route-base.js"
import { S3Writer } from "../services/s3-writer.js"
import { User } from "../services/user.js"

const DOMAIN = process.env.DOMAIN

export class Admin {
    private readonly s3Writer = new S3Writer()
    private readonly userService = new User()
    private readonly mailtrapClient: MailtrapClient

    constructor() {
        const mailtrapToken = process.env.MAILTRAP_TOKEN

        if (mailtrapToken == null) {
            throw new Error("Mailtrap token not supplied.")
        }

        this.mailtrapClient = new MailtrapClient({
            token: mailtrapToken
        })
    }

    public async getComments(
        args: ControllerParameters<void>
    ): Promise<AdminDto.GetCommentsResponse> {
        this.requireAdmin(args)

        const pollFiles = await this.s3Writer.readJsonFileFromS3<AllCardsDto>(Home.S3_CARDS_LIST_PATH)

        const polls: AdminDto.Poll[] = []

        for (const pollFile of pollFiles?.cards ?? []) {
            if (pollFile.id.includes("/")) {
                continue
            }

            const comments = await this.s3Writer.readJsonFolderFromS3<DiscussionCommentDto>(
                ActivePoll.getS3PathForComments(pollFile.id)
            )

            const commentsRequiringReview = comments.filter(comment => {
                return comment.payload.passedReview !== true
            })

            if (commentsRequiringReview.length === 0) {
                continue
            }

            polls.push({
                id: pollFile.id,
                title: pollFile.title,
                comments: await Promise.all(
                    commentsRequiringReview
                        .sort((a, b) => a.payload.createdAtEpoch - b.payload.createdAtEpoch)
                        .map(async comment => {
                            const user = await this.userService.getUser(comment.payload.userId)

                            return {
                                id: comment.id,
                                text: comment.payload.text,
                                createdAtEpoch: comment.payload.createdAtEpoch
                            }
                        })
                )
            })
        }

        return {
            polls
        }
    }

    public async approveComment(
        args: ControllerParameters<AdminDto.ApproveCommentRequest>
    ): Promise<void> {
        this.requireAdmin(args)

        const request = args.body

        const comment = await this.s3Writer.readJsonFileFromS3<DiscussionCommentDto>(
            this.getS3PathForComment(
                request.pollId,
                request.commentId
            )
        )

        if (comment == null) {
            throw new HttpError(
                HttpStatusCode.NOT_FOUND,
                "Comment not found."
            )
        }

        comment.passedReview = true

        await this.s3Writer.writeJsonFileToS3(
            comment,
            this.getS3PathForComment(
                request.pollId,
                request.commentId
            ),
            {
                allowOverwrite: true
            }
        )
    }

    public async rejectComment(
        args: ControllerParameters<AdminDto.RejectCommentRequest>
    ): Promise<void> {
        this.requireAdmin(args)
        const pollId = args.body.pollId
        const commentId = args.body.commentId

        const pollFiles = await this.s3Writer.readJsonFileFromS3<AllCardsDto>(Home.S3_CARDS_LIST_PATH)
        const pollTitle = pollFiles?.cards.find(x => x.id == pollId)?.title
        if (pollTitle == null) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "Poll not found.")
        }

        const commentDto = await this.s3Writer.readJsonFileFromS3<DiscussionCommentDto>(
            this.getS3PathForComment(pollId, commentId)
        )
        if (commentDto == null) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "Comment not found.")
        }

        const message = args.body.message?.trim()
        if (message != null && message.length > 0) {
            await this.sendRejectedCommentEmail({
                pollId,
                pollTitle,
                comment: commentDto,
                message,
            })
        }

        await this.s3Writer.removeJsonFileFromS3(
            this.getS3PathForComment(pollId, commentId)
        )
    }

    private requireAdmin(args: ControllerParameters<unknown>): void {
        if (args.loggedInUserIsAdmin !== true) {
            throw new HttpError(HttpStatusCode.FORBIDDEN, "You must be an administrator.")
        }
    }

    private async sendRejectedCommentEmail(args: {
        pollId: string
        pollTitle: string
        comment: DiscussionCommentDto
        message: string
    }): Promise<void> {
        const user = await this.userService.getUser(args.comment.userId)

        if (user?.email == null || user.email.length === 0) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, "The comment author does not have an email address.")
        }

        const pollUrl = `${DOMAIN}/active-poll/${args.pollId}`

        await this.mailtrapClient.send({
            from: {
                email: "noreply@enfieldnhzoning.org",
                name: "Enfield NH Zoning"
            },
            to: [{
                email: user.email
            }],
            subject: `Your comment was not approved`,
            html: `
                <p>Your comment on "${args.pollTitle}" was not approved for the following reason:</p>

                <p>${this.escapeHtml(args.message)}</p>

                <p>You may repost your comment with the requested edits here:</p>

                <p><a href="${pollUrl}">${this.escapeHtml(args.pollTitle)}</a></p>

                <p>Original comment:</p>

                <blockquote>${this.escapeHtml(args.comment.text).replace(/\n/g, "<br />")}</blockquote>
            `,
            text: `Your comment on ${args.pollTitle} was not approved for the following reason:

${args.message}

You may repost your comment with the requested edits here:

${pollUrl}

Original comment:

${args.comment.text}`,
            category: "Comment Rejection"
        })
    }

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
    }

    private getS3PathForComment(pollId: string, commentId: string): string {
        return `${ActivePoll.getS3PathForComments(pollId)}/${commentId}`
    }
}
