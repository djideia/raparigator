import { describe, expect, it } from "vitest";
import {
  PREMIUM_VISIBILITY_MULTIPLIER,
  addBillingCycle,
  canUploadMedia,
  getBillingSavingsPercent,
  getPlanLimits,
} from "../src/premium";

describe("limites por plano", () => {
  it("standard tem 10 fotos, 3 vídeos e sem view-once", () => {
    expect(getPlanLimits("standard")).toEqual({
      photoLimit: 10,
      videoLimit: 3,
      canSendViewOnce: false,
      canUseAlias: false,
      visibilityMultiplier: 1,
    });
  });

  it("premium tem 100 fotos, 50 vídeos, view-once e multiplicador 1.6", () => {
    const limits = getPlanLimits("premium");
    expect(limits.photoLimit).toBe(100);
    expect(limits.videoLimit).toBe(50);
    expect(limits.canSendViewOnce).toBe(true);
    expect(limits.visibilityMultiplier).toBe(PREMIUM_VISIBILITY_MULTIPLIER);
  });

  it("bloqueia o upload exatamente no limite", () => {
    expect(canUploadMedia("standard", "image", 9)).toBe(true);
    expect(canUploadMedia("standard", "image", 10)).toBe(false);
    expect(canUploadMedia("standard", "video", 3)).toBe(false);
    expect(canUploadMedia("premium", "video", 49)).toBe(true);
    expect(canUploadMedia("premium", "video", 50)).toBe(false);
  });

  it("semestral economiza 50% frente ao mensal", () => {
    expect(getBillingSavingsPercent()).toBe(50);
  });

  it("soma o ciclo em meses UTC sem estourar o mês", () => {
    const start = new Date("2026-01-31T00:00:00.000Z");
    expect(addBillingCycle(start, "monthly").toISOString()).toBe("2026-02-28T00:00:00.000Z");
    expect(addBillingCycle(new Date("2026-08-15T12:00:00.000Z"), "semiannual").toISOString()).toBe(
      "2027-02-15T12:00:00.000Z",
    );
  });
});
