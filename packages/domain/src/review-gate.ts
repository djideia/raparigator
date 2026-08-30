import type { InviteStatus, Message, ReviewInvite } from "@sigillus/contracts";

export const REVIEW_INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const REVIEW_INVITE_TTL_DAYS = 14;

type InviteLike = Pick<ReviewInvite, "expiresAt" | "usedAt">;

export function getInviteStatus(
  invite: InviteLike | undefined | null,
  now = Date.now(),
): InviteStatus {
  if (!invite) {
    return "none";
  }

  if (invite.usedAt) {
    return "used";
  }

  return Date.parse(invite.expiresAt) <= now ? "expired" : "open";
}

export function getInviteDaysLeft(
  invite: Pick<ReviewInvite, "expiresAt">,
  now = Date.now(),
): number {
  const remaining = Date.parse(invite.expiresAt) - now;
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

export function computeInviteExpiry(invitedAt: Date): Date {
  return new Date(invitedAt.getTime() + REVIEW_INVITE_TTL_MS);
}

export function hasTwoWayConversation(messages: Array<Pick<Message, "senderRole">>): boolean {
  let fromClient = false;
  let fromProfessional = false;

  for (const message of messages) {
    if (message.senderRole === "cliente") {
      fromClient = true;
    } else if (message.senderRole === "profissional") {
      fromProfessional = true;
    }

    if (fromClient && fromProfessional) {
      return true;
    }
  }

  return false;
}

export type InviteDecision =
  | { ok: true }
  | { ok: false; reason: "no_two_way_conversation" | "already_used" };

export function canInviteToReview(
  messages: Array<Pick<Message, "senderRole">>,
  existing: InviteLike | undefined | null,
): InviteDecision {
  if (existing?.usedAt) {
    return { ok: false, reason: "already_used" };
  }
  if (!hasTwoWayConversation(messages)) {
    return { ok: false, reason: "no_two_way_conversation" };
  }
  return { ok: true };
}

export type WithdrawDecision = { ok: true } | { ok: false; reason: "not_found" | "already_used" };

export function canWithdrawInvite(existing: InviteLike | undefined | null): WithdrawDecision {
  if (!existing) {
    return { ok: false, reason: "not_found" };
  }
  if (existing.usedAt) {
    return { ok: false, reason: "already_used" };
  }
  return { ok: true };
}

export type SubmitDecision = { ok: true } | { ok: false; reason: "no_invite" | "expired" | "used" };

export function canSubmitReview(
  existing: InviteLike | undefined | null,
  now = Date.now(),
): SubmitDecision {
  const status = getInviteStatus(existing, now);
  if (status === "open") {
    return { ok: true };
  }
  if (status === "none") {
    return { ok: false, reason: "no_invite" };
  }
  return { ok: false, reason: status };
}

export function mergeRating(
  seededRating: number,
  seededCount: number,
  submittedScores: number[],
): { rating: number; reviewsCount: number } {
  const reviewsCount = seededCount + submittedScores.length;
  if (reviewsCount === 0) {
    return { rating: seededRating, reviewsCount };
  }
  const seededTotal = seededRating * seededCount;
  const submittedTotal = submittedScores.reduce((total, score) => total + score, 0);
  return { rating: (seededTotal + submittedTotal) / reviewsCount, reviewsCount };
}
