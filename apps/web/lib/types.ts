import type { AdminUser as ContractAdminUser, User } from "@sigillus/contracts";

export type {
  AdCategory,
  AdminActivityLog,
  AdminReviewAction,
  AdminRole,
  AuthRole,
  AvailabilityStatus,
  ClientAccount as MockClient,
  Conversation,
  DashboardStats,
  EncounterBrief,
  GlobalSearchResult,
  MediaHighlight,
  Message,
  MessageStatus,
  MessageType,
  PlanTier,
  PremiumBillingCycle,
  ProfessionalAd,
  Report,
  ReportStatus,
  ReportType,
  Review,
  SimulationSelection,
  VerificationStatus,
  WeeklySignup,
} from "@sigillus/contracts";

export type MockUser = User & {
  password: string;
  label: string;
};

export type AdminUser = ContractAdminUser & {
  password: string;
};
