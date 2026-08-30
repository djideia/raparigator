import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { professionalProfiles, reviewInvites, reviews } from "../src/db/schema";
import { createTestHarness } from "./helpers/app";
import { signUp } from "./helpers/auth";
import { createChatFixture, type ChatFixture } from "./helpers/conversations";

const harness = createTestHarness();

async function twoWay(fx: ChatFixture) {
  await fx.chat.sendText(fx.client, { conversationId: fx.conversationId, content: "oi" });
  await fx.chat.sendText(fx.professional, { conversationId: fx.conversationId, content: "olá" });
}

describe("reviews", () => {
  it("convite exige conversa de mão dupla e só a dona convida", async () => {
    const fx = await createChatFixture(harness);
    await expect(fx.reviews.invite(fx.professional, fx.conversationId)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await fx.chat.sendText(fx.client, { conversationId: fx.conversationId, content: "oi" });
    await expect(fx.reviews.invite(fx.professional, fx.conversationId)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await fx.chat.sendText(fx.professional, { conversationId: fx.conversationId, content: "olá" });

    const other = await signUp(harness, { email: "outra-pro@sigillus.dev", role: "profissional" });
    await expect(
      fx.reviews.invite({ id: other.userId, role: "profissional" }, fx.conversationId),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const { invite } = await fx.reviews.invite(fx.professional, fx.conversationId);
    expect(invite.conversationId).toBe(fx.conversationId);
    expect(invite.adSlug).toBe(fx.slug);
    expect(invite.usedAt).toBeNull();
    expect(Date.parse(invite.expiresAt) - Date.parse(invite.invitedAt)).toBe(
      14 * 24 * 60 * 60 * 1000,
    );

    expect(harness.jobs.enqueued.some((job) => job.name === "review-invite.expire")).toBe(true);
    const clientNotifications = await fx.notifications.list(fx.client.id);
    expect(clientNotifications).toHaveLength(1);
    expect(clientNotifications[0]!.title).toBe("Avaliação disponível");
    expect(clientNotifications[0]!.href).toBe(`/anuncio/${fx.slug}?avaliar=${fx.conversationId}`);

    const status = await fx.reviews.getInvite(fx.client, fx.conversationId);
    expect(status.status).toBe("open");
    expect((await fx.reviews.listMyInvites(fx.client)).map((item) => item.conversationId)).toEqual([
      fx.conversationId,
    ]);
    expect(await fx.reviews.listMyInvites(fx.professional)).toHaveLength(1);
    expect(await fx.reviews.listMyInvites({ id: other.userId, role: "profissional" })).toHaveLength(
      0,
    );
  });

  it("cancelar convite remove notificação; convite usado não cancela nem reabre", async () => {
    const fx = await createChatFixture(harness);
    await twoWay(fx);
    await expect(
      fx.reviews.withdrawInvite(fx.professional, fx.conversationId),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await fx.reviews.invite(fx.professional, fx.conversationId);
    await fx.reviews.withdrawInvite(fx.professional, fx.conversationId);
    expect(await fx.notifications.list(fx.client.id)).toHaveLength(0);
    expect((await fx.reviews.getInvite(fx.client, fx.conversationId)).status).toBe("none");

    await fx.reviews.invite(fx.professional, fx.conversationId);
    await fx.reviews.submit(fx.client, {
      conversationId: fx.conversationId,
      score: 5,
      comment: "Ótimo",
    });
    await expect(
      fx.reviews.withdrawInvite(fx.professional, fx.conversationId),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(fx.reviews.invite(fx.professional, fx.conversationId)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect((await fx.reviews.getInvite(fx.professional, fx.conversationId)).status).toBe("used");
  });

  it("avaliação só com convite aberto, uma vez, e recalcula rating", async () => {
    const fx = await createChatFixture(harness);
    await twoWay(fx);
    await expect(
      fx.reviews.submit(fx.client, { conversationId: fx.conversationId, score: 4, comment: "" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    await fx.reviews.invite(fx.professional, fx.conversationId);
    await expect(
      fx.reviews.submit(fx.professional, {
        conversationId: fx.conversationId,
        score: 4,
        comment: "",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await fx.chat.updateAlias(fx.client, { conversationId: fx.conversationId, alias: "Viajante" });
    const { reviewId } = await fx.reviews.submit(fx.client, {
      conversationId: fx.conversationId,
      score: 3,
      comment: "Foi bom",
    });
    const [profile] = await harness.db
      .select({
        rating: professionalProfiles.rating,
        reviewsCount: professionalProfiles.reviewsCount,
      })
      .from(professionalProfiles)
      .where(eq(professionalProfiles.id, fx.profileId));
    expect(profile!.reviewsCount).toBe(3);
    expect(Number(profile!.rating)).toBeCloseTo((4.5 * 2 + 3) / 3, 2);
    expect(await fx.notifications.list(fx.client.id)).toHaveLength(0);

    await expect(
      fx.reviews.submit(fx.client, { conversationId: fx.conversationId, score: 1, comment: "" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const summary = await fx.reviews.listForAd(fx.slug);
    expect(summary.reviewsCount).toBe(3);
    expect(summary.reviews).toHaveLength(1);
    expect(summary.reviews[0]).toMatchObject({
      id: reviewId,
      adId: fx.profileId,
      author: "Viajante",
      score: 3,
      comment: "Foi bom",
    });
    const stored = await harness.db.select().from(reviews).where(eq(reviews.id, reviewId));
    expect(stored[0]!.authorUserId).toBe(fx.client.id);
  });

  it("convite expirado não permite avaliar, mas pode ser renovado", async () => {
    const fx = await createChatFixture(harness);
    await twoWay(fx);
    await fx.reviews.invite(fx.professional, fx.conversationId);
    await harness.db
      .update(reviewInvites)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(reviewInvites.conversationId, fx.conversationId));
    expect((await fx.reviews.getInvite(fx.client, fx.conversationId)).status).toBe("expired");
    await expect(
      fx.reviews.submit(fx.client, { conversationId: fx.conversationId, score: 5, comment: "" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    const renewed = await fx.reviews.invite(fx.professional, fx.conversationId);
    expect(Date.parse(renewed.invite.expiresAt)).toBeGreaterThan(Date.now());
    expect((await fx.reviews.getInvite(fx.client, fx.conversationId)).status).toBe("open");
    const rows = await harness.db
      .select()
      .from(reviewInvites)
      .where(eq(reviewInvites.conversationId, fx.conversationId));
    expect(rows).toHaveLength(1);
  });

  it("listForAd de anúncio inexistente é NOT_FOUND", async () => {
    const fx = await createChatFixture(harness);
    await expect(fx.reviews.listForAd("nao-existe")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
