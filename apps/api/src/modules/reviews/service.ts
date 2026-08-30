import { ORPCError } from "@orpc/server";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import type { AdReviewsSummary, InviteStatus, ReviewInvite } from "@sigillus/contracts";
import {
  canInviteToReview,
  canSubmitReview,
  canWithdrawInvite,
  computeInviteExpiry,
  getInviteStatus,
  mergeRating,
} from "@sigillus/domain";
import type { Database } from "../../db/client";
import {
  conversationParticipants,
  conversations,
  messages,
  professionalProfiles,
  reviewInvites,
  reviews,
} from "../../db/schema";
import { newId } from "../../lib/ids";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import type { NotificationsService } from "../notifications/service";
import type { ProfileRepository } from "../profiles/repository";

export type ReviewsActor = { id: string; role: "cliente" | "profissional" };

export type ReviewsServiceDeps = {
  db: Database;
  profiles: ProfileRepository;
  notifications: Pick<NotificationsService, "push" | "removeByKey">;
  jobs: JobQueue;
  logger: Logger;
};

export type ReviewsService = ReturnType<typeof createReviewsService>;

type InviteRow = typeof reviewInvites.$inferSelect;

type ConversationScope = {
  conversationId: string;
  profileId: string;
  clientUserId: string;
  professionalUserId: string;
  slug: string;
  artisticName: string;
};

export function reviewInviteNotificationKey(conversationId: string) {
  return `review-invite-${conversationId}`;
}

function toInvite(row: InviteRow, slug: string): ReviewInvite {
  return {
    conversationId: row.conversationId,
    adSlug: slug,
    invitedAt: row.invitedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    usedAt: row.usedAt?.toISOString() ?? null,
  };
}

function inviteLike(row: InviteRow | null) {
  return row ? { expiresAt: row.expiresAt.toISOString(), usedAt: row.usedAt?.toISOString() } : null;
}

export function createReviewsService(deps: ReviewsServiceDeps) {
  const { db, notifications, jobs, logger, profiles } = deps;

  async function findScope(conversationId: string): Promise<ConversationScope | null> {
    const [row] = await db
      .select({
        conversationId: conversations.id,
        profileId: conversations.profileId,
        clientUserId: conversations.clientUserId,
        professionalUserId: conversations.professionalUserId,
        slug: professionalProfiles.slug,
        artisticName: professionalProfiles.artisticName,
      })
      .from(conversations)
      .innerJoin(professionalProfiles, eq(professionalProfiles.id, conversations.profileId))
      .where(eq(conversations.id, conversationId))
      .limit(1);
    return row ?? null;
  }

  async function findInvite(conversationId: string): Promise<InviteRow | null> {
    const [row] = await db
      .select()
      .from(reviewInvites)
      .where(eq(reviewInvites.conversationId, conversationId))
      .limit(1);
    return row ?? null;
  }

  async function requireOwnedScope(actor: ReviewsActor, conversationId: string) {
    const scope = await findScope(conversationId);
    if (!scope || scope.professionalUserId !== actor.id) {
      throw new ORPCError("NOT_FOUND", { message: "Conversa não encontrada." });
    }
    return scope;
  }

  return {
    async invite(actor: ReviewsActor, conversationId: string): Promise<{ invite: ReviewInvite }> {
      const scope = await requireOwnedScope(actor, conversationId);
      const [existing, gateMessages] = await Promise.all([
        findInvite(conversationId),
        db
          .select({ senderRole: messages.senderRole })
          .from(messages)
          .where(and(eq(messages.conversationId, conversationId), isNull(messages.deletedAt))),
      ]);
      const decision = canInviteToReview(gateMessages, inviteLike(existing));
      if (!decision.ok) {
        throw new ORPCError("CONFLICT", {
          message:
            decision.reason === "already_used"
              ? "Esta conversa já foi avaliada."
              : "O convite exige conversa nos dois sentidos.",
        });
      }
      const invitedAt = new Date();
      const expiresAt = computeInviteExpiry(invitedAt);
      const [row] = await db
        .insert(reviewInvites)
        .values({
          id: newId(),
          conversationId,
          profileId: scope.profileId,
          clientUserId: scope.clientUserId,
          invitedAt,
          expiresAt,
          usedAt: null,
        })
        .onConflictDoUpdate({
          target: reviewInvites.conversationId,
          set: { invitedAt, expiresAt, usedAt: null },
        })
        .returning();
      await jobs.enqueue(
        "review-invite.expire",
        { inviteId: row!.id },
        { startAfter: expiresAt, singletonKey: row!.id },
      );
      await notifications.push(scope.clientUserId, {
        key: reviewInviteNotificationKey(conversationId),
        title: "Avaliação disponível",
        message: `${scope.artisticName} liberou uma avaliação do perfil. Conte como foi o contato.`,
        href: `/anuncio/${scope.slug}?avaliar=${conversationId}`,
      });
      logger.info({ conversationId, profileId: scope.profileId }, "convite de avaliação aberto");
      return { invite: toInvite(row!, scope.slug) };
    },

    async withdrawInvite(actor: ReviewsActor, conversationId: string) {
      const scope = await requireOwnedScope(actor, conversationId);
      const existing = await findInvite(conversationId);
      const decision = canWithdrawInvite(inviteLike(existing));
      if (!decision.ok) {
        if (decision.reason === "not_found") {
          throw new ORPCError("NOT_FOUND", { message: "Convite não encontrado." });
        }
        throw new ORPCError("CONFLICT", { message: "Convite já usado não pode ser cancelado." });
      }
      await db.delete(reviewInvites).where(eq(reviewInvites.conversationId, conversationId));
      await notifications.removeByKey(
        scope.clientUserId,
        reviewInviteNotificationKey(conversationId),
      );
      return { ok: true as const };
    },

    async getInvite(
      actor: ReviewsActor,
      conversationId: string,
    ): Promise<{ invite: ReviewInvite | null; status: InviteStatus }> {
      const scope = await findScope(conversationId);
      if (!scope || (scope.clientUserId !== actor.id && scope.professionalUserId !== actor.id)) {
        throw new ORPCError("NOT_FOUND", { message: "Conversa não encontrada." });
      }
      const row = await findInvite(conversationId);
      const invite = row ? toInvite(row, scope.slug) : null;
      return { invite, status: getInviteStatus(invite) };
    },

    async listMyInvites(actor: ReviewsActor): Promise<ReviewInvite[]> {
      const rows = await db
        .select({ invite: reviewInvites, slug: professionalProfiles.slug })
        .from(reviewInvites)
        .innerJoin(professionalProfiles, eq(professionalProfiles.id, reviewInvites.profileId))
        .where(
          or(eq(reviewInvites.clientUserId, actor.id), eq(professionalProfiles.userId, actor.id)),
        )
        .orderBy(desc(reviewInvites.invitedAt));
      return rows.map((row) => toInvite(row.invite, row.slug));
    },

    async submit(
      actor: ReviewsActor,
      input: { conversationId: string; score: number; comment: string },
    ): Promise<{ reviewId: string }> {
      const scope = await findScope(input.conversationId);
      if (!scope || scope.clientUserId !== actor.id) {
        throw new ORPCError("NOT_FOUND", { message: "Conversa não encontrada." });
      }
      const existing = await findInvite(input.conversationId);
      const decision = canSubmitReview(inviteLike(existing));
      if (!decision.ok) {
        const message =
          decision.reason === "used"
            ? "Esta conversa já foi avaliada."
            : decision.reason === "expired"
              ? "O convite de avaliação expirou."
              : "Não há convite de avaliação para esta conversa.";
        throw new ORPCError("CONFLICT", { message });
      }
      const [participant] = await db
        .select({ alias: conversationParticipants.alias })
        .from(conversationParticipants)
        .where(
          and(
            eq(conversationParticipants.conversationId, input.conversationId),
            eq(conversationParticipants.userId, actor.id),
          ),
        )
        .limit(1);
      const authorName = participant?.alias?.trim() || "Cliente";
      const reviewId = newId();
      const now = new Date();

      await db.transaction(async (tx) => {
        const used = await tx
          .update(reviewInvites)
          .set({ usedAt: now })
          .where(and(eq(reviewInvites.id, existing!.id), isNull(reviewInvites.usedAt)))
          .returning({ id: reviewInvites.id });
        if (used.length === 0) {
          throw new ORPCError("CONFLICT", { message: "Esta conversa já foi avaliada." });
        }
        await tx.insert(reviews).values({
          id: reviewId,
          profileId: scope.profileId,
          conversationId: input.conversationId,
          authorUserId: actor.id,
          authorName,
          score: input.score,
          comment: input.comment,
          isSeed: false,
          createdAt: now,
        });
        const [profile] = await tx
          .select({
            rating: professionalProfiles.rating,
            reviewsCount: professionalProfiles.reviewsCount,
          })
          .from(professionalProfiles)
          .where(eq(professionalProfiles.id, scope.profileId))
          .for("update");
        const merged = mergeRating(Number(profile?.rating ?? 0), profile?.reviewsCount ?? 0, [
          input.score,
        ]);
        await tx
          .update(professionalProfiles)
          .set({
            rating: merged.rating,
            reviewsCount: merged.reviewsCount,
            updatedAt: now,
          })
          .where(eq(professionalProfiles.id, scope.profileId));
      });

      await notifications.removeByKey(actor.id, reviewInviteNotificationKey(input.conversationId));
      logger.info({ conversationId: input.conversationId, reviewId }, "avaliação registrada");
      return { reviewId };
    },

    async listForAd(slug: string): Promise<AdReviewsSummary> {
      const profile = await profiles.findBySlug(slug);
      if (!profile || profile.verificationStatus !== "published" || profile.isSuspended) {
        throw new ORPCError("NOT_FOUND", { message: "Anúncio não encontrado." });
      }
      const rows = await db
        .select()
        .from(reviews)
        .where(eq(reviews.profileId, profile.id))
        .orderBy(desc(reviews.createdAt));
      return {
        reviews: rows.map((row) => ({
          id: row.id,
          adId: profile.id,
          author: row.authorName,
          score: row.score,
          comment: row.comment,
          createdAt: row.createdAt.toISOString(),
        })),
        rating: Number(profile.rating),
        reviewsCount: profile.reviewsCount,
      };
    },
  };
}

export function registerReviewJobs(deps: { jobs: JobQueue; logger: Logger }) {
  return deps.jobs.work("review-invite.expire", async ({ inviteId }) => {
    deps.logger.info({ inviteId }, "convite de avaliação chegou ao prazo");
  });
}
