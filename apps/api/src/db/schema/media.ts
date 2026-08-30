import { index, integer, pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { professionalProfiles } from "./profiles";

export const mediaAssets = pgTable(
  "media_asset",
  {
    id: text().primaryKey(),
    ownerUserId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    profileId: text().references(() => professionalProfiles.id, { onDelete: "cascade" }),
    kind: text({ enum: ["image", "video"] }).notNull(),
    purpose: text({ enum: ["gallery", "profile", "chat"] }).notNull(),
    status: text({ enum: ["pending_upload", "processing", "ready", "rejected", "failed"] })
      .notNull()
      .default("pending_upload"),
    contentType: text().notNull(),
    sizeBytes: integer().notNull().default(0),
    fileName: text(),
    storageKey: text().notNull(),
    thumbnailKey: text(),
    width: integer(),
    height: integer(),
    position: smallint(),
    moderationReason: text(),
    processedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("media_asset_owner_idx").on(table.ownerUserId, table.purpose, table.status),
    index("media_asset_profile_gallery_idx").on(table.profileId, table.purpose, table.position),
  ],
);
