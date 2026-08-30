"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Flag,
  LogOut,
  ShieldCheck,
  ChevronRight,
  LayoutDashboard,
  User,
  ClipboardCheck,
  Menu,
  X,
} from "lucide-react";
import { useAdminSession } from "@/lib/admin-session";
import { chromeGlassDark, chromePillDark } from "@/lib/chrome-styles";
import { cn } from "@/lib/utils";
import { AdminSearch } from "./admin-search";

interface AdminLayoutShellProps {
  children: ReactNode;
  breadcrumb?: string;
}

const navSections = [
  {
    label: "Visão Geral",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Gestão de Usuários",
    items: [
      { label: "Clientes", href: "/admin/clientes", icon: User, exact: false },
      { label: "Profissionais", href: "/admin/profissionais", icon: Users, exact: false },
    ],
  },
  {
    label: "Moderação & Segurança",
    items: [
      { label: "Validação de Perfis", href: "/admin/perfis", icon: ClipboardCheck, exact: false },
      { label: "Denúncias", href: "/admin/denuncias", icon: Flag, exact: false },
    ],
  },
];

export function AdminLayoutShell({ children, breadcrumb }: AdminLayoutShellProps) {
  const { isAdmin, admin, logout } = useAdminSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  // Guard: redireciona para login se não autenticado
  useEffect(() => {
    if (!isAdmin) {
      router.replace("/admin/login");
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-wine-900 border-t-wine-500" />
          <p className="text-xs text-zinc-500 font-medium">Autenticando sessão admin...</p>
        </div>
      </div>
    );
  }

  const renderNavContent = () => (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Logo Branding */}
        <div className="flex h-16 items-center gap-3 border-b border-zinc-800/80 px-5 bg-zinc-950/40">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-wine-600 to-wine-900 shadow-md shadow-wine-950/50 ring-1 ring-wine-400/20">
            <ShieldCheck className="h-5 w-5 text-zinc-100" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold tracking-wide text-zinc-100">
              Sigillus{" "}
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-wine-400">
                Admin
              </span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono tracking-tight">
              Command Center v2.0
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-5 px-3 py-4">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-wine-950/80 to-wine-900/40 text-wine-200 border border-wine-800/50 shadow-sm shadow-wine-950/40"
                          : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                          isActive ? "text-wine-400" : "text-zinc-500 group-hover:text-zinc-300",
                        )}
                      />
                      <span>{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeNavIndicator"
                          className="ml-auto flex items-center"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        >
                          <ChevronRight className="h-3.5 w-3.5 text-wine-400" />
                        </motion.div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Admin User Info + Logout */}
      <div className="border-t border-zinc-800/80 bg-zinc-950/60 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-wine-800 to-zinc-900 text-xs font-bold text-wine-200 ring-1 ring-wine-500/30">
            {admin?.fullName.charAt(0) || "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-zinc-200">{admin?.fullName}</p>
            <p className="truncate text-[10px] text-zinc-500">{admin?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800/60 bg-zinc-900/30 px-3 py-2 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-red-900/50 hover:bg-red-950/30 hover:text-red-300"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Encerrar Sessão</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 selection:bg-wine-900 selection:text-wine-100">
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-800/60 bg-zinc-950/90 backdrop-blur-xl md:flex sticky top-0 z-30">
        {renderNavContent()}
      </aside>

      {/* ── Mobile Sidebar Drawer ───────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-zinc-800 bg-zinc-950 md:hidden"
            >
              <div className="absolute right-3 top-3 z-10">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {renderNavContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ──────────────────────────────────────── */}
      <div className="relative min-h-screen min-w-0 flex-1 flex flex-col overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-wine-950/15 via-zinc-950 to-zinc-950">
        <header
          className={cn(
            chromeGlassDark,
            "sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-zinc-800/60 px-4 py-3 sm:px-6 backdrop-blur-xl",
          )}
        >
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-300 transition-colors hover:bg-zinc-800 md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb Pill */}
            <div
              className={cn(
                chromePillDark,
                "inline-flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 font-medium",
              )}
            >
              <span className="text-zinc-500">Sigillus</span>
              <ChevronRight className="h-3 w-3 text-zinc-600" />
              <span className="text-zinc-400">Admin</span>
              {breadcrumb ? (
                <>
                  <ChevronRight className="h-3 w-3 text-zinc-600" />
                  <span className="font-semibold text-wine-300">{breadcrumb}</span>
                </>
              ) : null}
            </div>
          </div>

          {/* Center/Right Status & Search */}
          <div className="flex items-center gap-3">
            {/* Live Operational Status Badge */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-900/50 bg-emerald-950/30 px-3 py-1 text-[11px] font-semibold text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>Servidores Operacionais</span>
            </div>

            {/* Search Trigger */}
            <AdminSearch />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
