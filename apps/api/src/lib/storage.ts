import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { AppConfig } from "../config";

export type PresignedUpload = {
  url: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresAt: Date;
};

export interface ObjectStorage {
  presignUpload(key: string, contentType: string, sizeBytes: number): Promise<PresignedUpload>;
  presignView(key: string, ttlSeconds?: number): Promise<string>;
  publicUrl(key: string): string | null;
  head(key: string): Promise<{ sizeBytes: number; contentType: string | null } | null>;
  getObject(key: string): Promise<Uint8Array>;
  putObject(key: string, body: Uint8Array, contentType: string): Promise<void>;
  deleteObject(key: string): Promise<void>;
}

export function createS3Storage(config: AppConfig): ObjectStorage {
  const client = new S3Client({
    endpoint: config.S3_ENDPOINT,
    region: config.S3_REGION,
    forcePathStyle: config.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: config.S3_ACCESS_KEY_ID,
      secretAccessKey: config.S3_SECRET_ACCESS_KEY,
    },
  });
  const bucket = config.S3_BUCKET;

  return {
    async presignUpload(key, contentType, sizeBytes) {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: sizeBytes,
      });
      const url = await getSignedUrl(client, command, {
        expiresIn: config.MEDIA_UPLOAD_TTL_SECONDS,
      });
      return {
        url,
        method: "PUT",
        headers: { "content-type": contentType },
        expiresAt: new Date(Date.now() + config.MEDIA_UPLOAD_TTL_SECONDS * 1000),
      };
    },
    async presignView(key, ttlSeconds = config.MEDIA_VIEW_URL_TTL_SECONDS) {
      return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
        expiresIn: ttlSeconds,
      });
    },
    publicUrl(key) {
      if (!config.S3_PUBLIC_BASE_URL) {
        return null;
      }
      return `${config.S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
    },
    async head(key) {
      try {
        const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        return { sizeBytes: result.ContentLength ?? 0, contentType: result.ContentType ?? null };
      } catch {
        return null;
      }
    },
    async getObject(key) {
      const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const bytes = await result.Body?.transformToByteArray();
      if (!bytes) {
        throw new Error(`objeto vazio: ${key}`);
      }
      return bytes;
    },
    async putObject(key, body, contentType) {
      await client.send(
        new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
      );
    },
    async deleteObject(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}

export function createMemoryStorage(baseUrl = "http://storage.test"): ObjectStorage & {
  objects: Map<string, { body: Uint8Array; contentType: string }>;
} {
  const objects = new Map<string, { body: Uint8Array; contentType: string }>();
  return {
    objects,
    async presignUpload(key, contentType) {
      return {
        url: `${baseUrl}/upload/${encodeURIComponent(key)}`,
        method: "PUT",
        headers: { "content-type": contentType },
        expiresAt: new Date(Date.now() + 900_000),
      };
    },
    async presignView(key) {
      return `${baseUrl}/view/${encodeURIComponent(key)}?signed=1`;
    },
    publicUrl(key) {
      return `${baseUrl}/public/${key}`;
    },
    async head(key) {
      const object = objects.get(key);
      return object ? { sizeBytes: object.body.byteLength, contentType: object.contentType } : null;
    },
    async getObject(key) {
      const object = objects.get(key);
      if (!object) {
        throw new Error(`objeto não encontrado: ${key}`);
      }
      return object.body;
    },
    async putObject(key, body, contentType) {
      objects.set(key, { body, contentType });
    },
    async deleteObject(key) {
      objects.delete(key);
    },
  };
}
