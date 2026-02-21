import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "./env.js";
import { logger } from "./logger.js";

export const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true, // required for MinIO
});

/**
 * Ensure the default upload bucket exists. Create it if missing.
 */
export async function ensureBucket(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
    logger.info(`✓ S3 bucket "${env.S3_BUCKET}" ready`);
  } catch {
    logger.info(`Creating S3 bucket "${env.S3_BUCKET}"…`);
    await s3.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }));
    logger.info(`✓ S3 bucket "${env.S3_BUCKET}" created`);
  }
}

/**
 * Upload a buffer to S3 / MinIO and return the object URL.
 */
export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`;
}
