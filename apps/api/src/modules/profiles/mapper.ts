import type { FeedAdSummary, ProfessionalAd } from "@sigillus/contracts";
import type { professionalProfiles } from "../../db/schema";

export type ProfileRow = typeof professionalProfiles.$inferSelect;

export type ProfileImages = {
  images: string[];
  profileImage?: string;
  profileImageIndex?: number;
};

export function resolveProfileImages(
  row: ProfileRow,
  galleryUrls: string[],
  profileAssetUrl: string | null,
): ProfileImages {
  const images = galleryUrls.length > 0 ? galleryUrls : row.externalImages;
  if (galleryUrls.length > 0) {
    if (profileAssetUrl) {
      const index = galleryUrls.indexOf(profileAssetUrl);
      return {
        images,
        profileImage: profileAssetUrl,
        profileImageIndex: index >= 0 ? index : undefined,
      };
    }
    return { images };
  }
  return {
    images,
    profileImage: row.externalProfileImage ?? undefined,
    profileImageIndex: row.externalProfileImageIndex ?? undefined,
  };
}

export function toProfessionalAd(row: ProfileRow, media: ProfileImages): ProfessionalAd {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.displayName,
    artisticName: row.artisticName,
    city: row.city,
    state: row.state,
    neighborhood: row.neighborhood,
    category: row.category,
    shortDescription: row.shortDescription,
    description: row.description,
    serviceDescription: row.serviceDescription,
    startingPrice: Number(row.startingPrice),
    age: row.age,
    heightCm: row.heightCm,
    weightKg: row.weightKg,
    ethnicity: row.ethnicity,
    eyeColor: row.eyeColor,
    hairType: row.hairType,
    hairColor: row.hairColor,
    services: row.services,
    serviceOptions: row.serviceOptions,
    fetishOptions: row.fetishOptions,
    fetishCustom: row.fetishCustom,
    pricingTable: row.pricingTable,
    paymentMethods: row.paymentMethods,
    status: row.availabilityStatus,
    adTier: row.adTier,
    images: media.images,
    profileImage: media.profileImage,
    profileImageIndex: media.profileImageIndex,
    rating: Number(row.rating),
    reviewsCount: row.reviewsCount,
    profileViews: row.profileViews,
    verificationStatus: row.verificationStatus,
    submittedAt: row.submittedAt?.toISOString(),
    rejectionReason: row.rejectionReason ?? undefined,
    isSuspended: row.isSuspended,
    whatsappNumber: row.whatsappNumber ?? undefined,
    telegramUsername: row.telegramUsername ?? undefined,
  };
}

export function toFeedAdSummary(row: ProfileRow, media: ProfileImages): FeedAdSummary {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.displayName,
    artisticName: row.artisticName,
    city: row.city,
    state: row.state,
    neighborhood: row.neighborhood,
    category: row.category,
    shortDescription: row.shortDescription,
    startingPrice: Number(row.startingPrice),
    age: row.age,
    ethnicity: row.ethnicity,
    hairColor: row.hairColor,
    services: row.services,
    status: row.availabilityStatus,
    adTier: row.adTier,
    images: media.images,
    profileImage: media.profileImage,
    profileImageIndex: media.profileImageIndex,
    rating: Number(row.rating),
    reviewsCount: row.reviewsCount,
    profileViews: row.profileViews,
  };
}
