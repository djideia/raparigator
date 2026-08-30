import { createMemoryChatEventBus, type ChatEventBus } from "../../src/lib/chat-events";
import { newId } from "../../src/lib/ids";
import { mediaAssets, professionalProfiles } from "../../src/db/schema";
import { createChatService, type ChatActor } from "../../src/modules/chat";
import { createNotificationsService } from "../../src/modules/notifications";
import { createReviewsService } from "../../src/modules/reviews";
import type { TestHarness } from "./app";
import { signUp } from "./auth";

export type ChatFixture = {
  chat: ReturnType<typeof createChatService>;
  reviews: ReturnType<typeof createReviewsService>;
  notifications: ReturnType<typeof createNotificationsService>;
  chatEvents: ChatEventBus;
  client: ChatActor;
  professional: ChatActor;
  profileId: string;
  slug: string;
  conversationId: string;
};

export async function createPublishedProfile(
  harness: TestHarness,
  userId: string,
  overrides: Partial<typeof professionalProfiles.$inferInsert> = {},
) {
  const id = newId();
  const slug = overrides.slug ?? `pro-${id.slice(0, 8)}`;
  await harness.db.insert(professionalProfiles).values({
    id,
    userId,
    slug,
    displayName: "Profissional Teste",
    artisticName: "Luna Teste",
    city: "Sao Paulo",
    state: "SP",
    startingPrice: 300,
    services: ["Jantar", "Viagens"],
    pricingTable: [
      { label: "1 hora", price: 300 },
      { label: "2 horas", price: 550 },
    ],
    listingStatus: "Ativo",
    verificationStatus: "published",
    rating: 4.5,
    reviewsCount: 2,
    ...overrides,
  });
  return { id, slug };
}

export async function createChatFixture(
  harness: TestHarness,
  options: { tag?: string; adTier?: "premium" | "normal"; chatEvents?: ChatEventBus } = {},
): Promise<ChatFixture> {
  const tag = options.tag ?? newId().slice(0, 8);
  const clientUser = await signUp(harness, {
    email: `cli-${tag}@sigillus.dev`,
    name: "Carlos Cliente",
    role: "cliente",
  });
  const proUser = await signUp(harness, {
    email: `pro-${tag}@sigillus.dev`,
    name: "Paula Pro",
    role: "profissional",
  });
  const profile = await createPublishedProfile(harness, proUser.userId, {
    adTier: options.adTier ?? "normal",
  });
  const chatEvents = options.chatEvents ?? createMemoryChatEventBus();
  const logger = harness.deps.logger;
  const profiles = harness.deps.services.profiles;
  const notifications = createNotificationsService({ db: harness.db });
  const chat = createChatService({
    db: harness.db,
    profiles,
    storage: harness.storage,
    chatEvents,
    logger,
    heartbeatMs: 50,
  });
  const reviews = createReviewsService({
    db: harness.db,
    profiles,
    notifications,
    jobs: harness.jobs,
    logger,
  });
  const client: ChatActor = { id: clientUser.userId, role: "cliente", name: "Carlos Cliente" };
  const professional: ChatActor = { id: proUser.userId, role: "profissional", name: "Paula Pro" };
  const { conversationId } = await chat.ensureConversationForAd(client, profile.slug);
  return {
    chat,
    reviews,
    notifications,
    chatEvents,
    client,
    professional,
    profileId: profile.id,
    slug: profile.slug,
    conversationId,
  };
}

export async function createChatAsset(
  harness: TestHarness,
  ownerUserId: string,
  overrides: Partial<typeof mediaAssets.$inferInsert> = {},
) {
  const id = newId();
  await harness.db.insert(mediaAssets).values({
    id,
    ownerUserId,
    kind: "image",
    purpose: "chat",
    status: "ready",
    contentType: "image/jpeg",
    sizeBytes: 1024,
    fileName: "foto.jpg",
    storageKey: `chat/${ownerUserId}/${id}.jpg`,
    ...overrides,
  });
  return id;
}
