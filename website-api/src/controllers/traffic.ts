import { ControllerParameters } from "../routes/route-base.js"
import { writeJsonFileToS3 } from "../services/s3-writter.js"

export class Traffic {
    readonly bucketName: string = "enfieldnhzoning-data"

    public async traffic(args: ControllerParameters<any>): Promise<void> {
        const pollAnswer = args.body["poll-answer"]?.toUpperCase()
        let pollAnswerRecording = undefined

        switch (pollAnswer) {
            case "YES":
            case "NO":
            case "ABSENT":
                pollAnswerRecording = pollAnswer
                break
            default:
                break
        }

        const recordedObj = {
            timestamp: (new Date()).getTime(),
            buttonClicked: args.params["page"],
            ips: args.ips,
            pollAnswer: pollAnswerRecording
        }

        await writeJsonFileToS3(this.bucketName, recordedObj, "v1/traffic")
    }
}