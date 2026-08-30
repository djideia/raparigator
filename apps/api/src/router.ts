import { os } from "./orpc/base";
import { adminRouter } from "./modules/admin/router";
import { adsRouter } from "./modules/ads/router";
import { announcementsRouter } from "./modules/announcements/router";
import { authRouter } from "./modules/auth/router";
import { catalogsRouter } from "./modules/catalogs/router";
import { chatRouter } from "./modules/chat/router";
import { feedRouter } from "./modules/feed/router";
import { mediaRouter } from "./modules/media/router";
import { notificationsRouter } from "./modules/notifications/router";
import { premiumRouter } from "./modules/premium/router";
import { reviewsRouter } from "./modules/reviews/router";
import { verificationRouter } from "./modules/verification/router";

export const router = os.router({
  auth: authRouter,
  catalogs: catalogsRouter,
  feed: feedRouter,
  ads: adsRouter,
  announcements: announcementsRouter,
  media: mediaRouter,
  chat: chatRouter,
  reviews: reviewsRouter,
  notifications: notificationsRouter,
  premium: premiumRouter,
  verification: verificationRouter,
  admin: adminRouter,
});

export type AppRouter = typeof router;
