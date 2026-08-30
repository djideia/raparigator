import type { AppDeps } from "../deps";
import type { AdminSession, UserSession } from "../lib/auth";

export type RequestInfo = {
  headers: Headers;
  ip: string;
};

export type AppContext = {
  request: RequestInfo;
  deps: AppDeps;
  sessions: {
    user?: Promise<UserSession | null>;
    admin?: Promise<AdminSession | null>;
  };
};

export function createAppContext(deps: AppDeps, request: RequestInfo): AppContext {
  return { request, deps, sessions: {} };
}

export function resolveClientIp(headers: Headers, fallback = "unknown"): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  return headers.get("x-real-ip") ?? fallback;
}

export async function getUserSession(context: AppContext): Promise<UserSession | null> {
  if (!context.sessions.user) {
    context.sessions.user = context.deps.auth.api
      .getSession({ headers: context.request.headers })
      .then((session) => session ?? null)
      .catch(() => null);
  }
  return context.sessions.user;
}

export async function getAdminSession(context: AppContext): Promise<AdminSession | null> {
  if (!context.sessions.admin) {
    context.sessions.admin = context.deps.adminAuth.api
      .getSession({ headers: context.request.headers })
      .then((session) => session ?? null)
      .catch(() => null);
  }
  return context.sessions.admin;
}
