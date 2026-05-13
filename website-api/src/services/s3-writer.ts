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

export class S3Writer {
    public async writeJsonFileToS3<T>(
        payload: T,
        filePath: string,
        addUniqueSuffix: boolean = false
    ): Promise<string | undefined> {
        // Figure out the final filename
        let fileName: string = ""
        let uniqueSuffix: string | undefined
        if (addUniqueSuffix) {
            // If we are adding a unique suffix, loop until we generate a unique GUID (I'm just being safe)
            let attemptCount = 0
            while (attemptCount < 5) {
                attemptCount++
                uniqueSuffix = randomUUID()
                fileName = `${filePath}/${uniqueSuffix}.json`
                try {
                    await s3.send(
                        new HeadObjectCommand({
                            Bucket: bucketName,
                            Key: fileName,
                        }),
                    )
                } catch (error: any) {
                    if (error?.name == "NotFound") {
                        break
                    }
                }
            }
        } else {
            fileName = `${filePath}.json`
        }

        // Write the contents to s3
        await s3.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: fileName,
                Body: JSON.stringify(payload),
                ContentType: "application/json",
            }),
        )

        // Return the unique suffix if there was one
        return uniqueSuffix
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