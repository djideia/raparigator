import { and, asc, eq, inArray, notInArray, sql } from "drizzle-orm";
import type { MediaKind, MediaPurpose } from "@sigillus/contracts";
import type { Database } from "../../db/client";
import { mediaAssets } from "../../db/schema";
import type { MediaAssetRow } from "./mapper";

export type MediaRepository = ReturnType<typeof createMediaRepository>;

const COUNTED_STATUSES: MediaAssetRow["status"][] = ["failed", "rejected"];

export function createMediaRepository(db: Database) {
  return {
    async findById(id: string): Promise<MediaAssetRow | null> {
      const [row] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
      return row ?? null;
    },

    async listByOwner(ownerUserId: string, purpose?: MediaPurpose): Promise<MediaAssetRow[]> {
      const where = purpose
        ? and(eq(mediaAssets.ownerUserId, ownerUserId), eq(mediaAssets.purpose, purpose))
        : eq(mediaAssets.ownerUserId, ownerUserId);
      return db
        .select()
        .from(mediaAssets)
        .where(where)
        .orderBy(asc(mediaAssets.position), asc(mediaAssets.createdAt));
    },

    async listByIds(ids: string[]): Promise<MediaAssetRow[]> {
      if (ids.length === 0) {
        return [];
      }
      return db.select().from(mediaAssets).where(inArray(mediaAssets.id, ids));
    },

    async countGalleryByKind(profileId: string, kind: MediaKind): Promise<number> {
      const [row] = await db
        .select({ count: sql<number>`count(*)` })
        .from(mediaAssets)
        .where(
          and(
            eq(mediaAssets.profileId, profileId),
            eq(mediaAssets.purpose, "gallery"),
            eq(mediaAssets.kind, kind),
            notInArray(mediaAssets.status, COUNTED_STATUSES),
          ),
        );
      return Number(row?.count ?? 0);
    },

    async nextGalleryPosition(profileId: string): Promise<number> {
      const [row] = await db
        .select({ max: sql<number | null>`max(${mediaAssets.position})` })
        .from(mediaAssets)
        .where(and(eq(mediaAssets.profileId, profileId), eq(mediaAssets.purpose, "gallery")));
      return row?.max === null || row?.max === undefined ? 0 : Number(row.max) + 1;
    },

    async insert(values: typeof mediaAssets.$inferInsert): Promise<MediaAssetRow> {
      const [row] = await db.insert(mediaAssets).values(values).returning();
      return row!;
    },

    async update(
      id: string,
      values: Partial<typeof mediaAssets.$inferInsert>,
    ): Promise<MediaAssetRow | null> {
      const [row] = await db
        .update(mediaAssets)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(mediaAssets.id, id))
        .returning();
      return row ?? null;
    },

    async setPositions(orderedIds: string[]): Promise<void> {
      if (orderedIds.length === 0) {
        return;
      }
      const cases = sql.join(
        orderedIds.map((id, index) => sql`when ${id} then ${sql.raw(String(index))}`),
        sql` `,
      );
      await db
        .update(mediaAssets)
        .set({ position: sql`case ${mediaAssets.id} ${cases} end`, updatedAt: new Date() })
        .where(inArray(mediaAssets.id, orderedIds));
    },

    async remove(id: string): Promise<void> {
      await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
    },
  };
}
