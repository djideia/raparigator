"use client";

import { Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ProfessionalAd } from "@/lib/types";

interface SpecialtiesSectionProps {
  ad: ProfessionalAd;
}

export function SpecialtiesSection({ ad }: SpecialtiesSectionProps) {
  return (
    <Card className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
      <h3 className="flex items-center gap-2.5 border-b border-zinc-100 pb-2 font-display text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
        <Award className="h-5 w-5 shrink-0 text-[#96001e]" /> Especialidades e Especificações
      </h3>

      <div className="space-y-4 text-sm text-zinc-700">
        <div>
          <p className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
            Acompanhamentos Disponíveis
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ad.services.map((service) => (
              <span
                key={service}
                className="flex items-center gap-1 rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-2xs transition-transform hover:scale-[1.02]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#96001e]" />
                {service}
              </span>
            ))}
          </div>
        </div>

        {ad.fetishOptions && ad.fetishOptions.length > 0 && (
          <div>
            <p className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
              Interesses Especiais / Fantasias
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ad.fetishOptions.map((f) => (
                <span
                  key={f}
                  className="rounded-lg border border-zinc-100 bg-[#fafafa] px-2.5 py-1 text-xs font-semibold text-zinc-600 shadow-2xs"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
