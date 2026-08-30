import type { MediaAsset } from "@sigillus/contracts";
import type { mediaAssets } from "../../db/schema";
import type { ObjectStorage } from "../../lib/storage";

export type MediaAssetRow = typeof mediaAssets.$inferSelect;

export function toMediaAsset(row: MediaAssetRow, storage: ObjectStorage): MediaAsset {
  const ready = row.status === "ready";
  return {
    id: row.id,
    ownerId: row.ownerUserId,
    kind: row.kind,
    purpose: row.purpose,
    status: row.status,
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    url: ready ? storage.publicUrl(row.storageKey) : null,
    thumbnailUrl: ready && row.thumbnailKey ? storage.publicUrl(row.thumbnailKey) : null,
    width: row.width,
    height: row.height,
    position: row.position,
    moderationReason: row.moderationReason,
    createdAt: row.createdAt.toISOString(),
  };
}
