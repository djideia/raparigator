import { and, count, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import type {
  AdminActivityLog,
  AdminReviewAction,
  ClientAccount,
  DashboardStats,
  GlobalSearchResult,
  PaginationInput,
  ProfessionalAd,
  Report,
  ReportStatus,
  VerificationStatus,
  WeeklySignup,
} from "@sigillus/contracts";
import type { Database } from "../../db/client";
import {
  adminActivityLogs,
  conversations,
  professionalProfiles,
  reports,
  sessions,
  users,
} from "../../db/schema";
import { newId } from "../../lib/ids";
import type { Logger } from "../../lib/logger";
import { toProfessionalAd, type ProfileRow } from "../profiles/mapper";
import type { ProfileRepository } from "../profiles/repository";

export type AdminActor = { id: string; name: string; email: string };

export type AdminNotification = { key: string; title: string; message: string; href: string };

export type AdminNotify = (userId: string, notification: AdminNotification) => Promise<void>;

export type AdminServiceDeps = {
  db: Database;
  profiles: ProfileRepository;
  logger: Logger;
  notify?: AdminNotify;
};

export type AdminService = ReturnType<typeof createAdminService>;

type ActivityRow = typeof adminActivityLogs.$inferSelect;
type ReportRow = typeof reports.$inferSelect;
type UserRow = typeof users.$inferSelect;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEKLY_SIGNUP_WEEKS = 7;
const SEARCH_LIMIT = 5;
const RECENT_ACTIVITY_LIMIT = 8;
const PROFESSIONAL_ADS_HREF = "/profissional/anuncios";

export function splitCityState(value: string | null): { city: string; state: string } {
  if (!value) {
    return { city: "", state: "" };
  }
  const separator = value.lastIndexOf(",");
  if (separator === -1) {
    return { city: value.trim(), state: "" };
  }
  return {
    city: value.slice(0, separator).trim(),
    state: value.slice(separator + 1).trim(),
  };
}

export function maskEmail(email: string): string {
  return `${email.slice(0, 8)}***`;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function startOfUtcWeek(date: Date): Date {
  const day = date.getUTCDay();
  const offset = (day + 6) % 7;
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - offset);
  return start;
}

function shortDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function toActivityLog(row: ActivityRow): AdminActivityLog {
  return {
    id: row.id,
    action: row.action,
    targetName: row.targetName,
    targetId: row.targetId ?? undefined,
    adminEmail: row.adminEmail ?? undefined,
    reason: row.reason ?? undefined,
    timestamp: row.createdAt.toISOString(),
  };
}

function toReport(row: ReportRow): Report {
  return {
    id: row.id,
    type: row.type,
    reporterName: row.reporterName,
    reporterRole: row.reporterRole,
    reportedName: row.reportedName,
    reportedId: row.reportedUserId ?? undefined,
    reportedRole: row.reportedRole,
    description: row.description,
    status: row.status,
    resolution: row.resolution ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
  };
}

function profileLabel(row: ProfileRow): string {
  return row.artisticName || row.displayName || row.slug;
}

export function createAdminService(deps: AdminServiceDeps) {
  const { db, profiles, logger, notify } = deps;

  async function logActivity(entry: {
    action: ActivityRow["action"];
    targetName: string;
    targetId?: string;
    adminEmail?: string;
    reason?: string;
  }) {
    await db.insert(adminActivityLogs).values({
      id: newId(),
      action: entry.action,
      targetName: entry.targetName,
      targetId: entry.targetId ?? null,
      adminEmail: entry.adminEmail ?? null,
      reason: entry.reason ?? null,
    });
  }

  async function invalidateUserSessions(userId: string) {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }

  async function findClient(id: string): Promise<UserRow> {
    const [row] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "cliente")))
      .limit(1);
    if (!row) {
      throw new ORPCError("NOT_FOUND", { message: "Cliente não encontrado." });
    }
    return row;
  }

  async function requireProfile(id: string): Promise<ProfileRow> {
    const row = await profiles.findById(id);
    if (!row) {
      throw new ORPCError("NOT_FOUND", { message: "Perfil não encontrado." });
    }
    return row;
  }

  async function requireReport(id: string): Promise<ReportRow> {
    const [row] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
    if (!row) {
      throw new ORPCError("NOT_FOUND", { message: "Denúncia não encontrada." });
    }
    return row;
  }

  async function toAds(rows: ProfileRow[]): Promise<ProfessionalAd[]> {
    const images = await profiles.imagesFor(rows);
    return rows.map((row) =>
      toProfessionalAd(row, images.get(row.id) ?? { images: row.externalImages }),
    );
  }

  async function weeklySignups(now: Date): Promise<WeeklySignup[]> {
    const currentWeek = startOfUtcWeek(now);
    const since = new Date(currentWeek.getTime() - (WEEKLY_SIGNUP_WEEKS - 1) * WEEK_MS);
    const weekKey = sql<string>`to_char(date_trunc('week', ${users.createdAt} at time zone 'UTC'), 'YYYY-MM-DD')`;
    const rows = await db
      .select({ week: weekKey, role: users.role, total: count() })
      .from(users)
      .where(gte(users.createdAt, since))
      .groupBy(weekKey, users.role);
    const buckets: WeeklySignup[] = [];
    for (let index = 0; index < WEEKLY_SIGNUP_WEEKS; index += 1) {
      const start = new Date(since.getTime() + index * WEEK_MS);
      const key = start.toISOString().slice(0, 10);
      const own = rows.filter((row) => row.week === key);
      buckets.push({
        label: shortDate(start),
        clients: own.filter((row) => row.role === "cliente").reduce((s, r) => s + r.total, 0),
        professionals: own
          .filter((row) => row.role === "profissional")
          .reduce((s, r) => s + r.total, 0),
      });
    }
    return buckets;
  }

  async function notifyProfileOwner(userId: string, notification: AdminNotification) {
    if (!notify) {
      return;
    }
    try {
      await notify(userId, notification);
    } catch (error) {
      logger.warn({ err: error, userId }, "falha ao notificar profissional");
    }
  }

  return {
    async dashboard(now: Date = new Date()): Promise<DashboardStats> {
      const weekAgo = new Date(now.getTime() - WEEK_MS);
      const [[clients], [published], [pending], [recent], activity, signups] = await Promise.all([
        db.select({ total: count() }).from(users).where(eq(users.role, "cliente")),
        db
          .select({ total: count() })
          .from(professionalProfiles)
          .where(
            and(
              eq(professionalProfiles.verificationStatus, "published"),
              eq(professionalProfiles.isSuspended, false),
            ),
          ),
        db
          .select({ total: count() })
          .from(professionalProfiles)
          .where(eq(professionalProfiles.verificationStatus, "pending_review")),
        db.select({ total: count() }).from(users).where(gte(users.createdAt, weekAgo)),
        db
          .select()
          .from(adminActivityLogs)
          .orderBy(desc(adminActivityLogs.createdAt))
          .limit(RECENT_ACTIVITY_LIMIT),
        weeklySignups(now),
      ]);
      return {
        totalClients: clients?.total ?? 0,
        totalProfessionals: published?.total ?? 0,
        pendingReview: pending?.total ?? 0,
        newThisWeek: recent?.total ?? 0,
        weeklySignups: signups,
        recentActivity: activity.map(toActivityLog),
      };
    },

    async activity(pagination: PaginationInput) {
      const offset = (pagination.page - 1) * pagination.pageSize;
      const [rows, [total]] = await Promise.all([
        db
          .select()
          .from(adminActivityLogs)
          .orderBy(desc(adminActivityLogs.createdAt))
          .limit(pagination.pageSize)
          .offset(offset),
        db.select({ total: count() }).from(adminActivityLogs),
      ]);
      return {
        items: rows.map(toActivityLog),
        total: total?.total ?? 0,
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
    },

    async clients(filter: { status?: "active" | "suspended" }): Promise<ClientAccount[]> {
      const totalContacts = sql<number>`(select count(*)::int from ${conversations} as c where c."client_user_id" = "user"."id")`;
      const where = filter.status
        ? and(eq(users.role, "cliente"), eq(users.status, filter.status))
        : eq(users.role, "cliente");
      const rows = await db
        .select({ user: users, totalContacts })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt));
      return rows.map(({ user, totalContacts: contacts }) => {
        const { city, state } = splitCityState(user.city);
        return {
          id: user.id,
          fullName: user.name,
          email: user.email,
          cpf: user.cpf ?? "",
          city,
          state,
          registeredAt: user.createdAt.toISOString(),
          status: user.status,
          suspensionReason: user.suspensionReason ?? undefined,
          totalContacts: Number(contacts),
        };
      });
    },

    async suspendClient(admin: AdminActor, input: { id: string; reason: string }) {
      const user = await findClient(input.id);
      await db
        .update(users)
        .set({ status: "suspended", suspensionReason: input.reason, updatedAt: new Date() })
        .where(eq(users.id, user.id));
      await invalidateUserSessions(user.id);
      await logActivity({
        action: "account_suspended",
        targetName: user.name,
        targetId: user.id,
        adminEmail: admin.email,
        reason: input.reason,
      });
      logger.info({ adminId: admin.id, userId: user.id }, "cliente suspenso");
      return { ok: true as const };
    },

    async reinstateClient(admin: AdminActor, input: { id: string }) {
      const user = await findClient(input.id);
      await db
        .update(users)
        .set({ status: "active", suspensionReason: null, updatedAt: new Date() })
        .where(eq(users.id, user.id));
      await logActivity({
        action: "account_reinstated",
        targetName: user.name,
        targetId: user.id,
        adminEmail: admin.email,
      });
      logger.info({ adminId: admin.id, userId: user.id }, "cliente reativado");
      return { ok: true as const };
    },

    async professionals(filter: { status?: VerificationStatus }): Promise<ProfessionalAd[]> {
      const rows = await profiles.listByStatus(filter.status);
      return toAds(rows);
    },

    async profile(input: { id: string }): Promise<ProfessionalAd | null> {
      const row = await profiles.findById(input.id);
      if (!row) {
        return null;
      }
      const [ad] = await toAds([row]);
      return ad ?? null;
    },

    async approveProfile(
      admin: AdminActor,
      input: { id: string; note?: string },
    ): Promise<AdminReviewAction> {
      const row = await requireProfile(input.id);
      const now = new Date();
      await profiles.update(row.id, {
        verificationStatus: "published",
        rejectionReason: null,
        reviewedAt: now,
      });
      await logActivity({
        action: "profile_approved",
        targetName: profileLabel(row),
        targetId: row.id,
        adminEmail: admin.email,
        reason: input.note,
      });
      await notifyProfileOwner(row.userId, {
        key: `profile-approved:${row.id}:${now.getTime()}`,
        title: "Anúncio aprovado",
        message: "Seu anúncio foi aprovado e já está publicado.",
        href: PROFESSIONAL_ADS_HREF,
      });
      logger.info({ adminId: admin.id, profileId: row.id }, "perfil aprovado");
      return {
        profileId: row.id,
        action: "approved",
        adminId: admin.id,
        note: input.note,
        timestamp: now.toISOString(),
      };
    },

    async rejectProfile(
      admin: AdminActor,
      input: { id: string; reason: string },
    ): Promise<AdminReviewAction> {
      const row = await requireProfile(input.id);
      const now = new Date();
      await profiles.update(row.id, {
        verificationStatus: "rejected",
        rejectionReason: input.reason,
        reviewedAt: now,
      });
      await logActivity({
        action: "profile_rejected",
        targetName: profileLabel(row),
        targetId: row.id,
        adminEmail: admin.email,
        reason: input.reason,
      });
      await notifyProfileOwner(row.userId, {
        key: `profile-rejected:${row.id}:${now.getTime()}`,
        title: "Anúncio precisa de ajustes",
        message: `Seu anúncio não foi aprovado: ${input.reason}`,
        href: PROFESSIONAL_ADS_HREF,
      });
      logger.info({ adminId: admin.id, profileId: row.id }, "perfil rejeitado");
      return {
        profileId: row.id,
        action: "rejected",
        adminId: admin.id,
        reason: input.reason,
        timestamp: now.toISOString(),
      };
    },

    async suspendProfessional(admin: AdminActor, input: { id: string; reason: string }) {
      const row = await requireProfile(input.id);
      await profiles.update(row.id, { isSuspended: true, suspensionReason: input.reason });
      await invalidateUserSessions(row.userId);
      await logActivity({
        action: "account_suspended",
        targetName: profileLabel(row),
        targetId: row.id,
        adminEmail: admin.email,
        reason: input.reason,
      });
      logger.info({ adminId: admin.id, profileId: row.id }, "profissional suspensa");
      return { ok: true as const };
    },

    async reinstateProfessional(admin: AdminActor, input: { id: string }) {
      const row = await requireProfile(input.id);
      await profiles.update(row.id, { isSuspended: false, suspensionReason: null });
      await logActivity({
        action: "account_reinstated",
        targetName: profileLabel(row),
        targetId: row.id,
        adminEmail: admin.email,
      });
      logger.info({ adminId: admin.id, profileId: row.id }, "profissional reativada");
      return { ok: true as const };
    },

    async reports(filter: { status?: ReportStatus }): Promise<Report[]> {
      const query = db.select().from(reports).orderBy(desc(reports.createdAt));
      const rows = filter.status
        ? await query.where(eq(reports.status, filter.status))
        : await query;
      return rows.map(toReport);
    },

    async startReportReview(input: { id: string }) {
      const row = await requireReport(input.id);
      if (row.status !== "pending") {
        throw new ORPCError("CONFLICT", { message: "Denúncia já está em análise ou encerrada." });
      }
      await db
        .update(reports)
        .set({ status: "under_review", updatedAt: new Date() })
        .where(eq(reports.id, row.id));
      return { ok: true as const };
    },

    async resolveReport(input: { id: string; resolution: "resolved" | "dismissed"; note: string }) {
      const row = await requireReport(input.id);
      if (row.status === "resolved" || row.status === "dismissed") {
        throw new ORPCError("CONFLICT", { message: "Denúncia já foi encerrada." });
      }
      await db
        .update(reports)
        .set({ status: input.resolution, resolution: input.note, updatedAt: new Date() })
        .where(eq(reports.id, row.id));
      return { ok: true as const };
    },

    async search(input: { q: string }): Promise<GlobalSearchResult[]> {
      const term = `%${escapeLike(input.q.trim())}%`;
      const [clientRows, profileRows] = await Promise.all([
        db
          .select()
          .from(users)
          .where(
            and(
              eq(users.role, "cliente"),
              or(ilike(users.name, term), ilike(users.email, term), ilike(users.city, term)),
            ),
          )
          .orderBy(desc(users.createdAt))
          .limit(SEARCH_LIMIT),
        db
          .select()
          .from(professionalProfiles)
          .where(
            and(
              inArray(professionalProfiles.verificationStatus, ["published", "pending_review"]),
              or(
                ilike(professionalProfiles.artisticName, term),
                ilike(professionalProfiles.city, term),
                ilike(professionalProfiles.category, term),
              ),
            ),
          )
          .orderBy(desc(professionalProfiles.updatedAt))
          .limit(SEARCH_LIMIT),
      ]);
      const clientResults: GlobalSearchResult[] = clientRows.map((user) => {
        const { city, state } = splitCityState(user.city);
        return {
          type: "client",
          id: user.id,
          name: user.name,
          subtitle: `${city}, ${state} · ${maskEmail(user.email)}`,
          href: "/admin/clientes",
          status: user.status,
        };
      });
      const professionalResults: GlobalSearchResult[] = profileRows.map((row) => ({
        type: "professional",
        id: row.id,
        name: profileLabel(row),
        subtitle: `${row.category} · ${row.city}, ${row.state}`,
        href: `/admin/perfis/${row.id}`,
        status: row.verificationStatus,
      }));
      return [...clientResults, ...professionalResults];
    },
  };
}
