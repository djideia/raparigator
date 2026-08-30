"use client";

import { useState } from "react";
import { BarChart3, Lock, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ShinyButton } from "@/components/ui/shiny-button";
import { PremiumConversionModal } from "@/components/ui/premium-conversion-modal";
import { trafficDiscovery } from "@/lib/mock-data";
import { usePremiumPlan } from "@/lib/premium-plan";
import { cn } from "@/lib/utils";

export function TrafficDiscoveryCard() {
  const { isPremium } = usePremiumPlan();
  const [upsellOpen, setUpsellOpen] = useState(false);

  const maxImpression = Math.max(...trafficDiscovery.weeklyImpressions.map((day) => day.value));
  const position = isPremium
    ? trafficDiscovery.premiumSearchPosition
    : trafficDiscovery.searchPosition;

  return (
    <Card className="relative overflow-hidden p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-50">
            <BarChart3 className="h-5 w-5 text-wine-700" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-zinc-900">Tráfego e Descoberta</h3>
            <p className="text-xs text-zinc-500">Como as clientes encontram seu anúncio</p>
          </div>
        </div>
        {isPremium ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#121212] px-3 py-1 text-xs font-semibold text-[#FFDF00]">
            <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
            VIP ativo
          </span>
        ) : null}
      </div>

      <div
        className={cn("space-y-5", !isPremium && "pointer-events-none select-none blur-sm")}
        aria-hidden={!isPremium}
      >
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Impressões nos últimos 7 dias
          </p>
          <div className="flex h-28 items-end gap-2">
            {trafficDiscovery.weeklyImpressions.map((day) => (
              <div key={day.label} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-zinc-600">{day.value}</span>
                <div
                  className="w-full rounded-t-md bg-linear-to-t from-wine-700 to-wine-500"
                  style={{ height: `${Math.round((day.value / maxImpression) * 80)}px` }}
                />
                <span className="text-[10px] text-zinc-500">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Origem das visitas
            </p>
            {trafficDiscovery.sources.map((source) => (
              <div key={source.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-700">{source.label}</span>
                  <span className="font-semibold text-zinc-900">{source.value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-wine-600"
                    style={{ width: `${source.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Posição na busca
            </p>
            <p
              className={cn(
                "mt-1 text-4xl font-bold",
                isPremium ? "text-[#DAA520]" : "text-zinc-900",
              )}
            >
              {position}º
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {isPremium ? "Topo das pesquisas garantido" : "entre os anúncios da sua cidade"}
            </p>
          </div>
        </div>
      </div>

      {!isPremium ? (
        <div className="absolute inset-x-0 bottom-0 top-16 flex flex-col items-center justify-center gap-3 bg-linear-to-b from-white/35 via-white/55 to-white/80 px-6 text-center backdrop-blur-[3px]">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#121212]">
            <Lock className="h-5 w-5 text-[#FFDF00]" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold text-zinc-900">Seus dados de desempenho já existem</p>
            <p className="mt-1 text-xs text-zinc-600">
              Impressões diárias, origem das visitas e sua posição real na busca estão aqui,
              esperando por você.
            </p>
          </div>
          <ShinyButton size="sm" onClick={() => setUpsellOpen(true)}>
            Revelar Tráfego VIP
          </ShinyButton>
        </div>
      ) : null}

      <PremiumConversionModal
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        highlight="traffic"
        from="traffic"
      />
    </Card>
  );
}
