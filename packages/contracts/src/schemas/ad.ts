import { z } from "zod";
import { AdCategorySchema, AvailabilityStatusSchema, VerificationStatusSchema } from "./common";

export const PricingTableItemSchema = z.object({
  label: z.string(),
  price: z.number(),
});
export type PricingTableItem = z.infer<typeof PricingTableItemSchema>;

export const ProfessionalAdSchema = z.object({
  id: z.string(),
  slug: z.string(),
  displayName: z.string(),
  artisticName: z.string(),
  city: z.string(),
  state: z.string(),
  neighborhood: z.string(),
  category: z.string(),
  shortDescription: z.string(),
  description: z.string(),
  serviceDescription: z.string(),
  startingPrice: z.number(),
  age: z.number(),
  heightCm: z.number(),
  weightKg: z.number(),
  ethnicity: z.string(),
  eyeColor: z.string(),
  hairType: z.string(),
  hairColor: z.string(),
  services: z.array(z.string()),
  serviceOptions: z.array(z.string()),
  fetishOptions: z.array(z.string()),
  fetishCustom: z.string(),
  pricingTable: z.array(PricingTableItemSchema),
  paymentMethods: z.array(z.string()).optional(),
  status: AvailabilityStatusSchema,
  adTier: AdCategorySchema,
  images: z.array(z.string()),
  profileImage: z.string().optional(),
  profileImageIndex: z.number().optional(),
  rating: z.number(),
  reviewsCount: z.number(),
  profileViews: z.number(),
  verificationStatus: VerificationStatusSchema.optional(),
  submittedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
  isSuspended: z.boolean().optional(),
  whatsappNumber: z.string().optional(),
  telegramUsername: z.string().optional(),
});
export type ProfessionalAd = z.infer<typeof ProfessionalAdSchema>;

export const FeedAdSummarySchema = ProfessionalAdSchema.pick({
  id: true,
  slug: true,
  displayName: true,
  artisticName: true,
  city: true,
  state: true,
  neighborhood: true,
  category: true,
  shortDescription: true,
  startingPrice: true,
  age: true,
  ethnicity: true,
  hairColor: true,
  services: true,
  status: true,
  adTier: true,
  images: true,
  profileImage: true,
  profileImageIndex: true,
  rating: true,
  reviewsCount: true,
  profileViews: true,
});
export type FeedAdSummary = z.infer<typeof FeedAdSummarySchema>;

export const MediaHighlightSchema = z.object({
  id: z.string(),
  category: z.string(),
  professionalName: z.string(),
  coverUrl: z.string(),
  likes: z.number(),
  views: z.number(),
  kind: z.enum(["foto", "video"]),
});
export type MediaHighlight = z.infer<typeof MediaHighlightSchema>;

export const ReviewSchema = z.object({
  id: z.string(),
  adId: z.string(),
  author: z.string(),
  score: z.number(),
  comment: z.string(),
  createdAt: z.string(),
});
export type Review = z.infer<typeof ReviewSchema>;

export const CatalogCitySchema = z.object({ city: z.string(), state: z.string() });
export type CatalogCity = z.infer<typeof CatalogCitySchema>;

export const CatalogsSchema = z.object({
  states: z.array(z.string()),
  cities: z.array(z.string()),
  locations: z.array(CatalogCitySchema),
  categories: z.array(z.string()),
  services: z.array(z.string()),
  fetishes: z.array(z.string()),
  ethnicities: z.array(z.string()),
  hairColors: z.array(z.string()),
  hairTypes: z.array(z.string()),
  paymentMethods: z.array(z.string()),
});
export type Catalogs = z.infer<typeof CatalogsSchema>;
