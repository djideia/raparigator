import { z } from "zod";

export const ConversationSchema = z.object({
  id: z.string(),
  participantId: z.string(),
  contactName: z.string(),
  contactStatus: z.enum(["online", "offline"]),
  lastMessage: z.string(),
  lastMessageAt: z.string(),
  unread: z.number(),
  currentUserAlias: z.string().optional(),
  isBlocked: z.boolean().optional(),
  deletedFromInboxAt: z.string().nullable().optional(),
  adSlug: z.string().optional(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const SimulationSelectionSchema = z.object({
  duration: z.string(),
  extras: z.array(z.string()),
});
export type SimulationSelection = z.infer<typeof SimulationSelectionSchema>;

export const EncounterBriefSchema = z.object({
  adSlug: z.string(),
  artisticName: z.string(),
  duration: z.string(),
  basePrice: z.number(),
  extras: z.array(z.string()),
  extrasCost: z.number(),
  total: z.number(),
});
export type EncounterBrief = z.infer<typeof EncounterBriefSchema>;

export const MessageStatusSchema = z.enum(["sending", "sent", "delivered", "failed"]);
export type MessageStatus = z.infer<typeof MessageStatusSchema>;

export const MessageTypeSchema = z.enum(["text", "media", "brief"]);
export type MessageType = z.infer<typeof MessageTypeSchema>;

export const MessageSenderRoleSchema = z.enum(["cliente", "profissional", "suporte"]);
export type MessageSenderRole = z.infer<typeof MessageSenderRoleSchema>;

export const MessageMediaSchema = z.object({
  id: z.string(),
  kind: z.enum(["image", "video"]),
  name: z.string(),
  isViewOnce: z.boolean(),
  openedAt: z.string().nullable().optional(),
});
export type MessageMedia = z.infer<typeof MessageMediaSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  senderRole: MessageSenderRoleSchema,
  senderDisplayName: z.string(),
  from: z.enum(["me", "other"]),
  content: z.string().optional(),
  messageType: MessageTypeSchema,
  status: MessageStatusSchema,
  media: MessageMediaSchema.optional(),
  brief: EncounterBriefSchema.optional(),
  sentAt: z.string(),
  deliveredAt: z.string().nullable().optional(),
  editedAt: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ChatSnapshotSchema = z.object({
  conversations: z.array(ConversationSchema),
  messages: z.array(MessageSchema),
});
export type ChatSnapshot = z.infer<typeof ChatSnapshotSchema>;

export const ChatMutationReasonSchema = z.enum(["not_found", "blocked", "empty", "adapter_error"]);
export type ChatMutationReason = z.infer<typeof ChatMutationReasonSchema>;

export const ChatMutationResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true) }),
  z.object({ ok: z.literal(false), reason: ChatMutationReasonSchema }),
]);
export type ChatMutationResult = z.infer<typeof ChatMutationResultSchema>;

export const ChatSendResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), messageId: z.string() }),
  z.object({
    ok: z.literal(false),
    reason: ChatMutationReasonSchema,
    messageId: z.string().optional(),
  }),
]);
export type ChatSendResult = z.infer<typeof ChatSendResultSchema>;

export const ChatEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("message.created"),
    conversationId: z.string(),
    messageId: z.string(),
  }),
  z.object({
    type: z.literal("message.delivered"),
    conversationId: z.string(),
    messageId: z.string(),
    deliveredAt: z.string(),
  }),
  z.object({
    type: z.literal("message.opened"),
    conversationId: z.string(),
    messageId: z.string(),
    openedAt: z.string(),
  }),
  z.object({
    type: z.literal("conversation.updated"),
    conversationId: z.string(),
  }),
  z.object({ type: z.literal("heartbeat"), at: z.string() }),
]);
export type ChatEvent = z.infer<typeof ChatEventSchema>;
