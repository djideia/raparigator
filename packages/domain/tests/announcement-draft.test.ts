import { describe, expect, it } from "vitest";
import {
  buildInitialState,
  calculateProfileScore,
  draftStartingPrice,
  draftToPricingTable,
  getMissingCharacteristics,
  getPublishBlockingItems,
  getPublishValidationErrors,
  isHairSelectionComplete,
  validateSectionForSave,
} from "../src/announcement-draft";

const preview = {
  slug: "luna",
  displayName: "Luna",
  artisticName: "Luna Velvet",
  city: "Sao Paulo",
  state: "SP",
  startingPrice: 450,
  images: ["a", "b", "c"],
  rating: 4.9,
  reviewsCount: 10,
  profileViews: 100,
  status: "livre",
  pricingTable: [
    { label: "1 hora", price: 450 },
    { label: "30 min", price: 250 },
  ],
};

function completeDraft() {
  const state = buildInitialState(preview);
  return {
    ...state,
    characteristics: {
      ...state.characteristics,
      gender: "Mulher",
      ethnicity: "Branca",
      height: "170",
      weight: "60",
      hairColor: "Liso::Castanho",
      smoker: "Não",
    },
    shortDescription: "Curta",
    description: "Uma descrição longa o bastante",
    services: state.services.map((s, index) => ({ ...s, selected: index === 0 })),
  };
}

describe("rascunho de anúncio", () => {
  it("estado inicial reflete a tabela de preço do anúncio", () => {
    const state = buildInitialState(preview);
    expect(state.pricing.find((p) => p.label === "1 hora")?.price).toBe("30000");
    expect(state.pricing.find((p) => p.label === "30 min")).toMatchObject({
      price: "25000",
      disabled: false,
    });
    expect(state.locationAddresses).toHaveLength(1);
    expect(state.paymentMethods).toEqual(["dinheiro"]);
  });

  it("cabelo só está completo com tipo e cor", () => {
    expect(isHairSelectionComplete("Selecionar")).toBe(false);
    expect(isHairSelectionComplete("Liso::Selecionar")).toBe(false);
    expect(isHairSelectionComplete("Liso::Castanho")).toBe(true);
    expect(isHairSelectionComplete("Castanho")).toBe(true);
  });

  it("aponta as características obrigatórias faltando", () => {
    const state = buildInitialState(preview);
    expect(getMissingCharacteristics(state.characteristics)).toEqual([
      "gender",
      "ethnicity",
      "height",
      "weight",
      "hairColor",
      "smoker",
    ]);
    expect(validateSectionForSave("characteristics", state)).toMatchObject({
      ok: false,
      reason: "characteristics",
    });
    expect(validateSectionForSave("characteristics", completeDraft())).toBeNull();
    expect(validateSectionForSave("pricing", { ...state, paymentMethods: [] })).toMatchObject({
      reason: "pricing",
    });
  });

  it("publicação exige características, preço, pagamento e localização", () => {
    const state = buildInitialState(preview);
    expect(getPublishValidationErrors(state)).toHaveLength(1);
    expect(getPublishValidationErrors(completeDraft())).toEqual([]);
    expect(getPublishBlockingItems(state, ["pricing"])).toEqual([
      { kind: "required", section: "characteristics", label: "Características físicas" },
      { kind: "unsaved", section: "pricing", label: "Tabela de preços" },
    ]);
  });

  it("score chega a 100 só com tudo preenchido e não passa disso", () => {
    const state = buildInitialState(preview);
    expect(calculateProfileScore(state).percentage).toBeLessThan(100);
    const full = {
      ...completeDraft(),
      showAvailability: true,
    };
    const score = calculateProfileScore(full);
    expect(score.percentage).toBe(100);
  });

  it("deriva tabela e preço inicial da máscara de moeda", () => {
    const state = buildInitialState(preview);
    expect(draftToPricingTable(state)).toEqual([
      { label: "1 hora", price: 300 },
      { label: "30 min", price: 250 },
    ]);
    expect(draftStartingPrice(state)).toBe(250);
  });
});
