import { ControllerParameters } from "../routes/route-base.js"
import { ActivePollModel } from "@enfield-zoning/website-api-dto"

export class ActivePoll {
    public async index(args: ControllerParameters<any>): Promise<ActivePollModel> {
        return {
            type: "zoning-ammendment",
            summaryMarkdown: "This is a summary.",
            zoningText: "This is some detailed text about zoning laws.",
            poll: {
                loggedIn: false,
            }
            /*
            poll: {
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
            }*/
        }
    }
}
