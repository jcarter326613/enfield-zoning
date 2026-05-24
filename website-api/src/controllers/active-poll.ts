import { ControllerParameters } from "../routes/route-base.js"
import { Poll } from "@enfield-zoning/website-api-dto"

export class ActivePoll {
    public async index(args: ControllerParameters<any>): Promise<Poll.ActivePollModel> {
        let pollObject: {
            loggedIn: true
            votingQuestion: string
            votingOptions: Poll.VotingOption[]
        } | {
            loggedIn: false
        }

        if (args.loggedInUserId != null) {
            pollObject = {
                loggedIn: true,
                votingQuestion: "What is your favorite color?",
                votingOptions: [{
                    label: "Green",
                    value: "green",
                }, {
                    label: "Blue",
                    value: "blue"
                }, {
                    label: "Red",
                    value: "red"
                }]
            }
        } else {
            pollObject = {
                loggedIn: false,
            }
        }

        return {
            type: "zoning-ammendment",
            summaryMarkdown: "This is a summary.",
            zoningText: "This is some detailed text about zoning laws.",
            poll: pollObject,
        }
    }
}
