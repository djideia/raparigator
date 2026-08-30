"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ads } from "@/lib/mock-data";
import type { ProfessionalAd } from "@/lib/types";
import { currency } from "@/lib/utils";

export function ProfessionalAdsScreen() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Anúncios
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
            Gerencie seus perfis e destaques
          </h1>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {ads.slice(0, 2).map((ad) => (
            <ProfessionalAdListCard key={ad.id} ad={ad} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function ProfessionalAdListCard({ ad }: { ad: ProfessionalAd }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = (x / rect.width - 0.5) * 2;
    const centerY = (y / rect.height - 0.5) * 2;
    const maxTilt = 10;

    cardRef.current.style.setProperty("--rot-x", `${-centerY * maxTilt}deg`);
    cardRef.current.style.setProperty("--rot-y", `${centerX * maxTilt}deg`);
    cardRef.current.style.setProperty("--glare-x", `${(x / rect.width) * 100}%`);
    cardRef.current.style.setProperty("--glare-y", `${(y / rect.height) * 100}%`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;

    cardRef.current.style.setProperty("--rot-x", "0deg");
    cardRef.current.style.setProperty("--rot-y", "0deg");
    cardRef.current.style.setProperty("--glare-x", "50%");
    cardRef.current.style.setProperty("--glare-y", "50%");
  };

  if (ad.adTier === "premium") {
    return (
      <Link
        href={`/anuncio/${ad.slug}`}
        className="group block perspective-1000 h-100 w-full cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <article
          ref={cardRef}
          className="preserve-3d relative h-full w-full transition-transform duration-200 ease-out active:scale-[0.97]"
          style={{
            transform: "rotateX(var(--rot-x, 0deg)) rotateY(var(--rot-y, 0deg))",
          }}
        >
          <div className="absolute inset-0 rounded-2xl overflow-hidden p-[1.5px] bg-linear-to-b from-[#3a3018] to-[#1a150a] shadow-2xl">
            <div
              className="absolute inset-[-150%] animate-spin bg-[conic-gradient(from_90deg,transparent_0%,transparent_75%,rgba(255,215,0,0.1)_80%,#FFD700_95%,#ffffff_98%,transparent_100%)] pointer-events-none"
              style={{ animationDuration: "4.5s", animationTimingFunction: "linear" }}
            />

            <div className="absolute inset-[1.5px] rounded-2xl overflow-hidden bg-[#121212] z-10 border border-[#DAA520]/20 shadow-sm transition-shadow duration-300 group-hover:shadow-[0_8px_30px_rgba(218,165,32,0.22)]">
              <Image
                src={ad.images[0] ?? ""}
                alt={`${ad.artisticName} premium`}
                fill
                className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/10 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,223,0,0.06)_0%,transparent_40%,rgba(218,165,32,0.1)_100%)]" />

              <div className="absolute left-4 top-4 rounded-full border border-[#FFDF00]/35 bg-black/35 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFDF00] backdrop-blur-md">
                Premium
              </div>

              <div className="absolute bottom-0 left-0 w-full px-5 pb-5 pt-16">
                <h3 className="font-display text-3xl font-semibold leading-tight text-[#FFDF00] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                  {ad.artisticName}
                </h3>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/75">
                  Experiência exclusiva
                </p>
              </div>

              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255,223,0,0.18) 0%, transparent 55%)",
                  mixBlendMode: "overlay",
                }}
              />
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-zinc-900">{ad.artisticName}</p>
          <p className="text-sm text-zinc-600">
            {ad.city}, {ad.state} · A partir de {currency(ad.startingPrice)}
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
          {ad.status}
        </span>
      </div>
      <p className="text-sm text-zinc-600">{ad.shortDescription}</p>
      <Link href={`/anuncio/${ad.slug}`}>
        <Button variant="secondary">Ver anúncio público</Button>
      </Link>
    </Card>
  );
}
