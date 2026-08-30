import { ORPCError } from "@orpc/server";
import type {
  ChatEvent,
  ChatMutationResult,
  Conversation,
  EncounterBrief,
  Message,
  ReportType,
  UserRole,
} from "@sigillus/contracts";
import { buildEncounterBrief, estimateEncounter, getPlanLimits } from "@sigillus/domain";
import type { Database } from "../../db/client";
import type { ChatEventBus } from "../../lib/chat-events";
import { newId } from "../../lib/ids";
import type { Logger } from "../../lib/logger";
import type { ObjectStorage } from "../../lib/storage";
import type { ProfileRepository } from "../profiles/repository";
import {
  displayNameForRole,
  otherParticipant,
  participantFor,
  toConversation,
  toMessage,
} from "./mapper";
import {
  createChatRepository,
  type ConversationContext,
  type MessageInsert,
  type MessageRow,
} from "./repository";

export type ChatActor = {
  id: string;
  role: UserRole;
  name: string;
};

export type ChatServiceDeps = {
  db: Database;
  profiles: ProfileRepository;
  storage: ObjectStorage;
  chatEvents: ChatEventBus;
  logger: Logger;
  heartbeatMs?: number;
};

export type ChatService = ReturnType<typeof createChatService>;

export const CHAT_HEARTBEAT_MS = 25_000;

type SendPreparation = {
  ctx: ConversationContext;
  existing: MessageRow | null;
};

function planFor(ctx: ConversationContext) {
  return getPlanLimits(ctx.profile.adTier === "premium" ? "premium" : "standard");
}

export function createChatService(deps: ChatServiceDeps) {
  const repo = createChatRepository(deps.db);
  const { chatEvents, storage, profiles, logger } = deps;

  async function requireContext(actor: ChatActor, conversationId: string) {
    const ctx = await repo.findContext(conversationId);
    if (!ctx || !participantFor(ctx, actor.id)) {
      throw new ORPCError("NOT_FOUND", { message: "Conversa não encontrada." });
    }
    return ctx;
  }

  async function findOwnContext(actor: ChatActor, conversationId: string) {
    const ctx = await repo.findContext(conversationId);
    if (!ctx || !participantFor(ctx, actor.id)) {
      return null;
    }
    return ctx;
  }

  async function prepareSend(
    actor: ChatActor,
    conversationId: string,
    clientMessageId: string | undefined,
  ): Promise<SendPreparation> {
    const ctx = await requireContext(actor, conversationId);
    const me = participantFor(ctx, actor.id)!;
    const other = otherParticipant(ctx, actor.id);
    if (me.isBlocked) {
      throw new ORPCError("CONFLICT", { message: "Você bloqueou esta conversa." });
    }
    if (other.isBlocked) {
      throw new ORPCError("CONFLICT", { message: "Esta conversa está bloqueada." });
    }
    const existing = clientMessageId
      ? await repo.findMessageByClientId(conversationId, actor.id, clientMessageId)
      : null;
    return { ctx, existing };
  }

  async function persistMessage(
    actor: ChatActor,
    ctx: ConversationContext,
    values: Omit<MessageInsert, "id" | "conversationId" | "senderUserId" | "senderRole" | "sentAt">,
    preview: string,
  ): Promise<{ message: Message }> {
    const sentAt = new Date();
    const inserted = await repo.insertMessage({
      id: newId(),
      conversationId: ctx.conversation.id,
      senderUserId: actor.id,
      senderRole: actor.role,
      sentAt,
      ...values,
    });
    if (!inserted) {
      const existing = await repo.findMessageByClientId(
        ctx.conversation.id,
        actor.id,
        values.clientMessageId!,
      );
      return { message: await mapSingle(existing!, ctx, actor.id) };
    }
    const other = otherParticipant(ctx, actor.id);
    await repo.recordSent({
      conversationId: ctx.conversation.id,
      recipientUserId: other.userId,
      preview,
      sentAt,
    });
    await chatEvents.publish([actor.id, other.userId], {
      type: "message.created",
      conversationId: ctx.conversation.id,
      messageId: inserted.id,
    });
    logger.debug(
      { conversationId: ctx.conversation.id, messageType: inserted.messageType },
      "mensagem enviada",
    );
    return { message: await mapSingle(inserted, ctx, actor.id) };
  }

  async function mapSingle(row: MessageRow, ctx: ConversationContext, viewerUserId: string) {
    const asset = row.mediaAssetId ? await repo.findMediaAsset(row.mediaAssetId) : null;
    return toMessage(row, ctx, viewerUserId, asset ?? undefined);
  }

  return {
    async ensureConversationForAd(actor: ChatActor, adSlug: string) {
      const profile = await profiles.findBySlug(adSlug);
      if (!profile || profile.verificationStatus !== "published" || profile.isSuspended) {
        throw new ORPCError("NOT_FOUND", { message: "Anúncio não encontrado." });
      }
      const existing = await repo.findContextByProfileAndClient(profile.id, actor.id);
      if (existing) {
        if (existing.clientParticipant.deletedFromInboxAt) {
          await repo.updateParticipant(existing.clientParticipant.id, {
            deletedFromInboxAt: null,
          });
        }
        return { conversationId: existing.conversation.id };
      }
      const conversationId = await repo.createConversation({
        profileId: profile.id,
        clientUserId: actor.id,
        professionalUserId: profile.userId,
      });
      return { conversationId };
    },

    async listConversations(actor: ChatActor): Promise<Conversation[]> {
      const rows = await repo.listContextsForUser(actor.id);
      const now = Date.now();
      return rows.map((ctx) => toConversation(ctx, actor.id, now));
    },

    async listMessages(
      actor: ChatActor,
      input: { conversationId: string; before?: string; limit: number },
    ): Promise<{ items: Message[]; hasMore: boolean }> {
      const ctx = await requireContext(actor, input.conversationId);
      const me = participantFor(ctx, actor.id)!;
      const before = input.before ? new Date(input.before) : null;
      const { rows, hasMore } = await repo.listMessages(
        input.conversationId,
        before && !Number.isNaN(before.getTime()) ? before : null,
        input.limit,
      );
      const now = new Date();
      const delivered = await repo.markDelivered(input.conversationId, actor.id, now);
      const deliveredIds = new Set(delivered.map((row) => row.id));
      await repo.updateParticipant(me.id, { lastSeenAt: now });
      const other = otherParticipant(ctx, actor.id);
      for (const row of delivered) {
        await chatEvents.publish([other.userId], {
          type: "message.delivered",
          conversationId: input.conversationId,
          messageId: row.id,
          deliveredAt: now.toISOString(),
        });
      }
      const assets = await repo.listMediaAssets(
        rows.flatMap((row) => (row.mediaAssetId ? [row.mediaAssetId] : [])),
      );
      const items = rows.map((row) =>
        toMessage(
          deliveredIds.has(row.id) ? { ...row, deliveredAt: now } : row,
          ctx,
          actor.id,
          row.mediaAssetId ? assets.get(row.mediaAssetId) : undefined,
        ),
      );
      return { items, hasMore };
    },

    async sendText(
      actor: ChatActor,
      input: { conversationId: string; content: string; clientMessageId?: string },
    ) {
      const { ctx, existing } = await prepareSend(
        actor,
        input.conversationId,
        input.clientMessageId,
      );
      if (existing) {
        return { message: await mapSingle(existing, ctx, actor.id) };
      }
      return persistMessage(
        actor,
        ctx,
        {
          messageType: "text",
          content: input.content,
          clientMessageId: input.clientMessageId ?? null,
        },
        input.content,
      );
    },

    async sendBrief(
      actor: ChatActor,
      input: {
        conversationId: string;
        brief: EncounterBrief;
        greeting: string;
        clientMessageId?: string;
      },
    ) {
      if (actor.role !== "cliente") {
        throw new ORPCError("FORBIDDEN", { message: "Só clientes enviam simulação." });
      }
      const { ctx, existing } = await prepareSend(
        actor,
        input.conversationId,
        input.clientMessageId,
      );
      if (existing) {
        return { message: await mapSingle(existing, ctx, actor.id) };
      }
      const estimate = estimateEncounter(
        {
          pricingTable: ctx.profile.pricingTable,
          startingPrice: Number(ctx.profile.startingPrice),
          services: ctx.profile.services,
        },
        { duration: input.brief.duration, extras: input.brief.extras },
      );
      const brief = buildEncounterBrief(
        { slug: ctx.profile.slug, artisticName: ctx.profile.artisticName },
        estimate.duration,
        estimate.extras,
        estimate.basePrice,
        estimate.extrasCost,
        estimate.total,
      );
      return persistMessage(
        actor,
        ctx,
        {
          messageType: "brief",
          content: input.greeting,
          brief,
          clientMessageId: input.clientMessageId ?? null,
        },
        `Interesse enviado · ${brief.duration}`,
      );
    },

    async sendMedia(
      actor: ChatActor,
      input: {
        conversationId: string;
        assetId: string;
        isViewOnce: boolean;
        clientMessageId?: string;
      },
    ) {
      const { ctx, existing } = await prepareSend(
        actor,
        input.conversationId,
        input.clientMessageId,
      );
      if (existing) {
        return { message: await mapSingle(existing, ctx, actor.id) };
      }
      const asset = await repo.findMediaAsset(input.assetId);
      if (
        !asset ||
        asset.ownerUserId !== actor.id ||
        asset.purpose !== "chat" ||
        asset.status !== "ready"
      ) {
        throw new ORPCError("NOT_FOUND", { message: "Mídia não disponível para envio." });
      }
      if (input.isViewOnce && !(actor.role === "profissional" && planFor(ctx).canSendViewOnce)) {
        throw new ORPCError("PLAN_LIMIT", {
          message: "Mídia temporária é exclusiva do plano premium.",
        });
      }
      return persistMessage(
        actor,
        ctx,
        {
          messageType: "media",
          mediaAssetId: asset.id,
          isViewOnce: input.isViewOnce,
          clientMessageId: input.clientMessageId ?? null,
        },
        input.isViewOnce ? "Mídia temporária" : "Mídia",
      );
    },

    async openViewOnce(actor: ChatActor, messageId: string) {
      const message = await repo.findMessage(messageId);
      if (
        !message ||
        message.deletedAt ||
        message.messageType !== "media" ||
        !message.mediaAssetId
      ) {
        throw new ORPCError("NOT_FOUND", { message: "Mídia não encontrada." });
      }
      const ctx = await requireContext(actor, message.conversationId);
      const asset = await repo.findMediaAsset(message.mediaAssetId);
      if (!asset) {
        throw new ORPCError("NOT_FOUND", { message: "Mídia não encontrada." });
      }
      if (!message.isViewOnce) {
        return {
          openedAt: (message.openedAt ?? new Date()).toISOString(),
          url: await storage.presignView(asset.storageKey),
        };
      }
      if (message.senderUserId === actor.id) {
        throw new ORPCError("FORBIDDEN", {
          message: "Só quem recebe pode abrir a mídia temporária.",
        });
      }
      const openedAt = new Date();
      const opened = await repo.markOpened(message.id, openedAt);
      if (!opened) {
        throw new ORPCError("CONFLICT", { message: "Esta mídia temporária já foi aberta." });
      }
      await chatEvents.publish([message.senderUserId], {
        type: "message.opened",
        conversationId: ctx.conversation.id,
        messageId: message.id,
        openedAt: openedAt.toISOString(),
      });
      return { openedAt: openedAt.toISOString(), url: await storage.presignView(asset.storageKey) };
    },

    async markRead(actor: ChatActor, conversationId: string) {
      const ctx = await requireContext(actor, conversationId);
      const me = participantFor(ctx, actor.id)!;
      const now = new Date();
      await repo.updateParticipant(me.id, { unreadCount: 0, lastReadAt: now, lastSeenAt: now });
      await chatEvents.publish([actor.id], { type: "conversation.updated", conversationId });
      return { ok: true as const };
    },

    async setBlocked(
      actor: ChatActor,
      input: { conversationId: string; isBlocked: boolean },
    ): Promise<ChatMutationResult> {
      const ctx = await findOwnContext(actor, input.conversationId);
      if (!ctx) {
        return { ok: false, reason: "not_found" };
      }
      const me = participantFor(ctx, actor.id)!;
      await repo.updateParticipant(me.id, { isBlocked: input.isBlocked });
      await chatEvents.publish([actor.id], {
        type: "conversation.updated",
        conversationId: input.conversationId,
      });
      return { ok: true };
    },

    async deleteFromInbox(actor: ChatActor, conversationId: string): Promise<ChatMutationResult> {
      const ctx = await findOwnContext(actor, conversationId);
      if (!ctx) {
        return { ok: false, reason: "not_found" };
      }
      const me = participantFor(ctx, actor.id)!;
      await repo.updateParticipant(me.id, { deletedFromInboxAt: new Date(), unreadCount: 0 });
      await chatEvents.publish([actor.id], { type: "conversation.updated", conversationId });
      return { ok: true };
    },

    async updateAlias(
      actor: ChatActor,
      input: { conversationId: string; alias: string | null },
    ): Promise<ChatMutationResult> {
      const ctx = await findOwnContext(actor, input.conversationId);
      if (!ctx) {
        return { ok: false, reason: "not_found" };
      }
      if (actor.role === "profissional" && !planFor(ctx).canUseAlias) {
        throw new ORPCError("PLAN_LIMIT", { message: "Apelido é exclusivo do plano premium." });
      }
      const me = participantFor(ctx, actor.id)!;
      const alias = input.alias?.trim() || null;
      await repo.updateParticipant(me.id, { alias });
      await chatEvents.publish([actor.id, otherParticipant(ctx, actor.id).userId], {
        type: "conversation.updated",
        conversationId: input.conversationId,
      });
      return { ok: true };
    },

    async report(
      actor: ChatActor,
      input: { conversationId: string; type: ReportType; reason: string },
    ): Promise<ChatMutationResult> {
      const ctx = await findOwnContext(actor, input.conversationId);
      if (!ctx) {
        return { ok: false, reason: "not_found" };
      }
      const other = otherParticipant(ctx, actor.id);
      await repo.insertReport({
        id: newId(),
        type: input.type,
        reporterUserId: actor.id,
        reporterName: displayNameForRole(ctx, actor.role),
        reporterRole: actor.role,
        reportedUserId: other.userId,
        reportedName: displayNameForRole(ctx, other.role),
        reportedRole: other.role,
        conversationId: input.conversationId,
        description: input.reason,
        status: "pending",
      });
      logger.info(
        { conversationId: input.conversationId, type: input.type },
        "denúncia registrada",
      );
      return { ok: true };
    },

    subscribe(
      actor: ChatActor,
      input: { conversationId?: string },
      signal?: AbortSignal,
    ): AsyncGenerator<ChatEvent> {
      return streamEvents(
        chatEvents,
        actor.id,
        input.conversationId,
        signal,
        deps.heartbeatMs ?? CHAT_HEARTBEAT_MS,
      );
    },
  };
}

async function* streamEvents(
  chatEvents: ChatEventBus,
  userId: string,
  conversationId: string | undefined,
  signal: AbortSignal | undefined,
  heartbeatMs: number,
): AsyncGenerator<ChatEvent> {
  const queue: ChatEvent[] = [];
  let wake: (() => void) | null = null;
  let closed = signal?.aborted ?? false;

  const notify = () => {
    const resolve = wake;
    wake = null;
    resolve?.();
  };
  const unsubscribe = chatEvents.subscribe(userId, (event) => {
    if (conversationId && "conversationId" in event && event.conversationId !== conversationId) {
      return;
    }
    queue.push(event);
    notify();
  });
  const onAbort = () => {
    closed = true;
    notify();
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    while (!closed) {
      const next = queue.shift();
      if (next) {
        yield next;
        continue;
      }
      const heartbeat = await new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => {
          wake = null;
          resolve(true);
        }, heartbeatMs);
        wake = () => {
          clearTimeout(timer);
          resolve(false);
        };
      });
      if (heartbeat && !closed) {
        yield { type: "heartbeat", at: new Date().toISOString() };
      }
    }
  } finally {
    signal?.removeEventListener("abort", onAbort);
    unsubscribe();
  }
}
