import { ControllerParameters } from "../routes/route-base.js"
import { HomeModel } from "@enfield-zoning/website-api-dto"

export class Home {
    public async index(args: ControllerParameters<any>): Promise<HomeModel> {
        return {
            cards: [{
                summary: "Test summary 1",
                title: "Test Title 1"
            }, {
                summary: "Test summary 2",
                title: "Test Title 2"
            }]
        }
    }
}