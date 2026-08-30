"use client";

import { ArrowRight, Clock, Pencil, RotateCcw, Send, X } from "lucide-react";
import Link from "next/link";
import { buildBriefGreeting, getAdEditHref } from "@/lib/encounter-brief";
import type { EncounterBrief } from "@/lib/types";
import { cn, currency } from "@/lib/utils";

function BriefLabel({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-wine-700",
        className,
      )}
    >
      Simulação de encontro
    </p>
  );
}

function BriefRows({ brief }: { brief: EncounterBrief }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Clock className="h-3.5 w-3.5" />
          Duração
        </span>
        <span className="text-sm font-semibold text-zinc-900">{brief.duration}</span>
      </div>

      {brief.extras.length > 0 ? (
        <div className="space-y-1.5">
          <span className="text-xs text-zinc-500">Adicionais</span>
          <div className="flex flex-wrap gap-1.5">
            {brief.extras.map((extra) => (
              <span
                key={extra}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-700"
              >
                {extra}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-dashed border-zinc-200 pt-2.5">
        <span className="text-xs text-zinc-500">Estimativa</span>
        <span className="font-mono text-base font-black text-wine-800">
          {currency(brief.total)}
        </span>
      </div>
    </>
  );
}

interface EncounterBriefCardProps {
  brief: EncounterBrief;
  className?: string;
}

/** Card do briefing dentro da conversa — fica fora da bolha para não empilhar vermelho no vermelho. */
export function EncounterBriefCard({ brief, className }: EncounterBriefCardProps) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm",
        className,
      )}
    >
      <div className="border-b border-zinc-100 bg-zinc-50/70 px-3.5 py-2">
        <BriefLabel />
      </div>

      <div className="space-y-2.5 px-3.5 py-3">
        <BriefRows brief={brief} />
        <p className="text-[10px] leading-snug text-zinc-400">
          Valor estimado pelo simulador. Os detalhes finais são combinados entre vocês.
        </p>
      </div>

      <Link
        // Mesma âncora do fluxo "ajustar simulação": pousa direto no simulador, não no
        // topo do anúncio — é ali que a pessoa estava quando montou esse interesse.
        href={getAdEditHref(brief.adSlug)}
        className="flex items-center justify-between gap-2 border-t border-zinc-100 bg-zinc-50/70 px-3.5 py-2.5 text-xs font-semibold text-wine-700 transition-colors hover:bg-zinc-100 hover:text-wine-800"
      >
        Ver anúncio de {brief.artisticName}
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}

interface EncounterBriefPreviewProps {
  brief: EncounterBrief;
  greeting: string;
  onGreetingChange: (value: string) => void;
  sending?: boolean;
  onSend: () => void;
  onDiscard: () => void;
  /** Volta ao anúncio para ajustar a simulação; disparado ao clicar no corpo do card */
  onEdit: () => void;
}

const GREETING_MAX_LENGTH = 500;

export function EncounterBriefPreview({
  brief,
  greeting,
  onGreetingChange,
  sending = false,
  onSend,
  onDiscard,
  onEdit,
}: EncounterBriefPreviewProps) {
  const suggestedGreeting = buildBriefGreeting(brief);
  const canSend = greeting.trim().length > 0 && !sending;

  return (
    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/70 px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-wine-700">
          Seu interesse, pronto para enviar
        </p>
        <button
          type="button"
          onClick={onDiscard}
          aria-label="Descartar simulação"
          title="Descartar simulação"
          className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 active:scale-95"
        >
          <X size={15} strokeWidth={2.5} />
        </button>
      </div>

      <div className="p-3">
        <div className="mb-2.5">
          <div className="mb-1 flex items-center justify-between">
            <label
              htmlFor="encounter-brief-greeting"
              className="text-[11px] font-semibold text-zinc-500"
            >
              Sua mensagem
            </label>
            {greeting !== suggestedGreeting ? (
              <button
                type="button"
                onClick={() => onGreetingChange(suggestedGreeting)}
                className="flex items-center gap-1 text-[11px] font-semibold text-wine-600 hover:text-wine-800 hover:underline"
              >
                <RotateCcw size={11} />
                Restaurar sugestão
              </button>
            ) : null}
          </div>
          <textarea
            id="encounter-brief-greeting"
            value={greeting}
            onChange={(event) => onGreetingChange(event.target.value)}
            maxLength={GREETING_MAX_LENGTH}
            rows={3}
            placeholder="Escreva uma saudação para enviar junto com a simulação..."
            className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:border-wine-400 focus:bg-white"
          />
        </div>

        <button
          type="button"
          onClick={onEdit}
          title="Voltar ao anúncio para ajustar a simulação"
          className="-m-1 w-[calc(100%+0.5rem)] rounded-xl p-1 text-left transition-colors hover:bg-zinc-50"
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="flex items-center gap-1.5 text-sm">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-semibold text-zinc-900">{brief.duration}</span>
            </span>
            {brief.extras.length > 0 ? (
              <span className="text-xs text-zinc-500">
                {brief.extras.length} {brief.extras.length > 1 ? "adicionais" : "adicional"} ·{" "}
                {brief.extras.join(", ")}
              </span>
            ) : (
              <span className="text-xs text-zinc-500">Sem adicionais</span>
            )}
            <span className="ml-auto font-mono text-base font-black text-wine-800">
              {currency(brief.total)}
            </span>
          </div>

          <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
            <Pencil size={11} />
            Toque para ajustar a simulação
          </p>
        </button>

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-wine-700 text-sm font-bold text-white shadow-sm transition-all hover:bg-wine-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={15} />
          {sending ? "Enviando..." : "Enviar interesse"}
        </button>
      </div>
    </div>
  );
}
