import { sql } from "drizzle-orm";
import {
  CATALOG_CATEGORIES,
  CATALOG_ETHNICITIES,
  CATALOG_FETISHES,
  CATALOG_GENDERS,
  CATALOG_HAIR_COLORS,
  CATALOG_HAIR_TYPES,
  CATALOG_LOCATIONS,
  CATALOG_PAYMENT_METHODS,
  CATALOG_SERVICES,
  CATALOG_STATES,
} from "@sigillus/domain";
import type { Database } from "../client";
import { catalogCities, catalogItems } from "../schema";

type CatalogKind = (typeof catalogItems.$inferInsert)["kind"];

function idFor(kind: string, label: string) {
  return `${kind}:${label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")}`;
}

export async function seedCatalogs(db: Database) {
  const groups: Array<[CatalogKind, string[]]> = [
    ["service", CATALOG_SERVICES],
    ["fetish", CATALOG_FETISHES],
    ["ethnicity", CATALOG_ETHNICITIES],
    ["hair_color", CATALOG_HAIR_COLORS],
    ["hair_type", CATALOG_HAIR_TYPES],
    ["payment_method", CATALOG_PAYMENT_METHODS],
    ["category", CATALOG_CATEGORIES],
    ["state", CATALOG_STATES],
    ["gender", CATALOG_GENDERS],
  ];

  const rows = groups.flatMap(([kind, labels]) =>
    labels.map((label, position) => ({ id: idFor(kind, label), kind, label, position })),
  );

  await db
    .insert(catalogItems)
    .values(rows)
    .onConflictDoUpdate({
      target: [catalogItems.kind, catalogItems.label],
      set: { position: sql`excluded.position`, active: true },
    });

  await db
    .insert(catalogCities)
    .values(
      CATALOG_LOCATIONS.map((location, position) => ({
        id: idFor("city", `${location.city}-${location.state}`),
        city: location.city,
        state: location.state,
        position,
      })),
    )
    .onConflictDoUpdate({
      target: [catalogCities.city, catalogCities.state],
      set: { position: sql`excluded.position`, active: true },
    });
}
