"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { motion, type PanInfo } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoLightboxProps {
  images: string[];
  selectedIndex: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelect: (index: number) => void;
}

const SWIPE_OFFSET_PX = 72;
const SWIPE_VELOCITY = 520;

const closeButtonClass =
  "inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-zinc-950/65 text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:bg-zinc-950/85 hover:border-white/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

const navArrowClass =
  "absolute top-1/2 z-10000 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center text-white transition hover:scale-110 hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 [filter:drop-shadow(0_2px_10px_rgba(0,0,0,0.85))]";

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Fechar galeria"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className={cn(closeButtonClass, "absolute top-4 right-4 z-10000")}
    >
      <X className="h-5 w-5" strokeWidth={2.25} />
    </button>
  );
}

function NavArrowButton({
  label,
  onClick,
  side,
  children,
}: {
  label: string;
  onClick: () => void;
  side: "left" | "right";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className={cn(navArrowClass, side === "left" ? "left-2 md:left-4" : "right-2 md:right-4")}
    >
      {children}
    </button>
  );
}

export function PhotoLightbox({
  images,
  selectedIndex,
  onClose,
  onNext,
  onPrev,
  onSelect,
}: PhotoLightboxProps) {
  const [direction, setDirection] = useState(0);
  const canNavigate = images.length > 1;

  useEffect(() => {
    if (selectedIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (!canNavigate) {
        return;
      }
      if (event.key === "ArrowRight") {
        setDirection(1);
        onNext();
      }
      if (event.key === "ArrowLeft") {
        setDirection(-1);
        onPrev();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedIndex, canNavigate, onClose, onNext, onPrev]);

  if (selectedIndex === null) {
    return null;
  }

  const goNext = () => {
    setDirection(1);
    onNext();
  };

  const goPrev = () => {
    setDirection(-1);
    onPrev();
  };

  const goSelect = (index: number) => {
    if (index === selectedIndex) {
      return;
    }
    setDirection(index > selectedIndex ? 1 : -1);
    onSelect(index);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (!canNavigate) {
      return;
    }

    const { offset, velocity } = info;
    if (offset.x < -SWIPE_OFFSET_PX || velocity.x < -SWIPE_VELOCITY) {
      goNext();
      return;
    }
    if (offset.x > SWIPE_OFFSET_PX || velocity.x > SWIPE_VELOCITY) {
      goPrev();
    }
  };

  return (
    <div
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-zinc-950/98 p-4 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Galeria de fotos"
    >
      <CloseButton onClick={onClose} />

      {canNavigate ? (
        <NavArrowButton label="Foto anterior" onClick={goPrev} side="left">
          <ChevronLeft className="h-10 w-10" strokeWidth={1.75} />
        </NavArrowButton>
      ) : null}

      <div className="relative mb-12 mt-[-40px] h-[65vh] w-full max-w-4xl overflow-hidden bg-zinc-950 select-none">
        <motion.div
          key={selectedIndex}
          initial={{ x: direction >= 0 ? 160 : -160, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.65 }}
          drag={canNavigate ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
        >
          <Image
            src={images[selectedIndex]}
            alt={`Foto de detalhe ${selectedIndex + 1}`}
            fill
            draggable={false}
            className="pointer-events-none rounded-xl object-contain drop-shadow-[0_8px_30px_rgb(0,0,0,0.8)]"
            sizes="(max-width: 768px) 100vw, 1024px"
            referrerPolicy="no-referrer"
            priority
          />
        </motion.div>
      </div>

      {canNavigate ? (
        <NavArrowButton label="Próxima foto" onClick={goNext} side="right">
          <ChevronRight className="h-10 w-10" strokeWidth={1.75} />
        </NavArrowButton>
      ) : null}

      <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 rounded-full border border-white/12 bg-zinc-950/65 px-3.5 py-1.5 font-mono text-xs font-semibold text-zinc-200 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md">
        {selectedIndex + 1} de {images.length}
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex w-full justify-center px-4">
        <div className="flex max-w-full items-center justify-start gap-3 overflow-x-auto p-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden">
          {images.map((img, idx) => (
            <button
              key={img}
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                goSelect(idx);
              }}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl transition-all duration-300",
                selectedIndex === idx
                  ? "scale-105 opacity-100 shadow-[0_0_15px_rgba(150,0,30,0.5)] ring-2 ring-wine-500"
                  : "opacity-40 ring-1 ring-white/20 hover:opacity-100",
              )}
            >
              <Image
                src={img}
                alt={`Miniatura ${idx + 1}`}
                fill
                className="object-cover"
                sizes="64px"
                referrerPolicy="no-referrer"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
