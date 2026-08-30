import { os } from "../../orpc/base";

export const adsRouter = {
  getBySlug: os.ads.getBySlug.handler(({ context, input }) =>
    context.deps.services.ads.getBySlug(input.slug),
  ),
  listPopular: os.ads.listPopular.handler(({ context, input }) =>
    context.deps.services.ads.listPopular(input.kind, input.limit),
  ),
  mediaHighlights: os.ads.mediaHighlights.handler(({ context }) =>
    context.deps.services.ads.mediaHighlights(),
  ),
  registerView: os.ads.registerView.handler(({ context, input }) =>
    context.deps.services.ads.registerView(input.slug),
  ),
};
