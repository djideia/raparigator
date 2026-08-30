import { ORPCError } from "@orpc/server";
import {
  MEDIA_MAX_IMAGE_BYTES,
  MEDIA_MAX_VIDEO_BYTES,
  type CreateUploadInput,
  type CreateUploadOutput,
  type MediaAsset,
  type MediaPurpose,
} from "@sigillus/contracts";
import { canUploadMedia } from "@sigillus/domain";
import type { Database } from "../../db/client";
import { newId } from "../../lib/ids";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import type { ObjectStorage } from "../../lib/storage";
import type { ProfileRepository } from "../profiles/repository";
import { toMediaAsset, type MediaAssetRow } from "./mapper";
import { createMediaRepository } from "./repository";

export type MediaServiceDeps = {
  db: Database;
  profiles: ProfileRepository;
  storage: ObjectStorage;
  jobs: JobQueue;
  logger: Logger;
};

export type MediaService = ReturnType<typeof createMediaService>;

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-matroska": "mkv",
};

export function extensionFor(contentType: string): string {
  const known = EXTENSION_BY_CONTENT_TYPE[contentType];
  if (known) {
    return known;
  }
  const subtype = contentType.split("/")[1] ?? "bin";
  return subtype.replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
}

export function storageKeyFor(ownerUserId: string, assetId: string, contentType: string): string {
  return `media/${ownerUserId}/${assetId}.${extensionFor(contentType)}`;
}

function isProfileMedia(purpose: MediaPurpose): boolean {
  return purpose === "gallery" || purpose === "profile";
}

export function createMediaService(deps: MediaServiceDeps) {
  const { db, profiles, storage, jobs, logger } = deps;
  const repo = createMediaRepository(db);

  async function requireOwned(ownerUserId: string, assetId: string): Promise<MediaAssetRow> {
    const row = await repo.findById(assetId);
    if (!row) {
      throw new ORPCError("NOT_FOUND", { message: "Mídia não encontrada." });
    }
    if (row.ownerUserId !== ownerUserId) {
      throw new ORPCError("FORBIDDEN", { message: "Esta mídia não pertence a você." });
    }
    return row;
  }

  async function requireProfile(ownerUserId: string) {
    const profile = await profiles.findByUserId(ownerUserId);
    if (!profile) {
      throw new ORPCError("FORBIDDEN", {
        message: "Crie seu anúncio antes de enviar fotos ou vídeos.",
      });
    }
    return profile;
  }

  return {
    async createUpload(ownerUserId: string, input: CreateUploadInput): Promise<CreateUploadOutput> {
      const family = input.contentType.split("/")[0];
      if (family !== input.kind) {
        throw new ORPCError("CONFLICT", {
          message: "O tipo do arquivo não corresponde ao tipo de mídia informado.",
        });
      }
      const maxBytes = input.kind === "image" ? MEDIA_MAX_IMAGE_BYTES : MEDIA_MAX_VIDEO_BYTES;
      if (input.sizeBytes > maxBytes) {
        throw new ORPCError("CONFLICT", {
          message: "Arquivo maior que o permitido para este tipo de mídia.",
        });
      }

      let profileId: string | null = null;
      let position: number | null = null;
      if (isProfileMedia(input.purpose)) {
        const profile = await requireProfile(ownerUserId);
        profileId = profile.id;
        const plan = profile.adTier === "premium" ? "premium" : "standard";
        const currentCount = await repo.countGalleryByKind(profile.id, input.kind);
        if (input.purpose === "gallery" && !canUploadMedia(plan, input.kind, currentCount)) {
          throw new ORPCError("PLAN_LIMIT", {
            message:
              input.kind === "image"
                ? "Você atingiu o limite de fotos do seu plano."
                : "Você atingiu o limite de vídeos do seu plano.",
          });
        }
        if (input.purpose === "gallery") {
          position = await repo.nextGalleryPosition(profile.id);
        }
      }

      const assetId = newId();
      const storageKey = storageKeyFor(ownerUserId, assetId, input.contentType);
      const row = await repo.insert({
        id: assetId,
        ownerUserId,
        profileId,
        kind: input.kind,
        purpose: input.purpose,
        status: "pending_upload",
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        fileName: input.fileName ?? null,
        storageKey,
        position,
      });
      const upload = await storage.presignUpload(storageKey, input.contentType, input.sizeBytes);
      logger.info({ assetId, kind: input.kind, purpose: input.purpose }, "upload de mídia criado");
      return {
        asset: toMediaAsset(row, storage),
        uploadUrl: upload.url,
        method: upload.method,
        headers: upload.headers,
        expiresAt: upload.expiresAt.toISOString(),
      };
    },

    async completeUpload(ownerUserId: string, assetId: string): Promise<MediaAsset> {
      const row = await requireOwned(ownerUserId, assetId);
      if (row.status !== "pending_upload") {
        return toMediaAsset(row, storage);
      }
      const head = await storage.head(row.storageKey);
      if (!head) {
        throw new ORPCError("CONFLICT", { message: "Arquivo ainda não enviado." });
      }
      const updated = await repo.update(row.id, {
        status: "processing",
        sizeBytes: head.sizeBytes || row.sizeBytes,
      });
      await jobs.enqueue("media.process", { assetId: row.id }, { singletonKey: row.id });
      const latest = (await repo.findById(row.id)) ?? updated ?? row;
      return toMediaAsset(latest, storage);
    },

    async get(ownerUserId: string, assetId: string): Promise<MediaAsset> {
      const row = await requireOwned(ownerUserId, assetId);
      return toMediaAsset(row, storage);
    },

    async listMine(ownerUserId: string, purpose?: MediaPurpose): Promise<MediaAsset[]> {
      const rows = await repo.listByOwner(ownerUserId, purpose);
      return rows.map((row) => toMediaAsset(row, storage));
    },

    async remove(ownerUserId: string, assetId: string) {
      const row = await requireOwned(ownerUserId, assetId);
      await storage.deleteObject(row.storageKey).catch(() => undefined);
      if (row.thumbnailKey) {
        await storage.deleteObject(row.thumbnailKey).catch(() => undefined);
      }
      if (row.profileId) {
        const profile = await profiles.findById(row.profileId);
        if (profile?.profileImageAssetId === row.id) {
          await profiles.update(profile.id, { profileImageAssetId: null });
        }
      }
      await repo.remove(row.id);
      return { ok: true as const };
    },

    async reorder(ownerUserId: string, assetIds: string[]) {
      const profile = await requireProfile(ownerUserId);
      const rows = await repo.listByIds(assetIds);
      const byId = new Map(rows.map((row) => [row.id, row]));
      for (const id of assetIds) {
        const row = byId.get(id);
        if (!row) {
          throw new ORPCError("NOT_FOUND", { message: "Mídia não encontrada." });
        }
        if (row.ownerUserId !== ownerUserId || row.profileId !== profile.id) {
          throw new ORPCError("FORBIDDEN", { message: "Esta mídia não pertence a você." });
        }
        if (row.purpose !== "gallery") {
          throw new ORPCError("CONFLICT", { message: "Só a galeria pode ser reordenada." });
        }
      }
      await repo.setPositions(assetIds);
      return { ok: true as const };
    },

    async setProfileImage(ownerUserId: string, assetId: string | null) {
      const profile = await requireProfile(ownerUserId);
      if (assetId === null) {
        await profiles.update(profile.id, { profileImageAssetId: null });
        return { ok: true as const };
      }
      const row = await requireOwned(ownerUserId, assetId);
      if (row.profileId !== profile.id) {
        throw new ORPCError("FORBIDDEN", { message: "Esta mídia não pertence a você." });
      }
      if (row.kind !== "image" || row.status !== "ready") {
        throw new ORPCError("CONFLICT", {
          message: "A foto de perfil precisa ser uma imagem já processada.",
        });
      }
      await profiles.update(profile.id, { profileImageAssetId: row.id });
      return { ok: true as const };
    },
  };
}
