import { eventIterator, oc } from "@orpc/contract";
import { z } from "zod";
import {
  AdminActivityLogSchema,
  DashboardStatsSchema,
  GlobalSearchResultSchema,
  ReportSchema,
  ReportStatusSchema,
  ReportTypeSchema,
} from "./schemas/admin";
import {
  CatalogsSchema,
  FeedAdSummarySchema,
  MediaHighlightSchema,
  ProfessionalAdSchema,
} from "./schemas/ad";
import {
  AnnouncementDraftStateSchema,
  AnnouncementListingStatusSchema,
  AnnouncementProfileScoreSchema,
  AnnouncementPublishResultSchema,
  AnnouncementSaveSectionResultSchema,
  AnnouncementSectionKeySchema,
  AnnouncementSmartTipSchema,
} from "./schemas/announcement-draft";
import {
  CreateUploadInputSchema,
  CreateUploadOutputSchema,
  MediaAssetSchema,
  MediaPurposeSchema,
} from "./schemas/announcement-media";
import {
  ChatEventSchema,
  ChatMutationResultSchema,
  ConversationSchema,
  EncounterBriefSchema,
  MessageSchema,
} from "./schemas/chat";
import {
  AvailabilityStatusSchema,
  IdSchema,
  OkSchema,
  PaginationInputSchema,
  SlugSchema,
  VerificationStatusSchema,
  paginated,
} from "./schemas/common";
import { FeedFiltersCriteriaSchema, FeedSortSchema } from "./schemas/feed";
import { VerificationChannelSchema, VerificationPublicStateSchema } from "./schemas/identity";
import { AccountNotificationItemSchema } from "./schemas/notifications";
import {
  PremiumPlanOptionSchema,
  PremiumStateSchema,
  StartSubscriptionInputSchema,
  StartSubscriptionOutputSchema,
} from "./schemas/premium";
import {
  AdReviewsSummarySchema,
  InviteStatusSchema,
  ReviewInviteSchema,
  SubmitReviewInputSchema,
} from "./schemas/reviews";
import {
  AdminReviewActionSchema,
  AdminSessionSchema,
  ClientAccountSchema,
  SessionSchema,
} from "./schemas/user";

const base = oc.errors({
  UNAUTHORIZED: { message: "Sessão necessária." },
  FORBIDDEN: { message: "Sem permissão para este recurso." },
  NOT_FOUND: { message: "Recurso não encontrado." },
  CONFLICT: { message: "Estado atual não permite a operação." },
  RATE_LIMITED: { message: "Muitas tentativas. Aguarde um instante." },
  PLAN_LIMIT: { message: "Limite do plano atingido." },
});

export const authContract = {
  me: base.route({ method: "GET", path: "/auth/me" }).output(SessionSchema),
};

export const catalogsContract = {
  get: base.route({ method: "GET", path: "/catalogs" }).output(CatalogsSchema),
};

export const feedContract = {
  list: base
    .route({ method: "POST", path: "/feed/list" })
    .input(
      z.object({
        criteria: FeedFiltersCriteriaSchema,
        sort: FeedSortSchema.default("relevance"),
        pagination: PaginationInputSchema.default({ page: 1, pageSize: 20 }),
      }),
    )
    .output(paginated(FeedAdSummarySchema)),
};

export const adsContract = {
  getBySlug: base
    .route({ method: "GET", path: "/ads/{slug}" })
    .input(z.object({ slug: SlugSchema }))
    .output(ProfessionalAdSchema.nullable()),
  listPopular: base
    .route({ method: "GET", path: "/ads/popular" })
    .input(
      z.object({
        kind: z.enum(["most_viewed", "top_rated"]),
        limit: z.number().int().min(1).max(50).default(12),
      }),
    )
    .output(z.array(FeedAdSummarySchema)),
  mediaHighlights: base
    .route({ method: "GET", path: "/ads/media-highlights" })
    .output(z.array(MediaHighlightSchema)),
  registerView: base
    .route({ method: "POST", path: "/ads/{slug}/view" })
    .input(z.object({ slug: SlugSchema }))
    .output(OkSchema),
};

export const announcementsContract = {
  getMine: base.route({ method: "GET", path: "/announcements/mine" }).output(
    z.object({
      ad: ProfessionalAdSchema.nullable(),
      draft: AnnouncementDraftStateSchema.nullable(),
      listingStatus: AnnouncementListingStatusSchema,
      score: AnnouncementProfileScoreSchema.nullable(),
      tips: z.array(AnnouncementSmartTipSchema),
    }),
  ),
  saveDraft: base
    .route({ method: "PUT", path: "/announcements/mine/draft" })
    .input(z.object({ draft: AnnouncementDraftStateSchema }))
    .output(z.object({ savedAt: z.string() })),
  saveSection: base
    .route({ method: "POST", path: "/announcements/mine/sections/{section}" })
    .input(z.object({ section: AnnouncementSectionKeySchema, draft: AnnouncementDraftStateSchema }))
    .output(AnnouncementSaveSectionResultSchema),
  publish: base
    .route({ method: "POST", path: "/announcements/mine/publish" })
    .input(z.object({ draft: AnnouncementDraftStateSchema }))
    .output(AnnouncementPublishResultSchema),
  setListingStatus: base
    .route({ method: "POST", path: "/announcements/mine/listing-status" })
    .input(z.object({ status: AnnouncementListingStatusSchema }))
    .output(OkSchema),
  setAvailability: base
    .route({ method: "POST", path: "/announcements/mine/availability" })
    .input(z.object({ status: AvailabilityStatusSchema }))
    .output(OkSchema),
  setContact: base
    .route({ method: "POST", path: "/announcements/mine/contact" })
    .input(
      z.object({
        whatsappNumber: z
          .string()
          .regex(/^\d{10,15}$/)
          .nullable(),
        telegramUsername: z
          .string()
          .regex(/^[A-Za-z0-9_]{5,32}$/)
          .nullable(),
      }),
    )
    .output(OkSchema),
};

export const mediaContract = {
  createUpload: base
    .route({ method: "POST", path: "/media/uploads" })
    .input(CreateUploadInputSchema)
    .output(CreateUploadOutputSchema),
  completeUpload: base
    .route({ method: "POST", path: "/media/uploads/{assetId}/complete" })
    .input(z.object({ assetId: IdSchema }))
    .output(MediaAssetSchema),
  get: base
    .route({ method: "GET", path: "/media/{assetId}" })
    .input(z.object({ assetId: IdSchema }))
    .output(MediaAssetSchema),
  listMine: base
    .route({ method: "GET", path: "/media" })
    .input(z.object({ purpose: MediaPurposeSchema.optional() }))
    .output(z.array(MediaAssetSchema)),
  remove: base
    .route({ method: "DELETE", path: "/media/{assetId}" })
    .input(z.object({ assetId: IdSchema }))
    .output(OkSchema),
  reorder: base
    .route({ method: "POST", path: "/media/reorder" })
    .input(z.object({ assetIds: z.array(IdSchema).max(150) }))
    .output(OkSchema),
  setProfileImage: base
    .route({ method: "POST", path: "/media/profile-image" })
    .input(z.object({ assetId: IdSchema.nullable() }))
    .output(OkSchema),
};

export const chatContract = {
  listConversations: base
    .route({ method: "GET", path: "/chat/conversations" })
    .output(z.array(ConversationSchema)),
  listMessages: base
    .route({ method: "GET", path: "/chat/conversations/{conversationId}/messages" })
    .input(
      z.object({
        conversationId: IdSchema,
        before: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .output(z.object({ items: z.array(MessageSchema), hasMore: z.boolean() })),
  ensureConversationForAd: base
    .route({ method: "POST", path: "/chat/conversations/for-ad" })
    .input(z.object({ adSlug: SlugSchema }))
    .output(z.object({ conversationId: IdSchema })),
  sendText: base
    .route({ method: "POST", path: "/chat/conversations/{conversationId}/messages" })
    .input(
      z.object({
        conversationId: IdSchema,
        content: z.string().trim().min(1).max(4000),
        clientMessageId: z.string().max(64).optional(),
      }),
    )
    .output(z.object({ message: MessageSchema })),
  sendBrief: base
    .route({ method: "POST", path: "/chat/conversations/{conversationId}/messages/brief" })
    .input(
      z.object({
        conversationId: IdSchema,
        brief: EncounterBriefSchema,
        greeting: z.string().trim().min(1).max(1000),
        clientMessageId: z.string().max(64).optional(),
      }),
    )
    .output(z.object({ message: MessageSchema })),
  sendMedia: base
    .route({ method: "POST", path: "/chat/conversations/{conversationId}/messages/media" })
    .input(
      z.object({
        conversationId: IdSchema,
        assetId: IdSchema,
        isViewOnce: z.boolean(),
        clientMessageId: z.string().max(64).optional(),
      }),
    )
    .output(z.object({ message: MessageSchema })),
  openViewOnce: base
    .route({ method: "POST", path: "/chat/messages/{messageId}/open" })
    .input(z.object({ messageId: IdSchema }))
    .output(z.object({ openedAt: z.string(), url: z.string().nullable() })),
  markRead: base
    .route({ method: "POST", path: "/chat/conversations/{conversationId}/read" })
    .input(z.object({ conversationId: IdSchema }))
    .output(OkSchema),
  setBlocked: base
    .route({ method: "PATCH", path: "/chat/conversations/{conversationId}/block" })
    .input(z.object({ conversationId: IdSchema, isBlocked: z.boolean() }))
    .output(ChatMutationResultSchema),
  deleteFromInbox: base
    .route({ method: "DELETE", path: "/chat/conversations/{conversationId}/inbox" })
    .input(z.object({ conversationId: IdSchema }))
    .output(ChatMutationResultSchema),
  report: base
    .route({ method: "POST", path: "/chat/conversations/{conversationId}/report" })
    .input(
      z.object({
        conversationId: IdSchema,
        type: ReportTypeSchema.default("other"),
        reason: z.string().trim().min(3).max(2000),
      }),
    )
    .output(ChatMutationResultSchema),
  updateAlias: base
    .route({ method: "PATCH", path: "/chat/conversations/{conversationId}/alias" })
    .input(z.object({ conversationId: IdSchema, alias: z.string().trim().max(60).nullable() }))
    .output(ChatMutationResultSchema),
  subscribe: base
    .route({ method: "GET", path: "/chat/events" })
    .input(z.object({ conversationId: IdSchema.optional() }))
    .output(eventIterator(ChatEventSchema)),
};

export const reviewsContract = {
  listForAd: base
    .route({ method: "GET", path: "/reviews/ad/{slug}" })
    .input(z.object({ slug: SlugSchema }))
    .output(AdReviewsSummarySchema),
  getInvite: base
    .route({ method: "GET", path: "/reviews/invites/{conversationId}" })
    .input(z.object({ conversationId: IdSchema }))
    .output(z.object({ invite: ReviewInviteSchema.nullable(), status: InviteStatusSchema })),
  listMyInvites: base
    .route({ method: "GET", path: "/reviews/invites" })
    .output(z.array(ReviewInviteSchema)),
  invite: base
    .route({ method: "POST", path: "/reviews/invites/{conversationId}" })
    .input(z.object({ conversationId: IdSchema }))
    .output(z.object({ invite: ReviewInviteSchema })),
  withdrawInvite: base
    .route({ method: "DELETE", path: "/reviews/invites/{conversationId}" })
    .input(z.object({ conversationId: IdSchema }))
    .output(OkSchema),
  submit: base
    .route({ method: "POST", path: "/reviews" })
    .input(SubmitReviewInputSchema)
    .output(z.object({ reviewId: IdSchema })),
};

export const verificationContract = {
  getState: base
    .route({ method: "GET", path: "/verification" })
    .output(VerificationPublicStateSchema),
  sendCode: base
    .route({ method: "POST", path: "/verification/{channel}/send" })
    .input(z.object({ channel: VerificationChannelSchema }))
    .output(z.object({ expiresAt: z.string(), devCode: z.string().nullable() })),
  confirmCode: base
    .route({ method: "POST", path: "/verification/{channel}/confirm" })
    .input(z.object({ channel: VerificationChannelSchema, code: z.string().regex(/^\d{6}$/) }))
    .output(z.object({ success: z.boolean(), message: z.string() })),
};

export const notificationsContract = {
  list: base
    .route({ method: "GET", path: "/notifications" })
    .output(z.array(AccountNotificationItemSchema)),
  markRead: base
    .route({ method: "POST", path: "/notifications/{id}/read" })
    .input(z.object({ id: IdSchema }))
    .output(OkSchema),
  markAllRead: base.route({ method: "POST", path: "/notifications/read-all" }).output(OkSchema),
  remove: base
    .route({ method: "DELETE", path: "/notifications/{id}" })
    .input(z.object({ id: IdSchema }))
    .output(OkSchema),
};

export const premiumContract = {
  getState: base.route({ method: "GET", path: "/premium" }).output(PremiumStateSchema),
  plans: base
    .route({ method: "GET", path: "/premium/plans" })
    .output(z.array(PremiumPlanOptionSchema)),
  startSubscription: base
    .route({ method: "POST", path: "/premium/subscribe" })
    .input(StartSubscriptionInputSchema)
    .output(StartSubscriptionOutputSchema),
  cancelSubscription: base
    .route({ method: "POST", path: "/premium/cancel" })
    .output(PremiumStateSchema),
};

export const adminContract = {
  me: base.route({ method: "GET", path: "/admin/me" }).output(AdminSessionSchema),
  dashboard: base.route({ method: "GET", path: "/admin/dashboard" }).output(DashboardStatsSchema),
  activity: base
    .route({ method: "GET", path: "/admin/activity" })
    .input(PaginationInputSchema)
    .output(paginated(AdminActivityLogSchema)),
  clients: base
    .route({ method: "GET", path: "/admin/clients" })
    .input(z.object({ status: z.enum(["active", "suspended"]).optional() }))
    .output(z.array(ClientAccountSchema)),
  suspendClient: base
    .route({ method: "POST", path: "/admin/clients/{id}/suspend" })
    .input(z.object({ id: IdSchema, reason: z.string().trim().min(3).max(500) }))
    .output(OkSchema),
  reinstateClient: base
    .route({ method: "POST", path: "/admin/clients/{id}/reinstate" })
    .input(z.object({ id: IdSchema }))
    .output(OkSchema),
  professionals: base
    .route({ method: "GET", path: "/admin/professionals" })
    .input(z.object({ status: VerificationStatusSchema.optional() }))
    .output(z.array(ProfessionalAdSchema)),
  profile: base
    .route({ method: "GET", path: "/admin/profiles/{id}" })
    .input(z.object({ id: IdSchema }))
    .output(ProfessionalAdSchema.nullable()),
  approveProfile: base
    .route({ method: "POST", path: "/admin/profiles/{id}/approve" })
    .input(z.object({ id: IdSchema, note: z.string().trim().max(500).optional() }))
    .output(AdminReviewActionSchema),
  rejectProfile: base
    .route({ method: "POST", path: "/admin/profiles/{id}/reject" })
    .input(z.object({ id: IdSchema, reason: z.string().trim().min(3).max(500) }))
    .output(AdminReviewActionSchema),
  suspendProfessional: base
    .route({ method: "POST", path: "/admin/professionals/{id}/suspend" })
    .input(z.object({ id: IdSchema, reason: z.string().trim().min(3).max(500) }))
    .output(OkSchema),
  reinstateProfessional: base
    .route({ method: "POST", path: "/admin/professionals/{id}/reinstate" })
    .input(z.object({ id: IdSchema }))
    .output(OkSchema),
  reports: base
    .route({ method: "GET", path: "/admin/reports" })
    .input(z.object({ status: ReportStatusSchema.optional() }))
    .output(z.array(ReportSchema)),
  startReportReview: base
    .route({ method: "POST", path: "/admin/reports/{id}/start-review" })
    .input(z.object({ id: IdSchema }))
    .output(OkSchema),
  resolveReport: base
    .route({ method: "POST", path: "/admin/reports/{id}/resolve" })
    .input(
      z.object({
        id: IdSchema,
        resolution: z.enum(["resolved", "dismissed"]),
        note: z.string().trim().max(1000),
      }),
    )
    .output(OkSchema),
  search: base
    .route({ method: "GET", path: "/admin/search" })
    .input(z.object({ q: z.string().trim().min(1).max(100) }))
    .output(z.array(GlobalSearchResultSchema)),
};

export const contract = {
  auth: authContract,
  catalogs: catalogsContract,
  feed: feedContract,
  ads: adsContract,
  announcements: announcementsContract,
  media: mediaContract,
  chat: chatContract,
  reviews: reviewsContract,
  verification: verificationContract,
  notifications: notificationsContract,
  premium: premiumContract,
  admin: adminContract,
};

export type Contract = typeof contract;
