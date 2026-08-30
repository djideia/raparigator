import { asc } from "drizzle-orm";
import type { MediaHighlight, ProfessionalAd } from "@sigillus/contracts";
import type { Database } from "../../db/client";
import { mediaHighlights } from "../../db/schema";
import { toFeedAdSummary, toProfessionalAd } from "../profiles/mapper";
import type { ProfileRepository } from "../profiles/repository";

export type AdsService = ReturnType<typeof createAdsService>;

export function createAdsService(db: Database, profiles: ProfileRepository) {
  return {
    async getBySlug(slug: string): Promise<ProfessionalAd | null> {
      const row = await profiles.findBySlug(slug);
      if (!row || row.verificationStatus !== "published" || row.isSuspended) {
        return null;
      }
      const images = await profiles.imagesFor([row]);
      const ad = toProfessionalAd(row, images.get(row.id) ?? { images: row.externalImages });
      return { ...ad, rejectionReason: undefined, isSuspended: undefined, submittedAt: undefined };
    },

    async listPopular(kind: "most_viewed" | "top_rated", limit: number) {
      const rows = await profiles.listPopular(kind, limit);
      const images = await profiles.imagesFor(rows);
      return rows.map((row) =>
        toFeedAdSummary(row, images.get(row.id) ?? { images: row.externalImages }),
      );
    },

    async mediaHighlights(): Promise<MediaHighlight[]> {
      const rows = await db.select().from(mediaHighlights).orderBy(asc(mediaHighlights.position));
      return rows.map(({ position: _position, ...row }) => row);
    },

    async registerView(slug: string) {
      const row = await profiles.findBySlug(slug);
      if (row) {
        await profiles.incrementViews(row.id);
      }
      return { ok: true as const };
    },
  };
}
