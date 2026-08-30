import { asc, eq } from "drizzle-orm";
import type { Catalogs } from "@sigillus/contracts";
import { CATALOG_CITIES } from "@sigillus/domain";
import type { Database } from "../../db/client";
import { catalogCities, catalogItems } from "../../db/schema";

export type CatalogsService = ReturnType<typeof createCatalogsService>;

export function createCatalogsService(db: Database) {
  return {
    async get(): Promise<Catalogs> {
      const [items, cities] = await Promise.all([
        db
          .select({ kind: catalogItems.kind, label: catalogItems.label })
          .from(catalogItems)
          .where(eq(catalogItems.active, true))
          .orderBy(asc(catalogItems.kind), asc(catalogItems.position)),
        db
          .select({ city: catalogCities.city, state: catalogCities.state })
          .from(catalogCities)
          .where(eq(catalogCities.active, true))
          .orderBy(asc(catalogCities.position)),
      ]);
      const byKind = (kind: (typeof items)[number]["kind"]) =>
        items.filter((item) => item.kind === kind).map((item) => item.label);
      return {
        states: byKind("state"),
        cities: CATALOG_CITIES,
        locations: cities,
        categories: byKind("category"),
        services: byKind("service"),
        fetishes: byKind("fetish"),
        ethnicities: byKind("ethnicity"),
        hairColors: byKind("hair_color"),
        hairTypes: byKind("hair_type"),
        paymentMethods: byKind("payment_method"),
      };
    },
  };
}
