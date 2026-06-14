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
            poll: pollData.feedback,
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

    private getMetadataPathForPoll(pollId: string): string {
        return `${ActivePoll.S3_ACTIVE_POLL_PATH}/${pollId}`
    }

    private async getVotingDataForPoll(args: {
        poll: FeedbackDto
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
                pollObject = {
                    isExpired: false,
                    loggedIn: true,
                    allowedToVote: true,
                    votingQuestion: args.poll.votingQuestion,
                    votingOptions: args.poll.votingOptions
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
