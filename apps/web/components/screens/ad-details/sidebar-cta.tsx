"use client";

import Link from "next/link";
import { Crown, Lock, MessageSquare, Sparkles, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useContactCta } from "./use-contact-cta";
import type { EncounterBrief } from "@/lib/types";
import { TelegramIcon, WhatsAppIcon } from "@/components/ui/contact-icons";

interface SidebarCtaProps {
  role: string;
  setRiskTarget: (target: "WhatsApp" | "Telegram") => void;
  brief: EncounterBrief | null;
}

export function SidebarCta({ role, setRiskTarget, brief }: SidebarCtaProps) {
  const { onLoginClick, openChatWithBrief } = useContactCta(brief);

  return (
    <Card className="order-last lg:order-first p-5 sm:p-6 border-0 bg-linear-to-br from-[#121212] via-[#1a1a1a] to-[#0a0a0a] shadow-xl rounded-2xl text-center space-y-6 relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none rotate-12">
        <Sparkles className="h-32 w-32 text-amber-300" strokeWidth={2.5} />
      </div>
      <div className="absolute -left-10 -bottom-10 h-32 w-32 overflow-hidden rounded-full bg-linear-to-tr from-amber-500/20 to-transparent blur-2xl" />

      <div className="relative space-y-4 z-10 flex flex-col items-center">
        {/* Minimalist Sigillus Logo/Icon Element */}
        <div className="h-12 w-12 rounded-full border border-amber-900/40 bg-black/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,215,0,0.1)] mb-1">
          <Crown className="h-6 w-6 text-amber-400" />
        </div>

        <div className="space-y-1">
          <h3 className="font-display text-xs uppercase tracking-[0.2em] font-extrabold text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Alto Padrão • Discrição
          </h3>
          <h4 className="font-display text-2xl font-bold bg-linear-to-r from-amber-200 via-amber-100 to-amber-300 bg-clip-text text-transparent pb-1">
            Acesso Exclusivo
          </h4>
        </div>

        <p className="text-sm text-zinc-400 leading-relaxed max-w-62.5 font-medium">
          Fale diretamente com a profissional pelo chat da plataforma, com total privacidade.
        </p>

        <div className="w-full flex items-center justify-center gap-4 py-2 border-y border-white/5">
          <div className="flex flex-col items-center">
            <Lock className="h-4 w-4 text-emerald-400 mb-1" />
            <span className="text-xs uppercase tracking-wider font-bold text-zinc-500">Sigilo</span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex flex-col items-center">
            <Star className="h-4 w-4 text-amber-400 mb-1" />
            <span className="text-xs uppercase tracking-wider font-bold text-zinc-500">
              Prestígio
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 relative z-10 w-full mt-2">
        {role === "visitor" ? (
          <Link
            href="/auth/login"
            onClick={onLoginClick}
            className="group relative block w-full outline-[none]"
          >
            <div className="absolute -inset-0.5 rounded-xl bg-linear-to-r from-amber-500/30 to-amber-600/30 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#121212] px-5 py-2 font-bold text-amber-400 shadow-sm transition-all duration-300 hover:bg-[#1a1a1a]">
              <MessageSquare className="h-5 w-5" /> Entrar para Interagir
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={openChatWithBrief}
            className="group relative block w-full outline-[none]"
          >
            <div className="absolute -inset-0.5 rounded-xl bg-linear-to-r from-amber-500/30 to-amber-600/30 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#121212] px-5 py-2 font-bold text-amber-400 shadow-sm transition-all duration-300 hover:bg-[#1a1a1a]">
              <MessageSquare className="h-5 w-5" /> Iniciar Chat
            </span>
          </button>
        )}

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => setRiskTarget("WhatsApp")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#121212] font-bold text-[#25D366] shadow-sm transition-all duration-300 hover:scale-[1.02] hover:bg-[#18181b] active:scale-[0.98] h-12 px-2 text-sm focus-visible:outline-none"
          >
            <WhatsAppIcon className="h-4.5 w-4.5" /> WhatsApp
          </button>
          <button
            onClick={() => setRiskTarget("Telegram")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#121212] font-bold text-[#229ED9] shadow-sm transition-all duration-300 hover:scale-[1.02] hover:bg-[#18181b] active:scale-[0.98] h-12 px-2 text-sm focus-visible:outline-none"
          >
            <TelegramIcon className="h-4.5 w-4.5" /> Telegram
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-zinc-400 text-left leading-relaxed flex items-start gap-2 shadow-inner backdrop-blur-sm relative z-10 w-full mt-2">
        <Crown className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <span>
          O contato é mantido em extrema privacidade. Detalhes e disponibilidade são acordados
          diretamente com a profissional.
        </span>
      </div>
    </Card>
  );
}
