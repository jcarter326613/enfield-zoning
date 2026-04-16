import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

type S3Payload = Record<string, unknown>;

export async function writeJsonFileToS3(
    bucketName: string,
    payload: S3Payload,
    keyPrefix = "",
): Promise<{ key: string }> {
    const fileName = `${randomUUID()}.json`;
    const key = keyPrefix ? `${keyPrefix.replace(/\/+$/, "")}/${fileName}` : fileName;

    await s3.send(
        new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: JSON.stringify(payload),
            ContentType: "application/json",
        }),
    );

    return { key };
}