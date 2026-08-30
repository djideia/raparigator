import { z } from "zod";
import { AdCategorySchema } from "./common";

export const FeedQuickFilterLabelSchema = z.enum(["Premium", "Livre Agora", "Com local"]);
export type FeedQuickFilterLabel = z.infer<typeof FeedQuickFilterLabelSchema>;

export const FeedAdTypeLabelSchema = z.enum(["Premium", "Comum"]);
export type FeedAdTypeLabel = z.infer<typeof FeedAdTypeLabelSchema>;

export const FeedSelectionFieldSchema = z.enum(["ethnicities", "hairs", "services"]);
export type FeedSelectionField = z.infer<typeof FeedSelectionFieldSchema>;

export const FeedFiltersCriteriaSchema = z.object({
  selectedCity: z.string(),
  selectedGender: z.string(),
  maxPrice: z.number(),
  adTiers: z.array(AdCategorySchema),
  quickFilters: z.array(z.enum(["Livre Agora", "Com local"])),
  ethnicities: z.array(z.string()),
  hairs: z.array(z.string()),
  services: z.array(z.string()),
});
export type FeedFiltersCriteria = z.infer<typeof FeedFiltersCriteriaSchema>;

export const FeedSortSchema = z.enum(["relevance", "price_asc", "price_desc", "rating"]);
export type FeedSort = z.infer<typeof FeedSortSchema>;
