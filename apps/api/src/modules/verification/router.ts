import { RATE_LIMITS } from "../../lib/rate-limit";
import { authed, rateLimited } from "../../orpc/base";

export const verificationRouter = {
  getState: authed.verification.getState.handler(({ context }) =>
    context.deps.services.verification.getState(context.user),
  ),
  sendCode: authed.verification.sendCode
    .use(rateLimited("verification.send", RATE_LIMITS.verificationSend))
    .handler(({ context, input }) =>
      context.deps.services.verification.sendCode(context.user, input.channel),
    ),
  confirmCode: authed.verification.confirmCode
    .use(rateLimited("verification.confirm", RATE_LIMITS.verificationConfirm))
    .handler(({ context, input }) =>
      context.deps.services.verification.confirmCode(context.user, input.channel, input.code),
    ),
};
