import { ControllerParameters } from "../routes/route-base.js"
import { writeJsonFileToS3 } from "../services/s3-writter.js"

export class Home {
    readonly bucketName: string = "enfieldnhzoning-data"

    public async index(args: ControllerParameters<any>): Promise<void> {
        
    }
}