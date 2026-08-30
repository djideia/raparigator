import { z } from "zod";

export const AdminActivityActionSchema = z.enum([
  "profile_approved",
  "profile_rejected",
  "profile_submitted",
  "client_registered",
  "account_suspended",
  "account_reinstated",
]);
export type AdminActivityAction = z.infer<typeof AdminActivityActionSchema>;

export const AdminActivityLogSchema = z.object({
  id: z.string(),
  action: AdminActivityActionSchema,
  targetName: z.string(),
  targetId: z.string().optional(),
  adminEmail: z.string().optional(),
  reason: z.string().optional(),
  timestamp: z.string(),
});
export type AdminActivityLog = z.infer<typeof AdminActivityLogSchema>;

export const WeeklySignupSchema = z.object({
  label: z.string(),
  clients: z.number(),
  professionals: z.number(),
});
export type WeeklySignup = z.infer<typeof WeeklySignupSchema>;

export const DashboardStatsSchema = z.object({
  totalClients: z.number(),
  totalProfessionals: z.number(),
  pendingReview: z.number(),
  newThisWeek: z.number(),
  weeklySignups: z.array(WeeklySignupSchema),
  recentActivity: z.array(AdminActivityLogSchema),
});
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

export const ReportTypeSchema = z.enum([
  "fake_profile",
  "scam",
  "harassment",
  "inappropriate_content",
  "other",
]);
export type ReportType = z.infer<typeof ReportTypeSchema>;

export const ReportStatusSchema = z.enum(["pending", "under_review", "resolved", "dismissed"]);
export type ReportStatus = z.infer<typeof ReportStatusSchema>;

export const ReportPartyRoleSchema = z.enum(["cliente", "profissional"]);

export const ReportSchema = z.object({
  id: z.string(),
  type: ReportTypeSchema,
  reporterName: z.string(),
  reporterRole: ReportPartyRoleSchema,
  reportedName: z.string(),
  reportedId: z.string().optional(),
  reportedRole: ReportPartyRoleSchema,
  description: z.string(),
  status: ReportStatusSchema,
  resolution: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type Report = z.infer<typeof ReportSchema>;

export const GlobalSearchResultSchema = z.object({
  type: z.enum(["client", "professional"]),
  id: z.string(),
  name: z.string(),
  subtitle: z.string(),
  href: z.string(),
  status: z.string().optional(),
});
export type GlobalSearchResult = z.infer<typeof GlobalSearchResultSchema>;
