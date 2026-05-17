import { randomUUID } from "node:crypto"
import { S3Writer } from "./s3-writer.js"

export class User {
    static readonly S3_USER_PATH = "v1/users"
    static readonly S3_USER_BYID_PATH = "v1/users/byId"
    static readonly S3_USER_BYEMAIL_PATH = "v1/users/byEmail"

    readonly s3Writter: S3Writer = new S3Writer

    async createUser(args: {
        email: string,
        legalName: string | undefined,
        domicileStreet: string | undefined,
    }): Promise<string | false> {
        // Create a user dto
        const nowEpoch = (new Date()).getTime()
        const userDto: UserDto = {
            createdEpoch: nowEpoch,
            lastLoginEpoch: nowEpoch,
            isVerified: false,
            isConfirmedRegisteredVoter: false,
            email: args.email,
            suppliedLegalName: args.legalName,
            suppliedDomicileStreet: args.domicileStreet,
            registeredVoterId: undefined,
        }

        // Attempt to write that user id into an email lookup index
        const userId = await this.s3Writter.writeJsonFileToS3<UserDto>(userDto, User.S3_USER_BYID_PATH, {
            addUniqueSuffix: true
        })
        if (userId === undefined) {
            return false
        }
        const byEmailPath = `${User.S3_USER_BYEMAIL_PATH}/${encodeURIComponent(args.email)}`
        const emailReserveResult = await this.s3Writter.writeJsonFileToS3<ByEmailDto>({
            id: userId
        }, byEmailPath)

        // If the email index was already populated
        if (emailReserveResult !== true) {
            // Fail the creation with a "User already exists" error.
            await this.s3Writter.removeJsonFileFromS3(`${User.S3_USER_BYID_PATH}/${userId}`)
            return false
        }

        // Report success
        return userId
    }
}

type UserDto = {
    createdEpoch: number,
    lastLoginEpoch: number,
    isVerified: boolean,
    isConfirmedRegisteredVoter: boolean
    email: string,

    // Optional fields
    suppliedLegalName: string | undefined,
    suppliedDomicileStreet: string | undefined,
    registeredVoterId: string | undefined,
}

type ByEmailDto = {
    id: string
}