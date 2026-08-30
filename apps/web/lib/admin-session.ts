"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { AdminUser } from "@/lib/types";
import { adminUsers } from "@/lib/mock-users";
import { ADMIN_SESSION_COOKIE, writeSessionCookie } from "@/lib/session-cookies";

const STORAGE_KEY = "sigillus-admin-session";

const listeners = new Set<() => void>();

function readStoredEmail(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((l) => l());
}

function setStoredEmail(email: string | null) {
  if (typeof window !== "undefined") {
    if (email) {
      window.localStorage.setItem(STORAGE_KEY, email);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
  writeSessionCookie(ADMIN_SESSION_COOKIE, email);
  emitChange();
}

/**
 * Hook de sessão do admin — completamente isolado da sessão de usuário normal.
 * Chave localStorage: "sigillus-admin-session"
 */
export function useAdminSession() {
  const email = useSyncExternalStore<string | null>(subscribe, readStoredEmail, () => null);

  const admin = useMemo<AdminUser | null>(() => {
    if (!email) return null;
    return adminUsers.find((u) => u.email === email) ?? null;
  }, [email]);

  return {
    isAdmin: admin !== null,
    admin,
    login: (adminUser: AdminUser) => setStoredEmail(adminUser.email),
    logout: () => {
      setStoredEmail(null);
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
      }
    },
  };
}
