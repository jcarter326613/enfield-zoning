import { randomUUID } from "node:crypto"
import { 
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    S3Client
} from "@aws-sdk/client-s3"

const s3 = new S3Client({})

const bucketName: string = "enfieldnhzoning-data"

type WriteJsonOptionsWithSuffix = {
    addUniqueSuffix: true
    allowOverwrite?: boolean
}

type WriteJsonOptionsWithoutSuffix = {
    addUniqueSuffix?: false | undefined
    allowOverwrite?: boolean
}

export class S3Writer {
    public async writeJsonFileToS3<T>(
        payload: T,
        filePath: string,
        opts: WriteJsonOptionsWithSuffix
    ): Promise<string | undefined>

    public async writeJsonFileToS3<T>(
        payload: T,
        filePath: string,
        opts?: WriteJsonOptionsWithoutSuffix
    ): Promise<true | undefined>

    public async writeJsonFileToS3<T>(
        payload: T,
        filePath: string,
        opts?: {
            addUniqueSuffix?: boolean,
            allowOverwrite?: boolean,
        }
    ): Promise<string | true | undefined> {
        const maxAttempts = 5
        let attemptCount = 0

        while (attemptCount < maxAttempts) {
            attemptCount++

            const uniqueSuffix = (opts?.addUniqueSuffix === true) ? randomUUID() : true
            const fileName = (opts?.addUniqueSuffix === true)
                ? `${filePath}/${uniqueSuffix}.json`
                : `${filePath}.json`

            try {
                const command = new PutObjectCommand({
                    Bucket: bucketName,
                    Key: fileName,
                    Body: JSON.stringify(payload),
                    ContentType: "application/json",
                    ...((opts?.allowOverwrite === true) ? {} : { IfNoneMatch: "*" }),
                })

                await s3.send(command)

                // Success
                return uniqueSuffix
            } catch (error: any) {
                // 412 Precondition Failed means the object already exists
                if (error?.$metadata?.httpStatusCode === 412) {
                    // If we're not generating unique names, there is nothing else to try
                    if (!(opts?.addUniqueSuffix === true)) {
                        return undefined
                    }

                    // Otherwise, generate another UUID and try again
                    continue
                }

                // Any other error should be propagated
                throw error
            }
        }

        // Failed to generate a unique filename after several attempts
        return undefined
    }

    public async readJsonFileFromS3<T>(
        filePath: string,
    ): Promise<T | undefined> {
        const fileName = `${filePath}.json`;

        try {
            const response = await s3.send(
                new GetObjectCommand({
                    Bucket: bucketName,
                    Key: fileName,
                }),
            )

            if (!response.Body) {
                return undefined
            }

            const contents = await response.Body.transformToString()
            return JSON.parse(contents) as T
        } catch (e: any) {
            if (
                e?.name === "NoSuchKey" ||
                e?.name === "NotFound"
            ) {
                return undefined
            }
            throw e
        }
    }

    public async removeJsonFileFromS3<T>(
        filePath: string,
    ): Promise<void> {
        const fileName = `${filePath}.json`;

        await s3.send(
            new DeleteObjectCommand({
                Bucket: bucketName,
                Key: fileName,
            }),
        );
    }
}