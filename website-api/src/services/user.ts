import { randomUUID, randomBytes } from "node:crypto"
import { S3Writer } from "./s3-writer.js"
import { HttpError } from "../exceptions/http-error.js"
import { HttpStatusCode } from "../http-status-code.js"

export class User {
    static readonly S3_USER_PATH = "v1/users"
    static readonly S3_USER_BYID_PATH = `${User.S3_USER_PATH}/byId`
    static readonly S3_USER_BYEMAIL_PATH = `${User.S3_USER_PATH}/byEmail`
    static readonly S3_LOGIN_TOKEN_PATH = `${User.S3_USER_PATH}/loginTokens`

    private readonly s3Writter: S3Writer = new S3Writer

    // Static publics
    static isUserAllowedToVote(userDto: UserDto): boolean {
        return userDto.suppliedLegalName != null && userDto.suppliedLegalName.length > 0 &&
            userDto.suppliedDomicileStreet != null && userDto.suppliedDomicileStreet.length > 0
    }

    static isTokenValid(token: LoginTokenDto, key: string) {

    }

    // Publics
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
            await this.s3Writter.removeJsonFileFromS3(this.getS3UserPath(userId))
            return false
        }

        // Report success
        return userId
    }

    async getUser(id: string): Promise<UserDto | undefined> {
        const path = this.getS3UserPath(id)
        return await this.s3Writter.readJsonFileFromS3<UserDto>(path)
    }

    async getUserIdByEmail(email: string): Promise<string | undefined> {
        const byEmailPath = `${User.S3_USER_BYEMAIL_PATH}/${encodeURIComponent(email)}`
        try {
            const emailReserveResult = await this.s3Writter.readJsonFileFromS3<ByEmailDto>(byEmailPath)
            return emailReserveResult?.id
        } catch (e: any) {
            return undefined
        }
    }

    async createLoginToken(args: {
        userId: string,
        redirectUrl: string,
    }): Promise<string> {
        const key = randomBytes(16).toString("base64url")
        const tokenDto: LoginTokenDto = {
            issuedEpoch: (new Date).getTime(),
            key: key,
            redirectUrl: args.redirectUrl
        }

        const path = `${User.S3_LOGIN_TOKEN_PATH}/${args.userId}`
        const success = await this.s3Writter.writeJsonFileToS3<LoginTokenDto>(tokenDto, path, {
            allowOverwrite: true
        })

        if (!success) {
            throw new HttpError(HttpStatusCode.SERVER_ERROR, "We were unable to create a login token.")
        }

        return key
    }

    async getLoginToken(userId: string): Promise<LoginTokenDto | undefined> {
        const path = `${User.S3_LOGIN_TOKEN_PATH}/${userId}`
        return this.s3Writter.readJsonFileFromS3<LoginTokenDto>(path)
    }

    async useLoginToken(userId: string) {
        const path = `${User.S3_LOGIN_TOKEN_PATH}/${userId}`
        return this.s3Writter.removeJsonFileFromS3(path)
    }

    async setProvidedIdentity(args: {
        userId: string,
        legalName: string,
        legalStreet: string,
    }) {
        const userDto = await this.getUser(args.userId)

        if (userDto != null) {
            if (args.legalName.trim().length > 0) {
                userDto.suppliedLegalName = args.legalName
            } else {
                delete userDto.suppliedLegalName
            }

            if (args.legalStreet.trim().length > 0) {
                userDto.suppliedDomicileStreet = args.legalStreet
            } else {
                delete userDto.suppliedDomicileStreet
            }

            const path = this.getS3UserPath(args.userId)
            await this.s3Writter.writeJsonFileToS3(userDto, path, {
                allowOverwrite: true
            })
        }
    }

    private getS3UserPath(userId: string) {
        return `${User.S3_USER_BYID_PATH}/${userId}`
    }
}

type ByEmailDto = {
    id: string
}

type LoginTokenDto = {
    issuedEpoch: number
    key: string
    redirectUrl: string
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
