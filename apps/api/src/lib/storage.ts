import { randomUUID } from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env.js';

const client = new S3Client({
  region: env.STORAGE_REGION,
  endpoint: env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: env.STORAGE_ACCESS_KEY,
    secretAccessKey: env.STORAGE_SECRET_KEY,
  },
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

const PRESIGN_EXPIRY_SECONDS = 300;

interface UploadObjectInput {
  key: string;
  body: Uint8Array;
  contentType: string;
}

export async function uploadObject({ key, body, contentType }: UploadObjectInput): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: env.STORAGE_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getFileDownloadUrl(key: string, fileName: string): Promise<string> {
  const asciiFallback = fileName.replace(/[^\x20-\x7e]/g, '').replace(/["\\]/g, '') || 'download';
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: env.STORAGE_BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    }),
    { expiresIn: PRESIGN_EXPIRY_SECONDS },
  );
}

export async function deleteObject(key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: key }));
}

export async function sweepFileKeys(keys: string[]): Promise<void> {
  await Promise.allSettled(keys.map((key) => deleteObject(key)));
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export function buildFileKey(deliverableId: string, fileName: string): string {
  return `deliverables/${deliverableId}/${randomUUID()}/${fileName}`;
}
