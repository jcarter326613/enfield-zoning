// Read in the environment
import * as dotenv from "dotenv"
dotenv.config({
    path: [
        `.env.${process.env.ENVIRONMENT?.toLowerCase() ?? "local"}`,
        `.env`,
    ]
})

