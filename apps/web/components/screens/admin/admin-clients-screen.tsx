"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, UserCheck, UserX, MapPin, Calendar, ShoppingBag, X, Users } from "lucide-react";
import { AdminLayoutShell } from "./admin-layout-shell";
import { useAdminSession } from "@/lib/admin-session";
import { getClients, suspendClient, reinstateClient } from "@/lib/admin-service";
import type { MockClient } from "@/lib/types";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  const visible = local.slice(0, 3);
  return `${visible}${"*".repeat(Math.max(local.length - 3, 3))}@${domain}`;
}

function maskCpf(cpf: string): string {
  return cpf.replace(/^(\d{3}\.\d{3}\.)(\d{3}-\d{2})$/, "***.***.$2");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function avatarColor(name: string): string {
  const colors = [
    "bg-blue-950 text-blue-300 border-blue-800/60",
    "bg-violet-950 text-violet-300 border-violet-800/60",
    "bg-emerald-950 text-emerald-300 border-emerald-800/60",
    "bg-amber-950 text-amber-300 border-amber-800/60",
    "bg-wine-950 text-wine-300 border-wine-800/60",
    "bg-cyan-950 text-cyan-300 border-cyan-800/60",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

type FilterStatus = "all" | "active" | "suspended";

interface SuspendModal {
  client: MockClient;
  reason: string;
}

export function AdminClientsScreen() {
  const { admin } = useAdminSession();
  const [clients, setClients] = useState<MockClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [suspendModal, setSuspendModal] = useState<SuspendModal | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    const data = await getClients();
    setClients(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await loadClients();
    })();
  }, [loadClients]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSuspend = async () => {
    if (!admin || !suspendModal || !suspendModal.reason.trim()) return;
    setActionLoading(suspendModal.client.id);
    await suspendClient(suspendModal.client.id, admin.id, suspendModal.reason.trim());
    await loadClients();
    setActionLoading(null);
    setSuspendModal(null);
    showToast(`${suspendModal.client.fullName} foi suspenso(a).`);
  };

  const handleReinstate = async (client: MockClient) => {
    if (!admin) return;
    setActionLoading(client.id);
    await reinstateClient(client.id, admin.id);
    await loadClients();
    setActionLoading(null);
    showToast(`${client.fullName} foi reativado(a).`);
  };

  const filtered = clients.filter((c) => {
    const matchStatus = filter === "all" || c.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.fullName.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    all: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    suspended: clients.filter((c) => c.status === "suspended").length,
  };

  return (
    <AdminLayoutShell breadcrumb="Gestão de Clientes">
      {/* Toast Feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-2xl border border-wine-800/60 bg-zinc-900 px-5 py-3.5 text-xs font-bold text-zinc-100 shadow-2xl shadow-black/80"
          >
            <span className="h-2 w-2 rounded-full bg-wine-500 animate-ping" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              Gestão de Clientes
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Administre cadastros de usuários contratantes, informações mascaradas e status de
              conta.
            </p>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900/40 p-2 rounded-2xl border border-zinc-800/60">
          <div className="flex items-center gap-1 overflow-x-auto p-1">
            {(["all", "active", "suspended"] as FilterStatus[]).map((f) => {
              const isActive = filter === f;
              const labels = { all: "Todos", active: "Ativos", suspended: "Suspensos" };
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-wine-900/60 text-wine-200 border border-wine-800/60 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                  }`}
                >
                  <span>{labels[f]}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      isActive ? "bg-wine-500 text-white" : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {counts[f]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative px-1">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              placeholder="Pesquisar por nome, email ou cidade…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-zinc-800 bg-zinc-950/80 py-2 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all focus:border-wine-700 focus:ring-1 focus:ring-wine-500/40 font-medium"
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-wine-500" />
            <p className="text-xs font-medium text-zinc-500">Carregando lista de clientes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-800/60 bg-zinc-900/20 py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 mb-3 text-zinc-600">
              <Users className="h-7 w-7" />
            </div>
            <p className="text-base font-bold text-zinc-300">Nenhum cliente encontrado</p>
            <p className="mt-1 text-xs text-zinc-500">Tente buscar por outro termo.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[auto_1.5fr_1.5fr_1fr_1fr_auto_auto] items-center gap-4 border-b border-zinc-800/80 bg-zinc-950/60 px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-zinc-500">
              <span>Avatar</span>
              <span>Nome do Cliente</span>
              <span>Contato Mascarado</span>
              <span>Cidade</span>
              <span>Registro</span>
              <span>Contatos</span>
              <span className="text-right">Ações</span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-zinc-800/60">
              {filtered.map((client, i) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="grid grid-cols-1 md:grid-cols-[auto_1.5fr_1.5fr_1fr_1fr_auto_auto] items-start md:items-center gap-3 md:gap-4 p-5 md:px-6 md:py-4 transition-colors hover:bg-zinc-900/80"
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold shadow-sm ${avatarColor(client.fullName)}`}
                  >
                    {client.fullName.charAt(0)}
                  </div>

                  {/* Nome + Status */}
                  <div>
                    <p className="font-bold text-zinc-100 text-xs sm:text-sm">{client.fullName}</p>
                    <div className="mt-1">
                      {client.status === "active" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                          <UserCheck className="h-3 w-3" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-950/60 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-red-400">
                          <UserX className="h-3 w-3" /> Suspenso
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Email + CPF */}
                  <div className="space-y-0.5">
                    <p className="text-xs text-zinc-300 font-mono">{maskEmail(client.email)}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{maskCpf(client.cpf)}</p>
                  </div>

                  {/* Cidade */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-wine-400 shrink-0" />
                    <span>
                      {client.city}, {client.state}
                    </span>
                  </div>

                  {/* Data */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Calendar className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                    <span>{formatDate(client.registeredAt)}</span>
                  </div>

                  {/* Contatos */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-wine-300 bg-wine-950/40 border border-wine-900/40 px-2.5 py-1 rounded-xl w-fit">
                    <ShoppingBag className="h-3.5 w-3.5 text-wine-400" />
                    <span>{client.totalContacts} contatos</span>
                  </div>

                  {/* Botão de Ação */}
                  <div className="flex justify-end">
                    {client.status === "active" ? (
                      <button
                        onClick={() => setSuspendModal({ client, reason: "" })}
                        disabled={actionLoading === client.id}
                        className="rounded-xl border border-red-900/60 bg-red-950/30 px-3 py-1.5 text-xs font-bold text-red-400 transition-all hover:bg-red-900/50 hover:text-red-200 disabled:opacity-50"
                      >
                        Suspender
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReinstate(client)}
                        disabled={actionLoading === client.id}
                        className="rounded-xl border border-emerald-900/60 bg-emerald-950/30 px-3 py-1.5 text-xs font-bold text-emerald-400 transition-all hover:bg-emerald-900/50 hover:text-emerald-200 disabled:opacity-50"
                      >
                        {actionLoading === client.id ? "Reativando..." : "Reativar"}
                      </button>
                    )}
                  </div>

                  {/* Motivo de Suspensão */}
                  {client.status === "suspended" && client.suspensionReason && (
                    <div className="col-span-full mt-1 rounded-2xl border border-red-900/40 bg-red-950/30 p-3 text-xs text-red-300">
                      <span className="font-bold uppercase tracking-wider text-[10px]">
                        Motivo da Suspensão:
                      </span>{" "}
                      {client.suspensionReason}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
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
                      <UserX className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-zinc-100 text-base">
                        Suspender Acesso de Cliente
                      </h2>
                      <p className="text-xs text-zinc-500">
                        Bloqueio de conta temporário/definitivo
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
                  Cliente: <span className="text-wine-300">{suspendModal.client.fullName}</span>
                </p>
                <p className="mb-4 text-xs text-zinc-400">
                  O cliente não poderá acessar a plataforma.
                </p>

                <textarea
                  value={suspendModal.reason}
                  onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })}
                  placeholder="Informe a justificativa da suspensão (ex: descumprimento de regras, acusação de assédio)..."
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
                      <UserX className="h-3.5 w-3.5" />
                    )}
                    <span>Confirmar Suspensão</span>
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
