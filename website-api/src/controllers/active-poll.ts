import { HttpError } from "../exceptions/http-error.js"
import { HttpStatusCode } from "../http-status-code.js"
import { ControllerParameters } from "../routes/route-base.js"
import { S3Writer } from "../services/s3-writer.js"
import { User } from "../services/user.js"

import { Poll } from "@enfield-zoning/website-api-dto"

export class ActivePoll {
    static readonly S3_ACTIVE_POLL_PATH = "v1/active-polls"

    private s3WriterService = new S3Writer
    private userService = new User

    public async index(args: ControllerParameters<void>): Promise<Poll.ActivePollResponse> {
        const pollId = args.params["id"]

        // Get the poll metadata
        const metadataPath = this.getMetadataPathForPoll(pollId)
        const pollData = await this.s3WriterService.readJsonFileFromS3<ActivePollDto>(metadataPath)

        if (pollData == null) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "The specified poll could not be found.")
        }

        // Get the feedback submission data
        const nowEpoch = (new Date).getTime()
        const hasExpired = nowEpoch > pollData.activeUntilEpoch
        let pollObject = await this.getVotingDataForPoll({
            pollId: pollId,
            feedbackDto: pollData.feedback,
            loggedInUserId: args.loggedInUserId,
            hasExpired: hasExpired,
        })

        // Return the DTO
        if (pollData.type == "zoning-ammendment") {
            return {
                type: pollData.type,
                summaryMarkdown: pollData.summaryMarkdown,
                zoningText: pollData.zoningText,
                poll: pollObject,
            }
        } else {
            throw new HttpError(HttpStatusCode.SERVER_ERROR, "We could not read the poll data.  Please report this error to the website maintainers.")
        }
    }

    public async castVote(args: ControllerParameters<Poll.CastVote>): Promise<void> {
        const pollId = args.params["id"]
        const selectedValue = args.body.selectedValue
        const userId = args.loggedInUserId

        if (pollId == null || userId == null) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, "You must specify a poll id and be logged in.")
        }

        // Save the vote
        const s3Path = this.getS3PathForVote({
            pollId: pollId,
            userId: userId
        })
        if (selectedValue == null) {
            await this.s3WriterService.removeJsonFileFromS3(s3Path)
        } else {
            await this.s3WriterService.writeJsonFileToS3<CastVote>({
                selectedValue
            }, s3Path, {
                allowOverwrite: true
            })
        }
    }

    public async getDiscussionComments(
        args: ControllerParameters<void>
    ): Promise<Poll.GetDiscussionCommentsResponse> {
        const pollId = args.params["id"]

        if (pollId == null) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, "You must specify a poll id.")
        }

        await this.requirePollExists(pollId)

        const comments = await this.s3WriterService.readJsonFolderFromS3<DiscussionCommentDto>(
            this.getS3PathForComments(pollId)
        )

        return {
            loggedIn: args.loggedInUserId != null,
            comments: comments
                .filter(x => x.payload.passedReview)
                .map(comment => ({
                    id: comment.id,
                    text: comment.payload.text,
                    createdAtEpoch: comment.payload.createdAtEpoch
                }))
                .sort((a, b) => a.createdAtEpoch - b.createdAtEpoch)
        }
    }

    public async createDiscussionComment(
        args: ControllerParameters<Poll.CreateDiscussionCommentRequest>
    ): Promise<Poll.CreateDiscussionCommentResponse> {
        const pollId = args.params["id"]
        const userId = args.loggedInUserId
        const text = args.body.text?.trim()

        if (pollId == null) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, "You must specify a poll id.")
        }

        if (userId == null) {
            throw new HttpError(HttpStatusCode.UNAUTHORIZED, "You must be logged in to post a comment.")
        }

        if (text == null || text.length === 0) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, "Comment text is required.")
        }

        if (text.length > 5000) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, "Comment text is too long.")
        }

        await this.requirePollExists(pollId)

        const commentId = await this.s3WriterService.writeJsonFileToS3<DiscussionCommentDto>(
            {
                userId,
                text,
                createdAtEpoch: Date.now(),
                passedReview: false,
            },
            this.getS3PathForComments(pollId),
            {
                addUniqueSuffix: true
            }
        )

        if (commentId == null) {
            throw new HttpError(HttpStatusCode.SERVER_ERROR, "The comment could not be saved.")
        }

        return {
            success: true
        }
    }

    private async getVotingDataForPoll(args: {
        pollId: string
        feedbackDto: FeedbackDto
        loggedInUserId: string | undefined
        hasExpired: boolean
    }): Promise<Poll.Poll> {
        let pollObject: Poll.Poll

        if (args.hasExpired) {
            return {
                isExpired: true
            }
        } else if (args.loggedInUserId != null) {
            let isAllowedToVote = false
            let userDto = await this.userService.getUser(args.loggedInUserId)
            if (userDto != null) {
                isAllowedToVote = User.isUserAllowedToVote(userDto)
            }

            if (!isAllowedToVote) {
                pollObject = {
                    isExpired: false,
                    loggedIn: true,
                    allowedToVote: false,
                }
            } else {
                // Get any historically cast votes
                const previousVoteS3Path = this.getS3PathForVote({
                    pollId: args.pollId,
                    userId: args.loggedInUserId,
                })
                const previouslyCastVote = await this.s3WriterService.readJsonFileFromS3<CastVote>(previousVoteS3Path)

                // Assemble the voting options
                pollObject = {
                    isExpired: false,
                    loggedIn: true,
                    allowedToVote: true,
                    votingQuestion: args.feedbackDto.votingQuestion,
                    votingOptions: args.feedbackDto.votingOptions.map(x => ({
                        label: x.label,
                        value: x.value,
                        selected: previouslyCastVote?.selectedValue == x.value,
                    }))
                }
            }
        } else {
            pollObject = {
                isExpired: false,
                loggedIn: false,
            }
        }

        return pollObject
    }

    private async requirePollExists(pollId: string): Promise<void> {
        const metadataPath = this.getMetadataPathForPoll(pollId)
        const pollData = await this.s3WriterService.readJsonFileFromS3<ActivePollDto>(metadataPath)

        if (pollData == null) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "The specified poll could not be found.")
        }
    }

    private getMetadataPathForPoll(pollId: string): string {
        return `${ActivePoll.S3_ACTIVE_POLL_PATH}/${pollId}`
    }

    private getS3PathForComments(pollId: string): string {
        return `${this.getMetadataPathForPoll(pollId)}/comments`
    }

    private getS3PathForVote(args: {
        pollId: string,
        userId: string,
    }): string {
        return `${this.getMetadataPathForPoll(args.pollId)}/votes/${args.userId}`
    }
}

type ActivePollDto = (
    {
        activeUntilEpoch: number
        type: "zoning-ammendment"
        summaryMarkdown: string
        zoningText: string
    }
) & {
    feedback: FeedbackDto
}

type FeedbackDto = {
    type: "multiple-choice"
    votingQuestion: string
    votingOptions: {
        value: string
        label: string
    }[]
}

type CastVote = {
    selectedValue: string
}

type DiscussionCommentDto = {
    userId: string
    text: string
    createdAtEpoch: number
    passedReview: boolean
}
