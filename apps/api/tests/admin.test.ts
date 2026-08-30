import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { RPCHandler } from "@orpc/server/fetch";
import { adminActivityLogs, conversations, reports, sessions, users } from "../src/db/schema";
import { DEV_ADMINS, upsertAdminWithPassword } from "../src/db/seed/users";
import { adminRouter } from "../src/modules/admin/router";
import { createAdminService, type AdminNotification } from "../src/modules/admin/service";
import { createAppContext } from "../src/orpc/context";
import type { AppDeps } from "../src/deps";
import { createTestHarness } from "./helpers/app";
import { signInAdmin, signUp } from "./helpers/auth";

const harness = createTestHarness();

type Notified = { userId: string; notification: AdminNotification };

function setup() {
  const notified: Notified[] = [];
  const admin = createAdminService({
    db: harness.db,
    profiles: harness.deps.services.profiles,
    logger: harness.deps.logger,
    notify: async (userId, notification) => {
      notified.push({ userId, notification });
    },
  });
  const deps: AppDeps = {
    ...harness.deps,
    services: { ...harness.deps.services, admin } as AppDeps["services"],
  };
  const handler = new RPCHandler({ admin: adminRouter });
  const rpc = async <T>(path: string, input?: unknown, cookie?: string) => {
    const request = new Request(`${harness.config.API_ORIGIN}/rpc/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
      body: JSON.stringify({ json: input ?? {} }),
    });
    const { response } = await handler.handle(request, {
      prefix: "/rpc",
      context: createAppContext(deps, { headers: request.headers, ip: "test" }),
    });
    if (!response) {
      throw new Error(`rota não encontrada: ${path}`);
    }
    const text = await response.text();
    const parsed = text ? (JSON.parse(text) as { json?: unknown }) : {};
    const body = parsed && typeof parsed === "object" && "json" in parsed ? parsed.json : parsed;
    return { status: response.status, body: body as T };
  };
  return { admin, notified, rpc };
}

function withoutCookieCache(cookie: string): string {
  return cookie
    .split("; ")
    .filter((part) => !part.includes("session_data"))
    .join("; ");
}

async function adminCookie() {
  await upsertAdminWithPassword(harness.db, DEV_ADMINS[0]!);
  return signInAdmin(harness, DEV_ADMINS[0]!.email, DEV_ADMINS[0]!.password);
}

async function createProfessional(email: string, artisticName: string, status = "pending_review") {
  const pro = await signUp(harness, { email, role: "profissional", name: artisticName });
  const profile = await harness.deps.services.profiles.insert({
    id: `profile-${artisticName.toLowerCase().replace(/\s+/g, "-")}`,
    userId: pro.userId,
    slug: artisticName.toLowerCase().replace(/\s+/g, "-"),
    artisticName,
    displayName: artisticName,
    city: "São Paulo",
    state: "SP",
    category: "Mulheres",
    verificationStatus: status as "pending_review" | "published" | "rejected",
    listingStatus: "Ativo",
    submittedAt: new Date(),
  });
  return { ...pro, profile };
}

describe("admin / backoffice", () => {
  it("admin.me devolve null sem sessão e o admin com sessão", async () => {
    const { rpc } = setup();
    const anonymous = await rpc<{ admin: null }>("admin/me");
    expect(anonymous.status).toBe(200);
    expect(anonymous.body).toEqual({ admin: null });

    const cookie = await adminCookie();
    const me = await rpc<{ admin: { email: string; role: string; fullName: string } }>(
      "admin/me",
      {},
      cookie,
    );
    expect(me.body.admin.email).toBe(DEV_ADMINS[0]!.email);
    expect(me.body.admin.role).toBe("admin");
    expect(me.body.admin.fullName).toBe(DEV_ADMINS[0]!.fullName);
  });

  it("sem sessão admin → UNAUTHORIZED; sessão de usuário comum não acessa", async () => {
    const { rpc } = setup();
    const anonymous = await rpc<{ code: string }>("admin/dashboard");
    expect(anonymous.status).toBe(401);
    expect(anonymous.body.code).toBe("UNAUTHORIZED");

    const user = await signUp(harness, { email: "comum@teste.dev" });
    const asUser = await rpc<{ code: string }>("admin/dashboard", {}, user.cookie);
    expect(asUser.status).toBe(401);
    expect(asUser.body.code).toBe("UNAUTHORIZED");
    const list = await rpc<{ code: string }>("admin/clients", {}, user.cookie);
    expect(list.status).toBe(401);
  });

  it("dashboard conta clientes, perfis e semanas", async () => {
    const { rpc } = setup();
    const cookie = await adminCookie();
    await signUp(harness, { email: "c1@teste.dev" });
    await signUp(harness, { email: "c2@teste.dev" });
    await createProfessional("p1@teste.dev", "Pro Um", "published");
    await createProfessional("p2@teste.dev", "Pro Dois", "pending_review");
    const result = await rpc<{
      totalClients: number;
      totalProfessionals: number;
      pendingReview: number;
      newThisWeek: number;
      weeklySignups: Array<{ label: string; clients: number; professionals: number }>;
      recentActivity: unknown[];
    }>("admin/dashboard", {}, cookie);
    expect(result.status).toBe(200);
    expect(result.body.totalClients).toBe(2);
    expect(result.body.totalProfessionals).toBe(1);
    expect(result.body.pendingReview).toBe(1);
    expect(result.body.newThisWeek).toBe(4);
    expect(result.body.weeklySignups).toHaveLength(7);
    const last = result.body.weeklySignups[6]!;
    expect(last.clients).toBe(2);
    expect(last.professionals).toBe(2);
  });

  it("aprovar publica, loga, notifica e devolve a ação", async () => {
    const { rpc, notified } = setup();
    const cookie = await adminCookie();
    const pro = await createProfessional("aprov@teste.dev", "Aprovada");
    const result = await rpc<{
      profileId: string;
      action: string;
      adminId: string;
      note?: string;
      timestamp: string;
    }>("admin/approveProfile", { id: pro.profile.id, note: "Tudo certo" }, cookie);
    expect(result.status).toBe(200);
    expect(result.body.action).toBe("approved");
    expect(result.body.profileId).toBe(pro.profile.id);
    expect(result.body.adminId).toBe(DEV_ADMINS[0]!.id);
    expect(result.body.note).toBe("Tudo certo");

    const profile = await harness.deps.services.profiles.findById(pro.profile.id);
    expect(profile?.verificationStatus).toBe("published");
    expect(profile?.reviewedAt).not.toBeNull();

    const logs = await harness.db.select().from(adminActivityLogs);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe("profile_approved");
    expect(logs[0]?.targetId).toBe(pro.profile.id);
    expect(logs[0]?.adminEmail).toBe(DEV_ADMINS[0]!.email);
    expect(notified).toHaveLength(1);
    expect(notified[0]?.userId).toBe(pro.userId);

    const listed = await rpc<Array<{ id: string; verificationStatus: string }>>(
      "admin/professionals",
      { status: "published" },
      cookie,
    );
    expect(listed.body.map((item) => item.id)).toContain(pro.profile.id);
    const activity = await rpc<{ items: unknown[]; total: number }>(
      "admin/activity",
      { page: 1, pageSize: 10 },
      cookie,
    );
    expect(activity.body.total).toBe(1);
  });

  it("rejeitar grava motivo e loga", async () => {
    const { rpc } = setup();
    const cookie = await adminCookie();
    const pro = await createProfessional("rej@teste.dev", "Rejeitada");
    const result = await rpc<{ action: string; reason?: string }>(
      "admin/rejectProfile",
      { id: pro.profile.id, reason: "Fotos ilegíveis" },
      cookie,
    );
    expect(result.body.action).toBe("rejected");
    expect(result.body.reason).toBe("Fotos ilegíveis");
    const profile = await rpc<{ verificationStatus: string; rejectionReason?: string }>(
      "admin/profile",
      { id: pro.profile.id },
      cookie,
    );
    expect(profile.body.verificationStatus).toBe("rejected");
    expect(profile.body.rejectionReason).toBe("Fotos ilegíveis");
    const missing = await rpc<{ code: string }>(
      "admin/approveProfile",
      { id: "nao-existe" },
      cookie,
    );
    expect(missing.status).toBe(404);
  });

  it("suspender cliente invalida a sessão e reativar limpa o motivo", async () => {
    const { rpc } = setup();
    const cookie = await adminCookie();
    const client = await signUp(harness, { email: "susp@teste.dev", name: "Suspenso" });
    const clientCookie = withoutCookieCache(client.cookie);
    const before = await harness.rpc<{ user: { id: string } | null }>(
      "auth/me",
      {},
      { cookie: clientCookie },
    );
    expect(before.body.user?.id).toBe(client.userId);

    const suspended = await rpc<{ ok: true }>(
      "admin/suspendClient",
      { id: client.userId, reason: "Comportamento abusivo" },
      cookie,
    );
    expect(suspended.body).toEqual({ ok: true });
    const remaining = await harness.db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, client.userId));
    expect(remaining).toHaveLength(0);
    const after = await harness.rpc<{ user: unknown }>("auth/me", {}, { cookie: clientCookie });
    expect(after.body.user).toBeNull();

    const clients = await rpc<
      Array<{ id: string; status: string; suspensionReason?: string; totalContacts: number }>
    >("admin/clients", { status: "suspended" }, cookie);
    expect(clients.body).toHaveLength(1);
    expect(clients.body[0]?.suspensionReason).toBe("Comportamento abusivo");
    expect(clients.body[0]?.totalContacts).toBe(0);

    await rpc("admin/reinstateClient", { id: client.userId }, cookie);
    const [row] = await harness.db.select().from(users).where(eq(users.id, client.userId));
    expect(row?.status).toBe("active");
    expect(row?.suspensionReason).toBeNull();
    const logs = await harness.db.select().from(adminActivityLogs);
    expect(logs.map((log) => log.action).sort()).toEqual([
      "account_reinstated",
      "account_suspended",
    ]);
  });

  it("suspender profissional marca perfil e derruba sessão", async () => {
    const { rpc } = setup();
    const cookie = await adminCookie();
    const pro = await createProfessional("prosusp@teste.dev", "Pro Suspensa", "published");
    await rpc("admin/suspendProfessional", { id: pro.profile.id, reason: "Denúncias" }, cookie);
    const profile = await harness.deps.services.profiles.findById(pro.profile.id);
    expect(profile?.isSuspended).toBe(true);
    expect(profile?.suspensionReason).toBe("Denúncias");
    const remaining = await harness.db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, pro.userId));
    expect(remaining).toHaveLength(0);
    await rpc("admin/reinstateProfessional", { id: pro.profile.id }, cookie);
    const reinstated = await harness.deps.services.profiles.findById(pro.profile.id);
    expect(reinstated?.isSuspended).toBe(false);
    expect(reinstated?.suspensionReason).toBeNull();
  });

  it("clientes: cidade/UF separados e contagem de contatos", async () => {
    const { rpc } = setup();
    const cookie = await adminCookie();
    const client = await signUp(harness, { email: "cid@teste.dev", name: "Cidadão" });
    await harness.db
      .update(users)
      .set({ city: "Belo Horizonte, MG", cpf: "123.456.789-00" })
      .where(eq(users.id, client.userId));
    const pro = await createProfessional("prochat@teste.dev", "Pro Chat", "published");
    await harness.db.insert(conversations).values({
      id: "conv-1",
      profileId: pro.profile.id,
      clientUserId: client.userId,
      professionalUserId: pro.userId,
    });
    const result = await rpc<
      Array<{ id: string; city: string; state: string; cpf: string; totalContacts: number }>
    >("admin/clients", {}, cookie);
    const row = result.body.find((item) => item.id === client.userId);
    expect(row).toMatchObject({
      city: "Belo Horizonte",
      state: "MG",
      cpf: "123.456.789-00",
      totalContacts: 1,
    });
  });

  it("denúncias: iniciar análise e resolver", async () => {
    const { rpc } = setup();
    const cookie = await adminCookie();
    await harness.db.insert(reports).values({
      id: "rep-1",
      type: "scam",
      reporterName: "Cliente X",
      reporterRole: "cliente",
      reportedName: "Pro Y",
      reportedRole: "profissional",
      description: "Pediu depósito antecipado",
    });
    const pending = await rpc<Array<{ id: string; status: string }>>(
      "admin/reports",
      { status: "pending" },
      cookie,
    );
    expect(pending.body.map((item) => item.id)).toEqual(["rep-1"]);
    await rpc("admin/startReportReview", { id: "rep-1" }, cookie);
    const again = await rpc<{ code: string }>("admin/startReportReview", { id: "rep-1" }, cookie);
    expect(again.status).toBe(409);
    await rpc(
      "admin/resolveReport",
      { id: "rep-1", resolution: "resolved", note: "Perfil suspenso" },
      cookie,
    );
    const resolved = await rpc<Array<{ status: string; resolution?: string; updatedAt?: string }>>(
      "admin/reports",
      {},
      cookie,
    );
    expect(resolved.body[0]).toMatchObject({ status: "resolved", resolution: "Perfil suspenso" });
    expect(resolved.body[0]?.updatedAt).toBeDefined();
  });

  it("busca mascara e-mail e devolve profissionais publicadas/pendentes", async () => {
    const { rpc } = setup();
    const cookie = await adminCookie();
    const client = await signUp(harness, { email: "mariana@teste.dev", name: "Mariana Silva" });
    await harness.db.update(users).set({ city: "Curitiba, PR" }).where(eq(users.id, client.userId));
    await createProfessional("luna@teste.dev", "Luna Mariana", "published");
    await createProfessional("rej2@teste.dev", "Mariana Rejeitada", "rejected");
    const result = await rpc<
      Array<{ type: string; id: string; name: string; subtitle: string; href: string }>
    >("admin/search", { q: "mariana" }, cookie);
    expect(result.status).toBe(200);
    const clientHit = result.body.find((item) => item.type === "client");
    expect(clientHit?.subtitle).toBe("Curitiba, PR · mariana@***");
    expect(clientHit?.subtitle).not.toContain("teste.dev");
    expect(clientHit?.href).toBe("/admin/clientes");
    const pros = result.body.filter((item) => item.type === "professional");
    expect(pros.map((item) => item.name)).toEqual(["Luna Mariana"]);
    expect(pros[0]?.href).toBe(`/admin/perfis/${pros[0]?.id}`);
    const byEmail = await rpc<Array<{ type: string }>>("admin/search", { q: "mariana@" }, cookie);
    expect(byEmail.body.some((item) => item.type === "client")).toBe(true);
  });
});
