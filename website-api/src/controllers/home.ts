import { ControllerParameters } from "../routes/route-base.js"
import { Home as HomeDto } from "@enfield-zoning/website-api-dto"
import { S3Writer } from "../services/s3-writer.js"
import { HttpError } from "../exceptions/http-error.js"
import { HttpStatusCode } from "../http-status-code.js"

export class Home {
    static readonly S3_CARDS_LIST_PATH = "v1/home/cards"

    private s3WriterService = new S3Writer

    public async index(args: ControllerParameters<any>): Promise<HomeDto.HomeModel> {
        const cards = await this.s3WriterService.readJsonFileFromS3<AllCardsDto>(Home.S3_CARDS_LIST_PATH)

        if (cards == null) {
            throw new HttpError(HttpStatusCode.SERVER_ERROR, "We could not load the list of active polls.")
        }

        return cards
    }
}

type AllCardsDto = {
    cards: CardDto[]
}

type CardDto = {
    id: string
    summary: string
    title: string
}