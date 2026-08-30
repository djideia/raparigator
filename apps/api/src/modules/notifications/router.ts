import { os, withUser } from "../../orpc/base";

export const notificationsRouter = {
  list: os.notifications.list
    .use(withUser)
    .handler(({ context }) => context.deps.services.notifications.list(context.user.id)),
  markRead: os.notifications.markRead
    .use(withUser)
    .handler(({ context, input }) =>
      context.deps.services.notifications.markRead(context.user.id, input.id),
    ),
  markAllRead: os.notifications.markAllRead
    .use(withUser)
    .handler(({ context }) => context.deps.services.notifications.markAllRead(context.user.id)),
  remove: os.notifications.remove
    .use(withUser)
    .handler(({ context, input }) =>
      context.deps.services.notifications.remove(context.user.id, input.id),
    ),
};
