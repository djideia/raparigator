import { describe, expect, it } from "vitest";
import {
  ENCOUNTER_EXTRA_PRICE,
  buildBriefMessageText,
  buildEncounterBriefFromSelection,
  decodeBriefSelection,
  encodeBriefParams,
  estimateEncounter,
} from "../src/encounter-brief";

const ad = {
  slug: "luna-velvet-sao-paulo",
  artisticName: "Luna Velvet",
  startingPrice: 450,
  services: ["Jantar", "Companhia"],
  pricingTable: [
    { label: "1 hora", price: 450 },
    { label: "2 horas", price: 800 },
  ],
};

describe("simulador de encontro", () => {
  it("estima a partir da tabela do anúncio e ignora extra inexistente", () => {
    expect(estimateEncounter(ad, { duration: "2 horas", extras: ["Jantar", "Foguete"] })).toEqual({
      duration: "2 horas",
      basePrice: 800,
      extras: ["Jantar"],
      extrasCost: ENCOUNTER_EXTRA_PRICE,
      total: 800 + ENCOUNTER_EXTRA_PRICE,
    });
  });

  it("cai no preço inicial quando a duração não existe", () => {
    expect(estimateEncounter(ad, { duration: "Pernoite", extras: [] }).basePrice).toBe(450);
  });

  it("codifica e decodifica a seleção pela URL", () => {
    const params = encodeBriefParams({ duration: "1 hora", extras: ["Jantar", "Companhia"] });
    expect(decodeBriefSelection(`?${params}`, ad)).toEqual({
      duration: "1 hora",
      extras: ["Jantar", "Companhia"],
    });
    expect(decodeBriefSelection("?d=Inexistente", ad)).toBeNull();
    expect(decodeBriefSelection("", ad)).toBeNull();
  });

  it("monta o texto com estimativa e link, sem tocar em window", () => {
    const brief = buildEncounterBriefFromSelection(ad, { duration: "1 hora", extras: ["Jantar"] });
    const text = buildBriefMessageText(brief, "https://sigillus.app");
    expect(text).toContain("Duração: 1 hora");
    expect(text).toContain("Adicionais: Jantar");
    expect(text).toContain("https://sigillus.app/p/luna-velvet-sao-paulo?d=1+hora&e=Jantar");
    expect(text).toContain("600,00");
  });
});
