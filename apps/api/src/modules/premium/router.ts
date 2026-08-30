import { os, professional } from "../../orpc/base";

export const premiumRouter = {
  getState: professional.premium.getState.handler(({ context }) =>
    context.deps.services.premium.getState(context.user.id),
  ),
  plans: os.premium.plans.handler(({ context }) => context.deps.services.premium.plans()),
  startSubscription: professional.premium.startSubscription.handler(({ context, input }) =>
    context.deps.services.premium.startSubscription(
      { id: context.user.id, email: context.user.email },
      { cycle: input.cycle },
    ),
  ),
  cancelSubscription: professional.premium.cancelSubscription.handler(({ context }) =>
    context.deps.services.premium.cancelSubscription(context.user.id),
  ),
};
