import type { AdminSession } from "@sigillus/contracts";
import { admin, os } from "../../orpc/base";
import { getAdminSession, type AppContext } from "../../orpc/context";

export async function resolveAdminSession(context: AppContext): Promise<AdminSession> {
  const session = await getAdminSession(context);
  if (!session) {
    return { admin: null };
  }
  return {
    admin: {
      id: session.user.id,
      fullName: session.user.name,
      email: session.user.email,
      role: "admin",
    },
  };
}

export const adminRouter = {
  me: os.admin.me.handler(({ context }) => resolveAdminSession(context)),
  dashboard: admin.admin.dashboard.handler(({ context }) =>
    context.deps.services.admin.dashboard(),
  ),
  activity: admin.admin.activity.handler(({ context, input }) =>
    context.deps.services.admin.activity(input),
  ),
  clients: admin.admin.clients.handler(({ context, input }) =>
    context.deps.services.admin.clients(input),
  ),
  suspendClient: admin.admin.suspendClient.handler(({ context, input }) =>
    context.deps.services.admin.suspendClient(context.admin, input),
  ),
  reinstateClient: admin.admin.reinstateClient.handler(({ context, input }) =>
    context.deps.services.admin.reinstateClient(context.admin, input),
  ),
  professionals: admin.admin.professionals.handler(({ context, input }) =>
    context.deps.services.admin.professionals(input),
  ),
  profile: admin.admin.profile.handler(({ context, input }) =>
    context.deps.services.admin.profile(input),
  ),
  approveProfile: admin.admin.approveProfile.handler(({ context, input }) =>
    context.deps.services.admin.approveProfile(context.admin, input),
  ),
  rejectProfile: admin.admin.rejectProfile.handler(({ context, input }) =>
    context.deps.services.admin.rejectProfile(context.admin, input),
  ),
  suspendProfessional: admin.admin.suspendProfessional.handler(({ context, input }) =>
    context.deps.services.admin.suspendProfessional(context.admin, input),
  ),
  reinstateProfessional: admin.admin.reinstateProfessional.handler(({ context, input }) =>
    context.deps.services.admin.reinstateProfessional(context.admin, input),
  ),
  reports: admin.admin.reports.handler(({ context, input }) =>
    context.deps.services.admin.reports(input),
  ),
  startReportReview: admin.admin.startReportReview.handler(({ context, input }) =>
    context.deps.services.admin.startReportReview(input),
  ),
  resolveReport: admin.admin.resolveReport.handler(({ context, input }) =>
    context.deps.services.admin.resolveReport(input),
  ),
  search: admin.admin.search.handler(({ context, input }) =>
    context.deps.services.admin.search(input),
  ),
};
