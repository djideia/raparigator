"use client";

import { useMemo, useSyncExternalStore } from "react";
import { pushNotification, removeNotification } from "@/lib/account-notifications";
import type { InviteStatus, ReviewInvite, SubmittedReview } from "@sigillus/contracts";
import { REVIEW_INVITE_TTL_MS, getInviteStatus } from "@sigillus/domain";

export type { InviteStatus, ReviewInvite, SubmittedReview };
export { getInviteDaysLeft, getInviteStatus, hasTwoWayConversation } from "@sigillus/domain";

const STORAGE_KEY = "sigillus-review-invites";

interface ReviewInvitesState {
  invites: ReviewInvite[];
  reviews: SubmittedReview[];
}

const EMPTY_STATE: ReviewInvitesState = { invites: [], reviews: [] };

const listeners = new Set<() => void>();

let cachedState: ReviewInvitesState | null = null;

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isInvite(value: unknown): value is ReviewInvite {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ReviewInvite>;
  return (
    typeof candidate.conversationId === "string" &&
    typeof candidate.adSlug === "string" &&
    typeof candidate.invitedAt === "string" &&
    typeof candidate.expiresAt === "string"
  );
}

function isSubmittedReview(value: unknown): value is SubmittedReview {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SubmittedReview>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.adSlug === "string" &&
    typeof candidate.conversationId === "string" &&
    typeof candidate.author === "string" &&
    typeof candidate.score === "number" &&
    typeof candidate.createdAt === "string"
  );
}

function readState(): ReviewInvitesState {
  if (typeof window === "undefined") {
    return EMPTY_STATE;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return EMPTY_STATE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ReviewInvitesState>;
    return {
      invites: Array.isArray(parsed.invites) ? parsed.invites.filter(isInvite) : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews.filter(isSubmittedReview) : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

function getSnapshot(): ReviewInvitesState {
  if (!cachedState) {
    cachedState = readState();
  }

  return cachedState;
}

function getServerSnapshot(): ReviewInvitesState {
  return EMPTY_STATE;
}

function writeState(next: ReviewInvitesState) {
  cachedState = next;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  emitChange();
}

function findInvite(state: ReviewInvitesState, conversationId: string) {
  return state.invites.find((invite) => invite.conversationId === conversationId);
}

/** Abre um convite de avaliação para a conversa. Reabrir um convite já usado não é possível. */
export function inviteToReview(conversationId: string, adSlug: string): boolean {
  const state = getSnapshot();
  const existing = findInvite(state, conversationId);

  if (existing?.usedAt) {
    return false;
  }

  const now = Date.now();
  const invite: ReviewInvite = {
    conversationId,
    adSlug,
    invitedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + REVIEW_INVITE_TTL_MS).toISOString(),
    usedAt: null,
  };

  writeState({
    ...state,
    invites: [...state.invites.filter((item) => item.conversationId !== conversationId), invite],
  });

  return true;
}

/** Cancela um convite ainda não usado. Convite já usado é definitivo. */
export function cancelInvite(conversationId: string): boolean {
  const state = getSnapshot();
  const existing = findInvite(state, conversationId);

  if (!existing || existing.usedAt) {
    return false;
  }

  writeState({
    ...state,
    invites: state.invites.filter((invite) => invite.conversationId !== conversationId),
  });

  return true;
}

export function submitReview(input: {
  conversationId: string;
  adSlug: string;
  author: string;
  score: number;
  comment: string;
}): boolean {
  const state = getSnapshot();
  const invite = findInvite(state, input.conversationId);

  if (getInviteStatus(invite) !== "open" || !invite) {
    return false;
  }

  const now = new Date().toISOString();
  const review: SubmittedReview = {
    id: `local-${input.conversationId}-${Date.parse(now)}`,
    adSlug: input.adSlug,
    conversationId: input.conversationId,
    author: input.author,
    score: input.score,
    comment: input.comment.trim(),
    createdAt: now,
  };

  writeState({
    invites: state.invites.map((item) =>
      item.conversationId === input.conversationId ? { ...item, usedAt: now } : item,
    ),
    reviews: [...state.reviews, review],
  });

  return true;
}

function inviteNotificationId(conversationId: string) {
  return `review-invite-${conversationId}`;
}

/** Abre o convite e avisa o cliente pela central de notificações. */
export function sendReviewInvite(input: {
  conversationId: string;
  adSlug: string;
  professionalName: string;
}): boolean {
  if (!inviteToReview(input.conversationId, input.adSlug)) {
    return false;
  }

  pushNotification("cliente", {
    id: inviteNotificationId(input.conversationId),
    title: "Avaliação disponível",
    message: `${input.professionalName} liberou uma avaliação do perfil. Conte como foi o contato.`,
    time: "Agora",
    href: `/anuncio/${input.adSlug}?avaliar=${input.conversationId}`,
  });

  return true;
}

/** Retira um convite ainda não usado e remove o aviso do cliente. */
export function withdrawReviewInvite(conversationId: string): boolean {
  if (!cancelInvite(conversationId)) {
    return false;
  }

  removeNotification("cliente", inviteNotificationId(conversationId));
  return true;
}

export function useReviewInvites() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Identidade estável para que os memos de quem consome não recalculem a cada render.
  return useMemo(
    () => ({
      invites: state.invites,
      reviews: state.reviews,
      getInvite: (conversationId: string) => findInvite(state, conversationId),
      getInviteForAd: (adSlug: string) => state.invites.find((invite) => invite.adSlug === adSlug),
      getReviewsForAd: (adSlug: string) =>
        state.reviews.filter((review) => review.adSlug === adSlug),
    }),
    [state],
  );
}
