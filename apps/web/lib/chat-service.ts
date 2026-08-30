import type { EncounterBrief, Message } from "@/lib/types";

export async function delay(ms = 260): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function fetchTextMessage(
  conversationId: string,
  content: string,
  senderDisplayName: string,
): Promise<Message> {
  // BACKEND: POST /api/chat/conversations/:conversationId/messages
  await delay(420);
  return {
    id: `srv-${Date.now()}`,
    conversationId,
    senderId: "current-user",
    senderRole: "cliente",
    senderDisplayName,
    from: "me",
    content,
    messageType: "text",
    status: "sent",
    sentAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    deliveredAt: null,
    editedAt: null,
    deletedAt: null,
  };
}

export async function fetchBriefMessage(
  conversationId: string,
  brief: EncounterBrief,
  greeting: string,
  senderDisplayName: string,
): Promise<Message> {
  // BACKEND: POST /api/chat/conversations/:conversationId/messages/brief
  await delay(460);
  return {
    id: `brief-${Date.now()}`,
    conversationId,
    senderId: "current-user",
    senderRole: "cliente",
    senderDisplayName,
    from: "me",
    content: greeting,
    messageType: "brief",
    status: "sent",
    brief: { ...brief, extras: [...brief.extras] },
    sentAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    deliveredAt: null,
    editedAt: null,
    deletedAt: null,
  };
}

export async function fetchViewOnceMediaMessage(
  conversationId: string,
  senderDisplayName: string,
): Promise<Message> {
  // BACKEND: POST /api/chat/conversations/:conversationId/messages/media
  await delay(520);
  return {
    id: `media-${Date.now()}`,
    conversationId,
    senderId: "current-user",
    senderRole: "cliente",
    senderDisplayName,
    from: "me",
    messageType: "media",
    status: "sent",
    media: {
      id: `asset-${Date.now()}`,
      kind: "image",
      name: "Mídia temporária",
      isViewOnce: true,
      openedAt: null,
    },
    sentAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    deliveredAt: null,
    editedAt: null,
    deletedAt: null,
  };
}

export async function fetchSetConversationBlocked(
  _conversationId: string,
  _isBlocked: boolean,
): Promise<void> {
  // BACKEND: PATCH /api/chat/conversations/:conversationId/block
  await delay(200);
}

export async function fetchDeleteConversationFromInbox(_conversationId: string): Promise<void> {
  // BACKEND: DELETE /api/chat/conversations/:conversationId/inbox
  await delay(200);
}

export async function fetchReportConversation(
  _conversationId: string,
  _reason: string,
): Promise<void> {
  // BACKEND: POST /api/chat/conversations/:conversationId/report
  await delay(300);
}

export async function fetchUpdateParticipantAlias(
  _conversationId: string,
  _alias: string | null,
): Promise<void> {
  // BACKEND: PATCH /api/chat/conversations/:conversationId/alias
  await delay(200);
}
