import {
  ENCOUNTER_FALLBACK_ORIGIN,
  ENCOUNTER_SIMULATOR_ANCHOR,
  buildBriefMessageText as buildBriefMessageTextWithOrigin,
  getSimulationUrl as getSimulationUrlWithOrigin,
} from "@sigillus/domain";
import type { EncounterBrief, SimulationSelection } from "@sigillus/contracts";

export {
  ENCOUNTER_SIMULATOR_ANCHOR,
  buildBriefGreeting,
  buildEncounterBrief,
  decodeBriefSelection,
  encodeBriefParams,
} from "@sigillus/domain";

const SIMULATION_DRAFT_KEY = "sigillus-sim-draft";

/** Afasta a âncora do cabeçalho fixo (4rem no mobile, 5rem no desktop) */
export const ENCOUNTER_SIMULATOR_SCROLL_MARGIN =
  "scroll-mt-[calc(4.75rem+env(safe-area-inset-top,0px))] md:scroll-mt-[calc(5.75rem+env(safe-area-inset-top,0px))]";

export function getAdEditHref(adSlug: string): string {
  return `/anuncio/${adSlug}#${ENCOUNTER_SIMULATOR_ANCHOR}`;
}

function currentOrigin(): string {
  return typeof window === "undefined" ? ENCOUNTER_FALLBACK_ORIGIN : window.location.origin;
}

export function getSimulationUrl(brief: EncounterBrief): string {
  return getSimulationUrlWithOrigin(brief, currentOrigin());
}

export function buildBriefMessageText(brief: EncounterBrief): string {
  return buildBriefMessageTextWithOrigin(brief, currentOrigin());
}

function readSessionJson<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeSessionJson(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

export interface BriefHandoff {
  brief: EncounterBrief;
  conversationId: string;
}

/**
 * Entrega do briefing do anúncio para o chat. É um store em memória, e não um
 * parâmetro na URL, porque `TabsKeepAlive` mantém a aba do chat montada: uma tela
 * que já está viva não roda efeito de montagem nem observa a query de novo.
 */
let handoff: BriefHandoff | null = null;
const handoffListeners = new Set<() => void>();

function emitHandoff() {
  handoffListeners.forEach((listener) => listener());
}

export function subscribeBriefHandoff(listener: () => void) {
  handoffListeners.add(listener);
  return () => {
    handoffListeners.delete(listener);
  };
}

export function getBriefHandoff(): BriefHandoff | null {
  return handoff;
}

export function getServerBriefHandoff(): BriefHandoff | null {
  return null;
}

export function requestBriefHandoff(brief: EncounterBrief, conversationId: string) {
  handoff = { brief: { ...brief, extras: [...brief.extras] }, conversationId };
  emitHandoff();
}

export function clearBriefHandoff() {
  if (!handoff) {
    return;
  }
  handoff = null;
  emitHandoff();
}

export function saveSimulationDraft(slug: string, selection: SimulationSelection) {
  const drafts = readSessionJson<Record<string, SimulationSelection>>(SIMULATION_DRAFT_KEY) ?? {};
  writeSessionJson(SIMULATION_DRAFT_KEY, { ...drafts, [slug]: selection });
}

export function readSimulationDraft(slug: string): SimulationSelection | null {
  const drafts = readSessionJson<Record<string, SimulationSelection>>(SIMULATION_DRAFT_KEY);
  const draft = drafts?.[slug];
  if (!draft || typeof draft.duration !== "string" || !Array.isArray(draft.extras)) {
    return null;
  }
  return draft;
}
