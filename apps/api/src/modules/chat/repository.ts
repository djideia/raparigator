import { and, desc, eq, inArray, isNull, lt, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Database } from "../../db/client";
import {
  conversationParticipants,
  conversations,
  mediaAssets,
  messages,
  professionalProfiles,
  reports,
  users,
} from "../../db/schema";
import { newId } from "../../lib/ids";

export type ConversationRow = typeof conversations.$inferSelect;
export type ParticipantRow = typeof conversationParticipants.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;
export type MessageInsert = typeof messages.$inferInsert;
export type ReportInsert = typeof reports.$inferInsert;

export type ConversationProfile = {
  id: string;
  slug: string;
  artisticName: string;
  adTier: "premium" | "normal";
  pricingTable: (typeof professionalProfiles.$inferSelect)["pricingTable"];
  startingPrice: number;
  services: string[];
};

export type ConversationUser = { id: string; name: string };

export type ConversationContext = {
  conversation: ConversationRow;
  profile: ConversationProfile;
  clientUser: ConversationUser;
  professionalUser: ConversationUser;
  clientParticipant: ParticipantRow;
  professionalParticipant: ParticipantRow;
};

export type ChatMediaAsset = {
  id: string;
  ownerUserId: string;
  kind: "image" | "video";
  purpose: "gallery" | "profile" | "chat";
  status: "pending_upload" | "processing" | "ready" | "rejected" | "failed";
  fileName: string | null;
  storageKey: string;
};

const clientUsers = alias(users, "client_user");
const professionalUsers = alias(users, "professional_user");
const clientParticipants = alias(conversationParticipants, "client_participant");
const professionalParticipants = alias(conversationParticipants, "professional_participant");

const profileColumns = {
  id: professionalProfiles.id,
  slug: professionalProfiles.slug,
  artisticName: professionalProfiles.artisticName,
  adTier: professionalProfiles.adTier,
  pricingTable: professionalProfiles.pricingTable,
  startingPrice: professionalProfiles.startingPrice,
  services: professionalProfiles.services,
};

const mediaColumns = {
  id: mediaAssets.id,
  ownerUserId: mediaAssets.ownerUserId,
  kind: mediaAssets.kind,
  purpose: mediaAssets.purpose,
  status: mediaAssets.status,
  fileName: mediaAssets.fileName,
  storageKey: mediaAssets.storageKey,
};

export type ChatRepository = ReturnType<typeof createChatRepository>;

export function createChatRepository(db: Database) {
  function contextQuery() {
    return db
      .select({
        conversation: conversations,
        profile: profileColumns,
        clientUser: { id: clientUsers.id, name: clientUsers.name },
        professionalUser: { id: professionalUsers.id, name: professionalUsers.name },
        clientParticipant: clientParticipants,
        professionalParticipant: professionalParticipants,
      })
      .from(conversations)
      .innerJoin(professionalProfiles, eq(professionalProfiles.id, conversations.profileId))
      .innerJoin(clientUsers, eq(clientUsers.id, conversations.clientUserId))
      .innerJoin(professionalUsers, eq(professionalUsers.id, conversations.professionalUserId))
      .innerJoin(
        clientParticipants,
        and(
          eq(clientParticipants.conversationId, conversations.id),
          eq(clientParticipants.userId, conversations.clientUserId),
        ),
      )
      .innerJoin(
        professionalParticipants,
        and(
          eq(professionalParticipants.conversationId, conversations.id),
          eq(professionalParticipants.userId, conversations.professionalUserId),
        ),
      );
  }

  return {
    async findContext(conversationId: string): Promise<ConversationContext | null> {
      const [row] = await contextQuery().where(eq(conversations.id, conversationId)).limit(1);
      return row ?? null;
    },

    async findContextByProfileAndClient(
      profileId: string,
      clientUserId: string,
    ): Promise<ConversationContext | null> {
      const [row] = await contextQuery()
        .where(
          and(eq(conversations.profileId, profileId), eq(conversations.clientUserId, clientUserId)),
        )
        .limit(1);
      return row ?? null;
    },

    async listContextsForUser(userId: string): Promise<ConversationContext[]> {
      const rows = await contextQuery()
        .where(
          sql`(${clientParticipants.userId} = ${userId} and ${clientParticipants.deletedFromInboxAt} is null) or (${professionalParticipants.userId} = ${userId} and ${professionalParticipants.deletedFromInboxAt} is null)`,
        )
        .orderBy(desc(sql`coalesce(${conversations.lastMessageAt}, ${conversations.createdAt})`));
      return rows;
    },

    async createConversation(input: {
      profileId: string;
      clientUserId: string;
      professionalUserId: string;
    }): Promise<string> {
      return db.transaction(async (tx) => {
        const conversationId = newId();
        const inserted = await tx
          .insert(conversations)
          .values({
            id: conversationId,
            profileId: input.profileId,
            clientUserId: input.clientUserId,
            professionalUserId: input.professionalUserId,
          })
          .onConflictDoNothing({ target: [conversations.profileId, conversations.clientUserId] })
          .returning({ id: conversations.id });
        if (inserted.length === 0) {
          const [existing] = await tx
            .select({ id: conversations.id })
            .from(conversations)
            .where(
              and(
                eq(conversations.profileId, input.profileId),
                eq(conversations.clientUserId, input.clientUserId),
              ),
            )
            .limit(1);
          return existing!.id;
        }
        await tx.insert(conversationParticipants).values([
          { id: newId(), conversationId, userId: input.clientUserId, role: "cliente" },
          { id: newId(), conversationId, userId: input.professionalUserId, role: "profissional" },
        ]);
        return conversationId;
      });
    },

    async updateParticipant(
      participantId: string,
      values: Partial<Omit<ParticipantRow, "id" | "conversationId" | "userId" | "role">>,
    ) {
      await db
        .update(conversationParticipants)
        .set(values)
        .where(eq(conversationParticipants.id, participantId));
    },

    async listMessages(conversationId: string, before: Date | null, limit: number) {
      const conditions = [eq(messages.conversationId, conversationId), isNull(messages.deletedAt)];
      if (before) {
        conditions.push(lt(messages.sentAt, before));
      }
      const rows = await db
        .select()
        .from(messages)
        .where(and(...conditions))
        .orderBy(desc(messages.sentAt), desc(messages.id))
        .limit(limit + 1);
      const hasMore = rows.length > limit;
      const page = (hasMore ? rows.slice(0, limit) : rows).reverse();
      return { rows: page, hasMore };
    },

    async listMessagesForGate(conversationId: string) {
      return db
        .select({ senderRole: messages.senderRole })
        .from(messages)
        .where(and(eq(messages.conversationId, conversationId), isNull(messages.deletedAt)));
    },

    async findMessage(messageId: string): Promise<MessageRow | null> {
      const [row] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
      return row ?? null;
    },

    async findMessageByClientId(
      conversationId: string,
      senderUserId: string,
      clientMessageId: string,
    ): Promise<MessageRow | null> {
      const [row] = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(messages.senderUserId, senderUserId),
            eq(messages.clientMessageId, clientMessageId),
          ),
        )
        .limit(1);
      return row ?? null;
    },

    async insertMessage(values: MessageInsert): Promise<MessageRow | null> {
      const [row] = await db
        .insert(messages)
        .values(values)
        .onConflictDoNothing({
          target: [messages.conversationId, messages.senderUserId, messages.clientMessageId],
        })
        .returning();
      return row ?? null;
    },

    async recordSent(input: {
      conversationId: string;
      recipientUserId: string;
      preview: string;
      sentAt: Date;
    }) {
      await db.transaction(async (tx) => {
        await tx
          .update(conversations)
          .set({
            lastMessagePreview: input.preview,
            lastMessageAt: input.sentAt,
            updatedAt: input.sentAt,
          })
          .where(eq(conversations.id, input.conversationId));
        await tx
          .update(conversationParticipants)
          .set({
            unreadCount: sql`${conversationParticipants.unreadCount} + 1`,
            deletedFromInboxAt: null,
          })
          .where(
            and(
              eq(conversationParticipants.conversationId, input.conversationId),
              eq(conversationParticipants.userId, input.recipientUserId),
            ),
          );
      });
    },

    async markDelivered(conversationId: string, recipientUserId: string, at: Date) {
      return db
        .update(messages)
        .set({ deliveredAt: at })
        .where(
          and(
            eq(messages.conversationId, conversationId),
            ne(messages.senderUserId, recipientUserId),
            isNull(messages.deliveredAt),
            isNull(messages.deletedAt),
          ),
        )
        .returning({ id: messages.id, senderUserId: messages.senderUserId });
    },

    async markOpened(messageId: string, at: Date): Promise<boolean> {
      const updated = await db
        .update(messages)
        .set({ openedAt: at })
        .where(and(eq(messages.id, messageId), isNull(messages.openedAt)))
        .returning({ id: messages.id });
      return updated.length > 0;
    },

    async findMediaAsset(assetId: string): Promise<ChatMediaAsset | null> {
      const [row] = await db
        .select(mediaColumns)
        .from(mediaAssets)
        .where(eq(mediaAssets.id, assetId))
        .limit(1);
      return row ?? null;
    },

    async listMediaAssets(assetIds: string[]): Promise<Map<string, ChatMediaAsset>> {
      const result = new Map<string, ChatMediaAsset>();
      if (assetIds.length === 0) {
        return result;
      }
      const rows = await db
        .select(mediaColumns)
        .from(mediaAssets)
        .where(inArray(mediaAssets.id, assetIds));
      for (const row of rows) {
        result.set(row.id, row);
      }
      return result;
    },

    async insertReport(values: ReportInsert) {
      await db.insert(reports).values(values);
    },
  };
}
