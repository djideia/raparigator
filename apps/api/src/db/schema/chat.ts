import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { EncounterBrief } from "@sigillus/contracts";
import { users } from "./auth";
import { mediaAssets } from "./media";
import { professionalProfiles } from "./profiles";

export const conversations = pgTable(
  "conversation",
  {
    id: text().primaryKey(),
    profileId: text()
      .notNull()
      .references(() => professionalProfiles.id, { onDelete: "cascade" }),
    clientUserId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    professionalUserId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastMessagePreview: text().notNull().default(""),
    lastMessageAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("conversation_profile_client_key").on(table.profileId, table.clientUserId),
    index("conversation_client_idx").on(table.clientUserId, table.lastMessageAt),
    index("conversation_professional_idx").on(table.professionalUserId, table.lastMessageAt),
  ],
);

export const conversationParticipants = pgTable(
  "conversation_participant",
  {
    id: text().primaryKey(),
    conversationId: text()
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text({ enum: ["cliente", "profissional"] }).notNull(),
    unreadCount: integer().notNull().default(0),
    alias: text(),
    isBlocked: boolean().notNull().default(false),
    deletedFromInboxAt: timestamp({ withTimezone: true }),
    lastReadAt: timestamp({ withTimezone: true }),
    lastSeenAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex("conversation_participant_key").on(table.conversationId, table.userId),
    index("conversation_participant_user_idx").on(table.userId, table.deletedFromInboxAt),
  ],
);

export const messages = pgTable(
  "message",
  {
    id: text().primaryKey(),
    conversationId: text()
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderUserId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    senderRole: text({ enum: ["cliente", "profissional", "suporte"] }).notNull(),
    messageType: text({ enum: ["text", "media", "brief"] }).notNull(),
    content: text(),
    mediaAssetId: text().references(() => mediaAssets.id, { onDelete: "set null" }),
    isViewOnce: boolean().notNull().default(false),
    openedAt: timestamp({ withTimezone: true }),
    brief: jsonb().$type<EncounterBrief>(),
    clientMessageId: text(),
    sentAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    deliveredAt: timestamp({ withTimezone: true }),
    editedAt: timestamp({ withTimezone: true }),
    deletedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    index("message_conversation_sent_idx").on(table.conversationId, table.sentAt),
    uniqueIndex("message_client_id_key").on(
      table.conversationId,
      table.senderUserId,
      table.clientMessageId,
    ),
  ],
);
