"use client";

import Image from "next/image";
import { Award, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProfessionalAd } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PhotoGallerySectionProps {
  ad: ProfessionalAd;
  galleryMode: "alternative" | "grid";
  setGalleryMode: (mode: "alternative" | "grid") => void;
  bentoItems: Array<
    | { type: "image"; src: string; originalIndex: number }
    | { type: "info"; src: string; originalIndex: number }
  >;
  isPremium: boolean;
  setSelectedPhotoIndex: (index: number) => void;
}

export function PhotoGallerySection({
  ad,
  galleryMode,
  setGalleryMode,
  bentoItems,
  isPremium,
  setSelectedPhotoIndex,
}: PhotoGallerySectionProps) {
  return (
    <section className="space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex w-full flex-col gap-1.5">
        <div
          className={cn(
            "hidden w-full items-center gap-3 md:grid",
            ad.images.length > 5 ? "grid-cols-5" : "grid-cols-4",
          )}
        >
          <div
            className={cn(
              "flex h-9 items-center gap-2",
              ad.images.length > 5 ? "col-span-4" : "col-span-3",
            )}
          >
            <h2 className="shrink-0 font-display text-xl font-bold text-zinc-900 md:text-2xl">
              Ensaio Fotográfico
            </h2>
            <div className="ml-2 mr-3 h-0.75 grow rounded-full bg-zinc-200/80" />

            <div className="flex shrink-0 rounded-lg bg-zinc-100 p-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setGalleryMode("alternative");
                }}
                className={cn(
                  "cursor-pointer rounded-md p-2 transition-all duration-200 hover:scale-105 active:scale-95",
                  galleryMode === "alternative"
                    ? "bg-white text-wine-700 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-700",
                )}
                aria-label="Destaque / Alternativo"
                title="Destaque / Alternativo"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4h10v10H4zM16 4h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h10v4H10z"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setGalleryMode("grid");
                }}
                className={cn(
                  "cursor-pointer rounded-md p-2 transition-all duration-200 hover:scale-105 active:scale-95",
                  galleryMode === "grid"
                    ? "bg-white text-wine-700 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-700",
                )}
                aria-label="Grade"
                title="Grade"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="col-span-1 flex h-9 w-full items-center justify-between gap-2">
            <div className="h-0.75 grow rounded-full bg-zinc-200/80" />
            <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1.5 font-mono text-xs font-bold text-zinc-500">
              {ad.images.length} fotos
            </span>
          </div>
        </div>

        <div className="flex w-full flex-row items-center justify-between gap-2 md:hidden">
          <div className="flex flex-col gap-0.5">
            <h2 className="shrink-0 font-display text-lg font-bold text-zinc-900 sm:text-xl">
              Ensaio Fotográfico
            </h2>
            <p className="max-w-45 text-xs leading-snug text-zinc-500 sm:max-w-none sm:text-sm">
              Toque nas fotos para expandir e ver mais detalhes
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="flex rounded-lg bg-zinc-100 p-1 sm:p-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setGalleryMode("alternative");
                }}
                className={cn(
                  "cursor-pointer rounded-md p-1.5 transition-all duration-200 hover:scale-105 active:scale-[0.93] sm:p-2",
                  galleryMode === "alternative"
                    ? "bg-white text-wine-700 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-700",
                )}
                aria-label="Destaque / Alternativo"
                title="Destaque / Alternativo"
              >
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4h10v10H4zM16 4h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h10v4H10z"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setGalleryMode("grid");
                }}
                className={cn(
                  "cursor-pointer rounded-md p-1.5 transition-all duration-200 hover:scale-105 active:scale-[0.93] sm:p-2",
                  galleryMode === "grid"
                    ? "bg-white text-wine-700 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-700",
                )}
                aria-label="Grade"
                title="Grade"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 font-mono text-xs font-bold text-zinc-500 sm:px-3 sm:py-1.5 sm:text-xs">
              {ad.images.length} fotos
            </span>
          </div>
        </div>

        <p className="mt-0.5 hidden px-1 text-sm text-zinc-500 md:block">
          Toque nas fotos para expandir e ver mais detalhes
        </p>
      </div>

      {galleryMode === "grid" && (
        <div className="grid animate-fade-in grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {ad.images.map((img, idx) => (
            <button
              key={img}
              type="button"
              aria-label={`Abrir foto ${idx + 1}`}
              onClick={() => setSelectedPhotoIndex(idx)}
              className="group relative block w-full aspect-3/4 cursor-pointer overflow-hidden rounded-2xl border border-zinc-200/50 bg-zinc-100 shadow-xs transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
            >
              <Image
                src={img}
                alt={`${ad.artisticName} ensaio ${idx + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                loading={idx === 0 ? "eager" : "lazy"}
                referrerPolicy="no-referrer"
              />

              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <svg
                  className="w-8 h-8 text-white relative z-10 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}

      {galleryMode === "alternative" && (
        <div className="grid grid-flow-dense grid-cols-2 auto-rows-43.75 gap-3 animate-fade-in sm:grid-cols-3 sm:auto-rows-53.75 lg:grid-cols-5 lg:auto-rows-58.75">
          {bentoItems.map((item, idx) => {
            const isImage = item.type === "image";

            let spanClass = "col-span-1 row-span-1";
            if (idx === 0) {
              spanClass = "col-span-2 row-span-2";
            } else if (item.type === "info") {
              spanClass = "col-span-2 row-span-2 lg:col-span-1 lg:col-start-5";
            } else if (idx === 6) {
              spanClass = "row-span-1 col-span-2 sm:col-span-1";
            }

            if (!isImage) {
              return (
                <div
                  key="info-plate"
                  className={cn(
                    "hidden h-full flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-linear-to-b from-zinc-50 to-white p-5 shadow-xs lg:flex",
                    spanClass,
                  )}
                >
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex -space-x-2.5 overflow-hidden">
                      {ad.images.slice(0, 4).map((img, i) => (
                        <div
                          key={i}
                          className="relative inline-block h-9 w-9 overflow-hidden rounded-full bg-zinc-200 ring-2 ring-white"
                        >
                          <Image
                            src={img}
                            alt="preview"
                            fill
                            className="object-cover"
                            sizes="36px"
                            loading={i === 0 ? "eager" : "lazy"}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ))}
                      {ad.images.length > 4 && (
                        <div className="relative inline-flex h-9 w-9 select-none items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-white ring-2 ring-white">
                          +{ad.images.length - 4}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="whitespace-nowrap text-left font-display text-sm font-bold tracking-widest text-[#96001e] uppercase lg:text-base">
                        Selo Anti-Edição
                      </h4>
                      <p className="text-left text-xs leading-relaxed text-zinc-600">
                        Nossas profissionais são fotografadas em ensaios auditados. Proteção
                        garantida contra o uso de fotos falsas (fake profiles).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-zinc-100 pt-4">
                    <div className="flex flex-row flex-wrap items-start gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-bold tracking-wide text-emerald-700 uppercase">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        Biotipo Confirmado
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold tracking-wide text-[#96001e] uppercase">
                        <Award className="h-3.5 w-3.5 shrink-0 text-[#96001e]" />
                        Fotos Sem Filtros
                      </span>
                      {isPremium && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold tracking-wide text-amber-800 uppercase">
                          <Sparkles className="h-3.5 w-3.5 shrink-0 fill-amber-300/25 text-amber-600" />
                          Premium Luxo
                        </span>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedPhotoIndex(0);
                      }}
                      className="py-2 text-xs font-bold text-zinc-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Ver Book Completo
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={item.src}
                type="button"
                aria-label={`Abrir foto ${item.originalIndex + 1}`}
                onClick={() => setSelectedPhotoIndex(item.originalIndex)}
                className={cn(
                  "group relative block w-full h-full cursor-pointer overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-900 shadow-xs transition-all duration-300 hover:shadow-md",
                  spanClass,
                )}
              >
                <Image
                  src={item.src}
                  alt={`${ad.artisticName} ensaio bento ${idx}`}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes={
                    spanClass.includes("col-span-2")
                      ? "(max-width: 640px) 100vw, 50vw"
                      : "(max-width: 640px) 50vw, 25vw"
                  }
                  loading={idx === 0 ? "eager" : "lazy"}
                  referrerPolicy="no-referrer"
                />

                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80" />

                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <svg
                    className="w-8 h-8 text-white relative z-10 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {ad.images.length > 5 && galleryMode === "alternative" && (
        <button
          type="button"
          aria-label="Ver mais fotos"
          className="group relative mt-3 block h-28 w-full cursor-pointer overflow-hidden rounded-2xl sm:h-32 lg:hidden"
          onClick={() => setSelectedPhotoIndex(5)}
        >
          <Image
            src={ad.images[5]}
            alt="Mais fotos"
            fill
            className="scale-110 object-cover opacity-80 blur-sm transition-all duration-500 group-hover:scale-115 group-hover:blur-[6px]"
            sizes="100vw"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] transition-colors duration-300 group-hover:bg-black/40">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 shadow-sm backdrop-blur-md transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
              <span className="mb-0.5 text-2xl leading-none font-light text-white">+</span>
            </div>
            <span className="text-xs font-bold tracking-widest text-white/90 uppercase drop-shadow-sm sm:text-xs">
              Ver mais fotos
            </span>
          </div>
        </button>
      )}

      {galleryMode === "alternative" && (
        <div className="mt-3 animate-fade-in lg:hidden">
          <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-linear-to-b from-zinc-50 to-white p-6 shadow-xs sm:p-7">
            <div className="space-y-5 sm:space-y-6">
              <div className="flex -space-x-2.5 overflow-hidden">
                {ad.images.slice(0, 4).map((img, i) => (
                  <div
                    key={i}
                    className="relative inline-block h-10 w-10 overflow-hidden rounded-full bg-zinc-200 ring-2 ring-white sm:h-11 sm:w-11"
                  >
                    <Image
                      src={img}
                      alt="preview"
                      fill
                      className="object-cover"
                      sizes="36px"
                      loading={i === 0 ? "eager" : "lazy"}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
                {ad.images.length > 4 && (
                  <div className="relative inline-flex h-10 w-10 select-none items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-white ring-2 ring-white sm:h-11 sm:w-11">
                    +{ad.images.length - 4}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="whitespace-nowrap text-left font-display text-base font-bold tracking-[0.12em] text-[#96001e] uppercase sm:text-lg">
                  Selo Anti-Edição
                </h4>
                <p className="text-left text-base leading-relaxed text-zinc-600">
                  Nossas profissionais são fotografadas em ensaios auditados. Proteção garantida
                  contra o uso de fotos falsas (fake profiles).
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4 border-t border-zinc-100 pt-5">
              <div className="flex flex-col gap-2">
                <div className="flex flex-row flex-wrap items-start gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold tracking-wide text-emerald-700 uppercase">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    Biotipo Confirmado
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold tracking-wide text-[#96001e] uppercase">
                    <Award className="h-4 w-4 shrink-0 text-[#96001e]" />
                    Fotos Sem Filtros
                  </span>
                  {isPremium && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold tracking-wide text-amber-800 uppercase">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 fill-amber-300/25 text-amber-600" />
                      Premium Luxo
                    </span>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                fullWidth
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedPhotoIndex(0);
                }}
                className="h-11 py-2 text-base font-bold text-zinc-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                Ver Book Completo
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
