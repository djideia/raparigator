"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Users,
  User,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  UserPlus,
  ShieldX,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Activity,
  BarChart3,
  Calendar,
} from "lucide-react";
import { AdminLayoutShell } from "./admin-layout-shell";
import { getDashboardStats } from "@/lib/admin-service";
import { useAdminSession } from "@/lib/admin-session";
import type { AdminActivityLog, DashboardStats } from "@/lib/types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `há ${mins} min`;
  if (hours < 24) return `há ${hours} h`;
  return `há ${days} d`;
}

function ActivityIcon({ action }: { action: AdminActivityLog["action"] }) {
  switch (action) {
    case "profile_approved":
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case "profile_rejected":
      return <XCircle className="h-4 w-4 text-red-400" />;
    case "profile_submitted":
      return <Clock className="h-4 w-4 text-amber-400" />;
    case "client_registered":
      return <UserPlus className="h-4 w-4 text-blue-400" />;
    case "account_suspended":
      return <ShieldX className="h-4 w-4 text-orange-400" />;
    case "account_reinstated":
      return <ShieldCheck className="h-4 w-4 text-emerald-400" />;
  }
}

function activityLabel(log: AdminActivityLog): string {
  switch (log.action) {
    case "profile_approved":
      return `${log.targetName} — perfil aprovado`;
    case "profile_rejected":
      return `${log.targetName} — perfil recusado`;
    case "profile_submitted":
      return `${log.targetName} — perfil submetido para análise`;
    case "client_registered":
      return `${log.targetName} — novo cadastro de cliente`;
    case "account_suspended":
      return `${log.targetName} — conta suspensa`;
    case "account_reinstated":
      return `${log.targetName} — conta reativada`;
  }
}

export function AdminDashboardScreen() {
  const { admin } = useAdminSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await getDashboardStats();
    setStats(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const maxBar = stats
    ? Math.max(...stats.weeklySignups.map((d) => d.clients + d.professionals), 1)
    : 1;

  const totalWeeklySignups = stats
    ? stats.weeklySignups.reduce((acc, curr) => acc + curr.clients + curr.professionals, 0)
    : 0;

  const currentDate = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <AdminLayoutShell breadcrumb="Dashboard">
      {loading || !stats ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-800 border-t-wine-500" />
          <p className="text-sm font-medium text-zinc-500">Carregando telemetria e métricas...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Hero Welcome Banner ── */}
          <div className="relative overflow-hidden rounded-3xl border border-wine-900/40 bg-gradient-to-r from-wine-950/80 via-zinc-900/90 to-zinc-950 p-6 sm:p-8 shadow-xl shadow-wine-950/30">
            {/* Background Ambient Glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-wine-600/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-wine-500/10 blur-2xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-wine-800/40 bg-wine-950/60 px-3 py-1 text-xs font-semibold text-wine-300">
                  <Sparkles className="h-3.5 w-3.5 text-wine-400" />
                  <span>Painel de Moderação Central</span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-100">
                  Olá, {admin?.fullName || "Administrador"}
                </h1>
                <p className="text-sm text-zinc-400 max-w-xl">
                  Aqui está o panorama operacional da plataforma Sigillus hoje.
                </p>
              </div>

              {/* Date & Quick Indicator */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-xs text-zinc-300 shadow-inner">
                  <Calendar className="h-4 w-4 text-wine-400" />
                  <span className="capitalize">{currentDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Pendência Urgente / Moderation Alert Banner ── */}
          {stats.pendingReview > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 sm:p-5 backdrop-blur-md shadow-lg shadow-amber-950/20"
            >
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40">
                  <AlertCircle className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-200">
                    {stats.pendingReview}{" "}
                    {stats.pendingReview === 1 ? "perfil aguarda" : "perfis aguardam"} aprovação
                  </h3>
                  <p className="text-xs text-amber-300/80">
                    Verifique os documentos e fotos antes de liberar a publicação na plataforma.
                  </p>
                </div>
              </div>
              <Link
                href="/admin/perfis"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-zinc-950 transition-all hover:bg-amber-300 shadow-md shadow-amber-950/40 outline-none focus:ring-2 focus:ring-amber-400/50"
              >
                <span>Revisar Agora</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          )}

          {/* ── Stat cards Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              {
                label: "Total de Clientes",
                value: stats.totalClients,
                subtext: "Clientes cadastrados",
                icon: User,
                color: "text-blue-400",
                accentBg: "from-blue-950/40 to-zinc-900/80",
                borderColor: "border-blue-900/40 hover:border-blue-700/60 focus:border-blue-600",
                iconBg: "bg-blue-500/10 text-blue-400 ring-blue-500/30",
                href: "/admin/clientes",
              },
              {
                label: "Profissionais Ativos",
                value: stats.totalProfessionals,
                subtext: "Perfis em exibição pública",
                icon: Users,
                color: "text-wine-400",
                accentBg: "from-wine-950/50 to-zinc-900/80",
                borderColor: "border-wine-900/50 hover:border-wine-700/60 focus:border-wine-600",
                iconBg: "bg-wine-500/10 text-wine-400 ring-wine-500/30",
                href: "/admin/profissionais",
              },
              {
                label: "Em Análise",
                value: stats.pendingReview,
                subtext: "Fila de moderação",
                icon: Clock,
                color: "text-amber-400",
                accentBg: "from-amber-950/40 to-zinc-900/80",
                borderColor: "border-amber-900/40 hover:border-amber-700/60 focus:border-amber-600",
                iconBg: "bg-amber-500/10 text-amber-400 ring-amber-500/30",
                href: "/admin/perfis",
              },
              {
                label: "Novos Registros",
                value: stats.newThisWeek,
                subtext: "Últimos 7 dias",
                icon: TrendingUp,
                color: "text-emerald-400",
                accentBg: "from-emerald-950/40 to-zinc-900/80",
                borderColor:
                  "border-emerald-900/40 hover:border-emerald-700/60 focus:border-emerald-600",
                iconBg: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
                href: "/admin/clientes",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link
                  href={stat.href}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-gradient-to-b ${stat.accentBg} ${stat.borderColor} p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl outline-none focus:ring-1 focus:ring-wine-500/40`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        {stat.label}
                      </p>
                      <p
                        className={`font-display text-3xl sm:text-4xl font-bold tracking-tight ${stat.color}`}
                      >
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${stat.iconBg} transition-transform duration-200 group-hover:scale-110`}
                    >
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-zinc-800/60 pt-3 text-[11px]">
                    <span className="text-zinc-500">{stat.subtext}</span>
                    <span
                      className={`flex items-center gap-1 font-semibold ${stat.color} transition-all group-hover:translate-x-0.5`}
                    >
                      Acessar <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* ── Main Content Grid: Chart + Recent Activity ── */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* ── Gráfico Semanal ── */}
            <div className="lg:col-span-2 flex flex-col justify-between rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-xl shadow-xl">
              <div>
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-wine-950 text-wine-400 border border-wine-800/50">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-100 text-base">Cadastros na Semana</h3>
                      <p className="text-xs text-zinc-500">
                        Distribuição por perfil nos últimos 7 dias
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                      <span className="inline-block h-3 w-3 rounded-md bg-wine-600 ring-1 ring-wine-400/40" />
                      Clientes
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-zinc-400">
                      <span className="inline-block h-3 w-3 rounded-md bg-zinc-700 ring-1 ring-zinc-500/40" />
                      Profissionais
                    </span>
                  </div>
                </div>

                {/* Total Counter Badge */}
                <div className="mb-4 flex items-center justify-between text-xs text-zinc-400 bg-zinc-950/40 rounded-xl px-4 py-2 border border-zinc-800/40">
                  <span>Total acumulado no período:</span>
                  <span className="font-bold text-wine-300">
                    {totalWeeklySignups} novos usuários
                  </span>
                </div>
              </div>

              {/* Chart Bars */}
              <div className="flex h-44 items-end justify-between gap-2 sm:gap-4 pt-4 px-2">
                {stats.weeklySignups.map((day, idx) => {
                  const clientH = Math.round((day.clients / maxBar) * 140);
                  const profH = Math.round((day.professionals / maxBar) * 140);
                  return (
                    <div
                      key={day.label}
                      className="group relative flex flex-1 flex-col items-center gap-2 h-full justify-end"
                    >
                      {/* Tooltip on Hover */}
                      <div className="absolute -top-10 z-20 hidden group-hover:flex flex-col items-center rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1 text-[10px] text-zinc-200 shadow-xl whitespace-nowrap">
                        <span className="font-bold">{day.label}</span>
                        <span>
                          {day.clients} Clientes • {day.professionals} Profissionais
                        </span>
                      </div>

                      <div className="flex w-full items-end justify-center gap-1">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(clientH, 6)}px` }}
                          transition={{ duration: 0.5, delay: idx * 0.05 }}
                          className="w-full max-w-[16px] rounded-t-md bg-gradient-to-t from-wine-800 to-wine-500 transition-all group-hover:brightness-125"
                        />
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(profH, 6)}px` }}
                          transition={{ duration: 0.5, delay: idx * 0.05 + 0.02 }}
                          className="w-full max-w-[16px] rounded-t-md bg-gradient-to-t from-zinc-800 to-zinc-600 transition-all group-hover:brightness-125"
                        />
                      </div>
                      <p className="text-[11px] font-semibold text-zinc-500 group-hover:text-zinc-300">
                        {day.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Atividade Recente ── */}
            <div className="flex flex-col justify-between rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-xl shadow-xl">
              <div>
                <div className="mb-4 flex items-center justify-between border-b border-zinc-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-wine-400" />
                    <h3 className="font-semibold text-zinc-100 text-base">Atividade Recente</h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    Feed Live
                  </span>
                </div>

                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {stats.recentActivity.map((log) => (
                    <div
                      key={log.id}
                      className="group flex items-start gap-3 rounded-xl border border-zinc-800/40 bg-zinc-950/40 p-3 transition-colors hover:border-zinc-700/60 hover:bg-zinc-900/60"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 group-hover:scale-105 transition-transform">
                        <ActivityIcon action={log.action} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium leading-snug text-zinc-200">
                          {activityLabel(log)}
                        </p>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                          <span>{timeAgo(log.timestamp)}</span>
                          {log.adminEmail && (
                            <span className="font-mono text-wine-400">
                              {log.adminEmail.split("@")[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 border-t border-zinc-800/60 pt-3">
                <Link
                  href="/admin/perfis"
                  className="flex items-center justify-center gap-2 text-xs font-semibold text-wine-400 hover:text-wine-300 transition-colors"
                >
                  <span>Ver todas as ações de moderação</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayoutShell>
  );
}
