import {
  fetchBriefMessage,
  fetchDeleteConversationFromInbox,
  fetchReportConversation,
  fetchSetConversationBlocked,
  fetchTextMessage,
  fetchUpdateParticipantAlias,
  fetchViewOnceMediaMessage,
} from "@/lib/chat-service";
import { getConversationAd } from "@/lib/conversation-ad";
import { ads, conversations as mockConversations, messages as mockMessages } from "@/lib/mock-data";
import type { ChatMutationResult, ChatSendResult, ChatSnapshot } from "@/lib/chat-store-types";
import type { Conversation, EncounterBrief, Message } from "@/lib/types";

const EMPTY_SNAPSHOT: ChatSnapshot = { conversations: [], messages: [] };

let snapshot: ChatSnapshot = EMPTY_SNAPSHOT;
let seeded = false;
const listeners = new Set<() => void>();

function cloneConversation(conversation: Conversation): Conversation {
  return { ...conversation };
}

function cloneMessage(message: Message): Message {
  return {
    ...message,
    media: message.media ? { ...message.media } : undefined,
    brief: message.brief ? { ...message.brief, extras: [...message.brief.extras] } : undefined,
  };
}

function buildSeedSnapshot(): ChatSnapshot {
  return {
    conversations: mockConversations
      .map(cloneConversation)
      .filter((conversation) => !conversation.deletedFromInboxAt),
    messages: mockMessages.map(cloneMessage).filter((message) => !message.deletedAt),
  };
}

function emit() {
  queueMicrotask(() => {
    listeners.forEach((listener) => listener());
  });
}

function replaceSnapshot(next: ChatSnapshot) {
  snapshot = next;
  emit();
}

export function getServerChatStoreSnapshot(): ChatSnapshot {
  return EMPTY_SNAPSHOT;
}

export function getChatStoreSnapshot(): ChatSnapshot {
  ensureChatStore();
  return snapshot;
}

export function ensureChatStore(): ChatSnapshot {
  if (typeof window === "undefined") {
    return EMPTY_SNAPSHOT;
  }
  if (!seeded) {
    seeded = true;
    snapshot = buildSeedSnapshot();
  }
  return snapshot;
}

export function reseedChatStore(): ChatSnapshot {
  if (typeof window === "undefined") {
    return EMPTY_SNAPSHOT;
  }
  seeded = true;
  replaceSnapshot(buildSeedSnapshot());
  return snapshot;
}

export function subscribeChatStore(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getChatUnreadCount(): number {
  const current = getChatStoreSnapshot();
  return current.conversations.reduce(
    (total, conversation) => total + (conversation.unread || 0),
    0,
  );
}

export function markConversationAsRead(conversationId: string) {
  const current = ensureChatStore();
  const target = current.conversations.find((conversation) => conversation.id === conversationId);
  if (!target || target.unread === 0) {
    return;
  }
  replaceSnapshot({
    ...current,
    conversations: current.conversations.map((conversation) =>
      conversation.id === conversationId ? { ...conversation, unread: 0 } : conversation,
    ),
  });
}

function syncPreview(
  current: ChatSnapshot,
  conversationId: string,
  lastMessage: string,
): Conversation[] {
  return current.conversations.map((conversation) =>
    conversation.id === conversationId
      ? { ...conversation, lastMessage, lastMessageAt: "agora", unread: 0 }
      : conversation,
  );
}

/**
 * Devolve o id da conversa vinculada a um anúncio, criando-a quando o cliente ainda
 * não falou com aquela profissional.
 */
export function ensureConversationForAd(adSlug: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const current = ensureChatStore();
  const existing = current.conversations.find(
    (conversation) => getConversationAd(conversation)?.slug === adSlug,
  );
  if (existing) {
    return existing.id;
  }

  const ad = ads.find((item) => item.slug === adSlug);
  if (!ad) {
    return null;
  }

  const conversation: Conversation = {
    id: `local-conv-${adSlug}`,
    participantId: ad.id,
    contactName: ad.artisticName,
    contactStatus: ad.status === "indisponivel" ? "offline" : "online",
    lastMessage: "Conversa iniciada pelo anúncio",
    lastMessageAt: "agora",
    unread: 0,
    adSlug,
  };

  replaceSnapshot({
    ...current,
    conversations: [conversation, ...current.conversations],
  });

  return conversation.id;
}

export async function sendChatBrief(
  conversationId: string,
  brief: EncounterBrief,
  greeting: string,
  senderDisplayName: string,
): Promise<ChatSendResult> {
  const current = ensureChatStore();
  const conversation = current.conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    return { ok: false, reason: "not_found" };
  }
  if (conversation.isBlocked) {
    return { ok: false, reason: "blocked" };
  }

  const optimisticId = `local-brief-${Date.now()}`;
  const optimisticMessage: Message = {
    id: optimisticId,
    conversationId,
    senderId: "current-user",
    senderRole: "cliente",
    senderDisplayName,
    from: "me",
    content: greeting,
    messageType: "brief",
    status: "sending",
    brief: { ...brief, extras: [...brief.extras] },
    sentAt: "agora",
    deliveredAt: null,
    editedAt: null,
    deletedAt: null,
  };

  replaceSnapshot({
    conversations: syncPreview(current, conversationId, `Interesse enviado · ${brief.duration}`),
    messages: [...current.messages, optimisticMessage],
  });

  try {
    const confirmed = await fetchBriefMessage(conversationId, brief, greeting, senderDisplayName);
    const latest = ensureChatStore();
    replaceSnapshot({
      ...latest,
      messages: latest.messages.map((message) =>
        message.id === optimisticId ? confirmed : message,
      ),
    });
    return { ok: true, messageId: confirmed.id };
  } catch {
    const latest = ensureChatStore();
    replaceSnapshot({
      ...latest,
      messages: latest.messages.map((message) =>
        message.id === optimisticId ? { ...message, status: "failed" } : message,
      ),
    });
    return { ok: false, reason: "adapter_error", messageId: optimisticId };
  }
}

export async function sendChatText(
  conversationId: string,
  content: string,
  senderDisplayName: string,
): Promise<ChatSendResult> {
  const trimmed = content.trim();
  if (!trimmed) {
    return { ok: false, reason: "empty" };
  }

  const current = ensureChatStore();
  const conversation = current.conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    return { ok: false, reason: "not_found" };
  }
  if (conversation.isBlocked) {
    return { ok: false, reason: "blocked" };
  }

  const optimisticId = `local-${Date.now()}`;
  const optimisticMessage: Message = {
    id: optimisticId,
    conversationId,
    senderId: "current-user",
    senderRole: "cliente",
    senderDisplayName,
    from: "me",
    content: trimmed,
    messageType: "text",
    status: "sending",
    sentAt: "agora",
    deliveredAt: null,
    editedAt: null,
    deletedAt: null,
  };

  replaceSnapshot({
    conversations: syncPreview(current, conversationId, trimmed),
    messages: [...current.messages, optimisticMessage],
  });

  try {
    const confirmed = await fetchTextMessage(conversationId, trimmed, senderDisplayName);
    const latest = ensureChatStore();
    replaceSnapshot({
      ...latest,
      messages: latest.messages.map((message) =>
        message.id === optimisticId ? confirmed : message,
      ),
    });
    return { ok: true, messageId: confirmed.id };
  } catch {
    const latest = ensureChatStore();
    replaceSnapshot({
      ...latest,
      messages: latest.messages.map((message) =>
        message.id === optimisticId ? { ...message, status: "failed" } : message,
      ),
    });
    return { ok: false, reason: "adapter_error", messageId: optimisticId };
  }
}

export async function sendChatViewOnceMedia(
  conversationId: string,
  senderDisplayName: string,
): Promise<ChatSendResult> {
  const current = ensureChatStore();
  const conversation = current.conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    return { ok: false, reason: "not_found" };
  }
  if (conversation.isBlocked) {
    return { ok: false, reason: "blocked" };
  }

  const optimisticId = `local-media-${Date.now()}`;
  const optimisticMessage: Message = {
    id: optimisticId,
    conversationId,
    senderId: "current-user",
    senderRole: "cliente",
    senderDisplayName,
    from: "me",
    messageType: "media",
    status: "sending",
    media: {
      id: `local-asset-${Date.now()}`,
      kind: "image",
      name: "Mídia temporária",
      isViewOnce: true,
      openedAt: null,
    },
    sentAt: "agora",
    deliveredAt: null,
    editedAt: null,
    deletedAt: null,
  };

  replaceSnapshot({
    conversations: syncPreview(current, conversationId, "Mídia temporária"),
    messages: [...current.messages, optimisticMessage],
  });

  try {
    const confirmed = await fetchViewOnceMediaMessage(conversationId, senderDisplayName);
    const latest = ensureChatStore();
    replaceSnapshot({
      ...latest,
      messages: latest.messages.map((message) =>
        message.id === optimisticId ? confirmed : message,
      ),
    });
    return { ok: true, messageId: confirmed.id };
  } catch {
    const latest = ensureChatStore();
    replaceSnapshot({
      ...latest,
      messages: latest.messages.map((message) =>
        message.id === optimisticId ? { ...message, status: "failed" } : message,
      ),
    });
    return { ok: false, reason: "adapter_error", messageId: optimisticId };
  }
}

export async function setChatConversationBlocked(
  conversationId: string,
  isBlocked: boolean,
): Promise<ChatMutationResult> {
  const current = ensureChatStore();
  const conversation = current.conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    return { ok: false, reason: "not_found" };
  }

  const previousBlocked = Boolean(conversation.isBlocked);
  replaceSnapshot({
    ...current,
    conversations: current.conversations.map((item) =>
      item.id === conversationId ? { ...item, isBlocked } : item,
    ),
  });

  try {
    await fetchSetConversationBlocked(conversationId, isBlocked);
    return { ok: true };
  } catch {
    const latest = ensureChatStore();
    replaceSnapshot({
      ...latest,
      conversations: latest.conversations.map((item) =>
        item.id === conversationId ? { ...item, isBlocked: previousBlocked } : item,
      ),
    });
    return { ok: false, reason: "adapter_error" };
  }
}

export async function deleteChatConversationFromInbox(
  conversationId: string,
): Promise<ChatMutationResult> {
  const current = ensureChatStore();
  const conversation = current.conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    return { ok: false, reason: "not_found" };
  }

  replaceSnapshot({
    ...current,
    conversations: current.conversations.filter((item) => item.id !== conversationId),
  });

  try {
    await fetchDeleteConversationFromInbox(conversationId);
    return { ok: true };
  } catch {
    const latest = ensureChatStore();
    replaceSnapshot({
      ...latest,
      conversations: latest.conversations.some((c) => c.id === conversationId)
        ? latest.conversations
        : [...latest.conversations, conversation],
    });
    return { ok: false, reason: "adapter_error" };
  }
}

export async function reportChatConversation(
  conversationId: string,
  reason: string,
): Promise<ChatMutationResult> {
  const current = ensureChatStore();
  if (!current.conversations.some((item) => item.id === conversationId)) {
    return { ok: false, reason: "not_found" };
  }

  try {
    await fetchReportConversation(conversationId, reason);
    return { ok: true };
  } catch {
    return { ok: false, reason: "adapter_error" };
  }
}

export async function updateChatParticipantAlias(
  conversationId: string,
  alias: string | null,
): Promise<ChatMutationResult> {
  const current = ensureChatStore();
  const conversation = current.conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    return { ok: false, reason: "not_found" };
  }

  const previousAlias = conversation.currentUserAlias;
  const nextAlias = alias && alias.trim() ? alias.trim() : undefined;

  replaceSnapshot({
    ...current,
    conversations: current.conversations.map((item) =>
      item.id === conversationId ? { ...item, currentUserAlias: nextAlias } : item,
    ),
  });

  try {
    await fetchUpdateParticipantAlias(conversationId, nextAlias ?? null);
    return { ok: true };
  } catch {
    const latest = ensureChatStore();
    replaceSnapshot({
      ...latest,
      conversations: latest.conversations.map((item) =>
        item.id === conversationId ? { ...item, currentUserAlias: previousAlias } : item,
      ),
    });
    return { ok: false, reason: "adapter_error" };
  }
}
