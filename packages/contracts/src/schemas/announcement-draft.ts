import { z } from "zod";

export const AvailabilityDaySchema = z.object({
  day: z.string(),
  enabled: z.boolean(),
  start: z.string(),
  end: z.string(),
});
export type AvailabilityDay = z.infer<typeof AvailabilityDaySchema>;

export const AnnouncementAdPreviewSchema = z.object({
  slug: z.string(),
  displayName: z.string(),
  artisticName: z.string(),
  city: z.string(),
  state: z.string(),
  startingPrice: z.number(),
  images: z.array(z.string()),
  profileImage: z.string().optional(),
  profileImageIndex: z.number().optional(),
  rating: z.number(),
  reviewsCount: z.number(),
  profileViews: z.number(),
  status: z.string(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  services: z.array(z.string()).optional(),
  pricingTable: z.array(z.object({ label: z.string(), price: z.number() })).optional(),
  neighborhood: z.string().optional(),
  category: z.string().optional(),
  heightCm: z.number().optional(),
  ethnicity: z.string().optional(),
  hairColor: z.string().optional(),
});
export type AnnouncementAdPreview = z.infer<typeof AnnouncementAdPreviewSchema>;

export const AnnouncementServiceOptionSchema = z.object({
  label: z.string(),
  selected: z.boolean(),
});
export type AnnouncementServiceOption = z.infer<typeof AnnouncementServiceOptionSchema>;

export const AnnouncementPricingItemSchema = z.object({
  label: z.string(),
  price: z.string(),
  disabled: z.boolean(),
  billingType: z.enum(["hourly", "fixed"]).optional(),
});
export type AnnouncementPricingItem = z.infer<typeof AnnouncementPricingItemSchema>;

export const AnnouncementLocationVenueSchema = z.object({
  key: z.string(),
  label: z.string(),
  checked: z.boolean(),
});
export type AnnouncementLocationVenue = z.infer<typeof AnnouncementLocationVenueSchema>;

export const AnnouncementLocationAddressSchema = z.object({
  id: z.string(),
  label: z.string(),
  addressLine: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  notes: z.string(),
  active: z.boolean(),
});
export type AnnouncementLocationAddress = z.infer<typeof AnnouncementLocationAddressSchema>;

export const AnnouncementCharacteristicsSchema = z.object({
  gender: z.string(),
  genitalia: z.string(),
  sexualPreference: z.string(),
  weight: z.string(),
  height: z.string(),
  ethnicity: z.string(),
  eyeColor: z.string(),
  hairColor: z.string(),
  hairLength: z.string(),
  silicone: z.string(),
  tattoos: z.string(),
  piercings: z.string(),
  smoker: z.string(),
  languages: z.string(),
});
export type AnnouncementCharacteristics = z.infer<typeof AnnouncementCharacteristicsSchema>;

export const AnnouncementRequiredCharacteristicKeySchema = z.enum([
  "gender",
  "ethnicity",
  "height",
  "weight",
  "hairColor",
  "smoker",
]);
export type AnnouncementRequiredCharacteristicKey = z.infer<
  typeof AnnouncementRequiredCharacteristicKeySchema
>;

export const AnnouncementDraftStateSchema = z.object({
  images: z.array(z.string()),
  coverIndex: z.number(),
  coverPreviews: z.array(z.string()),
  profileIndex: z.number().nullable(),
  profilePreviews: z.array(z.string()),
  shortDescription: z.string(),
  description: z.string(),
  characteristics: AnnouncementCharacteristicsSchema,
  services: z.array(AnnouncementServiceOptionSchema),
  pricing: z.array(AnnouncementPricingItemSchema),
  paymentMethods: z.array(z.string()),
  venues: z.array(AnnouncementLocationVenueSchema),
  acceptsTravel: z.boolean(),
  locationAddresses: z.array(AnnouncementLocationAddressSchema),
  locationState: z.string(),
  locationCity: z.string(),
  showAvailability: z.boolean(),
  availability: z.array(AvailabilityDaySchema),
});
export type AnnouncementDraftState = z.infer<typeof AnnouncementDraftStateSchema>;

export const AnnouncementSaveStatusSchema = z.enum(["idle", "saving", "saved", "error"]);
export type AnnouncementSaveStatus = z.infer<typeof AnnouncementSaveStatusSchema>;

export const AnnouncementSmartTipSchema = z.object({
  id: z.string(),
  text: z.string(),
  priority: z.enum(["high", "medium", "low"]),
});
export type AnnouncementSmartTip = z.infer<typeof AnnouncementSmartTipSchema>;

export const AnnouncementProfileScoreSchema = z.object({
  percentage: z.number(),
  breakdown: z.object({
    photos: z.number(),
    description: z.number(),
    pricing: z.number(),
    services: z.number(),
    location: z.number(),
  }),
});
export type AnnouncementProfileScore = z.infer<typeof AnnouncementProfileScoreSchema>;

export const AnnouncementSectionKeySchema = z.enum([
  "characteristics",
  "pricing",
  "location",
  "description",
  "services",
  "availability",
]);
export type AnnouncementSectionKey = z.infer<typeof AnnouncementSectionKeySchema>;

export const AnnouncementSectionSnapshotsSchema = z.record(
  AnnouncementSectionKeySchema,
  z.string(),
);
export type AnnouncementSectionSnapshots = z.infer<typeof AnnouncementSectionSnapshotsSchema>;

export const AnnouncementSectionDirtyStateSchema = z.record(
  AnnouncementSectionKeySchema,
  z.boolean(),
);
export type AnnouncementSectionDirtyState = z.infer<typeof AnnouncementSectionDirtyStateSchema>;

export const AnnouncementSaveResultSchema = z.enum(["saved", "no_changes", "error", "busy"]);
export type AnnouncementSaveResult = z.infer<typeof AnnouncementSaveResultSchema>;

export const AnnouncementPublishWarningItemSchema = z.object({
  kind: z.enum(["required", "unsaved"]),
  section: AnnouncementSectionKeySchema,
  label: z.string(),
});
export type AnnouncementPublishWarningItem = z.infer<typeof AnnouncementPublishWarningItemSchema>;

export const AnnouncementSaveSectionFailureSchema = z.union([
  z.object({
    ok: z.literal(false),
    reason: z.literal("characteristics"),
    missing: z.array(AnnouncementRequiredCharacteristicKeySchema),
    message: z.string(),
  }),
  z.object({
    ok: z.literal(false),
    reason: z.literal("pricing"),
    message: z.string(),
  }),
  z.object({
    ok: z.literal(false),
    reason: z.enum(["busy", "error", "not_dirty"]),
  }),
]);
export type AnnouncementSaveSectionFailure = z.infer<typeof AnnouncementSaveSectionFailureSchema>;

export const AnnouncementSaveSectionSuccessSchema = z.object({
  ok: z.literal(true),
  saveResult: AnnouncementSaveResultSchema,
});
export type AnnouncementSaveSectionSuccess = z.infer<typeof AnnouncementSaveSectionSuccessSchema>;

export const AnnouncementSaveSectionResultSchema = z.union([
  AnnouncementSaveSectionSuccessSchema,
  AnnouncementSaveSectionFailureSchema,
]);
export type AnnouncementSaveSectionResult = z.infer<typeof AnnouncementSaveSectionResultSchema>;

export const AnnouncementPublishResultSchema = z.union([
  z.object({ ok: z.literal(true) }),
  z.object({
    ok: z.literal(false),
    reason: z.literal("blocked"),
    message: z.string(),
    items: z.array(AnnouncementPublishWarningItemSchema),
  }),
  z.object({
    ok: z.literal(false),
    reason: z.literal("error"),
    message: z.string(),
  }),
]);
export type AnnouncementPublishResult = z.infer<typeof AnnouncementPublishResultSchema>;

export const AnnouncementListingStatusSchema = z.enum(["Ativo", "Pausado"]);
export type AnnouncementListingStatus = z.infer<typeof AnnouncementListingStatusSchema>;
