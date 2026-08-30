import type {
  AdminReviewAction,
  DashboardStats,
  GlobalSearchResult,
  MockClient,
  ProfessionalAd,
  Report,
  ReportStatus,
  VerificationStatus,
} from "@/lib/types";
import {
  ads,
  adminActivityLog,
  mockClients,
  mockReports,
  weeklySignupsData,
} from "@/lib/mock-data";

// ── In-memory stores (mock only) ─────────────────────────────────────────────
const profileStore: ProfessionalAd[] = ads.map((ad) => ({
  ...ad,
  verificationStatus: ad.verificationStatus ?? ("published" as VerificationStatus),
}));

const clientStore: MockClient[] = mockClients.map((c) => ({ ...c }));
const reportStore: Report[] = mockReports.map((r) => ({ ...r }));
// ─────────────────────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  // BACKEND: GET /api/admin/dashboard
  const published = profileStore.filter(
    (p) => p.verificationStatus === "published" && !p.isSuspended,
  );
  const pending = profileStore.filter((p) => p.verificationStatus === "pending_review");
  const newThisWeek = clientStore.filter((c) => {
    const registered = new Date(c.registeredAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return registered >= weekAgo;
  });
  return {
    totalClients: clientStore.length,
    totalProfessionals: published.length,
    pendingReview: pending.length,
    newThisWeek: newThisWeek.length,
    weeklySignups: weeklySignupsData,
    recentActivity: adminActivityLog.slice(0, 8),
  };
}

export async function getClients(status?: "active" | "suspended"): Promise<MockClient[]> {
  // BACKEND: GET /api/admin/clients?status={status}
  if (!status) return [...clientStore];
  return clientStore.filter((c) => c.status === status);
}

export async function suspendClient(id: string, adminId: string, reason: string): Promise<void> {
  // BACKEND: POST /api/admin/clients/:id/suspend { adminId, reason }
  const idx = clientStore.findIndex((c) => c.id === id);
  if (idx !== -1) {
    clientStore[idx] = { ...clientStore[idx], status: "suspended", suspensionReason: reason };
  }
}

export async function reinstateClient(id: string, _adminId: string): Promise<void> {
  // BACKEND: POST /api/admin/clients/:id/reinstate { adminId }
  const idx = clientStore.findIndex((c) => c.id === id);
  if (idx !== -1) {
    clientStore[idx] = { ...clientStore[idx], status: "active", suspensionReason: undefined };
  }
}

export async function getActiveProfessionals(): Promise<ProfessionalAd[]> {
  // BACKEND: GET /api/admin/professionals?status=published
  return profileStore.filter((p) => p.verificationStatus === "published");
}

export async function suspendProfessional(
  id: string,
  adminId: string,
  reason: string,
): Promise<void> {
  // BACKEND: POST /api/admin/professionals/:id/suspend { adminId, reason }
  const idx = profileStore.findIndex((p) => p.id === id);
  if (idx !== -1) {
    profileStore[idx] = { ...profileStore[idx], isSuspended: true, rejectionReason: reason };
  }
}

export async function reinstateProfessional(id: string, _adminId: string): Promise<void> {
  // BACKEND: POST /api/admin/professionals/:id/reinstate { adminId }
  const idx = profileStore.findIndex((p) => p.id === id);
  if (idx !== -1) {
    profileStore[idx] = { ...profileStore[idx], isSuspended: false, rejectionReason: undefined };
  }
}

export async function getAllProfiles(status?: VerificationStatus): Promise<ProfessionalAd[]> {
  // BACKEND: GET /api/admin/profiles?status={status}
  if (!status) return [...profileStore];
  return profileStore.filter((p) => p.verificationStatus === status);
}

export async function getProfileById(id: string): Promise<ProfessionalAd | null> {
  // BACKEND: GET /api/admin/profiles/:id
  return profileStore.find((p) => p.id === id) ?? null;
}

export async function approveProfile(
  id: string,
  adminId: string,
  note?: string,
): Promise<AdminReviewAction> {
  // BACKEND: POST /api/admin/profiles/:id/approve
  const idx = profileStore.findIndex((p) => p.id === id);
  if (idx !== -1) {
    profileStore[idx] = {
      ...profileStore[idx],
      verificationStatus: "published",
      rejectionReason: undefined,
    };
  }
  return {
    profileId: id,
    action: "approved",
    adminId,
    note,
    timestamp: new Date().toISOString(),
  };
}

export async function rejectProfile(
  id: string,
  adminId: string,
  reason: string,
): Promise<AdminReviewAction> {
  // BACKEND: POST /api/admin/profiles/:id/reject
  const idx = profileStore.findIndex((p) => p.id === id);
  if (idx !== -1) {
    profileStore[idx] = {
      ...profileStore[idx],
      verificationStatus: "rejected",
      rejectionReason: reason,
    };
  }
  return {
    profileId: id,
    action: "rejected",
    adminId,
    reason,
    timestamp: new Date().toISOString(),
  };
}

// ── Denúncias ────────────────────────────────────────────────────────────────

export async function getReports(status?: ReportStatus): Promise<Report[]> {
  // BACKEND: GET /api/admin/reports?status={status}
  if (!status) return [...reportStore];
  return reportStore.filter((r) => r.status === status);
}

export async function startReview(id: string): Promise<void> {
  // BACKEND: POST /api/admin/reports/:id/start-review
  const idx = reportStore.findIndex((r) => r.id === id);
  if (idx !== -1) {
    reportStore[idx] = {
      ...reportStore[idx],
      status: "under_review",
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function resolveReport(
  id: string,
  resolution: "resolved" | "dismissed",
  note: string,
): Promise<void> {
  // BACKEND: POST /api/admin/reports/:id/resolve { resolution, note }
  const idx = reportStore.findIndex((r) => r.id === id);
  if (idx !== -1) {
    reportStore[idx] = {
      ...reportStore[idx],
      status: resolution,
      resolution: note,
      updatedAt: new Date().toISOString(),
    };
  }
}

// ── Busca Global ─────────────────────────────────────────────────────────────

export async function globalSearch(query: string): Promise<GlobalSearchResult[]> {
  // BACKEND: GET /api/admin/search?q={query}
  if (!query.trim()) return [];
  const q = query.toLowerCase();

  const clientResults: GlobalSearchResult[] = clientStore
    .filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q),
    )
    .slice(0, 5)
    .map((c) => ({
      type: "client",
      id: c.id,
      name: c.fullName,
      subtitle: `${c.city}, ${c.state} · ${c.email.slice(0, 8)}***`,
      href: "/admin/clientes",
      status: c.status,
    }));

  const professionalResults: GlobalSearchResult[] = profileStore
    .filter(
      (p) =>
        (p.verificationStatus === "published" || p.verificationStatus === "pending_review") &&
        (p.artisticName.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)),
    )
    .slice(0, 5)
    .map((p) => ({
      type: "professional",
      id: p.id,
      name: p.artisticName,
      subtitle: `${p.category} · ${p.city}, ${p.state}`,
      href: `/admin/perfis/${p.id}`,
      status: p.verificationStatus,
    }));

  return [...clientResults, ...professionalResults];
}
