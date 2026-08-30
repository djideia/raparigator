import type { AppConfig } from "./config";
import type { Database } from "./db/client";
import type { BillingProvider } from "./lib/billing/provider";
import type { ChatEventBus } from "./lib/chat-events";
import type { JobQueue } from "./lib/jobs";
import type { Logger } from "./lib/logger";
import type { ObjectStorage } from "./lib/storage";
import { createAdminService } from "./modules/admin/service";
import { createAdsService } from "./modules/ads/service";
import { createAnnouncementsService } from "./modules/announcements/service";
import { createCatalogsService } from "./modules/catalogs/service";
import { createChatService } from "./modules/chat/service";
import { createFeedService } from "./modules/feed/service";
import { createMediaService } from "./modules/media/service";
import { createNotificationsService } from "./modules/notifications/service";
import { createPremiumService } from "./modules/premium/service";
import { createProfileRepository } from "./modules/profiles/repository";
import { createReviewsService } from "./modules/reviews/service";
import { createVerificationService } from "./modules/verification/service";

export type ServiceDeps = {
  config: AppConfig;
  db: Database;
  logger: Logger;
  storage: ObjectStorage;
  jobs: JobQueue;
  chatEvents: ChatEventBus;
  billing: BillingProvider;
};

export type Services = ReturnType<typeof createServices>;

export function createServices(deps: ServiceDeps) {
  const { db, logger, storage, jobs, chatEvents, billing, config } = deps;
  const profiles = createProfileRepository(db, storage);
  const notifications = createNotificationsService({ db });
  return {
    profiles,
    notifications,
    catalogs: createCatalogsService(db),
    feed: createFeedService(profiles),
    ads: createAdsService(db, profiles),
    announcements: createAnnouncementsService({ db, profiles, logger }),
    media: createMediaService({ db, profiles, storage, jobs, logger }),
    chat: createChatService({ db, profiles, storage, chatEvents, logger }),
    reviews: createReviewsService({ db, profiles, notifications, jobs, logger }),
    premium: createPremiumService({ db, billing, config, jobs, logger }),
    verification: createVerificationService({ db, config, logger }),
    admin: createAdminService({
      db,
      profiles,
      logger,
      notify: async (userId, item) => {
        await notifications.push(userId, item);
      },
    }),
  };
}
