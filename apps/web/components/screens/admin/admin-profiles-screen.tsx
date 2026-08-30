"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  MapPin,
  Calendar,
  ChevronRight,
  Users,
  Sparkles,
  Eye,
} from "lucide-react";
import { AdminLayoutShell } from "./admin-layout-shell";
import { useAdminSession } from "@/lib/admin-session";
import { getAllProfiles, approveProfile } from "@/lib/admin-service";
import type { ProfessionalAd, VerificationStatus } from "@/lib/types";

type TabStatus = "pending_review" | "published" | "rejected";

const TABS: { label: string; status: TabStatus; icon: React.ElementType }[] = [
  { label: "Pendentes", status: "pending_review", icon: Clock },
  { label: "Aprovados", status: "published", icon: CheckCircle2 },
  { label: "Recusados", status: "rejected", icon: XCircle },
];

function StatusBadge({ status }: { status: VerificationStatus | undefined }) {
  if (status === "pending_review") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-950/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 backdrop-blur-md shadow-sm">
        <Clock className="h-3 w-3" />
        Em análise
      </span>
    );
  }
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-md shadow-sm">
        <CheckCircle2 className="h-3 w-3" />
        Aprovado
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-950/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-300 backdrop-blur-md shadow-sm">
        <XCircle className="h-3 w-3" />
        Recusado
      </span>
    );
  }
  return null;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AdminProfilesScreen() {
  const { admin } = useAdminSession();
  const [activeTab, setActiveTab] = useState<TabStatus>("pending_review");
  const [profiles, setProfiles] = useState<ProfessionalAd[]>([]);
  const [counts, setCounts] = useState({ pending_review: 0, published: 0, rejected: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [pending, published, rejected] = await Promise.all([
      getAllProfiles("pending_review"),
      getAllProfiles("published"),
      getAllProfiles("rejected"),
    ]);
    setCounts({
      pending_review: pending.length,
      published: published.length,
      rejected: rejected.length,
    });
  }, []);

  const loadTab = useCallback(async () => {
    setLoading(true);
    const data = await getAllProfiles(activeTab);
    setProfiles(data);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    void (async () => {
      await loadAll();
    })();
  }, [loadAll]);

  useEffect(() => {
    void (async () => {
      await loadTab();
    })();
  }, [loadTab]);

  const handleQuickApprove = async (id: string) => {
    if (!admin) return;
    setApprovingId(id);
    await approveProfile(id, admin.id, "Aprovado via ação rápida no painel.");
    await Promise.all([loadAll(), loadTab()]);
    setApprovingId(null);
  };

  const filtered = profiles.filter(
    (p) =>
      p.artisticName.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminLayoutShell breadcrumb="Validação de Perfis">
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              Fila de Validação de Perfis
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Analise anúncios, fotos e documentação dos acompanhantes antes de liberar a exibição
              pública.
            </p>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Pendentes de Análise",
              value: counts.pending_review,
              color: "text-amber-400",
              bg: "from-amber-950/40 via-zinc-900/80 to-zinc-950",
              border: "border-amber-800/40",
              icon: Clock,
            },
            {
              label: "Perfis Aprovados",
              value: counts.published,
              color: "text-emerald-400",
              bg: "from-emerald-950/40 via-zinc-900/80 to-zinc-950",
              border: "border-emerald-800/40",
              icon: CheckCircle2,
            },
            {
              label: "Perfis Recusados",
              value: counts.rejected,
              color: "text-red-400",
              bg: "from-red-950/40 via-zinc-900/80 to-zinc-950",
              border: "border-red-800/40",
              icon: XCircle,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl border bg-gradient-to-r ${stat.bg} ${stat.border} p-5 shadow-lg flex items-center justify-between`}
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  {stat.label}
                </p>
                <p className={`font-display mt-1 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Controls Bar: Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900/40 p-2 rounded-2xl border border-zinc-800/60">
          <div className="flex items-center gap-1 overflow-x-auto p-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.status;
              return (
                <button
                  key={tab.status}
                  onClick={() => setActiveTab(tab.status)}
                  className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-wine-900/60 text-wine-200 border border-wine-800/60 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      isActive ? "bg-wine-500 text-white" : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {counts[tab.status]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative px-1">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              placeholder="Filtrar por nome ou cidade…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-zinc-800 bg-zinc-950/80 py-2 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all focus:border-wine-700 focus:ring-1 focus:ring-wine-500/40 font-medium"
            />
          </div>
        </div>

        {/* Main Grid Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-wine-500" />
            <p className="text-xs font-medium text-zinc-500">Carregando anúncios da fila...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-800/60 bg-zinc-900/20 py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 mb-3 text-zinc-600">
              <Users className="h-7 w-7" />
            </div>
            <p className="text-base font-bold text-zinc-300">Nenhum perfil encontrado</p>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm">
              {search
                ? "Nenhum resultado corresponde aos termos da sua busca."
                : "Não há anúncios nesta fila no momento."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map((profile, i) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-zinc-700/80 hover:shadow-2xl hover:shadow-black/60"
                >
                  <div>
                    {/* Banner Photo Container */}
                    <div className="relative h-48 w-full overflow-hidden bg-zinc-950">
                      {profile.images[0] ? (
                        <Image
                          src={profile.images[0]}
                          alt={profile.artisticName}
                          fill
                          className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-zinc-700">
                          <Users className="h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3">
                        <StatusBadge status={profile.verificationStatus} />
                      </div>
                      {profile.adTier === "premium" && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full border border-yellow-500/40 bg-zinc-950/80 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300 backdrop-blur-md shadow-sm">
                          <Sparkles className="h-3 w-3 text-amber-400" />
                          <span>VIP Gold</span>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display text-lg font-bold tracking-wide text-zinc-100 group-hover:text-wine-200 transition-colors">
                            {profile.artisticName}
                          </h3>
                          <p className="text-xs font-semibold text-zinc-500">{profile.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-extrabold text-wine-300">
                            R$ {profile.startingPrice.toLocaleString("pt-BR")}
                          </p>
                          <span className="text-[10px] text-zinc-500">por hora</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 border-t border-b border-zinc-800/60 py-2.5 text-xs text-zinc-400 font-medium">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-wine-400" />
                          {profile.city}, {profile.state}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                          {formatDate(profile.submittedAt)}
                        </span>
                      </div>

                      {/* Rejection preview if rejected */}
                      {profile.verificationStatus === "rejected" && profile.rejectionReason && (
                        <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-2.5 text-xs text-red-300">
                          <p className="font-bold text-[11px] uppercase tracking-wider mb-0.5">
                            Motivo da Recusa:
                          </p>
                          <p className="line-clamp-2 text-[11px]">{profile.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-5 pt-0 flex items-center gap-2">
                    {profile.verificationStatus === "pending_review" && (
                      <button
                        onClick={() => handleQuickApprove(profile.id)}
                        disabled={approvingId === profile.id}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/50 bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-950/40 transition-all hover:bg-emerald-500 disabled:opacity-60"
                      >
                        {approvingId === profile.id ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        <span>Aprovar</span>
                      </button>
                    )}

                    <Link
                      href={`/admin/perfis/${profile.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-800/80 py-2.5 text-xs font-bold text-zinc-200 shadow-sm transition-all hover:border-zinc-600 hover:bg-zinc-700"
                    >
                      <Eye className="h-3.5 w-3.5 text-wine-400" />
                      <span>Analisar</span>
                      <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AdminLayoutShell>
  );
}
