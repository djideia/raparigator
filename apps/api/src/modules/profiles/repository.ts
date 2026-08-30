import { and, asc, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import type { FeedFiltersCriteria, FeedSort, PaginationInput } from "@sigillus/contracts";
import {
  FEED_CATEGORY_BY_GENDER,
  FEED_DEFAULT_GENDER,
  FEED_LOCAL_SERVICE_TERMS,
  PREMIUM_VISIBILITY_MULTIPLIER,
  feedEthnicityTerms,
  feedHairTerms,
  feedServiceTerms,
} from "@sigillus/domain";
import type { Database } from "../../db/client";
import { mediaAssets, professionalProfiles } from "../../db/schema";
import type { ObjectStorage } from "../../lib/storage";
import { resolveProfileImages, type ProfileImages, type ProfileRow } from "./mapper";

export type ProfileRepository = ReturnType<typeof createProfileRepository>;

export const VISIBLE_PROFILE = and(
  eq(professionalProfiles.verificationStatus, "published"),
  eq(professionalProfiles.listingStatus, "Ativo"),
  eq(professionalProfiles.isSuspended, false),
);

const RELEVANCE = sql<number>`(${professionalProfiles.rating} * 100 + log(greatest(${professionalProfiles.profileViews}, 1)) * 10) * (case when ${professionalProfiles.adTier} = 'premium' then ${sql.raw(String(PREMIUM_VISIBILITY_MULTIPLIER))} else 1 end)`;

function anyTermCondition(column: SQL, terms: string[]): SQL {
  const parts = terms.map((term) => sql`unaccent(lower(${column})) like ${`%${term}%`}`);
  return sql`(${sql.join(parts, sql` or `)})`;
}

function anyServiceCondition(terms: string[]): SQL {
  return sql`exists (select 1 from unnest(${professionalProfiles.services}) as s where ${anyTermCondition(sql`s`, terms)})`;
}

export function buildFeedConditions(criteria: FeedFiltersCriteria): SQL[] {
  const conditions: SQL[] = [];
  if (criteria.selectedCity !== "all") {
    conditions.push(eq(professionalProfiles.city, criteria.selectedCity));
  }
  conditions.push(sql`${professionalProfiles.startingPrice} <= ${criteria.maxPrice}`);
  if (criteria.selectedGender !== FEED_DEFAULT_GENDER) {
    conditions.push(
      eq(professionalProfiles.category, FEED_CATEGORY_BY_GENDER[criteria.selectedGender] ?? ""),
    );
  }
  if (criteria.adTiers.length > 0) {
    conditions.push(inArray(professionalProfiles.adTier, criteria.adTiers));
  }
  if (criteria.quickFilters.includes("Livre Agora")) {
    conditions.push(eq(professionalProfiles.availabilityStatus, "livre"));
  }
  if (criteria.quickFilters.includes("Com local")) {
    conditions.push(anyServiceCondition(FEED_LOCAL_SERVICE_TERMS));
  }
  if (criteria.ethnicities.length > 0) {
    conditions.push(
      sql`(${sql.join(
        criteria.ethnicities.map((value) =>
          anyTermCondition(sql`${professionalProfiles.ethnicity}`, feedEthnicityTerms(value)),
        ),
        sql` or `,
      )})`,
    );
  }
  if (criteria.hairs.length > 0) {
    conditions.push(
      sql`(${sql.join(
        criteria.hairs.map((value) =>
          anyTermCondition(sql`${professionalProfiles.hairColor}`, feedHairTerms(value)),
        ),
        sql` or `,
      )})`,
    );
  }
  if (criteria.services.length > 0) {
    conditions.push(
      sql`(${sql.join(
        criteria.services.map((value) => anyServiceCondition(feedServiceTerms(value))),
        sql` or `,
      )})`,
    );
  }
  return conditions;
}

function orderFor(sort: FeedSort) {
  switch (sort) {
    case "price_asc":
      return [asc(professionalProfiles.startingPrice), desc(RELEVANCE)];
    case "price_desc":
      return [desc(professionalProfiles.startingPrice), desc(RELEVANCE)];
    case "rating":
      return [desc(professionalProfiles.rating), desc(RELEVANCE)];
    default:
      return [desc(RELEVANCE), desc(professionalProfiles.updatedAt)];
  }
}

export function createProfileRepository(db: Database, storage: ObjectStorage) {
  async function imagesFor(rows: ProfileRow[]): Promise<Map<string, ProfileImages>> {
    const result = new Map<string, ProfileImages>();
    if (rows.length === 0) {
      return result;
    }
    const assets = await db
      .select({
        id: mediaAssets.id,
        profileId: mediaAssets.profileId,
        purpose: mediaAssets.purpose,
        storageKey: mediaAssets.storageKey,
        position: mediaAssets.position,
      })
      .from(mediaAssets)
      .where(
        and(
          inArray(
            mediaAssets.profileId,
            rows.map((row) => row.id),
          ),
          eq(mediaAssets.status, "ready"),
          eq(mediaAssets.kind, "image"),
          inArray(mediaAssets.purpose, ["gallery", "profile"]),
        ),
      )
      .orderBy(asc(mediaAssets.position), asc(mediaAssets.createdAt));

    for (const row of rows) {
      const own = assets.filter((asset) => asset.profileId === row.id);
      const gallery = own
        .filter((asset) => asset.purpose === "gallery")
        .map((asset) => storage.publicUrl(asset.storageKey) ?? "")
        .filter(Boolean);
      const profileAsset = own.find((asset) => asset.id === row.profileImageAssetId);
      const profileUrl = profileAsset ? storage.publicUrl(profileAsset.storageKey) : null;
      result.set(row.id, resolveProfileImages(row, gallery, profileUrl));
    }
    return result;
  }

  return {
    imagesFor,

    async findBySlug(slug: string) {
      const [row] = await db
        .select()
        .from(professionalProfiles)
        .where(eq(professionalProfiles.slug, slug))
        .limit(1);
      return row ?? null;
    },

    async findById(id: string) {
      const [row] = await db
        .select()
        .from(professionalProfiles)
        .where(eq(professionalProfiles.id, id))
        .limit(1);
      return row ?? null;
    },

    async findByUserId(userId: string) {
      const [row] = await db
        .select()
        .from(professionalProfiles)
        .where(eq(professionalProfiles.userId, userId))
        .limit(1);
      return row ?? null;
    },

    async listFeed(criteria: FeedFiltersCriteria, sort: FeedSort, pagination: PaginationInput) {
      const where = and(VISIBLE_PROFILE, ...buildFeedConditions(criteria));
      const offset = (pagination.page - 1) * pagination.pageSize;
      const rows = await db
        .select({ row: professionalProfiles, total: sql<number>`count(*) over()` })
        .from(professionalProfiles)
        .where(where)
        .orderBy(...orderFor(sort))
        .limit(pagination.pageSize)
        .offset(offset);
      const total = rows[0] ? Number(rows[0].total) : 0;
      return { rows: rows.map((entry) => entry.row), total };
    },

    async listPopular(kind: "most_viewed" | "top_rated", limit: number) {
      const order =
        kind === "most_viewed"
          ? [desc(professionalProfiles.profileViews)]
          : [desc(professionalProfiles.rating), desc(professionalProfiles.reviewsCount)];
      return db
        .select()
        .from(professionalProfiles)
        .where(VISIBLE_PROFILE)
        .orderBy(...order)
        .limit(limit);
    },

    async listByStatus(status?: ProfileRow["verificationStatus"]) {
      const query = db.select().from(professionalProfiles);
      const rows = status
        ? await query.where(eq(professionalProfiles.verificationStatus, status))
        : await query;
      return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    async incrementViews(id: string) {
      await db
        .update(professionalProfiles)
        .set({ profileViews: sql`${professionalProfiles.profileViews} + 1` })
        .where(eq(professionalProfiles.id, id));
    },

    async update(id: string, values: Partial<typeof professionalProfiles.$inferInsert>) {
      const [row] = await db
        .update(professionalProfiles)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(professionalProfiles.id, id))
        .returning();
      return row ?? null;
    },

    async insert(values: typeof professionalProfiles.$inferInsert) {
      const [row] = await db.insert(professionalProfiles).values(values).returning();
      return row!;
    },
  };
}
