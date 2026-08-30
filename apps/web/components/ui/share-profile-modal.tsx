"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Link, X, MapPin } from "lucide-react";
import { Modal } from "./modal";
import { WhatsAppIcon, TelegramIcon } from "./contact-icons";
import { ProfessionalAd } from "@/lib/types";
import { isLocalImageSrc, resolveAdProfileImage } from "@/lib/ad-profile-image";
import { useModalLock } from "@/lib/modal-lock";
import {
  copyToClipboard,
  getShareCopyText,
  getWhatsAppShareUrl,
  getTelegramShareUrl,
  vibrate,
} from "@/lib/share-utils";
import { cn } from "@/lib/utils";

interface ShareProfileModalProps {
  open: boolean;
  onClose: () => void;
  ad: ProfessionalAd;
  isPremium?: boolean;
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ShareProfileModal({
  open,
  onClose,
  ad,
  isPremium = false,
}: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);
  const isClient = useIsClient();

  useModalLock(open && isPremium);

  if (!open) return null;

  const openShareUrl = (url: string) => {
    vibrate(50);
    onClose();
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopy = async () => {
    vibrate(50);
    const text = getShareCopyText(ad.artisticName, ad.slug);
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    openShareUrl(getWhatsAppShareUrl(ad.artisticName, ad.slug));
  };

  const handleTelegram = () => {
    openShareUrl(getTelegramShareUrl(ad.artisticName, ad.slug));
  };

  const adCover = ad.images[0];
  const adProfile = resolveAdProfileImage(ad);
  const profileUnoptimized = isLocalImageSrc(adProfile);

  if (isPremium) {
    if (!isClient) return null;

    return createPortal(
      <div
        className="fixed inset-0 z-220 flex items-center justify-center bg-black/80 px-4 touch-none pointer-events-auto opacity-100"
        role="dialog"
        aria-modal="true"
      >
        <div className="share-modal-premium-open relative w-full max-w-sm overflow-hidden rounded-3xl border border-[#DAA520]/50 bg-[#121212] p-1 shadow-2xl transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]">
          {/* Background effects */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,223,0,0.05)_0%,transparent_40%,rgba(218,165,32,0.05)_100%)]" />

          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="font-display text-[13px] font-bold tracking-[0.2em] text-[#DAA520]">
              COMPARTILHAR
            </h2>
            <button
              onClick={onClose}
              className="rounded-full border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition-colors hover:text-[#FFDF00]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Premium Preview */}
          <div className="relative mx-5 mb-5 overflow-hidden rounded-2xl">
            <Image
              src={adCover}
              alt="Capa"
              fill
              className="object-cover"
              sizes="(max-width: 640px) calc(100vw - 2.5rem), 384px"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

            <div className="relative z-10 flex flex-col items-center py-6">
              <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[#DAA520] shadow-[0_0_15px_rgba(218,165,32,0.2)]">
                <Image
                  src={adProfile}
                  alt={ad.artisticName}
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized={profileUnoptimized}
                />
              </div>

              <div className="mt-3 text-center">
                <h3 className="font-display text-2xl font-bold text-[#FFDF00] drop-shadow-md">
                  {ad.artisticName}
                </h3>
                <p className="mt-1 flex items-center justify-center gap-1.5 text-[13px] text-zinc-200 drop-shadow-md">
                  <MapPin className="h-3.5 w-3.5 text-red-500" />
                  {ad.neighborhood}, {ad.city}
                </p>
              </div>
            </div>
          </div>

          {/* Premium Actions */}
          <div className="mt-2 flex justify-center gap-6 px-5 pb-6">
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/50 text-[#FFDF00] transition-all hover:border-[#DAA520]/50 hover:bg-zinc-800 active:scale-95"
              >
                <Link className="h-6 w-6" />
              </button>
              <span className="text-[11px] font-semibold text-zinc-300 text-center w-16 leading-tight">
                {copied ? (
                  <span className="text-[#10b981] font-bold">Copiado!</span>
                ) : (
                  "Copiar Link"
                )}
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleWhatsApp}
                className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/50 text-[#25D366] transition-all hover:border-[#25D366]/50 hover:bg-zinc-800 active:scale-95"
              >
                <WhatsAppIcon className="h-6 w-6 fill-current" />
              </button>
              <span className="text-[11px] font-semibold text-zinc-300 text-center w-16 leading-tight">
                WhatsApp
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleTelegram}
                className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/50 text-[#229ED9] transition-all hover:border-[#229ED9]/50 hover:bg-zinc-800 active:scale-95"
              >
                <TelegramIcon className="h-6 w-6 fill-current" />
              </button>
              <span className="text-[11px] font-semibold text-zinc-300 text-center w-16 leading-tight">
                Telegram
              </span>
            </div>
          </div>

          {/* Inline Toast Premium */}
          <div
            className={cn(
              "absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[#10b981]/20 px-4 py-2 text-sm font-medium text-[#10b981] backdrop-blur-md transition-all duration-300",
              copied ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none",
            )}
          >
            Link copiado com sucesso!
          </div>
        </div>

        <button aria-label="Fechar modal" className="absolute inset-0 -z-10" onClick={onClose} />
      </div>,
      document.body,
    );
  }

  // Standard Variante
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Compartilhar Perfil"
      actions={null} // Sem ações padrão na base
      mobileCentered={true}
    >
      <div className="relative mb-6 overflow-hidden rounded-2xl">
        <Image
          src={adCover}
          alt="Capa"
          fill
          className="object-cover"
          sizes="(max-width: 640px) calc(100vw - 3rem), 384px"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

        <div className="relative z-10 flex flex-col items-center py-6">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-sm">
            <Image
              src={adProfile}
              alt={ad.artisticName}
              fill
              className="object-cover"
              sizes="80px"
              unoptimized={profileUnoptimized}
            />
          </div>

          <div className="mt-4 text-center">
            <h3 className="text-xl font-bold text-white drop-shadow-md">{ad.artisticName}</h3>
            <p className="mt-1 flex items-center justify-center gap-1 text-sm text-zinc-200 drop-shadow-md">
              <MapPin className="h-3.5 w-3.5 text-red-500" />
              {ad.neighborhood}, {ad.city}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-6 pb-2">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-700 shadow-sm transition-transform hover:scale-105 active:scale-95"
          >
            <Link className="h-6 w-6" />
          </button>
          <span className="text-[11px] font-semibold text-zinc-500 text-center w-16 leading-tight">
            {copied ? <span className="text-emerald-600 font-bold">Copiado!</span> : "Copiar Link"}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleWhatsApp}
            className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
          >
            <WhatsAppIcon className="h-6 w-6 fill-current" />
          </button>
          <span className="text-[11px] font-semibold text-zinc-500 text-center w-16 leading-tight">
            WhatsApp
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleTelegram}
            className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[#229ED9] text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
          >
            <TelegramIcon className="h-6 w-6 fill-current" />
          </button>
          <span className="text-[11px] font-semibold text-zinc-500 text-center w-16 leading-tight">
            Telegram
          </span>
        </div>
      </div>

      {/* Inline Toast Standard */}
      <div
        className={cn(
          "absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-300",
          copied ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none",
        )}
      >
        Link copiado com sucesso!
      </div>
    </Modal>
  );
}
