import { RATE_LIMITS } from "../../lib/rate-limit";
import { os, rateLimited, requireRole, withUser } from "../../orpc/base";

export const reviewsRouter = {
  listForAd: os.reviews.listForAd.handler(({ context, input }) =>
    context.deps.services.reviews.listForAd(input.slug),
  ),
  getInvite: os.reviews.getInvite
    .use(withUser)
    .handler(({ context, input }) =>
      context.deps.services.reviews.getInvite(context.user, input.conversationId),
    ),
  listMyInvites: os.reviews.listMyInvites
    .use(withUser)
    .handler(({ context }) => context.deps.services.reviews.listMyInvites(context.user)),
  invite: os.reviews.invite
    .use(withUser)
    .use(requireRole("profissional"))
    .handler(({ context, input }) =>
      context.deps.services.reviews.invite(context.user, input.conversationId),
    ),
  withdrawInvite: os.reviews.withdrawInvite
    .use(withUser)
    .use(requireRole("profissional"))
    .handler(({ context, input }) =>
      context.deps.services.reviews.withdrawInvite(context.user, input.conversationId),
    ),
  submit: os.reviews.submit
    .use(withUser)
    .use(requireRole("cliente"))
    .use(rateLimited("review", RATE_LIMITS.review))
    .handler(({ context, input }) => context.deps.services.reviews.submit(context.user, input)),
};
