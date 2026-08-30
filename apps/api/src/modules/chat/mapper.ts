import type { Conversation, Message, MessageSenderRole } from "@sigillus/contracts";
import type { ChatMediaAsset, ConversationContext, MessageRow, ParticipantRow } from "./repository";

export const ONLINE_WINDOW_MS = 2 * 60 * 1000;

export function participantFor(ctx: ConversationContext, userId: string): ParticipantRow | null {
  if (ctx.clientParticipant.userId === userId) {
    return ctx.clientParticipant;
  }
  if (ctx.professionalParticipant.userId === userId) {
    return ctx.professionalParticipant;
  }
  return null;
}

export function otherParticipant(ctx: ConversationContext, userId: string): ParticipantRow {
  return ctx.clientParticipant.userId === userId
    ? ctx.professionalParticipant
    : ctx.clientParticipant;
}

export function clientDisplayName(ctx: ConversationContext): string {
  return ctx.clientParticipant.alias?.trim() || ctx.clientUser.name;
}

export function displayNameForRole(ctx: ConversationContext, role: MessageSenderRole): string {
  if (role === "profissional") {
    return ctx.profile.artisticName;
  }
  if (role === "cliente") {
    return clientDisplayName(ctx);
  }
  return "Suporte";
}

export function toConversation(
  ctx: ConversationContext,
  viewerUserId: string,
  now = Date.now(),
): Conversation {
  const me = participantFor(ctx, viewerUserId) ?? ctx.clientParticipant;
  const other = otherParticipant(ctx, viewerUserId);
  const isClientView = me.userId === ctx.clientParticipant.userId;
  const otherSeenAt = other.lastSeenAt?.getTime() ?? 0;
  return {
    id: ctx.conversation.id,
    participantId: other.userId,
    contactName: isClientView ? ctx.profile.artisticName : clientDisplayName(ctx),
    contactStatus: now - otherSeenAt <= ONLINE_WINDOW_MS ? "online" : "offline",
    lastMessage: ctx.conversation.lastMessagePreview,
    lastMessageAt: (ctx.conversation.lastMessageAt ?? ctx.conversation.createdAt).toISOString(),
    unread: me.unreadCount,
    currentUserAlias: me.alias ?? undefined,
    isBlocked: me.isBlocked,
    deletedFromInboxAt: me.deletedFromInboxAt?.toISOString() ?? null,
    adSlug: ctx.profile.slug,
  };
}

export function toMessage(
  row: MessageRow,
  ctx: ConversationContext,
  viewerUserId: string,
  asset: ChatMediaAsset | undefined,
): Message {
  const media =
    row.messageType === "media" && row.mediaAssetId
      ? {
          id: row.mediaAssetId,
          kind: asset?.kind ?? ("image" as const),
          name: asset?.fileName ?? "Mídia",
          isViewOnce: row.isViewOnce,
          openedAt: row.openedAt?.toISOString() ?? null,
        }
      : undefined;
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderUserId,
    senderRole: row.senderRole,
    senderDisplayName: displayNameForRole(ctx, row.senderRole),
    from: row.senderUserId === viewerUserId ? "me" : "other",
    content: row.content ?? undefined,
    messageType: row.messageType,
    status: row.deliveredAt ? "delivered" : "sent",
    media,
    brief: row.brief ?? undefined,
    sentAt: row.sentAt.toISOString(),
    deliveredAt: row.deliveredAt?.toISOString() ?? null,
    editedAt: row.editedAt?.toISOString() ?? null,
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}
