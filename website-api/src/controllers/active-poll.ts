import { ControllerParameters } from "../routes/route-base.js"
import { ActivePollModel } from "@enfield-zoning/website-api-dto"

export class ActivePoll {
    public async index(args: ControllerParameters<any>): Promise<ActivePollModel> {
        return {
            summaryMarkdown: "This is a summary.",
            zoningText: "This is some detailed text about zoning laws."
        }
    }
}
