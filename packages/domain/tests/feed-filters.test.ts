import { describe, expect, it } from "vitest";
import {
  createFeedFiltersCriteria,
  feedRelevanceScore,
  filterAds,
  matchesFeedCriteria,
  partitionFeedAds,
  toggleFeedAdType,
  toggleFeedQuickFilter,
} from "../src/feed-filters";

const base = {
  city: "Sao Paulo",
  startingPrice: 400,
  category: "Feminino",
  adTier: "normal" as const,
  status: "livre" as const,
  services: ["Jantar", "Atendimento em hotel"],
  ethnicity: "Branca",
  hairColor: "Castanho",
  rating: 4.5,
  profileViews: 1000,
};

describe("filtros do feed", () => {
  it("critério vazio aceita tudo", () => {
    expect(matchesFeedCriteria(base, createFeedFiltersCriteria())).toBe(true);
  });

  it("filtra por cidade, preço e gênero", () => {
    expect(matchesFeedCriteria(base, createFeedFiltersCriteria({ selectedCity: "Santos" }))).toBe(
      false,
    );
    expect(matchesFeedCriteria(base, createFeedFiltersCriteria({ maxPrice: 399 }))).toBe(false);
    expect(matchesFeedCriteria(base, createFeedFiltersCriteria({ selectedGender: "Homem" }))).toBe(
      false,
    );
    expect(matchesFeedCriteria(base, createFeedFiltersCriteria({ selectedGender: "Mulher" }))).toBe(
      true,
    );
  });

  it("casa etnia, cabelo e serviço com sinônimos e sem acento", () => {
    expect(
      matchesFeedCriteria(base, createFeedFiltersCriteria({ ethnicities: ["Caucasiana"] })),
    ).toBe(true);
    expect(matchesFeedCriteria(base, createFeedFiltersCriteria({ hairs: ["Morena"] }))).toBe(true);
    expect(matchesFeedCriteria(base, createFeedFiltersCriteria({ hairs: ["Loira"] }))).toBe(false);
    expect(
      matchesFeedCriteria(base, createFeedFiltersCriteria({ services: ["Jantares e eventos"] })),
    ).toBe(true);
    expect(matchesFeedCriteria(base, createFeedFiltersCriteria({ services: ["Viagem"] }))).toBe(
      false,
    );
  });

  it("filtros rápidos: livre agora e com local", () => {
    const busy = { ...base, status: "em_atendimento" as const };
    expect(
      matchesFeedCriteria(busy, createFeedFiltersCriteria({ quickFilters: ["Livre Agora"] })),
    ).toBe(false);
    expect(
      matchesFeedCriteria(base, createFeedFiltersCriteria({ quickFilters: ["Com local"] })),
    ).toBe(true);
    expect(
      matchesFeedCriteria(
        { ...base, services: ["Jantar"] },
        createFeedFiltersCriteria({ quickFilters: ["Com local"] }),
      ),
    ).toBe(false);
  });

  it("toggle é idempotente em dois cliques", () => {
    const once = toggleFeedQuickFilter(createFeedFiltersCriteria(), "Premium");
    expect(once.adTiers).toEqual(["premium"]);
    expect(toggleFeedQuickFilter(once, "Premium").adTiers).toEqual([]);
    expect(toggleFeedAdType(once, "Comum").adTiers).toEqual(["premium", "normal"]);
  });

  it("particiona e ordena premium com multiplicador", () => {
    const premium = { ...base, adTier: "premium" as const };
    const { premium: p, standard: s } = partitionFeedAds(
      filterAds([base, premium], createFeedFiltersCriteria()),
    );
    expect(p).toHaveLength(1);
    expect(s).toHaveLength(1);
    expect(feedRelevanceScore(premium, 1.6)).toBeGreaterThan(feedRelevanceScore(base, 1.6));
    expect(feedRelevanceScore(premium, 1)).toBe(feedRelevanceScore(base, 1));
  });
});
