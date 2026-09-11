import { randomUUID } from "node:crypto";
import { Client } from "minio";
import { config } from "../config";

export const minioClient = new Client({
  endPoint: config.minio.endpoint,
  port: config.minio.port,
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
});

const bucket = config.minio.bucket;

let bucketReady: Promise<void> | null = null;

export async function ensureBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) await minioClient.makeBucket(bucket);
    })().catch((err) => {
      bucketReady = null;
      throw err;
    });
  }
  return bucketReady;
}

export interface UploadInput {
  tenantId: string;
  ownerId: string;
  kind: string;
  fileName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export async function uploadFile(input: UploadInput): Promise<string> {
  await ensureBucket();
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${input.tenantId}/${input.kind}/${randomUUID()}-${safeName}`;
  await minioClient.putObject(bucket, key, input.buffer, input.size, {
    "Content-Type": input.mimeType,
  });
  return key;
}

export async function getFileStream(key: string) {
  await ensureBucket();
  return minioClient.getObject(bucket, key);
}

export async function statFile(key: string) {
  await ensureBucket();
  return minioClient.statObject(bucket, key);
}

export async function deleteFile(key: string) {
  await ensureBucket();
  await minioClient.removeObject(bucket, key);
}
