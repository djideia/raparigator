import type {
  FeedAdSummary,
  FeedFiltersCriteria,
  FeedSort,
  PaginationInput,
} from "@sigillus/contracts";
import { toFeedAdSummary } from "../profiles/mapper";
import type { ProfileRepository } from "../profiles/repository";

export type FeedService = ReturnType<typeof createFeedService>;

export function createFeedService(profiles: ProfileRepository) {
  return {
    async list(criteria: FeedFiltersCriteria, sort: FeedSort, pagination: PaginationInput) {
      const { rows, total } = await profiles.listFeed(criteria, sort, pagination);
      const images = await profiles.imagesFor(rows);
      const items: FeedAdSummary[] = rows.map((row) =>
        toFeedAdSummary(row, images.get(row.id) ?? { images: row.externalImages }),
      );
      return { items, total, page: pagination.page, pageSize: pagination.pageSize };
    },
  };
}
