"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, ShieldCheck, Heart, Upload } from "lucide-react";
import type { ProfessionalAd } from "@/lib/types";
import { isLocalImageSrc, resolveAdProfileImage } from "@/lib/ad-profile-image";
import { ShareProfileModal } from "@/components/ui/share-profile-modal";
import { motion } from "motion/react";

interface PremiumHeroSectionProps {
  ad: ProfessionalAd;
}

export function PremiumHeroSection({ ad }: PremiumHeroSectionProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const profileImageSrc = resolveAdProfileImage(ad);
  const premiumAttributes = [
    { label: "Altura", value: `${ad.heightCm} cm`, icon: "/icons/attributes/size-woman.svg" },
    {
      label: "Cabelo",
      value: `${ad.hairType} • ${ad.hairColor}`,
      icon: "/icons/attributes/hair-woman.svg",
    },
    { label: "Etnia", value: ad.ethnicity, icon: "/icons/attributes/person.svg" },
    { label: "Olhos", value: ad.eyeColor, icon: "/icons/attributes/eye.svg" },
    { label: "Fumante?", value: "Não", icon: "/icons/attributes/smoking.svg" },
    { label: "Peso", value: `${ad.weightKg} kg`, icon: "/icons/attributes/weight.svg" },
  ];

  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#121212] shadow-xl select-none">
      <div className="relative h-48 w-full overflow-hidden bg-zinc-900 sm:h-64 md:h-72">
        <Image
          src={ad.images[0]}
          alt="Foto de capa premium"
          fill
          className="object-cover select-none pointer-events-none"
          priority
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          referrerPolicy="no-referrer"
          draggable={false}
        />

        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-full border border-[#DAA520]/70 bg-linear-to-br from-[#2a2a2a] to-[#0a0a0a] px-3 py-1.5 shadow-[0_4px_6px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md select-none cursor-default transition-all duration-300 hover:scale-105 hover:shadow-[0_0_12px_rgba(251,191,36,0.45)]">
          <span className="text-xs text-[#FFDF00] drop-shadow-[0_0_4px_rgba(255,223,0,0.9)]">
            ★
          </span>
          <span className="bg-linear-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] bg-clip-text text-xs font-extrabold tracking-[0.2em] text-transparent uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
            Premium
          </span>
        </div>

        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => setShareModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-[#DAA520]/70 bg-linear-to-br from-[#2a2a2a] to-[#0a0a0a] p-2 sm:px-3 sm:py-1.5 shadow-[0_4px_6px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md cursor-pointer"
          >
            <Upload
              className="h-4 w-4 text-[#FFEA00] drop-shadow-[0_0_6px_rgba(255,234,0,1)]"
              strokeWidth={2.5}
            />
            <span className="hidden sm:inline-block bg-linear-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] bg-clip-text text-xs font-bold tracking-wider text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
              Compartilhar
            </span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.85 }}
            className="flex items-center gap-1.5 rounded-full border border-[#DAA520]/70 bg-linear-to-br from-[#2a2a2a] to-[#0a0a0a] p-2 sm:px-3 sm:py-1.5 shadow-[0_4px_6px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md cursor-pointer"
          >
            <Heart
              className="h-4 w-4 text-[#FFEA00] drop-shadow-[0_0_6px_rgba(255,234,0,1)]"
              strokeWidth={2.5}
            />
            <span className="hidden sm:inline-block bg-linear-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] bg-clip-text text-xs font-bold tracking-wider text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
              Salvar
            </span>
          </motion.button>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 h-40 pointer-events-none bg-linear-to-t from-[#121212] via-[#121212]/70 to-transparent" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-black/20 via-black/40 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,223,0,0.02)_0%,transparent_40%,rgba(218,165,32,0.03)_100%)]" />

      <div className="relative z-10 w-full px-4 pb-4 sm:px-8 sm:pb-6 md:px-12 md:pb-8">
        <div className="flex flex-col gap-5 md:gap-6">
          <div className="relative -mt-8 flex flex-row items-center gap-3 sm:-mt-12 sm:gap-4 md:-mt-16 md:items-end md:justify-between">
            <div className="flex items-end gap-3 sm:gap-4">
              <div className="relative inline-block shrink-0 align-bottom">
                <div className="relative z-10 h-20 w-20 rounded-full bg-linear-to-tr from-amber-300 via-[#a88222] to-amber-300 p-1 shadow-[0_0_20px_rgba(218,165,32,0.35)] sm:h-28 sm:w-28 md:h-36 md:w-36">
                  <div className="relative h-full w-full overflow-hidden rounded-full border-[3px] border-[#121212]">
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
                </div>
                <div className="absolute right-[14.6%] bottom-[14.6%] z-10 translate-x-1/2 translate-y-1/2">
                  <span className="relative flex h-3 w-3 items-center justify-center sm:h-4 sm:w-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-65"></span>
                    <span className="relative inline-flex h-full w-full rounded-full bg-[#10b981] ring-2 ring-[#121212]"></span>
                  </span>
                </div>
              </div>

              <div className="min-w-0 space-y-1 text-left sm:space-y-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
                  <h1 className="min-w-0 font-display text-xl font-bold leading-tight text-[#FFDF00] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] sm:text-3xl">
                    {ad.artisticName}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-300 sm:gap-x-5 sm:text-sm">
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

                  <div className="flex items-center gap-1.5 font-medium leading-none text-[#10b981]">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    Identidade Verificada
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-6">
            {premiumAttributes.map((attribute) => (
              <div
                key={attribute.label}
                className="flex min-h-20 cursor-pointer items-center gap-2 rounded-2xl border border-white/8 bg-[#0c0c0c]/90 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02] sm:min-h-24 sm:gap-3 sm:px-4 sm:py-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-black/55 sm:h-12 sm:w-12">
                  <Image
                    src={attribute.icon}
                    alt={attribute.label}
                    width={34}
                    height={34}
                    className="h-7 w-7 object-contain sm:h-8 sm:w-8 pointer-events-none select-none"
                    referrerPolicy="no-referrer"
                    draggable={false}
                  />
                </div>

                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-bold tracking-[0.16em] text-amber-300/85 uppercase sm:text-xs sm:tracking-[0.18em]">
                    {attribute.label}
                  </p>
                  <p className="wrap-break-word text-xs font-semibold text-zinc-100 sm:text-base">
                    {attribute.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ShareProfileModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        ad={ad}
        isPremium={true}
      />
    </section>
  );
}
