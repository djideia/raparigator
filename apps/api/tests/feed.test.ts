import { describe, expect, it } from "vitest";
import { createFeedFiltersCriteria } from "@sigillus/domain";
import { seedDevData } from "../src/db/seed/dev-data";
import { seedDevUsers } from "../src/db/seed/users";
import { createTestHarness } from "./helpers/app";

const harness = createTestHarness();

type FeedResult = {
  items: Array<{ slug: string; adTier: string; city: string; startingPrice: number }>;
  total: number;
  page: number;
  pageSize: number;
};

async function feed(criteria = createFeedFiltersCriteria(), extra: Record<string, unknown> = {}) {
  const result = await harness.rpc<FeedResult>("feed/list", { criteria, ...extra });
  expect(result.status).toBe(200);
  return result.body;
}

describe("feed, catálogos e anúncio público", () => {
  it("catálogos vêm do banco semeado", async () => {
    const result = await harness.rpc<{ services: string[]; locations: unknown[] }>("catalogs/get");
    expect(result.status).toBe(200);
    expect(result.body.services).toContain("Jantar");
    expect(result.body.locations.length).toBeGreaterThan(5);
  });

  it("lista só perfis publicados, ativos e não suspensos, premium primeiro", async () => {
    await seedDevUsers(harness.db);
    await seedDevData(harness.db);
    const all = await feed();
    expect(all.total).toBeGreaterThan(5);
    const tiers = all.items.map((item) => item.adTier);
    const firstStandard = tiers.indexOf("normal");
    const lastPremium = tiers.lastIndexOf("premium");
    expect(lastPremium).toBeLessThan(firstStandard === -1 ? Infinity : firstStandard);
  });

  it("aplica filtros no servidor: cidade, preço, tier, cabelo e serviço", async () => {
    await seedDevUsers(harness.db);
    await seedDevData(harness.db);
    const all = await feed();
    const bySp = await feed(createFeedFiltersCriteria({ selectedCity: "Sao Paulo" }));
    expect(bySp.total).toBeLessThan(all.total);
    expect(bySp.items.every((item) => item.city === "Sao Paulo")).toBe(true);

    const cheap = await feed(createFeedFiltersCriteria({ maxPrice: 300 }));
    expect(cheap.items.every((item) => item.startingPrice <= 300)).toBe(true);

    const premium = await feed(createFeedFiltersCriteria({ adTiers: ["premium"] }));
    expect(premium.items.every((item) => item.adTier === "premium")).toBe(true);

    const morenas = await feed(createFeedFiltersCriteria({ hairs: ["Morena"] }));
    expect(morenas.total).toBeGreaterThan(0);
    expect(morenas.total).toBeLessThan(all.total);

    const jantares = await feed(createFeedFiltersCriteria({ services: ["Jantares e eventos"] }));
    expect(jantares.total).toBeGreaterThan(0);

    const none = await feed(createFeedFiltersCriteria({ selectedCity: "Lua" }));
    expect(none.total).toBe(0);
  });

  it("pagina com teto de 100 e rejeita acima", async () => {
    await seedDevUsers(harness.db);
    await seedDevData(harness.db);
    const page = await feed(createFeedFiltersCriteria(), { pagination: { page: 1, pageSize: 3 } });
    expect(page.items).toHaveLength(3);
    expect(page.pageSize).toBe(3);
    const tooBig = await harness.rpc("feed/list", {
      criteria: createFeedFiltersCriteria(),
      pagination: { page: 1, pageSize: 101 },
    });
    expect(tooBig.status).toBe(400);
  });

  it("anúncio público por slug e contagem de views", async () => {
    await seedDevUsers(harness.db);
    await seedDevData(harness.db);
    const before = await harness.rpc<{ profileViews: number; slug: string }>("ads/getBySlug", {
      slug: "luna-velvet-sao-paulo",
    });
    expect(before.body.slug).toBe("luna-velvet-sao-paulo");
    await harness.rpc("ads/registerView", { slug: "luna-velvet-sao-paulo" });
    const after = await harness.rpc<{ profileViews: number }>("ads/getBySlug", {
      slug: "luna-velvet-sao-paulo",
    });
    expect(after.body.profileViews).toBe(before.body.profileViews + 1);
    const missing = await harness.rpc<null>("ads/getBySlug", { slug: "nao-existe" });
    expect(missing.body).toBeNull();
  });
});
