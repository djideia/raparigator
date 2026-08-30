"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  MapPin,
  Star,
  Eye,
  ShieldX,
  ShieldCheck,
  X,
  Users,
  Crown,
  ChevronRight,
} from "lucide-react";
import { AdminLayoutShell } from "./admin-layout-shell";
import { useAdminSession } from "@/lib/admin-session";
import {
  getActiveProfessionals,
  suspendProfessional,
  reinstateProfessional,
} from "@/lib/admin-service";
import type { ProfessionalAd } from "@/lib/types";

type FilterTier = "all" | "premium" | "normal";

interface SuspendModal {
  profile: ProfessionalAd;
  reason: string;
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function AdminActiveProfessionalsScreen() {
  const { admin } = useAdminSession();
  const [profiles, setProfiles] = useState<ProfessionalAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<FilterTier>("all");
  const [suspendModal, setSuspendModal] = useState<SuspendModal | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getActiveProfessionals();
    setProfiles(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSuspend = async () => {
    if (!admin || !suspendModal || !suspendModal.reason.trim()) return;
    setActionLoading(suspendModal.profile.id);
    await suspendProfessional(suspendModal.profile.id, admin.id, suspendModal.reason.trim());
    await load();
    setActionLoading(null);
    setSuspendModal(null);
    showToast(`${suspendModal.profile.artisticName} foi suspenso(a).`, "error");
  };

  const handleReinstate = async (profile: ProfessionalAd) => {
    if (!admin) return;
    setActionLoading(profile.id);
    await reinstateProfessional(profile.id, admin.id);
    await load();
    setActionLoading(null);
    showToast(`${profile.artisticName} foi reativado(a).`, "success");
  };

  const filtered = profiles.filter((p) => {
    const matchTier = tierFilter === "all" || p.adTier === tierFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.artisticName.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchTier && matchSearch;
  });

  const counts = {
    all: profiles.length,
    premium: profiles.filter((p) => p.adTier === "premium").length,
    normal: profiles.filter((p) => p.adTier === "normal").length,
    suspended: profiles.filter((p) => p.isSuspended).length,
  };

  return (
    <AdminLayoutShell breadcrumb="Profissionais Aprovados">
      {/* Toast Feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-2xl border px-5 py-3.5 text-xs font-bold shadow-2xl ${
              toast.type === "success"
                ? "border-emerald-800/60 bg-zinc-900 text-emerald-300"
                : "border-red-800/60 bg-zinc-900 text-red-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full animate-ping ${toast.type === "success" ? "bg-emerald-400" : "bg-red-400"}`}
            />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              Profissionais & Anúncios Ativos
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              {counts.all} profissionais registrados · {counts.premium} com destaque VIP Gold ·{" "}
              {counts.suspended} suspensos
            </p>
          </div>
        </div>

        {/* Controls Bar: Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900/40 p-2 rounded-2xl border border-zinc-800/60">
          <div className="flex items-center gap-1 overflow-x-auto p-1">
            {(["all", "premium", "normal"] as FilterTier[]).map((t) => {
              const isActive = tierFilter === t;
              const labels = { all: "Todos", premium: "VIP Gold", normal: "Standard" };
              return (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-wine-900/60 text-wine-200 border border-wine-800/60 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                  }`}
                >
                  {t === "premium" && <Crown className="h-3.5 w-3.5 text-amber-400" />}
                  <span>{labels[t]}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      isActive ? "bg-wine-500 text-white" : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {counts[t]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative px-1">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              placeholder="Nome artístico, categoria ou cidade…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-zinc-800 bg-zinc-950/80 py-2 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all focus:border-wine-700 focus:ring-1 focus:ring-wine-500/40 font-medium"
            />
          </div>
        </div>

        {/* Grid Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-wine-500" />
            <p className="text-xs font-medium text-zinc-500">
              Carregando acompanhantes aprovadas...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-800/60 bg-zinc-900/20 py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 mb-3 text-zinc-600">
              <Users className="h-7 w-7" />
            </div>
            <p className="text-base font-bold text-zinc-300">
              Nenhum perfil profissional encontrado
            </p>
            <p className="mt-1 text-xs text-zinc-500">Tente buscar por outro termo.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map((profile, i) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-zinc-900/50 backdrop-blur-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-black/60 ${
                    profile.isSuspended
                      ? "border-red-900/60 opacity-80"
                      : "border-zinc-800/80 hover:border-zinc-700/80"
                  }`}
                >
                  <div>
                    {/* Image Container */}
                    <div className="relative h-48 w-full overflow-hidden bg-zinc-950">
                      {profile.images[0] ? (
                        <Image
                          src={profile.images[0]}
                          alt={profile.artisticName}
                          fill
                          className={`object-cover object-top transition-transform duration-700 group-hover:scale-105 ${
                            profile.isSuspended ? "grayscale" : ""
                          }`}
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-zinc-700">
                          <Users className="h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                      {/* Tier Badge */}
                      {profile.adTier === "premium" && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full border border-yellow-500/40 bg-zinc-950/80 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300 backdrop-blur-md shadow-sm">
                          <Crown className="h-3 w-3 text-amber-400" />
                          <span>VIP Gold</span>
                        </div>
                      )}

                      {/* Suspended Overlay */}
                      {profile.isSuspended && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-950/70 backdrop-blur-xs">
                          <div className="flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/90 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-red-300 shadow-xl">
                            <ShieldX className="h-4 w-4 text-red-400" />
                            <span>Conta Suspensa</span>
                          </div>
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

                      {/* Metrics Badges */}
                      <div className="flex flex-wrap items-center gap-3 border-t border-b border-zinc-800/60 py-2.5 text-xs text-zinc-400 font-medium">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-wine-400" />
                          {profile.city}, {profile.state}
                        </span>
                        {profile.rating > 0 && (
                          <span className="flex items-center gap-1 font-bold text-amber-400">
                            <Star className="h-3.5 w-3.5 fill-amber-400" />
                            {profile.rating.toFixed(1)}
                            <span className="text-[10px] font-normal text-zinc-500">
                              ({profile.reviewsCount})
                            </span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-zinc-500">
                          <Eye className="h-3.5 w-3.5 text-zinc-600" />
                          {formatViews(profile.profileViews)} views
                        </span>
                      </div>

                      {/* Suspension Reason if exists */}
                      {profile.isSuspended && profile.rejectionReason && (
                        <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-2.5 text-xs text-red-300">
                          <p className="font-bold text-[11px] uppercase tracking-wider mb-0.5">
                            Motivo do Bloqueio:
                          </p>
                          <p className="line-clamp-2 text-[11px]">{profile.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-5 pt-0 flex items-center gap-2">
                    {profile.isSuspended ? (
                      <button
                        onClick={() => handleReinstate(profile)}
                        disabled={actionLoading === profile.id}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/50 bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-950/40 transition-all hover:bg-emerald-500 disabled:opacity-60"
                      >
                        {actionLoading === profile.id ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                        <span>Reativar Conta</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSuspendModal({ profile, reason: "" })}
                        disabled={actionLoading === profile.id}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-900/60 bg-red-950/30 py-2.5 text-xs font-bold text-red-400 transition-all hover:bg-red-900/50 hover:text-red-200 disabled:opacity-60"
                      >
                        <ShieldX className="h-4 w-4" />
                        <span>Suspender</span>
                      </button>
                    )}

                    <Link
                      href={`/admin/perfis/${profile.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-800/80 py-2.5 text-xs font-bold text-zinc-200 shadow-sm transition-all hover:border-zinc-600 hover:bg-zinc-700"
                    >
                      <Eye className="h-3.5 w-3.5 text-wine-400" />
                      <span>Ver Perfil</span>
                      <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Modal de Suspensão */}
        <AnimatePresence>
          {suspendModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSuspendModal(null)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/80"
              >
                <div className="mb-4 flex items-center justify-between border-b border-zinc-800/80 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-950 text-red-400 border border-red-800/50">
                      <ShieldX className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-zinc-100 text-base">
                        Suspender Perfil Profissional
                      </h2>
                      <p className="text-xs text-zinc-500">
                        Oculta o anúncio de buscas e feed público
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSuspendModal(null)}
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="mb-1 text-xs font-bold text-zinc-200">
                  Acompanhante:{" "}
                  <span className="text-wine-300">{suspendModal.profile.artisticName}</span>
                </p>
                <p className="mb-4 text-xs text-zinc-400">
                  Descreva o motivo do bloqueio do anúncio para registro nos logs de moderação.
                </p>

                <textarea
                  value={suspendModal.reason}
                  onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })}
                  placeholder="Ex: Violação dos termos de imagem, denúncia confirmada de desacordo comercial..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-500/40 font-medium"
                />

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSuspendModal(null)}
                    className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSuspend}
                    disabled={!suspendModal.reason.trim() || actionLoading !== null}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:from-red-500 hover:to-red-600 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <ShieldX className="h-3.5 w-3.5" />
                    )}
                    <span>Confirmar Bloqueio</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayoutShell>
  );
}
