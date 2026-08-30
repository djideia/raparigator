"use client";

import { Check, Sparkles, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ProfessionalAd } from "@/lib/types";

interface AboutSectionProps {
  ad: ProfessionalAd;
}

export function AboutSection({ ad }: AboutSectionProps) {
  return (
    <Card className="relative space-y-5 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
      <div className="pointer-events-none absolute top-0 right-0 p-5">
        <Sparkles className="h-28 w-28 text-[#DAA520]/10" strokeWidth={2} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <span className="rounded-md border border-red-100/60 bg-red-50 px-2.5 py-1 text-xs font-bold tracking-[0.2em] text-[#96001e] uppercase">
            Sobre a Profissional
          </span>
          <div className="hidden h-1 rounded-full bg-zinc-100 sm:block lg:grow" />
        </div>

        <h3 className="font-display text-xl font-bold tracking-tight text-zinc-900">
          Perfil Premium com discrição absoluta
        </h3>

        <blockquote className="border-l-4 border-[#96001e] py-1 pl-4 font-serif text-sm leading-relaxed text-zinc-600 italic sm:text-base">
          &ldquo;{ad.shortDescription}&rdquo;
        </blockquote>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-zinc-100 pt-4 text-xs font-medium text-zinc-700">
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-emerald-100 bg-emerald-50 p-1.5 text-emerald-600">
            <Check className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="leading-none font-extrabold text-zinc-900">Ambiente Privado</p>
            <p className="mt-0.5 text-xs text-zinc-500">Itaim Bibi • São Paulo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-amber-100 bg-amber-50 p-1.5 text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
          </div>
          <div>
            <p className="leading-none font-extrabold text-zinc-900">Avaliações Positivas</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {ad.rating.toFixed(1)} / 5 ({ad.reviewsCount} votos)
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
