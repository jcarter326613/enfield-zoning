import { ControllerParameters } from "../routes/route-base.js"
import { Thing } from "@enfield-zoning/website-api-dto"

export class Home {
    public async index(args: ControllerParameters<any>): Promise<Thing> {
        
    }
}