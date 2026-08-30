"use client";

import { Button } from "@/components/ui/button";
import { confirmAdult, denyUnderage } from "@/lib/age-gate";

export function AgeGateScreen() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md space-y-8 text-center">
        <div className="space-y-3">
          <p className="font-display text-3xl text-wine-800">Sigillus</p>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-wine-200" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-wine-700">
              +18
            </span>
            <div className="h-px flex-1 bg-wine-200" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Conteúdo exclusivo para maiores de 18 anos
          </h1>
          <p className="text-sm leading-relaxed text-zinc-500">
            A Sigillus contém material adulto. Ao continuar, você declara ter 18 anos ou mais.
          </p>
        </div>

        <div className="space-y-3">
          <Button type="button" fullWidth size="lg" onClick={confirmAdult}>
            Sou maior de 18
          </Button>
          <Button type="button" fullWidth size="lg" variant="secondary" onClick={denyUnderage}>
            Tenho menos de 18
          </Button>
        </div>
      </div>
    </main>
  );
}
