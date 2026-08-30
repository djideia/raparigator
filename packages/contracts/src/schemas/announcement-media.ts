import { z } from "zod";

export const AnnouncementMediaAreaSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});
export type AnnouncementMediaArea = z.infer<typeof AnnouncementMediaAreaSchema>;

export const AnnouncementMediaOperationKindSchema = z.enum(["blur", "edit"]);
export type AnnouncementMediaOperationKind = z.infer<typeof AnnouncementMediaOperationKindSchema>;

export const AnnouncementMediaBlurModeSchema = z.enum(["crop", "brush"]);
export type AnnouncementMediaBlurMode = z.infer<typeof AnnouncementMediaBlurModeSchema>;

export const AnnouncementMediaHistoryEntrySchema = z.object({
  parent: z.string(),
  operation: AnnouncementMediaOperationKindSchema,
  cropArea: AnnouncementMediaAreaSchema.optional(),
  blurMode: AnnouncementMediaBlurModeSchema.optional(),
  blurMaskDataUrl: z.string().optional(),
});
export type AnnouncementMediaHistoryEntry = z.infer<typeof AnnouncementMediaHistoryEntrySchema>;

export const AnnouncementMediaHistoryMapSchema = z.record(
  z.string(),
  AnnouncementMediaHistoryEntrySchema,
);
export type AnnouncementMediaHistoryMap = z.infer<typeof AnnouncementMediaHistoryMapSchema>;

export const AnnouncementMediaHistoryItemSchema = z.object({
  src: z.string(),
  entry: AnnouncementMediaHistoryEntrySchema,
});
export type AnnouncementMediaHistoryItem = z.infer<typeof AnnouncementMediaHistoryItemSchema>;

export const AnnouncementMediaSourceOffsetSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type AnnouncementMediaSourceOffset = z.infer<typeof AnnouncementMediaSourceOffsetSchema>;

export const AnnouncementMediaRebuildResultSchema = z.object({
  src: z.string(),
  entries: z.array(AnnouncementMediaHistoryItemSchema),
});
export type AnnouncementMediaRebuildResult = z.infer<typeof AnnouncementMediaRebuildResultSchema>;

export const AnnouncementMediaBlurInputSchema = z.object({
  src: z.string(),
  mode: AnnouncementMediaBlurModeSchema,
  cropArea: AnnouncementMediaAreaSchema.optional(),
  maskDataUrl: z.string().optional(),
});
export type AnnouncementMediaBlurInput = z.infer<typeof AnnouncementMediaBlurInputSchema>;

export const MediaKindSchema = z.enum(["image", "video"]);
export type MediaKind = z.infer<typeof MediaKindSchema>;

export const MediaPurposeSchema = z.enum(["gallery", "profile", "chat"]);
export type MediaPurpose = z.infer<typeof MediaPurposeSchema>;

export const MediaAssetStatusSchema = z.enum([
  "pending_upload",
  "processing",
  "ready",
  "rejected",
  "failed",
]);
export type MediaAssetStatus = z.infer<typeof MediaAssetStatusSchema>;

export const MediaAssetSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  kind: MediaKindSchema,
  purpose: MediaPurposeSchema,
  status: MediaAssetStatusSchema,
  contentType: z.string(),
  sizeBytes: z.number(),
  url: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  position: z.number().nullable(),
  moderationReason: z.string().nullable(),
  createdAt: z.string(),
});
export type MediaAsset = z.infer<typeof MediaAssetSchema>;

export const MEDIA_MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MEDIA_MAX_VIDEO_BYTES = 200 * 1024 * 1024;

export const CreateUploadInputSchema = z.object({
  kind: MediaKindSchema,
  purpose: MediaPurposeSchema,
  contentType: z.string().regex(/^(image|video)\/[a-z0-9.+-]+$/),
  sizeBytes: z.number().int().positive().max(MEDIA_MAX_VIDEO_BYTES),
  fileName: z.string().max(200).optional(),
});
export type CreateUploadInput = z.infer<typeof CreateUploadInputSchema>;

export const CreateUploadOutputSchema = z.object({
  asset: MediaAssetSchema,
  uploadUrl: z.string(),
  method: z.literal("PUT"),
  headers: z.record(z.string(), z.string()),
  expiresAt: z.string(),
});
export type CreateUploadOutput = z.infer<typeof CreateUploadOutputSchema>;
