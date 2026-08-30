import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AnnouncementDraftState, PricingTableItem } from "@sigillus/contracts";
import { users } from "./auth";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const professionalProfiles = pgTable(
  "professional_profile",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text().notNull(),
    displayName: text().notNull().default(""),
    artisticName: text().notNull().default(""),
    city: text().notNull().default(""),
    state: text().notNull().default(""),
    neighborhood: text().notNull().default(""),
    category: text().notNull().default(""),
    shortDescription: text().notNull().default(""),
    description: text().notNull().default(""),
    serviceDescription: text().notNull().default(""),
    startingPrice: numeric({ precision: 10, scale: 2, mode: "number" }).notNull().default(0),
    age: smallint().notNull().default(0),
    heightCm: smallint().notNull().default(0),
    weightKg: smallint().notNull().default(0),
    ethnicity: text().notNull().default(""),
    eyeColor: text().notNull().default(""),
    hairType: text().notNull().default(""),
    hairColor: text().notNull().default(""),
    services: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    serviceOptions: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    fetishOptions: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    fetishCustom: text().notNull().default(""),
    pricingTable: jsonb().$type<PricingTableItem[]>().notNull().default([]),
    paymentMethods: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    availabilityStatus: text({ enum: ["livre", "em_atendimento", "indisponivel"] })
      .notNull()
      .default("livre"),
    adTier: text({ enum: ["premium", "normal"] })
      .notNull()
      .default("normal"),
    listingStatus: text({ enum: ["Ativo", "Pausado"] })
      .notNull()
      .default("Pausado"),
    verificationStatus: text({ enum: ["pending_review", "published", "rejected"] })
      .notNull()
      .default("pending_review"),
    submittedAt: timestamp({ withTimezone: true }),
    reviewedAt: timestamp({ withTimezone: true }),
    rejectionReason: text(),
    isSuspended: boolean().notNull().default(false),
    suspensionReason: text(),
    profileImageAssetId: text(),
    externalImages: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    externalProfileImage: text(),
    externalProfileImageIndex: smallint(),
    rating: numeric({ precision: 3, scale: 2, mode: "number" }).notNull().default(0),
    reviewsCount: integer().notNull().default(0),
    profileViews: integer().notNull().default(0),
    whatsappNumber: text(),
    telegramUsername: text(),
    draft: jsonb().$type<AnnouncementDraftState>(),
    draftSavedAt: timestamp({ withTimezone: true }),
    searchVector: tsvector().generatedAlwaysAs(
      sql`to_tsvector('portuguese', coalesce("artistic_name", '') || ' ' || coalesce("display_name", '') || ' ' || coalesce("city", '') || ' ' || coalesce("neighborhood", '') || ' ' || coalesce("category", '') || ' ' || coalesce("short_description", ''))`,
    ),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("professional_profile_user_id_key").on(table.userId),
    uniqueIndex("professional_profile_slug_key").on(table.slug),
    index("professional_profile_feed_idx").on(
      table.verificationStatus,
      table.listingStatus,
      table.isSuspended,
      table.city,
      table.adTier,
    ),
    index("professional_profile_starting_price_idx").on(table.startingPrice),
    index("professional_profile_category_idx").on(table.category),
    index("professional_profile_rating_idx").on(table.rating),
    index("professional_profile_views_idx").on(table.profileViews),
    index("professional_profile_search_idx").using("gin", table.searchVector),
    index("professional_profile_artistic_name_trgm_idx").using(
      "gin",
      sql`${table.artisticName} gin_trgm_ops`,
    ),
  ],
);

export const catalogItems = pgTable(
  "catalog_item",
  {
    id: text().primaryKey(),
    kind: text({
      enum: [
        "service",
        "fetish",
        "ethnicity",
        "hair_color",
        "hair_type",
        "payment_method",
        "category",
        "state",
        "gender",
      ],
    }).notNull(),
    label: text().notNull(),
    position: smallint().notNull().default(0),
    active: boolean().notNull().default(true),
  },
  (table) => [
    uniqueIndex("catalog_item_kind_label_key").on(table.kind, table.label),
    index("catalog_item_kind_idx").on(table.kind, table.position),
  ],
);

export const catalogCities = pgTable(
  "catalog_city",
  {
    id: text().primaryKey(),
    city: text().notNull(),
    state: text().notNull(),
    position: smallint().notNull().default(0),
    active: boolean().notNull().default(true),
  },
  (table) => [uniqueIndex("catalog_city_city_state_key").on(table.city, table.state)],
);

export const mediaHighlights = pgTable("media_highlight", {
  id: text().primaryKey(),
  category: text().notNull(),
  professionalName: text().notNull(),
  coverUrl: text().notNull(),
  likes: integer().notNull().default(0),
  views: integer().notNull().default(0),
  kind: text({ enum: ["foto", "video"] }).notNull(),
  position: smallint().notNull().default(0),
});
