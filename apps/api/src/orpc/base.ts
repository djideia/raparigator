import { implement, ORPCError } from "@orpc/server";
import { contract, type UserRole } from "@sigillus/contracts";
import type { RateLimitRule } from "../lib/rate-limit";
import { getAdminSession, getUserSession, type AppContext } from "./context";

export const os = implement(contract).$context<AppContext>();

export type AuthenticatedUser = {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  city: string | null;
  alias: string | null;
  status: "active" | "suspended";
};

export const withUser = os.middleware(async ({ context, next }) => {
  const session = await getUserSession(context);
  if (!session) {
    throw new ORPCError("UNAUTHORIZED");
  }
  const raw = session.user as Record<string, unknown>;
  const user: AuthenticatedUser = {
    id: session.user.id,
    role: (raw.role as UserRole | undefined) ?? "cliente",
    name: session.user.name,
    email: session.user.email,
    cpf: (raw.cpf as string | null | undefined) ?? null,
    phone: (raw.phone as string | null | undefined) ?? null,
    city: (raw.city as string | null | undefined) ?? null,
    alias: (raw.alias as string | null | undefined) ?? null,
    status: (raw.status as "active" | "suspended" | undefined) ?? "active",
  };
  if (user.status === "suspended") {
    throw new ORPCError("FORBIDDEN", { message: "Conta suspensa." });
  }
  return next({ context: { user } });
});

export function requireRole(role: UserRole) {
  return os.middleware(async ({ context, next }) => {
    const session = await getUserSession(context);
    if (!session) {
      throw new ORPCError("UNAUTHORIZED");
    }
    const actualRole =
      ((session.user as Record<string, unknown>).role as UserRole | undefined) ?? "cliente";
    if (actualRole !== role) {
      throw new ORPCError("FORBIDDEN");
    }
    return next();
  });
}

export const withAdmin = os.middleware(async ({ context, next }) => {
  const session = await getAdminSession(context);
  if (!session) {
    throw new ORPCError("UNAUTHORIZED", { message: "Sessão de administrador necessária." });
  }
  return next({
    context: {
      admin: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    },
  });
});

export function rateLimited(name: string, rule: RateLimitRule) {
  return os.middleware(async ({ context, next }) => {
    const session = await getUserSession(context);
    const key = `${name}:${session?.user.id ?? context.request.ip}`;
    const decision = context.deps.rateLimiter.hit(key, rule);
    if (!decision.allowed) {
      throw new ORPCError("RATE_LIMITED", {
        data: { retryAfterMs: decision.retryAfterMs },
      });
    }
    return next();
  });
}

export const authed = os.use(withUser);
export const professional = os.use(withUser).use(requireRole("profissional"));
export const client = os.use(withUser).use(requireRole("cliente"));
export const admin = os.use(withAdmin);
