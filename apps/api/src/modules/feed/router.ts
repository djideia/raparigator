import { os } from "../../orpc/base";

export const feedRouter = {
  list: os.feed.list.handler(({ context, input }) =>
    context.deps.services.feed.list(input.criteria, input.sort, input.pagination),
  ),
};
