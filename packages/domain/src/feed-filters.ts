import type {
  FeedAdTypeLabel,
  FeedFiltersCriteria,
  FeedQuickFilterLabel,
  FeedSelectionField,
  ProfessionalAd,
} from "@sigillus/contracts";
import { normalizeText } from "./format";

export type FeedFilterableAd = Pick<
  ProfessionalAd,
  | "city"
  | "startingPrice"
  | "category"
  | "adTier"
  | "status"
  | "services"
  | "ethnicity"
  | "hairColor"
>;

export const FEED_QUICK_FILTER_LABELS: FeedQuickFilterLabel[] = [
  "Premium",
  "Livre Agora",
  "Com local",
];
export const FEED_DEFAULT_LOCATION_LABEL = "São Paulo, SP";
export const FEED_DEFAULT_GENDER = "Todas";
export const FEED_DEFAULT_MAX_PRICE = 1500;
export const FEED_CATEGORY_BY_GENDER: Record<string, string> = {
  Todas: "",
  Mulher: "Feminino",
  Homem: "Masculino",
  Trans: "Trans",
  Casal: "Casais",
};

export const normalizeFeedText = normalizeText;

function toggleInArray<T>(items: T[], value: T): T[] {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

export function createFeedFiltersCriteria(
  partial: Partial<FeedFiltersCriteria> = {},
): FeedFiltersCriteria {
  return {
    selectedCity: partial.selectedCity ?? "all",
    selectedGender: partial.selectedGender ?? FEED_DEFAULT_GENDER,
    maxPrice: partial.maxPrice ?? FEED_DEFAULT_MAX_PRICE,
    adTiers: partial.adTiers ? [...partial.adTiers] : [],
    quickFilters: partial.quickFilters ? [...partial.quickFilters] : [],
    ethnicities: partial.ethnicities ? [...partial.ethnicities] : [],
    hairs: partial.hairs ? [...partial.hairs] : [],
    services: partial.services ? [...partial.services] : [],
  };
}

export function clearFeedFilters(): FeedFiltersCriteria {
  return createFeedFiltersCriteria();
}

export function toggleFeedQuickFilter(
  criteria: FeedFiltersCriteria,
  label: FeedQuickFilterLabel,
): FeedFiltersCriteria {
  if (label === "Premium") {
    return {
      ...criteria,
      adTiers: toggleInArray(criteria.adTiers, "premium"),
    };
  }

  return {
    ...criteria,
    quickFilters: toggleInArray(criteria.quickFilters, label),
  };
}

export function toggleFeedAdType(
  criteria: FeedFiltersCriteria,
  label: FeedAdTypeLabel,
): FeedFiltersCriteria {
  switch (label) {
    case "Premium":
      return {
        ...criteria,
        adTiers: toggleInArray(criteria.adTiers, "premium"),
      };
    case "Comum":
      return {
        ...criteria,
        adTiers: toggleInArray(criteria.adTiers, "normal"),
      };
    default: {
      const _exhaustive: never = label;
      return _exhaustive;
    }
  }
}

export function toggleFeedSelection(
  criteria: FeedFiltersCriteria,
  field: FeedSelectionField,
  value: string,
): FeedFiltersCriteria {
  return {
    ...criteria,
    [field]: toggleInArray(criteria[field], value),
  };
}

export function withFeedGender(
  criteria: FeedFiltersCriteria,
  selectedGender: string,
): FeedFiltersCriteria {
  return { ...criteria, selectedGender };
}

export function withFeedMaxPrice(
  criteria: FeedFiltersCriteria,
  maxPrice: number,
): FeedFiltersCriteria {
  return { ...criteria, maxPrice };
}

export function withFeedCity(
  criteria: FeedFiltersCriteria,
  selectedCity: string,
): FeedFiltersCriteria {
  return { ...criteria, selectedCity };
}

export function isFeedPremiumSelected(criteria: FeedFiltersCriteria): boolean {
  return criteria.adTiers.includes("premium");
}

export const FEED_ETHNICITY_SYNONYMS: Record<string, string[]> = {
  caucasiana: ["branca", "cauc"],
  negra: ["negra", "preta"],
  asiatica: ["asiat"],
  latina: ["latin", "parda"],
};

export const FEED_HAIR_SYNONYMS: Record<string, string[]> = {
  loira: ["loiro", "loira"],
  morena: ["castanho", "moreno", "preto"],
  ruiva: ["ruiv"],
};

export const FEED_SERVICE_SYNONYMS: Array<{ when: string; terms: string[] }> = [
  { when: "jantares", terms: ["jantar", "evento"] },
  { when: "viagem", terms: ["viagem", "tour"] },
];

export const FEED_LOCAL_SERVICE_TERMS = ["hotel", "local"];

export function feedEthnicityTerms(selected: string): string[] {
  const normalized = normalizeText(selected);
  return FEED_ETHNICITY_SYNONYMS[normalized] ?? [normalized];
}

export function feedHairTerms(selected: string): string[] {
  const normalized = normalizeText(selected);
  return FEED_HAIR_SYNONYMS[normalized] ?? [normalized];
}

export function feedServiceTerms(selected: string): string[] {
  const normalized = normalizeText(selected);
  const synonym = FEED_SERVICE_SYNONYMS.find((entry) => normalized.includes(entry.when));
  return synonym ? synonym.terms : [normalized];
}

function includesAnyTerm(value: string, terms: string[]): boolean {
  const normalized = normalizeText(value);
  return terms.some((term) => normalized.includes(term));
}

export function matchesFeedEthnicity(adEthnicity: string, selected: string): boolean {
  return includesAnyTerm(adEthnicity, feedEthnicityTerms(selected));
}

export function matchesFeedHair(adHairColor: string, selected: string): boolean {
  return includesAnyTerm(adHairColor, feedHairTerms(selected));
}

export function matchesFeedService(adServices: string[], selected: string): boolean {
  const terms = feedServiceTerms(selected);
  return adServices.some((adService) => includesAnyTerm(adService, terms));
}

export function hasFeedLocalService(adServices: string[]): boolean {
  return adServices.some((service) => includesAnyTerm(service, FEED_LOCAL_SERVICE_TERMS));
}

export function matchesFeedCriteria(ad: FeedFilterableAd, criteria: FeedFiltersCriteria): boolean {
  const cityMatch = criteria.selectedCity === "all" || ad.city === criteria.selectedCity;
  const priceMatch = ad.startingPrice <= criteria.maxPrice;
  const selectedCategory = FEED_CATEGORY_BY_GENDER[criteria.selectedGender];
  const categoryMatch =
    criteria.selectedGender === FEED_DEFAULT_GENDER || ad.category === selectedCategory;

  const adTypeMatch = criteria.adTiers.length === 0 || criteria.adTiers.includes(ad.adTier);

  const quickStatusMatch = !criteria.quickFilters.includes("Livre Agora") || ad.status === "livre";
  const quickLocalMatch =
    !criteria.quickFilters.includes("Com local") || hasFeedLocalService(ad.services);

  const ethnicityMatch =
    criteria.ethnicities.length === 0 ||
    criteria.ethnicities.some((ethnicity) => matchesFeedEthnicity(ad.ethnicity, ethnicity));

  const hairMatch =
    criteria.hairs.length === 0 ||
    criteria.hairs.some((hair) => matchesFeedHair(ad.hairColor, hair));

  const serviceMatch =
    criteria.services.length === 0 ||
    criteria.services.some((service) => matchesFeedService(ad.services, service));

  return (
    cityMatch &&
    priceMatch &&
    categoryMatch &&
    adTypeMatch &&
    quickStatusMatch &&
    quickLocalMatch &&
    ethnicityMatch &&
    hairMatch &&
    serviceMatch
  );
}

export function filterAds<T extends FeedFilterableAd>(
  ads: T[],
  criteria: FeedFiltersCriteria,
): T[] {
  return ads.filter((ad) => matchesFeedCriteria(ad, criteria));
}

export function partitionFeedAds<T extends Pick<ProfessionalAd, "adTier">>(
  ads: T[],
): {
  premium: T[];
  standard: T[];
} {
  return {
    premium: ads.filter((ad) => ad.adTier === "premium"),
    standard: ads.filter((ad) => ad.adTier === "normal"),
  };
}

export function serializeFeedFiltersCriteria(criteria: FeedFiltersCriteria): string {
  return JSON.stringify({
    selectedCity: criteria.selectedCity,
    selectedGender: criteria.selectedGender,
    maxPrice: criteria.maxPrice,
    adTiers: criteria.adTiers,
    quickFilters: criteria.quickFilters,
    ethnicities: criteria.ethnicities,
    hairs: criteria.hairs,
    services: criteria.services,
  });
}

export function feedRelevanceScore(
  ad: Pick<ProfessionalAd, "adTier" | "rating" | "profileViews">,
  visibilityMultiplier: number,
): number {
  const base = ad.rating * 100 + Math.log10(Math.max(ad.profileViews, 1)) * 10;
  return ad.adTier === "premium" ? base * visibilityMultiplier : base;
}
