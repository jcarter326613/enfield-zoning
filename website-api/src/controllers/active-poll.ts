import { ControllerParameters } from "../routes/route-base.js"
import { ActivePollModel } from "@enfield-zoning/website-api-dto"

export class ActivePoll {
    public async index(args: ControllerParameters<any>): Promise<ActivePollModel> {
        return {
            type: "zoning-ammendment",
            summaryMarkdown: "This is a summary.",
            zoningText: "This is some detailed text about zoning laws.",
            /*
            poll: {
                loggedIn: false,
            }
                */
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
            }
            /*
            votingQuestion: "What is your favorite color?",
            votingOptions: `<label for="yes">
  <input type="radio" id="yes" name="subscribe" value="yup" checked />
  Yup
  </label>
<label for="no">
  <input type="radio" id="no" name="subscribe" value="nope" />
  Nope
</label>`,*/
        }
    }
}
