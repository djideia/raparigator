"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getMockUserByRole } from "@/lib/mock-users";
import type { AuthRole } from "@/lib/types";
import { USER_ROLE_COOKIE, writeSessionCookie } from "@/lib/session-cookies";

const STORAGE_KEY = "sigillus-user-role";

const listeners = new Set<() => void>();

function isAuthRole(value: string | null): value is AuthRole {
  return value === "visitor" || value === "cliente" || value === "profissional";
}

function readStoredRole(): AuthRole {
  if (typeof window === "undefined") {
    return "visitor";
  }

  const storedRole = window.localStorage.getItem(STORAGE_KEY);
  return isAuthRole(storedRole) ? storedRole : "visitor";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setStoredRole(role: AuthRole) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, role);
  }
  writeSessionCookie(USER_ROLE_COOKIE, role === "visitor" ? null : role);

  emitChange();
}

export function pathRequiresAuth(pathname: string) {
  return (
    pathname.startsWith("/conta") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/profissional") ||
    pathname.startsWith("/admin")
  );
}

export function useAuthSession() {
  const role = useSyncExternalStore<AuthRole>(subscribe, readStoredRole, () => "visitor");

  const user = useMemo(() => {
    if (role === "visitor") {
      return null;
    }

    return getMockUserByRole(role);
  }, [role]);

  return {
    role,
    user,
    isLoggedIn: role !== "visitor",
    logout: () => {
      setStoredRole("visitor");
      if (typeof window === "undefined") {
        return;
      }

      if (pathRequiresAuth(window.location.pathname)) {
        window.location.href = "/feed";
      }
    },
    setRole: (nextRole: AuthRole) => setStoredRole(nextRole),
  };
}
