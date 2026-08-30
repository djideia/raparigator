"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { MessageSquare, X, Lock } from "lucide-react";
import type { ProfessionalAd } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TelegramIcon, WhatsAppIcon } from "@/components/ui/contact-icons";
import { useMobileContactFab } from "./use-mobile-contact-fab";
import { useContactCta } from "./use-contact-cta";
import type { EncounterBrief } from "@/lib/types";

interface StandardMobileContactFabProps {
  ad: ProfessionalAd;
  setRiskTarget: (target: "WhatsApp" | "Telegram") => void;
  role: "visitor" | "client" | "professional";
  brief: EncounterBrief | null;
}

export function StandardMobileContactFab({
  ad,
  setRiskTarget,
  role,
  brief,
}: StandardMobileContactFabProps) {
  const { onLoginClick, openChatWithBrief } = useContactCta(brief);
  const {
    isOpen,
    showTooltip,
    isVisible,
    hasAppeared,
    fabSide,
    tooltipSide,
    fabRef,
    x,
    y,
    dragConstraints,
    toggleOpen,
    handleDragEnd,
  } = useMobileContactFab();

  if (!hasAppeared) {
    return null;
  }

  return (
    <motion.div
      ref={fabRef}
      initial={false}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.2 }}
      drag={isVisible}
      dragConstraints={dragConstraints}
      dragElastic={0.12}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      style={{ x, y }}
      className={cn(
        "fixed bottom-17.25 z-60 flex w-14 flex-col items-center justify-end md:hidden",
        isVisible ? "pointer-events-auto" : "pointer-events-none",
        fabSide === "right" ? "right-4" : "left-4",
      )}
    >
      <div className="relative flex w-full items-center justify-center">
        <AnimatePresence>
          {showTooltip && !isOpen && isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: tooltipSide === "right" ? -10 : 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={cn(
                "absolute z-10 w-max max-w-35 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold leading-tight text-zinc-700 shadow-md backdrop-blur-sm",
                tooltipSide === "right" ? "left-17" : "right-17",
              )}
            >
              <div
                className={cn(
                  "absolute top-1/2 h-0 w-0 -translate-y-1/2 border-y-4 border-y-transparent",
                  tooltipSide === "right"
                    ? "-left-1.5 border-r-[6px] border-r-white"
                    : "-right-1.5 border-l-[6px] border-l-white",
                )}
              />
              Falar agora.
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen && isVisible && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: -65 }}
                exit={{ opacity: 0, scale: 0.5, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="absolute"
              >
                {role === "visitor" ? (
                  <Link
                    href="/auth/login"
                    onClick={onLoginClick}
                    aria-label="Entrar para interagir"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-wine-700 text-white shadow-lg ring-1 ring-white/20"
                  >
                    <Lock className="h-4.5 w-4.5 text-white" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={openChatWithBrief}
                    aria-label="Abrir chat direto"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-wine-700 text-white shadow-lg ring-1 ring-white/20"
                  >
                    <MessageSquare className="h-4.5 w-4.5 fill-white text-white" />
                  </button>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: -115 }}
                exit={{ opacity: 0, scale: 0.5, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
                className="absolute"
              >
                <button
                  onClick={() => setRiskTarget("WhatsApp")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg cursor-pointer"
                >
                  <WhatsAppIcon className="h-5.5 w-5.5" />
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: -165 }}
                exit={{ opacity: 0, scale: 0.5, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="absolute"
              >
                <button
                  onClick={() => setRiskTarget("Telegram")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg cursor-pointer"
                >
                  <TelegramIcon className="h-5.5 w-5.5" />
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <button
          onClick={toggleOpen}
          className={cn(
            "relative z-20 h-14 w-14 shrink-0 cursor-pointer rounded-full bg-wine-700 p-0.5 shadow-xl transition-transform active:scale-95",
            isOpen && "shadow-[0_0_20px_rgba(150,0,30,0.3)]",
          )}
        >
          <div className="relative h-full w-full overflow-hidden rounded-full border border-black/25 bg-zinc-900">
            <Image
              src={ad.images[0]}
              alt={ad.artisticName}
              fill
              className="object-cover pointer-events-none select-none"
              sizes="56px"
              loading="eager"
              referrerPolicy="no-referrer"
              draggable={false}
            />
          </div>
          <div className="absolute right-[14.6%] bottom-[14.6%] z-20 flex h-6 w-6 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-zinc-900 border border-white/20">
            {isOpen ? (
              <X className="h-3.5 w-3.5 text-white" />
            ) : (
              <MessageSquare className="h-3.5 w-3.5 fill-white text-white" />
            )}
          </div>
        </button>
      </div>
    </motion.div>
  );
}
