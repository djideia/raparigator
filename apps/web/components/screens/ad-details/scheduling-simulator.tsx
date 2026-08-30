"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { Check, Lock, MessageSquare, DollarSign, Zap, CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PixIcon } from "@/components/ui/pix-icon";
import { CashIcon } from "@/components/ui/cash-icon";
import { VerifiedCheckIcon } from "@/components/ui/verified-check-icon";
import { TelegramIcon, WhatsAppIcon } from "@/components/ui/contact-icons";
import {
  ENCOUNTER_SIMULATOR_ANCHOR,
  ENCOUNTER_SIMULATOR_SCROLL_MARGIN,
} from "@/lib/encounter-brief";
import { useContactCta } from "./use-contact-cta";
import type { EncounterBrief, ProfessionalAd } from "@/lib/types";
import { cn, currency } from "@/lib/utils";

const PAYMENT_METHOD_OPTIONS = [
  {
    id: "pix",
    label: "Pix",
    Icon: PixIcon,
    iconClassName: "text-teal-500",
    iconSlotClassName: undefined,
  },
  {
    id: "dinheiro",
    label: "Dinheiro",
    Icon: CashIcon,
    iconClassName: "text-emerald-600",
    iconSlotClassName: "w-5",
  },
] as const;

function PaymentMethodBadge({
  label,
  Icon,
  iconClassName,
  iconSlotClassName,
}: {
  label: string;
  Icon: ComponentType<{ className?: string }>;
  iconClassName: string;
  iconSlotClassName?: string;
}) {
  const icon = <Icon className={cn("h-4 w-4 shrink-0", iconClassName)} />;

  return (
    <span
      className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-zinc-500 select-none"
      title={label}
    >
      {iconSlotClassName ? (
        <span className={cn("inline-flex shrink-0 items-center justify-center", iconSlotClassName)}>
          {icon}
        </span>
      ) : (
        icon
      )}
      {label}
    </span>
  );
}

interface SchedulingSimulatorProps {
  ad: ProfessionalAd;
  selectedDuration: string;
  setSelectedDuration: (duration: string) => void;
  selectedExtras: string[];
  toggleExtra: (extra: string) => void;
  basePrice: number;
  calculatedExtrasCost: number;
  totalCalculatedValue: number;
  role: string;
  setRiskTarget: (target: "WhatsApp" | "Telegram") => void;
  brief: EncounterBrief | null;
}

export function SchedulingSimulator({
  ad,
  selectedDuration,
  setSelectedDuration,
  selectedExtras,
  toggleExtra,
  basePrice,
  calculatedExtrasCost,
  totalCalculatedValue,
  role,
  setRiskTarget,
  brief,
}: SchedulingSimulatorProps) {
  const { onLoginClick, openChatWithBrief } = useContactCta(brief);

  return (
    <Card
      id={ENCOUNTER_SIMULATOR_ANCHOR}
      className={cn(
        "relative space-y-5 overflow-hidden rounded-2xl border-y-zinc-200/80 border-r-zinc-200/80 border-l-4 border-l-[#96001e] bg-linear-to-br from-white to-zinc-50/40 p-5 shadow-md sm:p-6",
        ENCOUNTER_SIMULATOR_SCROLL_MARGIN,
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-nowrap items-center justify-between gap-2">
          <h3 className="flex min-w-0 shrink items-center gap-2.5 font-display text-lg font-bold tracking-tight whitespace-nowrap text-zinc-900 sm:text-xl">
            <Zap className="h-5 w-5 shrink-0 text-[#96001e]" /> Simulador de Encontro
          </h3>
          <div className="mt-0.5 shrink-0">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-xs font-bold tracking-widest text-emerald-800 uppercase sm:text-xs">
              <VerifiedCheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />{" "}
              <span className="hidden sm:inline">Serviço</span> Seguro
            </span>
          </div>
        </div>
        {ad.paymentMethods && ad.paymentMethods.length > 0 && (
          <div className="pointer-events-none -mx-1 flex flex-nowrap items-center gap-x-2.5 overflow-x-auto px-1 touch-none select-none scrollbar-none sm:gap-x-3 [&::-webkit-scrollbar]:hidden">
            <span className="shrink-0 text-[11px] font-black uppercase tracking-widest text-zinc-900">
              Aceita:
            </span>
            {PAYMENT_METHOD_OPTIONS.map((option) =>
              ad.paymentMethods?.includes(option.id) ? (
                <PaymentMethodBadge
                  key={option.id}
                  label={option.label}
                  Icon={option.Icon}
                  iconClassName={option.iconClassName}
                  iconSlotClassName={
                    "iconSlotClassName" in option ? option.iconSlotClassName : undefined
                  }
                />
              ) : null,
            )}
            {ad.paymentMethods.includes("credito") && ad.paymentMethods.includes("debito") ? (
              <PaymentMethodBadge
                key="credito-debito"
                label="Crédito e Débito"
                Icon={CreditCard}
                iconClassName="text-indigo-500"
              />
            ) : (
              <>
                {ad.paymentMethods.includes("credito") && (
                  <PaymentMethodBadge
                    key="credito"
                    label="Crédito"
                    Icon={CreditCard}
                    iconClassName="text-indigo-500"
                  />
                )}
                {ad.paymentMethods.includes("debito") && (
                  <PaymentMethodBadge
                    key="debito"
                    label="Débito"
                    Icon={CreditCard}
                    iconClassName="text-indigo-500"
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {ad.pricingTable.map((plan) => {
          const isSelected = selectedDuration === plan.label;
          return (
            <button
              key={plan.label}
              type="button"
              onClick={() => setSelectedDuration(plan.label)}
              className={cn(
                "group relative flex min-h-15.5 cursor-pointer flex-nowrap items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all sm:min-h-16.5 sm:px-5 sm:py-3.5",
                isSelected
                  ? "border-[#96001e] bg-red-50/40 ring-1 ring-[#96001e]/30 shadow-sm"
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50",
              )}
            >
              <div className="flex min-w-0 shrink flex-col pr-2">
                <span className="text-xs font-black tracking-widest whitespace-nowrap text-zinc-400 uppercase sm:text-xs">
                  Duração
                </span>
                <span
                  className={cn(
                    "mt-0.5 truncate text-sm font-semibold whitespace-nowrap sm:text-base",
                    isSelected ? "font-bold text-[#96001e]" : "text-zinc-700",
                  )}
                >
                  {plan.label}
                </span>
              </div>

              <div className="flex shrink-0 flex-nowrap items-center gap-3">
                {isSelected && (
                  <span className="mr-1 animate-fade-in text-sm font-bold whitespace-nowrap text-zinc-900 sm:text-base">
                    {currency(plan.price)}
                  </span>
                )}
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                    isSelected
                      ? "border-[#96001e] bg-[#96001e] text-white"
                      : "border-zinc-200 bg-zinc-50/50",
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
              </div>

              {plan.label === "1 hora" && (
                <span className="absolute -top-2.5 right-3 z-10 block rounded-full border-2 border-white bg-[#ffc107] px-3 py-0.5 text-xs leading-none font-extrabold tracking-widest text-zinc-900 uppercase shadow-sm sm:right-4 sm:text-xs">
                  Popular
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-3 border-t border-zinc-100 pt-5">
        <p className="text-xs font-bold tracking-widest text-zinc-900 uppercase sm:text-xs">
          Deseja incluir algum adicional?
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {ad.services.map((svc) => {
            const hasExtra = selectedExtras.includes(svc);
            return (
              <button
                key={svc}
                type="button"
                onClick={() => toggleExtra(svc)}
                className={cn(
                  "flex min-h-11.5 cursor-pointer items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition-all sm:min-h-12.5 sm:px-4",
                  hasExtra
                    ? "border-[#96001e] bg-red-50/40 ring-1 ring-[#96001e]/30 shadow-xs"
                    : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50",
                )}
              >
                <span
                  className={cn(
                    "truncate pr-1 text-xs font-medium sm:pr-2 sm:text-sm",
                    hasExtra ? "font-semibold text-zinc-900" : "text-zinc-700",
                  )}
                >
                  {svc}
                </span>

                <div className="flex shrink-0 items-center gap-3">
                  {hasExtra && (
                    <span className="flex animate-fade-in items-center text-sm font-medium text-zinc-900">
                      <span className="mr-1 font-bold text-[#96001e]">+</span> {currency(150)}
                    </span>
                  )}
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                      hasExtra
                        ? "border-[#96001e] bg-[#96001e] text-white"
                        : "border-zinc-200 bg-zinc-50/50",
                    )}
                  >
                    {hasExtra && <Check className="h-3 w-3" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex flex-col overflow-hidden rounded-2xl bg-zinc-950 text-white shadow-lg">
        <div className="space-y-3 p-5 pb-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Encontro Selecionado ({selectedDuration})</span>
            <span className="font-mono">{currency(basePrice)}</span>
          </div>
          {selectedExtras.length > 0 && (
            <div className="animate-slide-in flex items-center justify-between text-xs text-zinc-400">
              <span>Adicionais Personalizados ({selectedExtras.length})</span>
              <span className="flex items-center font-mono">
                <span className="mr-1.5 font-bold text-[#96001e]">+</span>{" "}
                {currency(calculatedExtrasCost)}
              </span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-dashed border-zinc-800 pt-3 text-sm">
            <span className="flex items-center gap-1.5 font-bold text-zinc-100">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              Valor Total:
            </span>
            <span className="font-mono text-lg font-black text-amber-300">
              {currency(totalCalculatedValue)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 bg-zinc-900/50 p-4">
          {role === "visitor" ? (
            <Link
              href="/auth/login"
              onClick={onLoginClick}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 font-bold text-white shadow-sm ring-1 ring-white/5 transition-all hover:bg-zinc-700 active:scale-[0.98]"
            >
              <Lock className="h-4 w-4" /> Entrar para Interagir
            </Link>
          ) : (
            <button
              type="button"
              onClick={openChatWithBrief}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 font-bold text-white shadow-sm ring-1 ring-white/5 transition-all hover:bg-zinc-700 active:scale-[0.98]"
            >
              <MessageSquare className="h-4 w-4" /> Chat Direto
            </button>
          )}
          <div className="flex items-center gap-2.5 w-full">
            <button
              onClick={() => setRiskTarget("WhatsApp")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-800 font-bold text-[#25D366] shadow-sm ring-1 ring-white/5 transition-all duration-300 hover:scale-[1.02] hover:bg-zinc-700 active:scale-[0.98] h-11 px-2 text-sm focus-visible:outline-none"
            >
              <WhatsAppIcon className="h-4.5 w-4.5" /> WhatsApp
            </button>
            <button
              onClick={() => setRiskTarget("Telegram")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-800 font-bold text-[#229ED9] shadow-sm ring-1 ring-white/5 transition-all duration-300 hover:scale-[1.02] hover:bg-zinc-700 active:scale-[0.98] h-11 px-2 text-sm focus-visible:outline-none"
            >
              <TelegramIcon className="h-4.5 w-4.5" /> Telegram
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
