import { RATE_LIMITS } from "../../lib/rate-limit";
import { os, rateLimited, requireRole, withUser } from "../../orpc/base";

const sendLimit = rateLimited("chat.send", RATE_LIMITS.chatSend);

export const chatRouter = {
  listConversations: os.chat.listConversations
    .use(withUser)
    .handler(({ context }) => context.deps.services.chat.listConversations(context.user)),
  listMessages: os.chat.listMessages
    .use(withUser)
    .handler(({ context, input }) => context.deps.services.chat.listMessages(context.user, input)),
  ensureConversationForAd: os.chat.ensureConversationForAd
    .use(withUser)
    .use(requireRole("cliente"))
    .handler(({ context, input }) =>
      context.deps.services.chat.ensureConversationForAd(context.user, input.adSlug),
    ),
  sendText: os.chat.sendText
    .use(withUser)
    .use(sendLimit)
    .handler(({ context, input }) => context.deps.services.chat.sendText(context.user, input)),
  sendBrief: os.chat.sendBrief
    .use(withUser)
    .use(sendLimit)
    .handler(({ context, input }) => context.deps.services.chat.sendBrief(context.user, input)),
  sendMedia: os.chat.sendMedia
    .use(withUser)
    .use(sendLimit)
    .handler(({ context, input }) => context.deps.services.chat.sendMedia(context.user, input)),
  openViewOnce: os.chat.openViewOnce
    .use(withUser)
    .handler(({ context, input }) =>
      context.deps.services.chat.openViewOnce(context.user, input.messageId),
    ),
  markRead: os.chat.markRead
    .use(withUser)
    .handler(({ context, input }) =>
      context.deps.services.chat.markRead(context.user, input.conversationId),
    ),
  setBlocked: os.chat.setBlocked
    .use(withUser)
    .handler(({ context, input }) => context.deps.services.chat.setBlocked(context.user, input)),
  deleteFromInbox: os.chat.deleteFromInbox
    .use(withUser)
    .handler(({ context, input }) =>
      context.deps.services.chat.deleteFromInbox(context.user, input.conversationId),
    ),
  report: os.chat.report
    .use(withUser)
    .use(rateLimited("chat.report", RATE_LIMITS.report))
    .handler(({ context, input }) => context.deps.services.chat.report(context.user, input)),
  updateAlias: os.chat.updateAlias
    .use(withUser)
    .handler(({ context, input }) => context.deps.services.chat.updateAlias(context.user, input)),
  subscribe: os.chat.subscribe
    .use(withUser)
    .handler(({ context, input, signal }) =>
      context.deps.services.chat.subscribe(context.user, input, signal),
    ),
};
