import sharp from "sharp";
import type { Database } from "../../db/client";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import type { ObjectStorage } from "../../lib/storage";
import { createMediaRepository } from "./repository";

export type MediaJobsDeps = {
  db: Database;
  storage: ObjectStorage;
  jobs: JobQueue;
  logger: Logger;
};

export const MEDIA_THUMBNAIL_WIDTH = 480;

export function thumbnailKeyFor(storageKey: string): string {
  return `${storageKey}.thumb.webp`;
}

export async function registerMediaJobs(deps: MediaJobsDeps): Promise<void> {
  const { db, storage, jobs, logger } = deps;
  const repo = createMediaRepository(db);

  await jobs.work("media.process", async ({ assetId }) => {
    const row = await repo.findById(assetId);
    if (!row) {
      logger.warn({ assetId }, "media.process: asset inexistente");
      return;
    }
    if (row.status !== "processing") {
      return;
    }
    try {
      if (row.kind === "image") {
        const bytes = await storage.getObject(row.storageKey);
        const image = sharp(Buffer.from(bytes), { failOn: "none" });
        const metadata = await image.metadata();
        const thumbnail = await image
          .clone()
          .rotate()
          .resize({ width: MEDIA_THUMBNAIL_WIDTH, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        const thumbnailKey = thumbnailKeyFor(row.storageKey);
        await storage.putObject(thumbnailKey, new Uint8Array(thumbnail), "image/webp");
        await repo.update(row.id, {
          status: "ready",
          width: metadata.width ?? null,
          height: metadata.height ?? null,
          thumbnailKey,
          processedAt: new Date(),
        });
      } else {
        const head = await storage.head(row.storageKey);
        if (!head) {
          throw new Error("objeto de vídeo não encontrado no storage");
        }
        await repo.update(row.id, { status: "ready", processedAt: new Date() });
      }
    } catch (error) {
      logger.error({ err: error, assetId }, "media.process falhou");
      await repo.update(row.id, { status: "failed", processedAt: new Date() });
      return;
    }
    await jobs.enqueue("media.moderate", { assetId }, { singletonKey: `moderate:${assetId}` });
  });

  await jobs.work("media.moderate", async ({ assetId }) => {
    const row = await repo.findById(assetId);
    if (!row || row.status !== "ready") {
      return;
    }
    logger.debug({ assetId }, "media.moderate: sem integração de moderação, mantendo ready");
  });
}
