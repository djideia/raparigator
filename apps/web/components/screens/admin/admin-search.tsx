"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Search, User, Users, X, Command, ArrowRight } from "lucide-react";
import { globalSearch } from "@/lib/admin-service";
import type { GlobalSearchResult } from "@/lib/types";

function ResultIcon({ type }: { type: GlobalSearchResult["type"] }) {
  return type === "client" ? (
    <User className="h-4 w-4 text-blue-400" />
  ) : (
    <Users className="h-4 w-4 text-wine-400" />
  );
}

function statusLabel(status?: string): string {
  switch (status) {
    case "pending_review":
      return "Em análise";
    case "published":
      return "Aprovado";
    case "rejected":
      return "Recusado";
    case "active":
      return "Ativo";
    case "suspended":
      return "Suspenso";
    default:
      return "";
  }
}

function statusColor(status?: string): string {
  switch (status) {
    case "pending_review":
      return "bg-amber-950/60 text-amber-400 border-amber-800/50";
    case "published":
    case "active":
      return "bg-emerald-950/60 text-emerald-400 border-emerald-800/50";
    case "rejected":
    case "suspended":
      return "bg-red-950/60 text-red-400 border-red-800/50";
    default:
      return "bg-zinc-800/60 text-zinc-400 border-zinc-700/50";
  }
}

export function AdminSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "client" | "professional">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K / ⌘K
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Focus input when opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      void (() => {
        setQuery("");
        setResults([]);
        setActiveFilter("all");
      })();
    }
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const data = await globalSearch(q);
    setResults(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void doSearch(query);
    }, 200);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const filteredResults = results.filter((r) => {
    if (activeFilter === "all") return true;
    return r.type === activeFilter;
  });

  const clients = filteredResults.filter((r) => r.type === "client");
  const professionals = filteredResults.filter((r) => r.type === "professional");

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2.5 rounded-full border border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 text-xs text-zinc-400 shadow-inner transition-all duration-200 hover:border-wine-800/60 hover:bg-zinc-900 hover:text-zinc-200"
      >
        <Search className="h-3.5 w-3.5 text-zinc-500 transition-colors group-hover:text-wine-400" />
        <span className="hidden sm:inline font-medium">Buscar no painel...</span>
        <span className="inline sm:hidden font-medium">Buscar</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-500 shadow-sm">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 sm:pt-24">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950 shadow-2xl shadow-black/80"
            >
              {/* Header Search Input */}
              <div className="flex items-center gap-3 border-b border-zinc-800/80 px-4 py-3.5 bg-zinc-900/40">
                <Search className="h-4 w-4 shrink-0 text-wine-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Pesquisar clientes por nome/email ou acompanhantes por nome/cidade..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none font-medium"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-[10px] font-bold text-zinc-500 hover:text-zinc-300"
                >
                  ESC
                </button>
              </div>

              {/* Filter Tabs */}
              {query && (
                <div className="flex items-center gap-2 border-b border-zinc-800/60 bg-zinc-950 px-4 py-2 text-xs">
                  <button
                    onClick={() => setActiveFilter("all")}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                      activeFilter === "all"
                        ? "bg-wine-900/50 text-wine-300 border border-wine-800/50"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Todos ({results.length})
                  </button>
                  <button
                    onClick={() => setActiveFilter("client")}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                      activeFilter === "client"
                        ? "bg-blue-950/60 text-blue-300 border border-blue-800/50"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Clientes ({results.filter((r) => r.type === "client").length})
                  </button>
                  <button
                    onClick={() => setActiveFilter("professional")}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                      activeFilter === "professional"
                        ? "bg-wine-950/60 text-wine-300 border border-wine-800/50"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Profissionais ({results.filter((r) => r.type === "professional").length})
                  </button>
                </div>
              )}

              {/* Results List */}
              <div className="max-h-96 overflow-y-auto p-2 space-y-3">
                {loading && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-2">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-800 border-t-wine-500" />
                    <p className="text-xs text-zinc-500">Buscando na base de dados...</p>
                  </div>
                )}

                {!loading && query && filteredResults.length === 0 && (
                  <div className="py-12 text-center text-xs text-zinc-500">
                    Nenhum resultado encontrado para &ldquo;
                    <span className="text-zinc-300">{query}</span>&rdquo;
                  </div>
                )}

                {!loading && !query && (
                  <div className="py-10 text-center space-y-2">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-wine-950/50 border border-wine-900/30 text-wine-400">
                      <Search className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-medium text-zinc-400">
                      Busca Rápida de Administrador
                    </p>
                    <p className="text-[11px] text-zinc-600 max-w-xs mx-auto">
                      Digite o nome, email, telefone ou ID do cliente ou profissional para encontrar
                      o registro instantaneamente.
                    </p>
                  </div>
                )}

                {!loading && clients.length > 0 && (
                  <div>
                    <p className="mb-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                      Clientes Registrados
                    </p>
                    <div className="space-y-1">
                      {clients.map((r) => (
                        <Link
                          key={r.id}
                          href={r.href}
                          onClick={() => setOpen(false)}
                          className="group flex items-center justify-between gap-3 rounded-xl border border-transparent p-2.5 transition-all hover:border-zinc-800 hover:bg-zinc-900/80"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-950/60 border border-blue-900/40">
                              <ResultIcon type={r.type} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-200 group-hover:text-wine-300">
                                {r.name}
                              </p>
                              <p className="text-[11px] text-zinc-500 truncate">{r.subtitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {r.status && (
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor(r.status)}`}
                              >
                                {statusLabel(r.status)}
                              </span>
                            )}
                            <ArrowRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {!loading && professionals.length > 0 && (
                  <div>
                    <p className="mb-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                      Profissionais & Anúncios
                    </p>
                    <div className="space-y-1">
                      {professionals.map((r) => (
                        <Link
                          key={r.id}
                          href={r.href}
                          onClick={() => setOpen(false)}
                          className="group flex items-center justify-between gap-3 rounded-xl border border-transparent p-2.5 transition-all hover:border-zinc-800 hover:bg-zinc-900/80"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wine-950/60 border border-wine-900/40">
                              <ResultIcon type={r.type} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-200 group-hover:text-wine-300">
                                {r.name}
                              </p>
                              <p className="text-[11px] text-zinc-500 truncate">{r.subtitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {r.status && (
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor(r.status)}`}
                              >
                                {statusLabel(r.status)}
                              </span>
                            )}
                            <ArrowRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer status bar */}
              <div className="flex items-center justify-between border-t border-zinc-800/80 bg-zinc-900/50 px-4 py-2.5 text-[11px] text-zinc-500">
                <span>Use as setas para selecionar · Enter para abrir</span>
                <span className="font-mono text-zinc-600">Sigillus Admin v2.0</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
