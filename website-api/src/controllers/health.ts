import { ControllerParameters } from "../routes/route-base.js"

export class Health {
    public async health(args: ControllerParameters<void>): Promise<void> {}
}