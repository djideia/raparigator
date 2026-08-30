"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  Ruler,
  Tag,
  DollarSign,
  X,
  AlertTriangle,
} from "lucide-react";
import { AdminLayoutShell } from "./admin-layout-shell";
import { useAdminSession } from "@/lib/admin-session";
import { getProfileById, approveProfile, rejectProfile } from "@/lib/admin-service";
import type { ProfessionalAd, VerificationStatus } from "@/lib/types";

interface AdminProfileDetailScreenProps {
  profileId: string;
}

function StatusBadge({ status }: { status: VerificationStatus | undefined }) {
  if (status === "pending_review") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-800/60 bg-amber-900/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
        <Clock className="h-3 w-3" /> Em análise
      </span>
    );
  }
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800/60 bg-emerald-900/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Aprovado
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-800/60 bg-red-900/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-400">
        <XCircle className="h-3 w-3" /> Recusado
      </span>
    );
  }
  return null;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminProfileDetailScreen({ profileId }: AdminProfileDetailScreenProps) {
  const router = useRouter();
  const { admin } = useAdminSession();
  const [profile, setProfile] = useState<ProfessionalAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const data = await getProfileById(profileId);
    setProfile(data);
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    void (async () => {
      await loadProfile();
    })();
  }, [loadProfile]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async () => {
    if (!admin || !profile) return;
    setActionLoading("approve");
    await approveProfile(profile.id, admin.id);
    await loadProfile();
    setActionLoading(null);
    showToast("Perfil aprovado com sucesso!", "success");
  };

  const handleReject = async () => {
    if (!admin || !profile || !rejectReason.trim()) return;
    setActionLoading("reject");
    await rejectProfile(profile.id, admin.id, rejectReason.trim());
    await loadProfile();
    setActionLoading(null);
    setShowRejectModal(false);
    setRejectReason("");
    showToast("Perfil recusado.", "error");
  };

  if (loading) {
    return (
      <AdminLayoutShell breadcrumb="Carregando…">
        <div className="flex items-center justify-center py-20">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-wine-500" />
        </div>
      </AdminLayoutShell>
    );
  }

  if (!profile) {
    return (
      <AdminLayoutShell breadcrumb="Perfil não encontrado">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle className="mb-3 h-10 w-10 text-zinc-700" />
          <p className="text-sm font-semibold text-zinc-400">Perfil não encontrado.</p>
          <button
            onClick={() => router.push("/admin/perfis")}
            className="mt-4 text-xs text-wine-400 underline"
          >
            Voltar para a lista
          </button>
        </div>
      </AdminLayoutShell>
    );
  }

  const isPending = profile.verificationStatus === "pending_review";

  return (
    <AdminLayoutShell breadcrumb={profile.artisticName}>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl transition-all ${
            toast.type === "success"
              ? "border-emerald-800/60 bg-emerald-900/80 text-emerald-300"
              : "border-red-800/60 bg-red-900/80 text-red-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      )}

      {/* Back + Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/perfis")}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </button>
          <div>
            <h1 className="text-lg font-bold text-zinc-100">{profile.artisticName}</h1>
            <p className="text-xs text-zinc-500">Submetido em {formatDate(profile.submittedAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={profile.verificationStatus} />
          {isPending && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading !== null}
                className="flex items-center gap-1.5 rounded-xl border border-red-800/60 bg-red-900/20 px-4 py-2 text-sm font-semibold text-red-400 transition-all hover:bg-red-900/40 disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                Recusar
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading !== null}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-900/40 transition-all hover:bg-emerald-600 disabled:opacity-60"
              >
                {actionLoading === "approve" ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Aprovar perfil
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna esquerda: imagens */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            {/* Imagem principal */}
            <div className="relative aspect-[3/4] bg-zinc-800">
              {profile.images[activeImage] && (
                <Image
                  src={profile.images[activeImage]}
                  alt={`${profile.artisticName} — foto ${activeImage + 1}`}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              )}
            </div>
            {/* Thumbnails */}
            {profile.images.length > 1 && (
              <div className="flex gap-2 p-3">
                {profile.images.map((img, idx) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(idx)}
                    className={`relative h-14 w-14 overflow-hidden rounded-lg border-2 transition-all ${
                      idx === activeImage
                        ? "border-wine-500"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Foto ${idx + 1}`}
                      fill
                      className="object-cover object-top"
                      sizes="56px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Motivo de recusa */}
          {profile.verificationStatus === "rejected" && profile.rejectionReason && (
            <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 p-4">
              <p className="mb-1 text-xs font-black uppercase tracking-wider text-red-500">
                Motivo da recusa
              </p>
              <p className="text-sm leading-relaxed text-red-300">{profile.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Coluna direita: detalhes */}
        <div className="space-y-4 lg:col-span-2">
          {/* Informações básicas */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
              Informações do perfil
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                {
                  icon: MapPin,
                  label: "Localização",
                  value: `${profile.neighborhood}, ${profile.city} — ${profile.state}`,
                },
                { icon: Tag, label: "Categoria", value: profile.category },
                { icon: Ruler, label: "Altura", value: `${profile.heightCm} cm` },
                {
                  icon: DollarSign,
                  label: "A partir de",
                  value: `R$ ${profile.startingPrice.toLocaleString("pt-BR")}/h`,
                },
                { icon: Calendar, label: "Submetido em", value: formatDate(profile.submittedAt) },
                { icon: Tag, label: "Etnia", value: profile.ethnicity },
              ].map((item) => (
                <div key={item.label}>
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    <item.icon className="h-3 w-3" />
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-zinc-200">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
              Descrição do perfil
            </p>
            <p className="text-sm leading-relaxed text-zinc-300">{profile.description}</p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              {profile.serviceDescription}
            </p>
          </div>

          {/* Serviços */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
              Serviços
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.services.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
                >
                  {s}
                </span>
              ))}
              {profile.serviceOptions.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-zinc-700/50 bg-zinc-800/50 px-3 py-1 text-xs text-zinc-500"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Tabela de preços */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
              Tabela de preços
            </p>
            <div className="divide-y divide-zinc-800">
              {profile.pricingTable.map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-zinc-400">{row.label}</span>
                  <span className="font-semibold text-zinc-200">
                    R$ {row.price.toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de recusa */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-400" />
                <h2 className="font-semibold text-zinc-100">Recusar perfil</h2>
              </div>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="rounded-lg p-1 text-zinc-600 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 text-sm text-zinc-400">
              Informe o motivo da recusa. Este texto será registrado e poderá ser comunicado à
              profissional.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Fotos não atendem os critérios mínimos de qualidade…"
              rows={4}
              className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all focus:border-red-700/60 focus:ring-1 focus:ring-red-700/20"
            />

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 transition-all hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading === "reject"}
                className="flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading === "reject" ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Confirmar recusa
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayoutShell>
  );
}
