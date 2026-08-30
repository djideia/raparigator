"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ShieldCheck,
  MapPin,
  Heart,
  Ruler,
  Weight,
  Eye,
  User,
  Cigarette,
  Scissors,
  Upload,
} from "lucide-react";
import type { ProfessionalAd } from "@/lib/types";
import { isLocalImageSrc, resolveAdProfileImage } from "@/lib/ad-profile-image";
import { ShareProfileModal } from "@/components/ui/share-profile-modal";
import { motion } from "motion/react";

interface StandardProfileHeaderProps {
  ad: ProfessionalAd;
}

export function StandardProfileHeader({ ad }: StandardProfileHeaderProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const profileImageSrc = resolveAdProfileImage(ad);
  const attributes = [
    { label: "Altura", value: `${ad.heightCm} cm`, icon: Ruler },
    { label: "Cabelo", value: `${ad.hairType} • ${ad.hairColor}`, icon: Scissors },
    { label: "Etnia", value: ad.ethnicity, icon: User },
    { label: "Olhos", value: ad.eyeColor, icon: Eye },
    { label: "Fumante?", value: "Não", icon: Cigarette },
    { label: "Peso", value: `${ad.weightKg} kg`, icon: Weight },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm select-none">
      <div className="relative h-48 w-full overflow-hidden bg-zinc-100 sm:h-64 md:h-72">
        <Image
          src={ad.images[0]}
          alt={`Capa de ${ad.artisticName}`}
          fill
          className="object-cover select-none pointer-events-none"
          priority
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          referrerPolicy="no-referrer"
          draggable={false}
        />

        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.85 }}
            type="button"
            onClick={() => setShareModalOpen(true)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-200/90 bg-white/90 p-2 shadow-sm backdrop-blur-md sm:px-3 sm:py-1.5"
          >
            <Upload className="h-4 w-4 text-zinc-600" strokeWidth={2.5} />
            <span className="hidden text-xs font-semibold text-zinc-700 sm:inline-block">
              Compartilhar
            </span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.85 }}
            type="button"
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-200/90 bg-white/90 p-2 shadow-sm backdrop-blur-md sm:px-3 sm:py-1.5"
          >
            <Heart className="h-4 w-4 text-zinc-600" strokeWidth={2.5} />
            <span className="hidden text-xs font-semibold text-zinc-700 sm:inline-block">
              Salvar
            </span>
          </motion.button>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 h-16 pointer-events-none bg-linear-to-t from-white to-transparent" />
      </div>

      <div className="relative z-10 w-full px-4 pb-4 sm:px-8 sm:pb-6 md:px-12 md:pb-8">
        <div className="flex flex-col gap-5 md:gap-6">
          <div className="relative -mt-8 flex flex-row items-center gap-3 sm:-mt-12 sm:gap-4 md:-mt-16 md:items-end md:justify-between">
            <div className="flex items-end gap-3 sm:gap-4">
              <div className="relative inline-block shrink-0 align-bottom">
                <div className="relative z-10 h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-zinc-100 shadow-md sm:h-28 sm:w-28 md:h-36 md:w-36">
                  <Image
                    src={profileImageSrc}
                    alt={ad.artisticName}
                    fill
                    className="object-cover pointer-events-none select-none"
                    sizes="(max-width: 640px) 80px, (max-width: 768px) 112px, 144px"
                    referrerPolicy="no-referrer"
                    draggable={false}
                    unoptimized={isLocalImageSrc(profileImageSrc)}
                  />
                </div>
                <div className="absolute right-[14.6%] bottom-[14.6%] z-10 translate-x-1/2 translate-y-1/2">
                  <span className="relative flex h-3 w-3 items-center justify-center sm:h-4 sm:w-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-65"></span>
                    <span className="relative inline-flex h-full w-full rounded-full bg-emerald-500 ring-2 ring-white"></span>
                  </span>
                </div>
              </div>

              <div className="min-w-0 space-y-1 text-left sm:space-y-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
                  <h1 className="min-w-0 font-display text-xl font-bold leading-tight text-zinc-900 sm:text-3xl">
                    {ad.artisticName}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500 sm:gap-x-5 sm:text-sm">
                  <span className="flex items-center gap-1.5 font-medium leading-none">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-red-500 sm:h-4 sm:w-4" />
                    {ad.neighborhood}, {ad.city}
                  </span>

                  <span className="flex items-center gap-1.5 font-medium leading-none">
                    <Image
                      src="/icons/attributes/age.svg"
                      alt="Idade"
                      width={16}
                      height={16}
                      className="h-3.5 w-3.5 object-contain sm:h-4 sm:w-4 pointer-events-none select-none"
                      referrerPolicy="no-referrer"
                      draggable={false}
                    />
                    {ad.age} anos
                  </span>

                  <div className="flex items-center gap-1.5 font-medium leading-none text-emerald-600">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    Identidade Verificada
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-6">
            {attributes.map((attr) => {
              const Icon = attr.icon;
              return (
                <div
                  key={attr.label}
                  className="flex min-h-20 items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-3 py-3 shadow-xs transition-colors hover:border-zinc-300 sm:min-h-24 sm:gap-3 sm:px-4 sm:py-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wine-50 text-wine-700 sm:h-12 sm:w-12">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase sm:text-xs">
                      {attr.label}
                    </p>
                    <p className="wrap-break-word text-xs font-semibold text-zinc-800 sm:text-base">
                      {attr.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ShareProfileModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        ad={ad}
        isPremium={false}
      />
    </section>
  );
}
