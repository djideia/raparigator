import { describe, expect, it } from "vitest";
import {
  REVIEW_INVITE_TTL_MS,
  canInviteToReview,
  canSubmitReview,
  canWithdrawInvite,
  computeInviteExpiry,
  getInviteDaysLeft,
  getInviteStatus,
  hasTwoWayConversation,
  mergeRating,
} from "../src/review-gate";

const NOW = Date.parse("2026-08-15T12:00:00.000Z");
const cliente = { senderRole: "cliente" as const };
const profissional = { senderRole: "profissional" as const };
const suporte = { senderRole: "suporte" as const };

describe("gate de avaliação", () => {
  it("só existe conversa real com mensagens dos dois lados", () => {
    expect(hasTwoWayConversation([])).toBe(false);
    expect(hasTwoWayConversation([cliente, cliente])).toBe(false);
    expect(hasTwoWayConversation([profissional])).toBe(false);
    expect(hasTwoWayConversation([cliente, suporte])).toBe(false);
    expect(hasTwoWayConversation([cliente, profissional])).toBe(true);
  });

  it("não convida sem conversa de mão dupla", () => {
    expect(canInviteToReview([cliente], null)).toEqual({
      ok: false,
      reason: "no_two_way_conversation",
    });
    expect(canInviteToReview([cliente, profissional], null)).toEqual({ ok: true });
  });

  it("convite já usado é definitivo: não reabre nem cancela", () => {
    const used = { expiresAt: new Date(NOW + 1000).toISOString(), usedAt: "2026-08-10" };
    expect(canInviteToReview([cliente, profissional], used)).toEqual({
      ok: false,
      reason: "already_used",
    });
    expect(canWithdrawInvite(used)).toEqual({ ok: false, reason: "already_used" });
    expect(canWithdrawInvite(null)).toEqual({ ok: false, reason: "not_found" });
    expect(
      canWithdrawInvite({ expiresAt: new Date(NOW + 1000).toISOString(), usedAt: null }),
    ).toEqual({
      ok: true,
    });
  });

  it("expira em 14 dias", () => {
    const invitedAt = new Date(NOW);
    const expiresAt = computeInviteExpiry(invitedAt);
    expect(expiresAt.getTime() - invitedAt.getTime()).toBe(REVIEW_INVITE_TTL_MS);
    expect(getInviteDaysLeft({ expiresAt: expiresAt.toISOString() }, NOW)).toBe(14);
    expect(getInviteStatus({ expiresAt: expiresAt.toISOString(), usedAt: null }, NOW)).toBe("open");
    expect(
      getInviteStatus({ expiresAt: expiresAt.toISOString(), usedAt: null }, expiresAt.getTime()),
    ).toBe("expired");
  });

  it("só aceita avaliação com convite aberto, e uma vez só", () => {
    const open = { expiresAt: new Date(NOW + 1000).toISOString(), usedAt: null };
    expect(canSubmitReview(open, NOW)).toEqual({ ok: true });
    expect(canSubmitReview({ ...open, usedAt: "x" }, NOW)).toEqual({ ok: false, reason: "used" });
    expect(canSubmitReview({ ...open, expiresAt: new Date(NOW - 1).toISOString() }, NOW)).toEqual({
      ok: false,
      reason: "expired",
    });
    expect(canSubmitReview(null, NOW)).toEqual({ ok: false, reason: "no_invite" });
  });

  it("recalcula nota ponderando as semeadas", () => {
    expect(mergeRating(4.9, 128, [])).toEqual({ rating: 4.9, reviewsCount: 128 });
    const merged = mergeRating(4, 1, [5]);
    expect(merged.reviewsCount).toBe(2);
    expect(merged.rating).toBe(4.5);
    expect(mergeRating(0, 0, [])).toEqual({ rating: 0, reviewsCount: 0 });
  });
});
