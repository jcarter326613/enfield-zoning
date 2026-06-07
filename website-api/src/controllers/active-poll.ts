import { ControllerParameters } from "../routes/route-base.js"
import { Poll } from "@enfield-zoning/website-api-dto"
import { User } from "../services/user.js"

export class ActivePoll {
    private userService = new User

    public async index(args: ControllerParameters<any>): Promise<Poll.ActivePollModel> {
        let pollObject: Poll.Poll
        
        if (args.loggedInUserId != null) {
            let isAllowedToVote = false
            let userDto = await this.userService.getUser(args.loggedInUserId)
            if (userDto != null) {
                isAllowedToVote = User.isUserAllowedToVote(userDto)
            }

            if (!isAllowedToVote) {
                pollObject = {
                    loggedIn: true,
                    allowedToVote: false,
                }
            } else {
                pollObject = {
                    loggedIn: true,
                    allowedToVote: true,
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
