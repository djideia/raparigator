import { useEffect, useMemo, useState } from "react";
import { useAuthSession } from "@/lib/auth-session";
import {
  buildEncounterBrief,
  decodeBriefSelection,
  readSimulationDraft,
  saveSimulationDraft,
} from "@/lib/encounter-brief";
import { ads } from "@/lib/mock-data";
import type { EncounterBrief, ProfessionalAd, SimulationSelection } from "@/lib/types";

export interface BentoItem {
  type: "image" | "info";
  src: string;
  originalIndex: number;
}

export interface UseAdDetailsReturn {
  ad: ProfessionalAd | undefined;
  role: ReturnType<typeof useAuthSession>["role"];
  riskTarget: "WhatsApp" | "Telegram" | null;
  setRiskTarget: (target: "WhatsApp" | "Telegram" | null) => void;
  selectedPhotoIndex: number | null;
  setSelectedPhotoIndex: (index: number | null) => void;
  galleryMode: "alternative" | "grid";
  setGalleryMode: (mode: "alternative" | "grid") => void;
  selectedDuration: string;
  setSelectedDuration: (duration: string) => void;
  selectedExtras: string[];
  toggleExtra: (extra: string) => void;
  bentoItems: BentoItem[];
  basePrice: number;
  calculatedExtrasCost: number;
  totalCalculatedValue: number;
  nextPhoto: () => void;
  prevPhoto: () => void;
  isPremium: boolean;
  premiumAttributes: Array<{ label: string; value: string; icon: string }>;
  brief: EncounterBrief | null;
}

export interface UseAdDetailsOptions {
  /**
   * Grava a simulação na sessão para sobreviver a idas ao login. Só a instância que
   * de fato renderiza o simulador deve ativar — `ad-details-screen` chama o hook
   * apenas para escolher a variante e descarta o estado.
   */
  persistDraft?: boolean;
}

const DEFAULT_DURATION = "1 hora";

function resolveInitialSelection(ad: ProfessionalAd | undefined): SimulationSelection {
  const fallbackDuration =
    ad?.pricingTable?.find((plan) => plan.label.toLowerCase().includes(DEFAULT_DURATION))?.label ??
    ad?.pricingTable?.[0]?.label ??
    DEFAULT_DURATION;

  if (!ad || typeof window === "undefined") {
    return { duration: fallbackDuration, extras: [] };
  }

  const fromLink = decodeBriefSelection(window.location.search, ad);
  if (fromLink) {
    return fromLink;
  }

  const fromDraft = readSimulationDraft(ad.slug);
  if (fromDraft) {
    const duration = ad.pricingTable.some((plan) => plan.label === fromDraft.duration)
      ? fromDraft.duration
      : fallbackDuration;
    return { duration, extras: fromDraft.extras.filter((extra) => ad.services.includes(extra)) };
  }

  return { duration: fallbackDuration, extras: [] };
}

export function useAdDetails(slug: string, options: UseAdDetailsOptions = {}): UseAdDetailsReturn {
  const { persistDraft = false } = options;
  const { role } = useAuthSession();
  const [riskTarget, setRiskTarget] = useState<"WhatsApp" | "Telegram" | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [galleryMode, setGalleryMode] = useState<"alternative" | "grid">("alternative");

  const ad = useMemo(() => ads.find((item) => item.slug === slug), [slug]);

  const bentoItems = useMemo(() => {
    if (!ad || !ad.images) return [];
    const limitImages = ad.images.slice(0, 5);
    const items: BentoItem[] = limitImages.map((img, idx) => ({
      type: "image" as const,
      src: img,
      originalIndex: idx,
    }));
    const infoPlateIndex = Math.min(3, items.length);
    items.splice(infoPlateIndex, 0, {
      type: "info" as const,
      src: "",
      originalIndex: -1,
    });
    return items;
  }, [ad]);

  const [initialSelection] = useState<SimulationSelection>(() => resolveInitialSelection(ad));
  const [selectedDuration, setSelectedDuration] = useState<string>(initialSelection.duration);
  const [selectedExtras, setSelectedExtras] = useState<string[]>(initialSelection.extras);

  useEffect(() => {
    if (!persistDraft || !ad) {
      return;
    }
    saveSimulationDraft(ad.slug, { duration: selectedDuration, extras: selectedExtras });
  }, [ad, persistDraft, selectedDuration, selectedExtras]);

  const basePrice = useMemo(() => {
    if (!ad) return 0;
    const option = ad.pricingTable.find((t) => t.label === selectedDuration);
    return option ? option.price : ad.startingPrice;
  }, [ad, selectedDuration]);

  const calculatedExtrasCost = useMemo(() => selectedExtras.length * 150, [selectedExtras]);
  const totalCalculatedValue = useMemo(
    () => basePrice + calculatedExtrasCost,
    [basePrice, calculatedExtrasCost],
  );

  const toggleExtra = (extra: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extra) ? prev.filter((e) => e !== extra) : [...prev, extra],
    );
  };

  const nextPhoto = () => {
    if (selectedPhotoIndex !== null && ad) {
      setSelectedPhotoIndex((selectedPhotoIndex + 1) % ad.images.length);
    }
  };

  const prevPhoto = () => {
    if (selectedPhotoIndex !== null && ad) {
      setSelectedPhotoIndex((selectedPhotoIndex - 1 + ad.images.length) % ad.images.length);
    }
  };

  const brief = useMemo(
    () =>
      ad
        ? buildEncounterBrief(
            ad,
            selectedDuration,
            selectedExtras,
            basePrice,
            calculatedExtrasCost,
            totalCalculatedValue,
          )
        : null,
    [ad, basePrice, calculatedExtrasCost, selectedDuration, selectedExtras, totalCalculatedValue],
  );

  const isPremium = ad?.adTier === "premium";
  const premiumAttributes = ad
    ? [
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
      ]
    : [];

  return {
    ad,
    role,
    riskTarget,
    setRiskTarget,
    selectedPhotoIndex,
    setSelectedPhotoIndex,
    galleryMode,
    setGalleryMode,
    selectedDuration,
    setSelectedDuration,
    selectedExtras,
    toggleExtra,
    bentoItems,
    basePrice,
    calculatedExtrasCost,
    totalCalculatedValue,
    nextPhoto,
    prevPhoto,
    isPremium,
    premiumAttributes,
    brief,
  };
}
