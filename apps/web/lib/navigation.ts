import type { AuthRole } from "@/lib/types";

export interface NavigationItem {
  label: string;
  href: string;
}

export const navigationByRole: Record<AuthRole, NavigationItem[]> = {
  visitor: [],
  cliente: [
    { label: "Feed", href: "/feed" },
    { label: "Chat", href: "/chat" },
  ],
  profissional: [
    { label: "Feed", href: "/feed" },
    { label: "Chat", href: "/chat" },
    { label: "Painel", href: "/profissional/dashboard" },
  ],
};

export function getNavigationItems(role: AuthRole) {
  return navigationByRole[role];
}

export function getRoleLabel(role: AuthRole) {
  switch (role) {
    case "cliente":
      return "Cliente";
    case "profissional":
      return "Profissional";
    default:
      return "Visitante";
  }
}

export function getProfileHref(role: AuthRole) {
  switch (role) {
    case "cliente":
      return "/conta";
    case "profissional":
      return "/conta";
    default:
      return "/auth/login";
  }
}
