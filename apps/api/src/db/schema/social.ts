import {
  boolean,
  index,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { conversations } from "./chat";
import { professionalProfiles } from "./profiles";

export const reviewInvites = pgTable(
  "review_invite",
  {
    id: text().primaryKey(),
    conversationId: text()
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    profileId: text()
      .notNull()
      .references(() => professionalProfiles.id, { onDelete: "cascade" }),
    clientUserId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    invitedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    usedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex("review_invite_conversation_key").on(table.conversationId),
    index("review_invite_client_idx").on(table.clientUserId),
    index("review_invite_expires_idx").on(table.expiresAt),
  ],
);

export const reviews = pgTable(
  "review",
  {
    id: text().primaryKey(),
    profileId: text()
      .notNull()
      .references(() => professionalProfiles.id, { onDelete: "cascade" }),
    conversationId: text().references(() => conversations.id, { onDelete: "set null" }),
    authorUserId: text().references(() => users.id, { onDelete: "set null" }),
    authorName: text().notNull(),
    score: smallint().notNull(),
    comment: text().notNull().default(""),
    isSeed: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("review_profile_idx").on(table.profileId, table.createdAt),
    uniqueIndex("review_conversation_key").on(table.conversationId),
  ],
);

export const reports = pgTable(
  "report",
  {
    id: text().primaryKey(),
    type: text({ enum: ["fake_profile", "scam", "harassment", "inappropriate_content", "other"] })
      .notNull()
      .default("other"),
    reporterUserId: text().references(() => users.id, { onDelete: "set null" }),
    reporterName: text().notNull(),
    reporterRole: text({ enum: ["cliente", "profissional"] }).notNull(),
    reportedUserId: text().references(() => users.id, { onDelete: "set null" }),
    reportedName: text().notNull(),
    reportedRole: text({ enum: ["cliente", "profissional"] }).notNull(),
    conversationId: text().references(() => conversations.id, { onDelete: "set null" }),
    description: text().notNull(),
    status: text({ enum: ["pending", "under_review", "resolved", "dismissed"] })
      .notNull()
      .default("pending"),
    resolution: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }),
  },
  (table) => [index("report_status_idx").on(table.status, table.createdAt)],
);

export const adminActivityLogs = pgTable(
  "admin_activity_log",
  {
    id: text().primaryKey(),
    action: text({
      enum: [
        "profile_approved",
        "profile_rejected",
        "profile_submitted",
        "client_registered",
        "account_suspended",
        "account_reinstated",
      ],
    }).notNull(),
    targetName: text().notNull(),
    targetId: text(),
    adminEmail: text(),
    reason: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("admin_activity_log_created_idx").on(table.createdAt)],
);

export const notifications = pgTable(
  "notification",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text().notNull(),
    title: text().notNull(),
    message: text().notNull(),
    href: text(),
    readAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("notification_user_key").on(table.userId, table.key),
    index("notification_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const verificationChannels = pgTable(
  "verification_channel",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: text({ enum: ["email", "phone"] }).notNull(),
    target: text().notNull(),
    codeHash: text(),
    codeSentAt: timestamp({ withTimezone: true }),
    expiresAt: timestamp({ withTimezone: true }),
    attempts: smallint().notNull().default(0),
    verifiedAt: timestamp({ withTimezone: true }),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("verification_channel_user_channel_key").on(table.userId, table.channel)],
);

export const subscriptions = pgTable(
  "subscription",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text().notNull(),
    providerRef: text(),
    cycle: text({ enum: ["monthly", "semiannual"] }).notNull(),
    status: text({
      enum: ["none", "pending_payment", "active", "past_due", "canceled", "expired"],
    })
      .notNull()
      .default("pending_payment"),
    currentPeriodStart: timestamp({ withTimezone: true }),
    currentPeriodEnd: timestamp({ withTimezone: true }),
    cancelAtPeriodEnd: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("subscription_user_idx").on(table.userId, table.createdAt),
    index("subscription_status_period_idx").on(table.status, table.currentPeriodEnd),
  ],
);

export const subscriptionEvents = pgTable(
  "subscription_event",
  {
    id: text().primaryKey(),
    subscriptionId: text()
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    type: text({
      enum: [
        "checkout_created",
        "payment_confirmed",
        "payment_failed",
        "renewed",
        "cancel_requested",
        "canceled",
        "expired",
      ],
    }).notNull(),
    idempotencyKey: text().notNull(),
    payload: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    occurredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("subscription_event_idempotency_key").on(table.idempotencyKey),
    index("subscription_event_subscription_idx").on(table.subscriptionId, table.occurredAt),
  ],
);

export const webhookDeliveries = pgTable(
  "webhook_delivery",
  {
    id: text().primaryKey(),
    provider: text().notNull(),
    externalId: text().notNull(),
    payload: jsonb().$type<Record<string, unknown>>().notNull(),
    receivedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp({ withTimezone: true }),
    error: text(),
  },
  (table) => [
    uniqueIndex("webhook_delivery_provider_external_key").on(table.provider, table.externalId),
  ],
);
