import type { EncounterBrief, ProfessionalAd, SimulationSelection } from "@sigillus/contracts";
import { formatCurrencyBRL } from "./format";

export const ENCOUNTER_EXTRA_PRICE = 150;
export const ENCOUNTER_DEFAULT_DURATION = "1 hora";
export const ENCOUNTER_SIMULATOR_ANCHOR = "simulador-de-encontro";
export const ENCOUNTER_FALLBACK_ORIGIN = "https://sigillus.app";

export type EncounterEstimate = {
  duration: string;
  basePrice: number;
  extras: string[];
  extrasCost: number;
  total: number;
};

type EstimableAd = Pick<ProfessionalAd, "pricingTable" | "startingPrice" | "services">;

export function resolveDefaultDuration(ad: Pick<ProfessionalAd, "pricingTable"> | undefined) {
  return (
    ad?.pricingTable?.find((plan) => plan.label.toLowerCase().includes(ENCOUNTER_DEFAULT_DURATION))
      ?.label ??
    ad?.pricingTable?.[0]?.label ??
    ENCOUNTER_DEFAULT_DURATION
  );
}

export function estimateEncounter(
  ad: EstimableAd,
  selection: SimulationSelection,
): EncounterEstimate {
  const option = ad.pricingTable.find((item) => item.label === selection.duration);
  const basePrice = option ? option.price : ad.startingPrice;
  const extras = selection.extras.filter((extra) => ad.services.includes(extra));
  const extrasCost = extras.length * ENCOUNTER_EXTRA_PRICE;
  return {
    duration: selection.duration,
    basePrice,
    extras,
    extrasCost,
    total: basePrice + extrasCost,
  };
}

export function buildEncounterBrief(
  ad: Pick<ProfessionalAd, "slug" | "artisticName">,
  duration: string,
  extras: string[],
  basePrice: number,
  extrasCost: number,
  total: number,
): EncounterBrief {
  return {
    adSlug: ad.slug,
    artisticName: ad.artisticName,
    duration,
    basePrice,
    extras: [...extras],
    extrasCost,
    total,
  };
}

export function buildEncounterBriefFromSelection(
  ad: EstimableAd & Pick<ProfessionalAd, "slug" | "artisticName">,
  selection: SimulationSelection,
): EncounterBrief {
  const estimate = estimateEncounter(ad, selection);
  return buildEncounterBrief(
    ad,
    estimate.duration,
    estimate.extras,
    estimate.basePrice,
    estimate.extrasCost,
    estimate.total,
  );
}

export function encodeBriefParams(selection: SimulationSelection): URLSearchParams {
  const params = new URLSearchParams();
  params.set("d", selection.duration);
  if (selection.extras.length > 0) {
    params.set("e", selection.extras.join("|"));
  }
  return params;
}

export function decodeBriefSelection(
  search: string,
  ad: Pick<ProfessionalAd, "pricingTable" | "services">,
): SimulationSelection | null {
  const params = new URLSearchParams(search);
  const rawDuration = params.get("d");
  const rawExtras = params.get("e");

  if (!rawDuration && !rawExtras) {
    return null;
  }

  const duration = ad.pricingTable.find((plan) => plan.label === rawDuration)?.label;
  const extras = (rawExtras ? rawExtras.split("|") : []).filter((extra) =>
    ad.services.includes(extra),
  );

  if (!duration && extras.length === 0) {
    return null;
  }

  return {
    duration: duration ?? ad.pricingTable[0]?.label ?? "",
    extras,
  };
}

export function getSimulationUrl(brief: EncounterBrief, origin: string): string {
  const params = encodeBriefParams({ duration: brief.duration, extras: brief.extras });
  return `${origin}/p/${brief.adSlug}?${params.toString()}`;
}

export function buildBriefMessageText(brief: EncounterBrief, origin: string): string {
  const lines = [
    `Olá, ${brief.artisticName}! ✨`,
    "",
    "Vi seu anúncio na Sigillus e me interessei pela sua apresentação.",
    "",
    "📋 *O que tenho em mente:*",
    `⏳ Duração: ${brief.duration}`,
  ];

  if (brief.extras.length > 0) {
    lines.push(`➕ Adicionais: ${brief.extras.join(", ")}`);
  }

  lines.push(
    `💰 Estimativa: ${formatCurrencyBRL(brief.total)}`,
    "",
    `🔗 Simulação completa: ${getSimulationUrl(brief, origin)}`,
    "",
    "Podemos conversar sobre disponibilidade e como você prefere combinar? 🙏",
  );

  return lines.join("\n");
}

export function buildBriefGreeting(brief: EncounterBrief): string {
  return `Olá, ${brief.artisticName}! Vi seu anúncio e montei uma simulação de encontro. Dá uma olhada no que tenho em mente e me diz se funciona pra você. ✨`;
}
