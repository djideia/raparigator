import type {
  AnnouncementDraftState,
  AnnouncementListingStatus,
  AnnouncementPublishResult,
  AnnouncementSaveSectionResult,
  AnnouncementSectionKey,
  AvailabilityStatus,
} from "@sigillus/contracts";
import {
  ANNOUNCEMENT_PUBLISH_BLOCKED_MESSAGE,
  FEED_CATEGORY_BY_GENDER,
  calculateProfileScore,
  draftSelectedServices,
  draftStartingPrice,
  draftToPricingTable,
  generateSmartTips,
  getPublishBlockingItems,
  isSelectUnselected,
  normalizeText,
  sanitizeNumericInput,
  validateSectionForSave,
} from "@sigillus/domain";
import type { Database } from "../../db/client";
import { adminActivityLogs, professionalProfiles } from "../../db/schema";
import { newId } from "../../lib/ids";
import type { Logger } from "../../lib/logger";
import { toProfessionalAd } from "../profiles/mapper";
import type { ProfileRepository } from "../profiles/repository";

export type AnnouncementsServiceDeps = {
  db: Database;
  profiles: ProfileRepository;
  logger: Logger;
};

export type AnnouncementsService = ReturnType<typeof createAnnouncementsService>;

export type AnnouncementOwner = { id: string; name: string };

type ProfileValues = Partial<typeof professionalProfiles.$inferInsert>;

const HAIR_SEPARATOR = "::";
const ALL_SECTIONS: AnnouncementSectionKey[] = [
  "characteristics",
  "pricing",
  "location",
  "description",
  "services",
  "availability",
];

function slugify(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function optionalSelect(value: string): string | null {
  return isSelectUnselected(value) ? null : value.trim();
}

function splitHair(value: string): { hairType: string | null; hairColor: string | null } {
  if (isSelectUnselected(value)) {
    return { hairType: null, hairColor: null };
  }
  if (!value.includes(HAIR_SEPARATOR)) {
    return { hairType: null, hairColor: value.trim() };
  }
  const [type = "", color = ""] = value.split(HAIR_SEPARATOR);
  return { hairType: optionalSelect(type), hairColor: optionalSelect(color) };
}

export function draftSectionToProfileValues(
  section: AnnouncementSectionKey,
  draft: AnnouncementDraftState,
): ProfileValues {
  switch (section) {
    case "description":
      return { shortDescription: draft.shortDescription, description: draft.description };
    case "location": {
      const values: ProfileValues = {};
      const city = draft.locationCity.trim();
      const state = draft.locationState.trim();
      if (city) {
        values.city = city;
      }
      if (state) {
        values.state = state;
      }
      const activeAddress = draft.locationAddresses.find((address) => address.active);
      const neighborhood = activeAddress?.addressLine.trim();
      if (neighborhood) {
        values.neighborhood = neighborhood;
      }
      return values;
    }
    case "services": {
      const services = draftSelectedServices(draft);
      return services.length > 0 ? { services } : {};
    }
    case "pricing":
      return {
        pricingTable: draftToPricingTable(draft),
        startingPrice: draftStartingPrice(draft),
        paymentMethods: draft.paymentMethods,
      };
    case "characteristics": {
      const values: ProfileValues = {};
      const { characteristics } = draft;
      const ethnicity = optionalSelect(characteristics.ethnicity);
      if (ethnicity) {
        values.ethnicity = ethnicity;
      }
      const eyeColor = optionalSelect(characteristics.eyeColor);
      if (eyeColor) {
        values.eyeColor = eyeColor;
      }
      const hair = splitHair(characteristics.hairColor);
      if (hair.hairType) {
        values.hairType = hair.hairType;
      }
      if (hair.hairColor) {
        values.hairColor = hair.hairColor;
      }
      const height = Number(sanitizeNumericInput(characteristics.height));
      if (height > 0) {
        values.heightCm = height;
      }
      const weight = Number(sanitizeNumericInput(characteristics.weight));
      if (weight > 0) {
        values.weightKg = weight;
      }
      const gender = optionalSelect(characteristics.gender);
      const category = gender ? FEED_CATEGORY_BY_GENDER[gender] : undefined;
      if (category) {
        values.category = category;
      }
      return values;
    }
    case "availability":
      return {};
    default: {
      const exhaustive: never = section;
      return exhaustive;
    }
  }
}

export function draftToProfileValues(draft: AnnouncementDraftState): ProfileValues {
  return ALL_SECTIONS.reduce<ProfileValues>(
    (values, section) => ({ ...values, ...draftSectionToProfileValues(section, draft) }),
    {},
  );
}

export function createAnnouncementsService(deps: AnnouncementsServiceDeps) {
  const { db, profiles, logger } = deps;

  async function uniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || "perfil";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `${base}-${newId().slice(0, 6)}`;
      if (!(await profiles.findBySlug(candidate))) {
        return candidate;
      }
    }
    return `${base}-${newId()}`;
  }

  async function ensureProfile(owner: AnnouncementOwner) {
    const existing = await profiles.findByUserId(owner.id);
    if (existing) {
      return existing;
    }
    const created = await profiles.insert({
      id: newId(),
      userId: owner.id,
      slug: await uniqueSlug(owner.name),
      displayName: owner.name,
      verificationStatus: "pending_review",
      listingStatus: "Pausado",
    });
    logger.info({ profileId: created.id }, "perfil profissional criado");
    return created;
  }

  return {
    async getMine(owner: AnnouncementOwner) {
      const profile = await ensureProfile(owner);
      const images = await profiles.imagesFor([profile]);
      const ad = toProfessionalAd(
        profile,
        images.get(profile.id) ?? { images: profile.externalImages },
      );
      const draft = profile.draft ?? null;
      return {
        ad,
        draft,
        listingStatus: profile.listingStatus,
        score: draft ? calculateProfileScore(draft) : null,
        tips: draft ? generateSmartTips(draft) : [],
      };
    },

    async saveDraft(owner: AnnouncementOwner, draft: AnnouncementDraftState) {
      const profile = await ensureProfile(owner);
      const savedAt = new Date();
      await profiles.update(profile.id, { draft, draftSavedAt: savedAt });
      return { savedAt: savedAt.toISOString() };
    },

    async saveSection(
      owner: AnnouncementOwner,
      section: AnnouncementSectionKey,
      draft: AnnouncementDraftState,
    ): Promise<AnnouncementSaveSectionResult> {
      const profile = await ensureProfile(owner);
      const failure = validateSectionForSave(section, draft);
      if (failure) {
        return failure;
      }
      await profiles.update(profile.id, {
        draft,
        draftSavedAt: new Date(),
        ...draftSectionToProfileValues(section, draft),
      });
      return { ok: true, saveResult: "saved" };
    },

    async publish(
      owner: AnnouncementOwner,
      draft: AnnouncementDraftState,
    ): Promise<AnnouncementPublishResult> {
      const profile = await ensureProfile(owner);
      const items = getPublishBlockingItems(draft, []);
      if (items.length > 0) {
        return {
          ok: false,
          reason: "blocked",
          message: ANNOUNCEMENT_PUBLISH_BLOCKED_MESSAGE,
          items,
        };
      }
      const now = new Date();
      const values: ProfileValues = {
        draft,
        draftSavedAt: now,
        ...draftToProfileValues(draft),
        listingStatus: "Ativo",
      };
      const needsReview = profile.verificationStatus !== "published";
      if (needsReview) {
        values.verificationStatus = "pending_review";
        values.submittedAt = now;
        values.rejectionReason = null;
      }
      const updated = await profiles.update(profile.id, values);
      if (needsReview && updated) {
        await db.insert(adminActivityLogs).values({
          id: newId(),
          action: "profile_submitted",
          targetName: updated.artisticName || owner.name,
          targetId: updated.id,
        });
      }
      return { ok: true };
    },

    async setListingStatus(owner: AnnouncementOwner, status: AnnouncementListingStatus) {
      const profile = await ensureProfile(owner);
      await profiles.update(profile.id, { listingStatus: status });
      return { ok: true as const };
    },

    async setAvailability(owner: AnnouncementOwner, status: AvailabilityStatus) {
      const profile = await ensureProfile(owner);
      await profiles.update(profile.id, { availabilityStatus: status });
      return { ok: true as const };
    },

    async setContact(
      owner: AnnouncementOwner,
      contact: { whatsappNumber: string | null; telegramUsername: string | null },
    ) {
      const profile = await ensureProfile(owner);
      await profiles.update(profile.id, contact);
      return { ok: true as const };
    },
  };
}
