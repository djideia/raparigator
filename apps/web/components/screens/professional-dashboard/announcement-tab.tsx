"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue } from "motion/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import {
  BadgeDollarSign,
  ChevronDown,
  Clock3,
  Edit,
  Image as ImageIcon,
  Lock,
  CreditCard,
  Undo,
  Redo,
} from "lucide-react";
import { PixIcon } from "@/components/ui/pix-icon";
import { CashIcon } from "@/components/ui/cash-icon";
import { useOptionalDashboardHeaderTitleMotion } from "./dashboard-header-title-context";
import { DASHBOARD_HEADER_TITLE, DASHBOARD_TITLE_PAGE_CLASS } from "./dashboard-title";
import type { AdPreview, AdStatus } from "./types";
import {
  useAnnouncementDraft,
  getPublishValidationErrors,
  isHairSelectionComplete,
  isSelectUnselected,
  OPTIMIZE_SECTION_ORDER,
  SECTION_LABELS,
  syncDraftToMockAd,
} from "@/lib/announcement-draft";
import type {
  AnnouncementCharacteristics,
  AnnouncementLocationAddress,
  AnnouncementPricingItem,
  AnnouncementPublishWarningItem,
  AnnouncementSectionKey,
  AnnouncementServiceOption,
  AvailabilityDay,
} from "@/lib/announcement-draft-types";
import { ImageCropperModal, type Area } from "@/components/ui/image-cropper-modal";
import { ImageBlurModal, type ImageBlurResult } from "@/components/ui/image-blur-modal";
import { aspectsMatch } from "@/components/ui/image-selection-utils";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Toast } from "@/components/ui/toast";
import { PremiumConversionModal } from "@/components/ui/premium-conversion-modal";
import { PremiumEntryBanner } from "@/components/ui/premium-entry-banner";
import { PremiumEntryButton } from "@/components/ui/premium-entry-button";
import { PREMIUM_UPLOAD_ERROR_MESSAGE, usePremiumPlan } from "@/lib/premium-plan";
import { useAnnouncementMedia } from "@/lib/announcement-media";
import { getCroppedImg } from "@/lib/cropImage";

const SELECT_PLACEHOLDER = "Selecionar";
const GENDER_OPTIONS = [SELECT_PLACEHOLDER, "Feminino", "Masculino", "Trans", "Não-binário"];
const ETHNICITY_OPTIONS = [
  { label: SELECT_PLACEHOLDER, value: SELECT_PLACEHOLDER },
  { label: "Branca", value: "Branca" },
  { label: "Preta", value: "Preta" },
  { label: "Parda (miscigenados)", value: "Parda" },
  { label: "Amarela (descendentes de asiáticos)", value: "Amarela" },
  { label: "Indígena", value: "Indígena" },
];
const HAIR_TYPE_OPTIONS = [
  SELECT_PLACEHOLDER,
  "Liso",
  "Ondulado",
  "Cacheado",
  "Crespo",
  "Afro",
  "Trançado",
];
const HAIR_COLOR_OPTIONS = [
  SELECT_PLACEHOLDER,
  "Preto",
  "Castanho",
  "Loiro",
  "Ruivo",
  "Colorido",
  "Rosa",
  "Platinado",
];
const SMOKER_OPTIONS = [SELECT_PLACEHOLDER, "Sim", "Não"];
const HAIR_SELECTION_SEPARATOR = "::";
type VisibilityStatus = "Ativo" | "Pausado" | "Invisível";
const MAX_LOCATION_ADDRESSES = 10;
const GROUP_WARNING_AUTO_DISMISS_MS = 3200;
type LocationStatusTone = "success" | "error" | "info";
type PhotoCropMode = "edit" | "cover" | "profile";
type PhotoCropTarget = {
  index: number;
  mode: PhotoCropMode;
};
type MediaRole = "cover" | "profile";

type LocationDraft = {
  label: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  notes: string;
};

type DetectedLocation = LocationDraft & {
  latitude: number;
  longitude: number;
  displayName: string;
};

function formatIntegerGroup(value: string) {
  const normalized = value.replace(/^0+(?=\d)/, "");

  if (!normalized) {
    return "0";
  }

  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) {
    return "0,00";
  }

  const normalizedDigits = digits.padStart(3, "0");
  const integerPart = normalizedDigits.slice(0, -2);
  const fractionPart = normalizedDigits.slice(-2);

  return `${formatIntegerGroup(integerPart)},${fractionPart}`;
}

function formatWeightInput(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 0) {
    return "0,0";
  }

  const clampedDigits = Number(digits) > 1000 ? "1000" : digits;
  const normalizedDigits = clampedDigits.padStart(2, "0");
  const integerPart = normalizedDigits.slice(0, -1);
  const fractionPart = normalizedDigits.slice(-1);

  return `${formatIntegerGroup(integerPart)},${fractionPart}`;
}

function formatHeightInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 3);
}

function sanitizeCityInput(value: string) {
  return value
    .replace(/[^A-Za-zÀ-ÿ' -]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 60);
}

function parseHairSelection(value: string) {
  if (!value.trim() || value === SELECT_PLACEHOLDER) {
    return {
      type: SELECT_PLACEHOLDER,
      color: SELECT_PLACEHOLDER,
    };
  }

  if (value.includes(HAIR_SELECTION_SEPARATOR)) {
    const [type = SELECT_PLACEHOLDER, color = SELECT_PLACEHOLDER] =
      value.split(HAIR_SELECTION_SEPARATOR);

    return {
      type: type.trim() || SELECT_PLACEHOLDER,
      color: color.trim() || SELECT_PLACEHOLDER,
    };
  }

  return {
    type: SELECT_PLACEHOLDER,
    color: value,
  };
}

function serializeHairSelection(type: string, color: string) {
  return `${type}${HAIR_SELECTION_SEPARATOR}${color}`;
}

function formatHairSelectionSummary(value: string) {
  const { type, color } = parseHairSelection(value);

  if (isHairSelectionComplete(value)) {
    return `${type} • ${color}`;
  }

  if (!isSelectUnselected(type) && isSelectUnselected(color)) {
    return `Tipo: ${type}`;
  }

  if (!isSelectUnselected(color) && isSelectUnselected(type)) {
    return `Cor: ${color}`;
  }

  return "Selecione o tipo e a cor";
}

function resolvePricingBillingType(item: AnnouncementPricingItem) {
  if (item.billingType) {
    return item.billingType;
  }

  const normalizedLabel = normalizeText(item.label);
  const isHourly = normalizedLabel.includes("hora") || normalizedLabel.includes("min");
  return isHourly ? "hourly" : "fixed";
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function createLocationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `location-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildLocationLabel(location: LocationDraft) {
  if (location.label.trim()) {
    return location.label.trim();
  }

  if (location.addressLine.trim()) {
    return location.addressLine.trim();
  }

  return `${location.city.trim()}${location.state.trim() ? `, ${location.state.trim()}` : ""}`.trim();
}

function createDraftFromLocation(location: Partial<LocationDraft> = {}): LocationDraft {
  return {
    label: location.label ?? "",
    addressLine: location.addressLine ?? "",
    city: location.city ?? "",
    state: location.state ?? "",
    country: location.country ?? "",
    notes: location.notes ?? "",
  };
}

function isSameLocation(a: Partial<LocationDraft>, b: Partial<LocationDraft>) {
  return (
    normalizeText(a.city ?? "") === normalizeText(b.city ?? "") &&
    normalizeText(a.state ?? "") === normalizeText(b.state ?? "")
  );
}

function hasSameAddressData(a: Partial<LocationDraft>, b: Partial<LocationDraft>) {
  return (
    normalizeText(a.addressLine ?? "") === normalizeText(b.addressLine ?? "") &&
    normalizeText(a.city ?? "") === normalizeText(b.city ?? "") &&
    normalizeText(a.state ?? "") === normalizeText(b.state ?? "") &&
    normalizeText(a.country ?? "") === normalizeText(b.country ?? "")
  );
}

function formatLocationSummary(location: AnnouncementLocationAddress) {
  const parts = [
    location.addressLine,
    `${location.city}${location.state ? `, ${location.state}` : ""}`,
    location.country,
    location.notes,
  ].filter(Boolean);
  return parts.join(" • ");
}

function extractNeighborhood(address: Record<string, string | undefined>) {
  const candidates = [
    address.suburb,
    address.neighbourhood,
    address.city_district,
    address.quarter,
    address.residential,
    address.hamlet,
  ];

  return candidates.find((value) => Boolean(value?.trim()))?.trim() ?? "";
}

async function reverseGeocode(latitude: number, longitude: number): Promise<DetectedLocation> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
  );

  if (!response.ok) {
    throw new Error("Falha ao consultar localização");
  }

  const data = (await response.json()) as {
    display_name?: string;
    address?: Record<string, string | undefined>;
  };

  const address = data.address ?? {};
  const city =
    address.city ?? address.town ?? address.village ?? address.municipality ?? address.county ?? "";
  const state = address.state ?? address.region ?? address.province ?? "";
  const country = address.country ?? "";
  const neighborhood = extractNeighborhood(address);
  const label =
    city || state
      ? `${city}${state ? `, ${state}` : ""}`
      : (data.display_name ?? "Local detectado");

  return {
    label,
    addressLine: neighborhood,
    city,
    state,
    country,
    notes: "",
    latitude,
    longitude,
    displayName: data.display_name ?? "",
  };
}

function buildLocationFromDetected(detected: DetectedLocation): LocationDraft {
  return {
    label: detected.label || `${detected.city}${detected.state ? `, ${detected.state}` : ""}`,
    addressLine: detected.addressLine,
    city: detected.city,
    state: detected.state,
    country: detected.country || "",
    notes: detected.notes,
  };
}

function sanitizeTimeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

function resolveCoverIndex(coverIndex: number, imageCount: number) {
  if (imageCount <= 0) {
    return 0;
  }

  return Math.min(Math.max(coverIndex, 0), imageCount - 1);
}

function resolveProfileIndex(profileIndex: number | null, imageCount: number) {
  if (profileIndex === null || imageCount <= 0) {
    return null;
  }

  if (profileIndex < 0 || profileIndex >= imageCount) {
    return null;
  }

  return profileIndex;
}

function remapIndexAfterMoveToFront(index: number | null, movedIndex: number) {
  if (index === null) {
    return null;
  }

  if (index === movedIndex) {
    return 0;
  }

  if (index < movedIndex) {
    return index + 1;
  }

  return index;
}

function removeIndexedCoverPreview(previews: string[], removedIndex: number) {
  return previews.filter((_, index) => index !== removedIndex);
}

function moveItemToFront<T>(items: T[], index: number) {
  if (index <= 0 || index >= items.length) {
    return [...items];
  }

  const nextItems = [...items];
  const [selectedItem] = nextItems.splice(index, 1);
  nextItems.unshift(selectedItem);
  return nextItems;
}

function padPreviews(previews: string[], length: number) {
  const next = [...previews];
  while (next.length < length) {
    next.push("");
  }
  return next;
}

function subscribeSmUp(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(min-width: 640px)");
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getSmUpSnapshot() {
  return window.matchMedia("(min-width: 640px)").matches;
}

function useSmUp() {
  return useSyncExternalStore(subscribeSmUp, getSmUpSnapshot, () => true);
}

export function AnnouncementTab({
  ad,
  status,
  onToggleStatus,
}: {
  ad: AdPreview;
  adSlug: string;
  status: AdStatus;
  onToggleStatus: () => void;
}) {
  const {
    form,
    saveStatus,
    hasUnsavedChanges,
    lastSavedAt,
    score,
    tips,
    sectionDirtyState,
    updateField,
    updateNestedField,
    updateForm,
    saveSection,
    cancelSection,
    publish,
    isSectionReadyForOptimization,
  } = useAnnouncementDraft(ad);
  const router = useRouter();
  const { isPremium, photoLimit, videoLimit } = usePremiumPlan();
  const motionValues = useOptionalDashboardHeaderTitleMotion();
  const fallbackInPageOpacity = useMotionValue(1);
  const inPageTitleOpacity = motionValues?.inPageTitleOpacity ?? fallbackInPageOpacity;
  const { hasOperation, applyEdit, applyBlur, revertOperation } = useAnnouncementMedia();
  const [conversionOpen, setConversionOpen] = useState(false);
  const [conversionHighlight, setConversionHighlight] = useState<"portfolio" | undefined>(
    undefined,
  );
  const [conversionFrom, setConversionFrom] = useState<string | undefined>(undefined);
  const [uploadToast, setUploadToast] = useState<{ title: string; message: string } | null>(null);

  const openConversion = (from: string, highlight?: "portfolio") => {
    setConversionFrom(from);
    setConversionHighlight(highlight);
    setConversionOpen(true);
  };

  const showUploadError = () => {
    setUploadToast({ title: "Upload", message: PREMIUM_UPLOAD_ERROR_MESSAGE });
    window.setTimeout(() => setUploadToast(null), 3200);
  };

  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [photoCropTarget, setPhotoCropTarget] = useState<PhotoCropTarget | null>(null);
  const visibilityStatus: VisibilityStatus = status === "Pausado" ? "Pausado" : "Ativo";
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishErrorItems, setPublishErrorItems] = useState<AnnouncementPublishWarningItem[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [availabilityCloseSignal, setAvailabilityCloseSignal] = useState(0);
  const [isGallerySectionOpen, setIsGallerySectionOpen] = useState(true);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [characteristicsError, setCharacteristicsError] = useState<string | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [characteristicsInvalidFields, setCharacteristicsInvalidFields] = useState<
    Array<keyof AnnouncementCharacteristics>
  >([]);
  const [isCharacteristicsShaking, setIsCharacteristicsShaking] = useState(false);
  const [isPricingShaking, setIsPricingShaking] = useState(false);
  const [isLocationSectionOpen, setIsLocationSectionOpen] = useState(false);
  const [highlightedLocationId, setHighlightedLocationId] = useState<string | null>(null);
  const [isLocationDecisionOpen, setIsLocationDecisionOpen] = useState(false);
  const [isLocationDraftOpen, setIsLocationDraftOpen] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<DetectedLocation | null>(null);
  const [pendingLocationDraft, setPendingLocationDraft] =
    useState<LocationDraft>(createDraftFromLocation());
  const [draftEditingLocationId, setDraftEditingLocationId] = useState<string | null>(null);
  const [removingLocationId, setRemovingLocationId] = useState<string | null>(null);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);
  const [locationStatusTone, setLocationStatusTone] = useState<LocationStatusTone>("info");
  const [highlightedSection, setHighlightedSection] = useState<AnnouncementSectionKey | null>(null);
  const sectionRefs = useRef<Record<AnnouncementSectionKey, HTMLDivElement | null>>({
    characteristics: null,
    pricing: null,
    location: null,
    description: null,
    services: null,
    availability: null,
  });
  const [isCharacteristicsSectionOpen, setIsCharacteristicsSectionOpen] = useState(false);
  const [isPricingSectionOpen, setIsPricingSectionOpen] = useState(false);
  const [isDescriptionSectionOpen, setIsDescriptionSectionOpen] = useState(false);
  const [isServicesSectionOpen, setIsServicesSectionOpen] = useState(false);
  const [isAvailabilitySectionOpen, setIsAvailabilitySectionOpen] = useState(false);

  useEffect(() => {
    if (!highlightedSection) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHighlightedSection(null);
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [highlightedSection]);

  useEffect(() => {
    if (!highlightedLocationId) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setHighlightedLocationId(null);
    }, 2400);

    return () => clearTimeout(timeoutId);
  }, [highlightedLocationId]);

  useEffect(() => {
    if (!locationStatusMessage) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setLocationStatusMessage(null);
    }, 3200);

    return () => clearTimeout(timeoutId);
  }, [locationStatusMessage]);

  const scrollToSection = (section: AnnouncementSectionKey) => {
    if (section === "characteristics") {
      setIsCharacteristicsSectionOpen(true);
    }

    if (section === "pricing") {
      setIsPricingSectionOpen(true);
    }

    if (section === "location") {
      setIsLocationSectionOpen(true);
    }

    if (section === "description") {
      setIsDescriptionSectionOpen(true);
    }

    if (section === "services") {
      setIsServicesSectionOpen(true);
    }

    if (section === "availability") {
      setIsAvailabilitySectionOpen(true);
    }

    setHighlightedSection(section);

    window.setTimeout(() => {
      const target = sectionRefs.current[section];
      if (!target) {
        return;
      }

      const block = window.innerWidth < 768 ? "start" : "center";
      target.scrollIntoView({ behavior: "smooth", block, inline: "nearest" });
    }, 140);
  };

  const handleOptimizeNow = () => {
    const targetSection = OPTIMIZE_SECTION_ORDER.find(
      (section) => sectionDirtyState[section] || !isSectionReadyForOptimization(section),
    );

    if (targetSection) {
      scrollToSection(targetSection);
      return;
    }

    const validationErrors = getPublishValidationErrors(form);
    const publishTarget = OPTIMIZE_SECTION_ORDER.find((section) =>
      validationErrors.some((message) => message.includes(SECTION_LABELS[section])),
    );

    if (publishTarget) {
      scrollToSection(publishTarget);
    }
  };
  const pushLocationStatus = (message: string, tone: LocationStatusTone) => {
    setLocationStatusTone(tone);
    setLocationStatusMessage(message);
  };

  const isLocationSectionExpanded =
    isLocationSectionOpen || isLocationDraftOpen || isLocationDecisionOpen;
  const hasReachedLocationLimit = form.locationAddresses.length >= MAX_LOCATION_ADDRESSES;
  const activeLocation = form.locationAddresses.find((location) => location.active) ?? null;
  const resolvedCoverIndex = resolveCoverIndex(form.coverIndex, form.images.length);
  const resolvedProfileIndex = resolveProfileIndex(form.profileIndex, form.images.length);
  const coverPreviewSrc =
    form.coverPreviews[resolvedCoverIndex] || form.images[resolvedCoverIndex] || "";

  const openPhotoCropper = (index: number, mode: PhotoCropMode) => {
    if (!form.images[index]) {
      return;
    }

    setPhotoCropTarget({ index, mode });
  };

  const updateCoverPreview = (index: number, previewSrc: string, mode: PhotoCropMode) => {
    updateForm((current) => {
      const nextPreviews = padPreviews(current.coverPreviews, current.images.length);
      const nextProfilePreviews = padPreviews(current.profilePreviews, current.images.length);

      nextPreviews[index] = previewSrc;

      if (mode === "cover") {
        const safeIndex = resolveCoverIndex(index, current.images.length);

        const next = {
          ...current,
          images: moveItemToFront(current.images, safeIndex),
          coverPreviews: moveItemToFront(nextPreviews, safeIndex),
          profilePreviews: moveItemToFront(nextProfilePreviews, safeIndex),
          coverIndex: current.images.length > 0 ? 0 : current.coverIndex,
          profileIndex: remapIndexAfterMoveToFront(current.profileIndex, safeIndex),
        };
        syncDraftToMockAd(ad.slug, next);
        return next;
      }

      return {
        ...current,
        coverPreviews: nextPreviews,
      };
    });

    setPhotoCropTarget(null);
  };

  const updateProfilePreview = (index: number, previewSrc: string) => {
    updateForm((current) => {
      if (current.images.length === 0) {
        return current;
      }

      const safeIndex = resolveCoverIndex(index, current.images.length);
      const nextProfilePreviews = padPreviews(current.profilePreviews, current.images.length);
      nextProfilePreviews[safeIndex] = previewSrc;

      const next = {
        ...current,
        profilePreviews: nextProfilePreviews,
        profileIndex: safeIndex,
      };
      syncDraftToMockAd(ad.slug, next);
      return next;
    });

    setPhotoCropTarget(null);
  };

  const setCoverIndex = (index: number) => {
    updateForm((current) => {
      if (current.images.length === 0) {
        return current;
      }

      const safeIndex = resolveCoverIndex(index, current.images.length);

      const next = {
        ...current,
        images: moveItemToFront(current.images, safeIndex),
        coverPreviews: moveItemToFront(
          padPreviews(current.coverPreviews, current.images.length),
          safeIndex,
        ),
        profilePreviews: moveItemToFront(
          padPreviews(current.profilePreviews, current.images.length),
          safeIndex,
        ),
        coverIndex: 0,
        profileIndex: remapIndexAfterMoveToFront(current.profileIndex, safeIndex),
      };
      syncDraftToMockAd(ad.slug, next);
      return next;
    });
  };

  const setProfileIndex = (index: number) => {
    updateForm((current) => {
      if (current.images.length === 0) {
        return current;
      }

      const next = {
        ...current,
        profileIndex: resolveCoverIndex(index, current.images.length),
      };
      syncDraftToMockAd(ad.slug, next);
      return next;
    });
  };

  const deleteMediaAtIndex = (index: number) => {
    updateForm((current) => {
      const nextImages = current.images.filter((_, imageIndex) => imageIndex !== index);
      const nextPreviews = removeIndexedCoverPreview(current.coverPreviews, index);
      const nextProfilePreviews = removeIndexedCoverPreview(current.profilePreviews, index);

      let nextCoverIndex = current.coverIndex;

      if (nextImages.length === 0) {
        nextCoverIndex = 0;
      } else if (index < current.coverIndex) {
        nextCoverIndex = current.coverIndex - 1;
      } else if (index === current.coverIndex) {
        nextCoverIndex = Math.min(index, nextImages.length - 1);
      }

      let nextProfileIndex = current.profileIndex;

      if (nextImages.length === 0 || nextProfileIndex === null) {
        nextProfileIndex = null;
      } else if (index === nextProfileIndex) {
        nextProfileIndex = null;
      } else if (index < nextProfileIndex) {
        nextProfileIndex = nextProfileIndex - 1;
      }

      return {
        ...current,
        images: nextImages,
        coverPreviews: nextPreviews,
        profilePreviews: nextProfilePreviews,
        coverIndex: resolveCoverIndex(nextCoverIndex, nextImages.length),
        profileIndex: resolveProfileIndex(nextProfileIndex, nextImages.length),
      };
    });
  };

  const handleCropComplete = async (croppedAreaPixels: Area) => {
    if (!photoCropTarget) {
      return;
    }

    try {
      const currentSrc = form.images[photoCropTarget.index];

      if (photoCropTarget.mode === "cover") {
        const croppedUrl = await getCroppedImg(currentSrc, croppedAreaPixels);
        updateCoverPreview(photoCropTarget.index, croppedUrl, photoCropTarget.mode);
        return;
      }

      if (photoCropTarget.mode === "profile") {
        const croppedUrl = await getCroppedImg(currentSrc, croppedAreaPixels);
        updateProfilePreview(photoCropTarget.index, croppedUrl);
        return;
      }

      const nextSrc = await applyEdit(currentSrc, croppedAreaPixels);
      if (!nextSrc) return;

      updateForm((current) => {
        const nextImages = [...current.images];
        nextImages[photoCropTarget.index] = nextSrc;
        return { ...current, images: nextImages };
      });

      setPhotoCropTarget(null);
    } catch (error) {
      console.error(error);
      setPhotoCropTarget(null);
    }
  };

  const activateLocation = (locationId: string) => {
    updateForm((current) => {
      const nextLocations = current.locationAddresses.map((location) => ({
        ...location,
        active: location.id === locationId,
      }));

      const nextActive = nextLocations.find((location) => location.active) ?? null;

      return {
        ...current,
        locationAddresses: nextLocations,
        locationState: nextActive?.state ?? current.locationState,
        locationCity: nextActive?.city ?? current.locationCity,
      };
    });

    setHighlightedLocationId(locationId);
  };

  const openLocationDraft = (draft: LocationDraft, locationId: string | null = null) => {
    if (!locationId && hasReachedLocationLimit) {
      pushLocationStatus(`Você pode cadastrar até ${MAX_LOCATION_ADDRESSES} endereços.`, "error");
      return;
    }

    setPendingLocationDraft(draft);
    setDraftEditingLocationId(locationId);
    setIsLocationDraftOpen(true);
    setIsLocationSectionOpen(true);
  };

  const saveLocationDraft = () => {
    const isEditing = Boolean(draftEditingLocationId);

    if (!isEditing && hasReachedLocationLimit) {
      pushLocationStatus(`Limite de ${MAX_LOCATION_ADDRESSES} endereços atingido.`, "error");
      setIsLocationDraftOpen(false);
      return;
    }

    const nextLabel = buildLocationLabel(pendingLocationDraft);
    const nextAddress: AnnouncementLocationAddress = {
      id: draftEditingLocationId ?? createLocationId(),
      label: nextLabel,
      addressLine: pendingLocationDraft.addressLine.trim(),
      city: pendingLocationDraft.city.trim(),
      state: pendingLocationDraft.state.trim().toUpperCase().slice(0, 2),
      country: pendingLocationDraft.country.trim(),
      notes: pendingLocationDraft.notes.trim(),
      active: true,
    };

    const hasDuplicateAddress = form.locationAddresses.some((location) => {
      if (isEditing && location.id === draftEditingLocationId) {
        return false;
      }

      return hasSameAddressData(location, nextAddress);
    });

    if (hasDuplicateAddress) {
      pushLocationStatus(
        "Já existe um endereço cadastrado com os mesmos dados. Revise os campos para salvar.",
        "error",
      );
      return;
    }

    updateForm((current) => {
      const withoutEdited = isEditing
        ? current.locationAddresses.filter((location) => location.id !== draftEditingLocationId)
        : current.locationAddresses;
      const nextLocations = withoutEdited.map((location) => ({ ...location, active: false }));

      return {
        ...current,
        locationAddresses: [...nextLocations, nextAddress],
        locationState: nextAddress.state,
        locationCity: nextAddress.city,
      };
    });

    setIsLocationDraftOpen(false);
    setDraftEditingLocationId(null);
    setHighlightedLocationId(nextAddress.id);
    pushLocationStatus(
      isEditing
        ? "Endereço atualizado e definido como ativo."
        : "Nova localização cadastrada e definida como ativa.",
      "success",
    );
  };

  const captureDeviceLocation = async () => {
    if (!navigator.geolocation) {
      throw new Error("Geolocalização indisponível");
    }

    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      });
    });

    return reverseGeocode(position.coords.latitude, position.coords.longitude);
  };

  const runDeviceLocationDetection = async () => {
    setLocationStatusMessage(null);
    setLocationStatusTone("info");
    setIsLocationSectionOpen(true);

    try {
      const detected = await captureDeviceLocation();
      setDetectedLocation(detected);

      const matchingRegisteredLocation = form.locationAddresses.find((location) =>
        isSameLocation(location, detected),
      );

      if (matchingRegisteredLocation) {
        if (matchingRegisteredLocation.id !== activeLocation?.id) {
          setIsLocationDecisionOpen(true);
        } else {
          setHighlightedLocationId(matchingRegisteredLocation.id);
          pushLocationStatus(
            "A localização detectada já corresponde ao endereço ativo atual.",
            "info",
          );
        }
        return;
      }

      if (hasReachedLocationLimit) {
        pushLocationStatus(
          `Você atingiu o limite de ${MAX_LOCATION_ADDRESSES} endereços. Edite ou exclua um para adicionar outro.`,
          "error",
        );
        return;
      }

      openLocationDraft(buildLocationFromDetected(detected));
    } catch {
      pushLocationStatus(
        "Não foi possível detectar sua localização automaticamente. Verifique as permissões do navegador e tente novamente.",
        "error",
      );
    }
  };

  const handleLocationDecisionConfirm = () => {
    if (!detectedLocation) {
      setIsLocationDecisionOpen(false);
      return;
    }

    const matchingRegisteredLocation = form.locationAddresses.find((location) =>
      isSameLocation(location, detectedLocation),
    );

    if (!matchingRegisteredLocation) {
      setIsLocationDecisionOpen(false);

      if (hasReachedLocationLimit) {
        pushLocationStatus(
          `Você atingiu o limite de ${MAX_LOCATION_ADDRESSES} endereços. Edite ou exclua um para adicionar outro.`,
          "error",
        );
        return;
      }

      openLocationDraft(buildLocationFromDetected(detectedLocation));
      return;
    }

    activateLocation(matchingRegisteredLocation.id);
    setIsLocationDecisionOpen(false);
    setIsLocationSectionOpen(true);
    pushLocationStatus("Localização ativa atualizada para o endereço detectado.", "success");
  };

  const handleEditLocation = (location: AnnouncementLocationAddress) => {
    openLocationDraft(
      {
        label: location.label,
        addressLine: location.addressLine,
        city: location.city,
        state: location.state,
        country: location.country,
        notes: location.notes,
      },
      location.id,
    );
  };

  const handleDeleteLocation = () => {
    if (!draftEditingLocationId) {
      return;
    }

    const deletingLocationId = draftEditingLocationId;
    setIsLocationDraftOpen(false);
    setDraftEditingLocationId(null);
    setRemovingLocationId(deletingLocationId);

    setTimeout(() => {
      updateForm((current) => {
        const remainingLocations = current.locationAddresses.filter(
          (location) => location.id !== deletingLocationId,
        );
        const hasActiveLocation = remainingLocations.some((location) => location.active);
        const nextLocations = hasActiveLocation
          ? remainingLocations
          : remainingLocations.map((location, index) => ({
              ...location,
              active: index === 0,
            }));
        const nextActive = nextLocations.find((location) => location.active) ?? null;

        return {
          ...current,
          locationAddresses: nextLocations,
          locationState: nextActive?.state ?? "",
          locationCity: nextActive?.city ?? "",
        };
      });

      setRemovingLocationId(null);
      pushLocationStatus("Endereço excluído com sucesso.", "success");
    }, 220);
  };

  const handleTravelToggle = (enabled: boolean) => {
    updateField("acceptsTravel", enabled);
  };

  const statusStyles = {
    Ativo: {
      button: "bg-emerald-100 text-emerald-800 border-emerald-300",
      wave: "bg-emerald-400",
      dot: "bg-emerald-600",
    },
    Pausado: {
      button: "bg-orange-100 text-orange-800 border-orange-300",
      wave: "bg-orange-400",
      dot: "bg-orange-600",
    },
    Invisível: {
      button: "bg-zinc-200 text-zinc-700 border-zinc-300",
      wave: "bg-zinc-400",
      dot: "bg-zinc-600",
    },
  } as const;

  const handleViewPublicAd = () => {
    syncDraftToMockAd(ad.slug, form);
    router.push(`/anuncio/${ad.slug}`);
  };

  const handlePublish = async () => {
    if (saveStatus === "saving" || isPublishing) return;

    setIsPublishing(true);

    const result = await publish({ status, onActivate: onToggleStatus });

    if (!result.ok) {
      setPublishError(result.message);
      setPublishErrorItems(result.reason === "blocked" ? result.items : []);
      setIsPublishing(false);
      return;
    }

    setPublishError(null);
    setPublishErrorItems([]);
    setIsPublishing(false);
  };

  const handleCancelSection = (section: AnnouncementSectionKey) => {
    if (!sectionDirtyState[section] || saveStatus === "saving") {
      return;
    }

    cancelSection(section);

    if (section === "characteristics") {
      setCharacteristicsInvalidFields([]);
      setCharacteristicsError(null);
    }

    if (section === "pricing") {
      setPricingError(null);
    }

    if (section === "location") {
      setHighlightedLocationId(null);
      setLocationStatusMessage(null);
    }

    setPublishError(null);
    setPublishErrorItems([]);
  };

  const handleSaveSection = async (section: AnnouncementSectionKey) => {
    const result = await saveSection(section);

    if (!result.ok) {
      if (result.reason === "characteristics") {
        setCharacteristicsInvalidFields(result.missing);
        setCharacteristicsError(result.message);
        setIsCharacteristicsShaking(true);
        setTimeout(() => setIsCharacteristicsShaking(false), 420);
        return;
      }

      if (result.reason === "pricing") {
        setPricingError(result.message);
        setIsPricingShaking(true);
        setTimeout(() => setIsPricingShaking(false), 420);
      }

      return;
    }

    if (section === "characteristics") {
      setCharacteristicsInvalidFields([]);
      setCharacteristicsError(null);
    }

    if (section === "pricing") {
      setPricingError(null);
    }

    setPublishError(null);
    setPublishErrorItems([]);
  };

  return (
    <div className="space-y-8 pb-12 px-1 lg:px-0">
      {/* ── 1. Header & Bento Grid Fotos ──────────────────────────── */}
      <section>
        <div className="relative mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <motion.div
              data-dashboard-desktop-title-source
              style={{ opacity: inPageTitleOpacity }}
              className="hidden min-w-0 lg:block"
            >
              <h1 className={cn("truncate", DASHBOARD_TITLE_PAGE_CLASS)}>
                {DASHBOARD_HEADER_TITLE}
                {hasUnsavedChanges && (
                  <span className="ml-2 text-base font-semibold text-amber-700">
                    (Alterações não salvas)
                  </span>
                )}
              </h1>
            </motion.div>
            <p className="mt-1 text-zinc-500">
              Gerencie sua identidade visual e informações do anúncio.
            </p>
            {publishError ? (
              <div className="mt-2 space-y-1 text-sm font-medium text-red-600">
                <p>{publishError}</p>
                {publishErrorItems.length > 0 ? (
                  <ol className="space-y-1 text-red-600">
                    {publishErrorItems.map((item, index) => (
                      <li key={`${item.kind}-${item.section}-${index}`} className="leading-relaxed">
                        {index + 1}.{" "}
                        {item.kind === "unsaved"
                          ? "Salve ou cancele as alterações em"
                          : "Preencha os campos obrigatórios em"}{" "}
                        <button
                          type="button"
                          onClick={() => scrollToSection(item.section)}
                          className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 font-semibold text-red-700 underline decoration-red-300 underline-offset-2 transition hover:bg-red-100 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-300"
                        >
                          {item.label}
                        </button>
                        .
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="relative flex w-full gap-2 sm:w-auto sm:gap-3">
            <button
              type="button"
              onClick={handleViewPublicAd}
              className="px-3 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base rounded-lg border border-zinc-200 bg-white font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Ver Anúncio Público
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={saveStatus === "saving" || isPublishing}
              className="px-3 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base rounded-lg bg-wine-700 text-white font-bold shadow-md hover:bg-wine-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <PublishIndicator
                status={saveStatus}
                lastSavedAt={lastSavedAt}
                isPublishing={isPublishing}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Fullscreen Photo Modal */}
      {activePhotoIndex !== null && (
        <PhotoGalleryModal
          images={form.images}
          activeIndex={activePhotoIndex}
          onClose={() => setActivePhotoIndex(null)}
          onChange={(idx) => setActivePhotoIndex(idx)}
          onSetCover={(idx) => setCoverIndex(idx)}
          onSetProfile={(idx) => setProfileIndex(idx)}
          coverIndex={resolvedCoverIndex}
          profileIndex={resolvedProfileIndex}
          onEditPhoto={(idx, mode) => openPhotoCropper(idx, mode)}
          onUpdateImage={(idx, blurredSrc: ImageBlurResult) => {
            const currentSrc = form.images[idx];
            const nextSrc = applyBlur(currentSrc, {
              src: blurredSrc.src,
              mode: blurredSrc.mode,
              cropArea: blurredSrc.cropArea,
              maskDataUrl: blurredSrc.maskDataUrl,
            });
            updateForm((current) => {
              const newImages = [...current.images];
              newImages[idx] = nextSrc;
              return { ...current, images: newImages };
            });
          }}
          canRevertBlur={hasOperation(form.images[activePhotoIndex], "blur")}
          canRevertEdit={hasOperation(form.images[activePhotoIndex], "edit")}
          onRevertBlur={async (idx) => {
            const currentSrc = form.images[idx];
            const next = await revertOperation(currentSrc, "blur");
            if (!next) return;
            updateForm((current) => {
              const newImages = [...current.images];
              newImages[idx] = next;
              return { ...current, images: newImages };
            });
          }}
          onRevertEdit={async (idx) => {
            const currentSrc = form.images[idx];
            const next = await revertOperation(currentSrc, "edit");
            if (!next) return;
            updateForm((current) => {
              const nextImages = [...current.images];
              nextImages[idx] = next;
              return {
                ...current,
                images: nextImages,
              };
            });
          }}
          onDelete={(idx) => {
            deleteMediaAtIndex(idx);
            if (form.images.length === 1) {
              setActivePhotoIndex(null);
            } else if (idx === form.images.length - 1) {
              setActivePhotoIndex(idx - 1);
            }
          }}
          onAddPhoto={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = true;
            input.accept =
              ".webp,.jpg,.jpeg,.avif,.mp4,.mov,.webm,image/webp,image/jpeg,image/avif,video/mp4,video/quicktime,video/webm";
            input.onchange = (e) => {
              const files = Array.from((e.target as HTMLInputElement).files || []);
              if (!files.length) return;

              let currentVideos = form.images.filter((img) => img.startsWith("data:video")).length;
              let currentPhotos = form.images.length - currentVideos;
              let blockedByLimit = false;

              files.forEach((file) => {
                const isVid = file.type.startsWith("video/");
                if (isVid && currentVideos >= videoLimit) {
                  blockedByLimit = true;
                  return;
                }
                if (!isVid && currentPhotos >= photoLimit) {
                  blockedByLimit = true;
                  return;
                }

                if (isVid) currentVideos++;
                else currentPhotos++;

                const reader = new FileReader();
                reader.onload = (readerEvent) => {
                  const result = readerEvent.target?.result as string;
                  updateForm((current) => ({
                    ...current,
                    images: [...current.images, result],
                    coverPreviews: [...current.coverPreviews, ""],
                    profilePreviews: [...current.profilePreviews, ""],
                  }));
                };
                reader.readAsDataURL(file);
              });

              if (blockedByLimit) {
                if (isPremium) {
                  showUploadError();
                } else {
                  openConversion("portfolio", "portfolio");
                }
              }
            };
            input.click();
          }}
        />
      )}

      <PremiumConversionModal
        open={conversionOpen}
        onClose={() => setConversionOpen(false)}
        highlight={conversionHighlight}
        from={conversionFrom}
      />

      {uploadToast ? (
        <Toast title={uploadToast.title} message={uploadToast.message} type="error" />
      ) : null}

      {isLocationDecisionOpen && detectedLocation && (
        <LocationDecisionModal
          activeLocation={activeLocation}
          detectedLocation={detectedLocation}
          onClose={() => setIsLocationDecisionOpen(false)}
          onConfirm={handleLocationDecisionConfirm}
        />
      )}

      {isLocationDraftOpen && (
        <LocationDraftModal
          draft={pendingLocationDraft}
          locationStatusMessage={locationStatusMessage}
          locationStatusTone={locationStatusTone}
          onClose={() => {
            setIsLocationDraftOpen(false);
            setDraftEditingLocationId(null);
          }}
          onChange={setPendingLocationDraft}
          onConfirm={saveLocationDraft}
          onDelete={handleDeleteLocation}
          onDetectLocation={async () => {
            try {
              const detected = await captureDeviceLocation();
              setDetectedLocation(detected);
              setPendingLocationDraft(buildLocationFromDetected(detected));
              pushLocationStatus("Localização atual aplicada ao rascunho do endereço.", "success");
            } catch {
              pushLocationStatus(
                "Não foi possível detectar sua localização automaticamente. Verifique as permissões do navegador e tente novamente.",
                "error",
              );
            }
          }}
          isEditing={Boolean(draftEditingLocationId)}
        />
      )}

      {photoCropTarget && form.images[photoCropTarget.index] ? (
        <ImageCropperModal
          imageSrc={form.images[photoCropTarget.index]}
          onClose={() => setPhotoCropTarget(null)}
          onCropComplete={handleCropComplete}
          aspect={
            photoCropTarget.mode === "cover"
              ? 21 / 9
              : photoCropTarget.mode === "profile"
                ? 3 / 4
                : undefined
          }
          canRevert={
            photoCropTarget.mode === "edit" &&
            hasOperation(form.images[photoCropTarget.index], "edit")
          }
          onRevert={
            photoCropTarget.mode === "edit"
              ? async () => {
                  const currentSrc = form.images[photoCropTarget.index];
                  const next = await revertOperation(currentSrc, "edit");
                  if (!next) return;

                  updateForm((current) => {
                    const nextImages = [...current.images];
                    nextImages[photoCropTarget.index] = next;
                    return {
                      ...current,
                      images: nextImages,
                    };
                  });

                  setPhotoCropTarget(null);
                }
              : undefined
          }
        />
      ) : null}

      {/* ── 2. Conteúdo e Informações (Split Layout) ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coluna Lateral (Direita no Desktop, Topo no Mobile) */}
        <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
          <Card className="p-5 sm:p-6 bg-white shadow-sm border-zinc-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-900">
                Status do Anúncio
              </span>
              <div className="relative flex flex-col items-end gap-1">
                <button
                  onClick={onToggleStatus}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-1.5 rounded-full text-sm font-bold border shadow-sm transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
                    statusStyles[visibilityStatus].button,
                  )}
                >
                  <span className="relative inline-flex h-4 w-4 items-center justify-center">
                    <span
                      className={cn(
                        "absolute inline-flex h-4 w-4 rounded-full opacity-65 animate-ping",
                        statusStyles[visibilityStatus].wave,
                      )}
                    ></span>
                    <span
                      className={cn(
                        "relative inline-flex h-2.5 w-2.5 rounded-full",
                        statusStyles[visibilityStatus].dot,
                      )}
                    ></span>
                  </span>
                  {visibilityStatus}
                </button>

                <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-zinc-500 leading-none">
                  Alterar o status
                  <svg
                    className="h-4 w-4 shrink-0 text-zinc-600"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M9 4l-3 3h2.25v10.5h1.5V7H12L9 4z" />
                    <path d="M15 20l3-3h-2.25V6.5h-1.5V17H12l3 3z" />
                  </svg>
                </span>
              </div>
            </div>
            <ProfileScoreBar score={score} onOptimizeNow={handleOptimizeNow} />
          </Card>

          {tips.length > 0 && (
            <div className="bg-zinc-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-3 relative z-10 flex items-center gap-2">
                <span className="text-amber-400">💡</span> Dicas Inteligentes
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed relative z-10 mb-4 line-clamp-3">
                {tips[0].text}
              </p>
              <button
                onClick={() => setIsTipsModalOpen(true)}
                className="text-xs font-black uppercase tracking-widest text-amber-400 hover:text-white transition-colors"
              >
                Ver todas
              </button>
            </div>
          )}

          {!isPremium ? (
            <>
              <PremiumEntryBanner
                variant="sidebar"
                className="hidden lg:block"
                onClick={() => openConversion("announcement-sidebar")}
              />
              <PremiumEntryButton
                className="lg:hidden"
                onClick={() => openConversion("announcement-sidebar")}
              />
            </>
          ) : null}
        </div>

        {/* Coluna Principal (Esquerda no Desktop, Baixo no Mobile) */}
        <div className="lg:col-span-8 space-y-8 order-2 lg:order-1 px-0.5 sm:px-0">
          {/* ================= SEÇÃO OBRIGATÓRIOS ================= */}
          <div className="flex items-center gap-3 border-b border-zinc-200 pb-2">
            <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-black">
              *
            </div>
            <h2 className="text-xl font-bold text-zinc-900">Informações Obrigatórias</h2>
          </div>

          {/* Galeria como SectionCard Expansível */}
          <SectionCard
            title="Galeria"
            requiredAsterisk
            open={isGallerySectionOpen}
            onOpenChange={setIsGallerySectionOpen}
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
          >
            <BentoPhotoGallery
              images={form.images}
              coverIndex={resolvedCoverIndex}
              profileIndex={resolvedProfileIndex}
              coverPreview={coverPreviewSrc}
              coverPreviews={form.coverPreviews}
              photoLimit={photoLimit}
              videoLimit={videoLimit}
              isPremium={isPremium}
              onUpgradeClick={() => openConversion("portfolio", "portfolio")}
              onPhotoClick={(idx) => setActivePhotoIndex(idx)}
              onDeletePhoto={(idx) => deleteMediaAtIndex(idx)}
              onAddPhoto={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.accept =
                  ".webp,.jpg,.jpeg,.avif,.mp4,.mov,.webm,image/webp,image/jpeg,image/avif,video/mp4,video/quicktime,video/webm";
                input.onchange = (e) => {
                  const files = Array.from((e.target as HTMLInputElement).files || []);
                  if (!files.length) return;

                  let currentVideos = form.images.filter((img) =>
                    img.startsWith("data:video"),
                  ).length;
                  let currentPhotos = form.images.length - currentVideos;
                  let blockedByLimit = false;

                  files.forEach((file) => {
                    const isVid = file.type.startsWith("video/");
                    if (isVid && currentVideos >= videoLimit) {
                      blockedByLimit = true;
                      return;
                    }
                    if (!isVid && currentPhotos >= photoLimit) {
                      blockedByLimit = true;
                      return;
                    }

                    if (isVid) currentVideos++;
                    else currentPhotos++;

                    const reader = new FileReader();
                    reader.onload = (readerEvent) => {
                      const result = readerEvent.target?.result as string;
                      updateForm((current) => ({
                        ...current,
                        images: [...current.images, result],
                        coverPreviews: [...current.coverPreviews, ""],
                        profilePreviews: [...current.profilePreviews, ""],
                      }));
                    };
                    reader.readAsDataURL(file);
                  });

                  if (blockedByLimit) {
                    if (isPremium) {
                      showUploadError();
                    } else {
                      openConversion("portfolio", "portfolio");
                    }
                  }
                };
                input.click();
              }}
            />
          </SectionCard>

          <SectionCard
            sectionRef={(node) => {
              sectionRefs.current.characteristics = node;
            }}
            title="Características físicas"
            requiredAsterisk
            dirty={sectionDirtyState.characteristics}
            showSaveAction
            onSaveAction={() => handleSaveSection("characteristics")}
            onCancelAction={() => handleCancelSection("characteristics")}
            saveDisabled={saveStatus === "saving"}
            open={isCharacteristicsSectionOpen}
            onOpenChange={setIsCharacteristicsSectionOpen}
            highlighted={highlightedSection === "characteristics"}
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
          >
            <CharacteristicsSection
              characteristics={form.characteristics}
              invalidFields={characteristicsInvalidFields}
              errorMessage={characteristicsError}
              isShaking={isCharacteristicsShaking}
              onUpdate={(field, value) => {
                const sanitizedValue =
                  field === "height"
                    ? formatHeightInput(value)
                    : field === "weight"
                      ? (() => {
                          const digits = value.replace(/\D/g, "");
                          if (!digits) {
                            return "";
                          }

                          return Number(digits) > 1000 ? "1000" : digits;
                        })()
                      : value;

                setCharacteristicsInvalidFields((prev) => prev.filter((item) => item !== field));
                setCharacteristicsError(null);

                if (
                  (field === "gender" ||
                    field === "ethnicity" ||
                    field === "hairColor" ||
                    field === "smoker") &&
                  sanitizedValue === SELECT_PLACEHOLDER
                ) {
                  updateField("characteristics", {
                    ...form.characteristics,
                    [field]: sanitizedValue,
                    height: "",
                    weight: "",
                  });
                  return;
                }

                updateNestedField("characteristics", field, sanitizedValue);
              }}
            />
          </SectionCard>

          <SectionCard
            sectionRef={(node) => {
              sectionRefs.current.pricing = node;
            }}
            title="Tabela de preços"
            requiredAsterisk
            dirty={sectionDirtyState.pricing}
            showSaveAction
            onSaveAction={() => handleSaveSection("pricing")}
            onCancelAction={() => handleCancelSection("pricing")}
            saveDisabled={saveStatus === "saving"}
            open={isPricingSectionOpen}
            onOpenChange={setIsPricingSectionOpen}
            highlighted={highlightedSection === "pricing"}
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          >
            <PricingSection
              pricing={form.pricing}
              paymentMethods={form.paymentMethods || []}
              errorMessage={pricingError}
              isShaking={isPricingShaking}
              onUpdate={(idx: number, field: string, value: string | number) => {
                const next = form.pricing.map((p, i) =>
                  i === idx
                    ? {
                        ...p,
                        [field]: field === "price" ? String(value).replace(/\D/g, "") : value,
                      }
                    : p,
                );
                updateField("pricing", next);
              }}
              onToggleDisabled={(idx: number) => {
                const next = form.pricing.map((p, i) =>
                  i === idx ? { ...p, disabled: !p.disabled } : p,
                );
                updateField("pricing", next);
              }}
              onToggleMethod={(methodId: string) => {
                const currentMethods = form.paymentMethods || [];
                if (currentMethods.includes(methodId) && currentMethods.length === 1) {
                  setPricingError("Ao menos uma modalidade de pagamento deve ser selecionada.");
                  setIsPricingShaking(true);
                  setTimeout(() => setIsPricingShaking(false), 420);
                  return;
                }
                const next = currentMethods.includes(methodId)
                  ? form.paymentMethods.filter((id) => id !== methodId)
                  : [...form.paymentMethods, methodId];
                updateField("paymentMethods", next);
                setPricingError(null);
              }}
            />
          </SectionCard>

          <SectionCard
            sectionRef={(node) => {
              sectionRefs.current.location = node;
            }}
            title="Localização"
            requiredAsterisk
            dirty={sectionDirtyState.location}
            showSaveAction
            onSaveAction={() => handleSaveSection("location")}
            onCancelAction={() => handleCancelSection("location")}
            saveDisabled={saveStatus === "saving"}
            open={isLocationSectionExpanded}
            onOpenChange={setIsLocationSectionOpen}
            highlighted={highlightedSection === "location"}
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
          >
            <LocationSection
              addresses={form.locationAddresses}
              activeLocation={activeLocation}
              highlightedLocationId={highlightedLocationId}
              onDetectLocation={runDeviceLocationDetection}
              onAddLocation={() => openLocationDraft(createDraftFromLocation())}
              onEditLocation={handleEditLocation}
              onToggleActive={activateLocation}
              onToggleTravel={handleTravelToggle}
              acceptsTravel={form.acceptsTravel}
              removingLocationId={removingLocationId}
              canAddLocation={!hasReachedLocationLimit}
              locationStatusMessage={locationStatusMessage}
              locationStatusTone={locationStatusTone}
              suppressErrorOverlay={isLocationDraftOpen}
            />
          </SectionCard>

          {/* ================= SEÇÃO OPCIONAIS ================= */}
          <div className="flex items-center gap-3 border-b border-zinc-200 pb-2 mt-12">
            <h2 className="text-xl font-bold text-zinc-900">Informações Opcionais</h2>
          </div>

          <SectionCard
            sectionRef={(node) => {
              sectionRefs.current.description = node;
            }}
            title="Descrição do Perfil"
            dirty={sectionDirtyState.description}
            showSaveAction
            onSaveAction={() => handleSaveSection("description")}
            onCancelAction={() => handleCancelSection("description")}
            saveDisabled={saveStatus === "saving"}
            open={isDescriptionSectionOpen}
            onOpenChange={setIsDescriptionSectionOpen}
            highlighted={highlightedSection === "description"}
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
              </svg>
            }
          >
            <DescriptionSection
              shortDescription={form.shortDescription}
              description={form.description}
              onShortDescChange={(v: string) =>
                updateField("shortDescription", v.replace(/\s{2,}/g, " "))
              }
              onDescChange={(v: string) => updateField("description", v.replace(/\s{3,}/g, "  "))}
            />
          </SectionCard>

          <SectionCard
            sectionRef={(node) => {
              sectionRefs.current.services = node;
            }}
            title="Serviços Oferecidos"
            dirty={sectionDirtyState.services}
            showSaveAction
            onSaveAction={() => handleSaveSection("services")}
            onCancelAction={() => handleCancelSection("services")}
            saveDisabled={saveStatus === "saving"}
            open={isServicesSectionOpen}
            onOpenChange={setIsServicesSectionOpen}
            highlighted={highlightedSection === "services"}
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            }
          >
            <ServicesSection
              services={form.services}
              onToggle={(idx: number) => {
                const next = form.services.map((s, i) =>
                  i === idx ? { ...s, selected: !s.selected } : s,
                );
                updateField("services", next);
              }}
            />
          </SectionCard>

          <SectionCard
            sectionRef={(node) => {
              sectionRefs.current.availability = node;
            }}
            key={`availability-${availabilityCloseSignal}`}
            title="Horários de Disponibilidade"
            dirty={sectionDirtyState.availability}
            showSaveAction
            onSaveAction={() => handleSaveSection("availability")}
            onCancelAction={() => handleCancelSection("availability")}
            saveDisabled={saveStatus === "saving"}
            open={isAvailabilitySectionOpen}
            onOpenChange={setIsAvailabilitySectionOpen}
            highlighted={highlightedSection === "availability"}
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          >
            <AvailabilitySection
              showAvailability={form.showAvailability}
              availability={form.availability}
              onToggleShow={(v: boolean) => {
                if (!v) {
                  updateField("showAvailability", false);
                  return;
                }

                const hasEnabledDay = form.availability.some((day) => day.enabled);
                if (!hasEnabledDay) {
                  const fallbackAvailability = form.availability.map((day, idx) =>
                    idx === 0 ? { ...day, enabled: true, start: "10:00", end: "22:00" } : day,
                  );
                  updateField("availability", fallbackAvailability);
                }
                updateField("showAvailability", true);
              }}
              onDayToggle={(idx: number, enabled: boolean) => {
                const next = form.availability.map((d, i) =>
                  i === idx
                    ? {
                        ...d,
                        enabled,
                        start: enabled ? "10:00" : "--:--",
                        end: enabled ? "22:00" : "--:--",
                      }
                    : d,
                );
                updateField("availability", next);

                if (!next.some((d) => d.enabled)) {
                  updateField("showAvailability", false);
                  setAvailabilityCloseSignal((prev) => prev + 1);
                }
              }}
              onTimeChange={(idx: number, field: string, value: string) => {
                const next = form.availability.map((d, i) =>
                  i === idx ? { ...d, [field]: sanitizeTimeInput(value) } : d,
                );
                updateField("availability", next);
              }}
            />
          </SectionCard>

          {!isPremium ? (
            <PremiumEntryBanner
              variant="availability"
              onClick={() => openConversion("announcement-availability")}
            />
          ) : null}
        </div>
      </div>

      {/* Tips Modal */}
      {isTipsModalOpen && (
        <Modal
          open
          onClose={() => setIsTipsModalOpen(false)}
          title="Dicas Inteligentes para o seu Perfil"
          size="md"
          actions={
            <button
              onClick={() => setIsTipsModalOpen(false)}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-lg shadow-zinc-900/10"
            >
              Entendi
            </button>
          }
        >
          <div className="space-y-6 pt-2">
            {/* Bloco 1: Amber - Descrição */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                <Edit className="w-4 h-4" /> Descrição Irresistível
              </h4>
              <p className="text-sm text-amber-800 leading-relaxed">
                No campo de descrição, evite escrever muito, seja breve quanto aos seus objetivos, a
                maioria das pessoas ao entrar em um perfil e ver muito texto não irá ler, ela
                preferirá ver fotos ou gatilhos que despertem seu interesse, como especialidades ou
                habilidades únicas.
              </p>
            </div>

            {/* Bloco 2: Indigo - Imagem */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> O Poder da Imagem
              </h4>
              <p className="text-sm text-indigo-800 leading-relaxed">
                Um bom ensaio fotográfico não é apenas capricho, e sim transmitir uma ideia de
                exclusividade e garantir uma experiência única. Certifique-se de ter boa iluminação
                e mostrar diferentes ângulos que valorizem suas características.
              </p>
            </div>

            {/* Bloco 3: Emerald - Valores */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <h4 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                <BadgeDollarSign className="w-4 h-4" /> Transparência nos Valores
              </h4>
              <p className="text-sm text-emerald-800 leading-relaxed">
                Perfis com os valores preenchidos na tabela de preços convertem muito mais. O
                cliente prefere anúncios onde já saiba o valor esperado, descartando contatos
                casuais.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Componentes Visuais do Redesign ──────────────────────────────

function SectionCard({
  title,
  icon,
  children,
  requiredAsterisk,
  dirty,
  highlighted,
  showSaveAction,
  onSaveAction,
  onCancelAction,
  saveDisabled,
  open,
  onOpenChange,
  defaultOpen = false,
  sectionRef,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  requiredAsterisk?: boolean;
  dirty?: boolean;
  highlighted?: boolean;
  showSaveAction?: boolean;
  onSaveAction?: () => void;
  onCancelAction?: () => void;
  saveDisabled?: boolean;
  open?: boolean;
  onOpenChange?: (next: boolean) => void;
  defaultOpen?: boolean;
  sectionRef?: (node: HTMLDivElement | null) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const handleOpenChange = onOpenChange ?? setInternalOpen;

  // Control overlay locally so re-renders (e.g. opening the section) don't retrigger animation
  const [showHighlightOverlay, setShowHighlightOverlay] = useState(false);
  const flashingRef = useRef(false);

  useEffect(() => {
    if (highlighted && !flashingRef.current) {
      flashingRef.current = true;
      const openTimeoutId = window.setTimeout(() => {
        setShowHighlightOverlay(true);
      }, 0);

      const timeoutId = window.setTimeout(() => {
        setShowHighlightOverlay(false);
        flashingRef.current = false;
      }, 1600);

      return () => {
        window.clearTimeout(openTimeoutId);
        window.clearTimeout(timeoutId);
      };
    }
    return;
  }, [highlighted]);

  return (
    <div
      ref={sectionRef}
      className={cn(
        "relative scroll-mt-24 sm:scroll-mt-28 lg:scroll-mt-32 bg-white rounded-2xl shadow-sm border transition-all duration-300",
        highlighted
          ? "border-red-500 ring-4 ring-red-500/10 scale-[1.002]"
          : dirty
            ? "border-amber-400 ring-2 ring-amber-400/10"
            : "border-zinc-200",
        "overflow-hidden",
      )}
    >
      {showHighlightOverlay ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-zinc-900/30"
          style={{
            animation: "section-focus-flash 1.6s ease-out 1",
            willChange: "opacity, transform",
          }}
        />
      ) : null}
      <div className="relative z-10">
        <button
          type="button"
          onClick={() => handleOpenChange(!isOpen)}
          aria-expanded={isOpen}
          className="w-full p-5 sm:p-6 bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-zinc-100/60 transition-colors"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                "p-2 rounded-lg shrink-0",
                dirty ? "text-amber-700 bg-amber-100" : "text-wine-700 bg-wine-50",
              )}
            >
              {icon}
            </div>
            <h3 className="flex min-w-0 items-start gap-1 text-lg sm:text-xl font-bold text-zinc-900">
              <span className="min-w-0 truncate">{title}</span>
              {requiredAsterisk && (
                <span className="mt-0.5 shrink-0 text-red-600" aria-hidden="true">
                  *
                </span>
              )}
            </h3>
          </div>
          <span
            className="h-8 w-8 rounded-full border border-zinc-200 bg-white text-zinc-600 flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <svg
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                isOpen ? "rotate-180" : "rotate-0",
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </button>
        {isOpen && (
          <div className="p-6 sm:p-8">
            {children}
            {showSaveAction && (
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-3">
                {dirty ? (
                  <button
                    type="button"
                    onClick={onCancelAction}
                    disabled={saveDisabled}
                    className="inline-flex w-full shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    Cancelar alterações
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onSaveAction}
                  disabled={!dirty || saveDisabled}
                  className="inline-flex w-full shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-wine-700 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-wine-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                >
                  Salvar seção
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes section-focus-flash {
          0% {
            opacity: 0;
            transform: scale(1);
          }
          10% {
            opacity: 0.34;
            transform: scale(1.004);
          }
          60% {
            opacity: 0.34;
            transform: scale(1.006);
          }
          100% {
            opacity: 0;
            transform: scale(1.01);
          }
        }
      `}</style>
    </div>
  );
}

function MediaRoleBadges({
  isCover,
  isProfile,
  compact = false,
}: {
  isCover: boolean;
  isProfile: boolean;
  compact?: boolean;
}) {
  if (!isCover && !isProfile) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute top-2 left-2 z-10 flex flex-wrap gap-1",
        !compact && "top-4 left-4 gap-1.5",
      )}
    >
      {isCover ? (
        <div
          className={cn(
            "bg-white/95 backdrop-blur rounded font-black uppercase tracking-widest text-wine-700 shadow-lg",
            compact ? "px-2 py-1 text-[8px]" : "px-3 py-1.5 text-[10px]",
          )}
        >
          Capa do Perfil
        </div>
      ) : null}
      {isProfile ? (
        <div
          className={cn(
            "bg-white/95 backdrop-blur rounded font-black uppercase tracking-widest text-teal-700 shadow-lg",
            compact ? "px-2 py-1 text-[8px]" : "px-3 py-1.5 text-[10px]",
          )}
        >
          Foto de Perfil
        </div>
      ) : null}
    </div>
  );
}

function BentoPhotoGallery({
  images,
  coverIndex,
  profileIndex,
  coverPreview,
  coverPreviews,
  onPhotoClick,
  onDeletePhoto,
  onAddPhoto,
  photoLimit,
  videoLimit,
  isPremium,
  onUpgradeClick,
}: {
  images: string[];
  coverIndex: number;
  profileIndex: number | null;
  coverPreview: string;
  coverPreviews: string[];
  onPhotoClick: (idx: number) => void;
  onDeletePhoto: (idx: number) => void;
  onAddPhoto: () => void;
  photoLimit: number;
  videoLimit: number;
  isPremium: boolean;
  onUpgradeClick: () => void;
}) {
  const [viewMode, setViewMode] = useState<"bento" | "grid">("bento");

  const clampAspectRatio = (ratio: number) => {
    if (!Number.isFinite(ratio) || ratio <= 0) {
      return 1;
    }

    return Math.min(Math.max(ratio, 0.42), 2.4);
  };

  const videosCount = images.filter((img) => img.startsWith("data:video")).length;
  const photosCount = images.length - videosCount;
  const canAddMore = photosCount < photoLimit || videosCount < videoLimit;
  const mediaCapacity = photoLimit + videoLimit;
  const atStandardLimit = !isPremium && !canAddMore;
  const lockedSlots = atStandardLimit ? 2 : 0;
  const resolvedCoverIndex = resolveCoverIndex(coverIndex, images.length);
  const resolvedProfileIndex = resolveProfileIndex(profileIndex, images.length);
  const resolvedCoverSrc = coverPreview || images[resolvedCoverIndex] || "";
  const mediaSources = useMemo(
    () => images.map((src, idx) => coverPreviews[idx] || src),
    [coverPreviews, images],
  );
  const [mediaAspectRatios, setMediaAspectRatios] = useState<Record<number, number>>({});

  useEffect(() => {
    let isMounted = true;

    if (mediaSources.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMediaAspectRatios({});
      return () => {
        isMounted = false;
      };
    }

    const collectRatios = async () => {
      const nextRatios: Record<number, number> = {};

      await Promise.all(
        mediaSources.map(
          (src, idx) =>
            new Promise<void>((resolve) => {
              if (!src || src.startsWith("data:video")) {
                nextRatios[idx] = 1;
                resolve();
                return;
              }

              const media = new window.Image();
              media.onload = () => {
                nextRatios[idx] = clampAspectRatio(media.naturalWidth / media.naturalHeight);
                resolve();
              };
              media.onerror = () => {
                nextRatios[idx] = 1;
                resolve();
              };
              media.src = src;
            }),
        ),
      );

      if (isMounted) {
        setMediaAspectRatios(nextRatios);
      }
    };

    void collectRatios();

    return () => {
      isMounted = false;
    };
  }, [mediaSources]);

  const galleryItems = useMemo(
    () =>
      images
        .map((img, idx) => ({
          idx,
          src: coverPreviews[idx] || img,
          ratio: mediaAspectRatios[idx] ?? 1,
        }))
        .filter((item) => item.idx !== resolvedCoverIndex),
    [coverPreviews, images, mediaAspectRatios, resolvedCoverIndex],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Clique nas fotos para interagir
          <span className="block sm:inline sm:ml-2">
            ({images.length}/{mediaCapacity} mídias)
          </span>
        </p>
        <div className="flex bg-zinc-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setViewMode("bento")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "bento"
                ? "bg-white shadow-sm text-wine-700"
                : "text-zinc-500 hover:text-zinc-900",
            )}
            aria-label="Destaque"
            title="Destaque"
          >
            <svg
              className="w-5 h-5"
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
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "grid"
                ? "bg-white shadow-sm text-wine-700"
                : "text-zinc-500 hover:text-zinc-900",
            )}
            aria-label="Grade Instagram"
            title="Grade Instagram"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {viewMode === "bento" ? (
        <div className="space-y-3">
          {images.length > 0 ? (
            <div className="relative group w-full aspect-21/9 rounded-3xl overflow-hidden shadow-sm cursor-pointer bg-zinc-100">
              <Image
                src={resolvedCoverSrc}
                alt={`Foto ${resolvedCoverIndex}`}
                fill
                priority
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 1023px) calc(100vw - 2rem), min(80rem, calc(100vw - 20rem))"
              />

              <MediaRoleBadges isCover isProfile={resolvedProfileIndex === resolvedCoverIndex} />

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

              <button
                type="button"
                aria-label="Abrir foto de capa"
                onClick={() => onPhotoClick(resolvedCoverIndex)}
                className="absolute inset-0 z-10 cursor-pointer"
              />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePhoto(resolvedCoverIndex);
                }}
                className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-700 text-white p-1.5 sm:p-2 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20 shadow-md"
                aria-label="Excluir"
                title="Excluir"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ) : null}

          <div className="columns-2 sm:columns-3 gap-2 sm:gap-3 [column-fill:balance]">
            {galleryItems.map((item) => (
              <div key={item.idx} className="mb-2 sm:mb-3 break-inside-avoid">
                <div
                  className="relative group rounded-2xl overflow-hidden shadow-sm cursor-pointer bg-zinc-100"
                  style={{ aspectRatio: item.ratio }}
                >
                  <Image
                    src={item.src}
                    alt={`Foto ${item.idx}`}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />

                  <MediaRoleBadges
                    isCover={false}
                    isProfile={resolvedProfileIndex === item.idx}
                    compact
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

                  <button
                    type="button"
                    aria-label="Abrir foto"
                    onClick={() => onPhotoClick(item.idx)}
                    className="absolute inset-0 z-10 cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePhoto(item.idx);
                    }}
                    className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-700 text-white p-1.5 sm:p-2 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20 shadow-md"
                    aria-label="Excluir"
                    title="Excluir"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {images.length === 0 && (
              <div className="mb-2 sm:mb-3 break-inside-avoid aspect-4/3 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400">
                Sem fotos
              </div>
            )}

            {canAddMore && (
              <div className="mb-2 sm:mb-3 break-inside-avoid">
                <button
                  type="button"
                  onClick={onAddPhoto}
                  className="relative w-full rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center cursor-pointer hover:border-wine-300 hover:bg-wine-50 hover:text-wine-700 text-zinc-400 transition-all group aspect-square"
                >
                  <svg
                    className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[11px] font-bold uppercase tracking-wider">Add Foto</span>
                </button>
              </div>
            )}

            {Array.from({ length: lockedSlots }).map((_, idx) => (
              <div key={`locked-${idx}`} className="mb-2 sm:mb-3 break-inside-avoid">
                <button
                  type="button"
                  onClick={onUpgradeClick}
                  className="relative w-full aspect-square rounded-2xl border-2 border-dashed border-[#DAA520]/40 bg-zinc-50/60 opacity-70 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-zinc-400 transition-all hover:opacity-100 hover:border-[#DAA520]"
                >
                  <Lock className="w-6 h-6 text-[#DAA520]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#DAA520]">
                    Premium
                  </span>
                </button>
              </div>
            ))}
          </div>

          {atStandardLimit && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#DAA520]/40 bg-[#121212] p-5 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <p className="text-sm font-bold text-[#FFDF00]">
                  Seu portfólio está pronto para crescer
                </p>
                <p className="mt-1 text-xs text-zinc-300">
                  Você usou o limite de 10 fotos e 3 vídeos do Standard. No Premium, a mídia do
                  portfólio fica ilimitada.
                </p>
              </div>
              <ShinyButton size="sm" onClick={onUpgradeClick}>
                Desbloquear o Portfólio Ilimitado
              </ShinyButton>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {images.length > 0 ? (
            <div className="relative group w-full aspect-21/9 rounded-3xl overflow-hidden shadow-sm cursor-pointer bg-zinc-100">
              <Image
                src={resolvedCoverSrc}
                alt={`Foto ${resolvedCoverIndex}`}
                fill
                priority
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 1023px) calc(100vw - 2rem), min(80rem, calc(100vw - 20rem))"
              />
              <MediaRoleBadges isCover isProfile={resolvedProfileIndex === resolvedCoverIndex} />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <svg
                  className="w-6 h-6 text-white"
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
              <button
                type="button"
                aria-label="Abrir foto de capa"
                onClick={() => onPhotoClick(resolvedCoverIndex)}
                className="absolute inset-0 z-10 cursor-pointer"
              />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePhoto(resolvedCoverIndex);
                }}
                className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-700 text-white p-1.5 sm:p-2 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20 shadow-md"
                aria-label="Excluir"
                title="Excluir"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
            {galleryItems.map((item) => (
              <div
                key={item.idx}
                className="relative aspect-square cursor-pointer overflow-hidden group rounded-xl bg-zinc-100"
              >
                <Image
                  src={item.src}
                  alt={`Foto ${item.idx}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 33vw, 200px"
                />
                <MediaRoleBadges
                  isCover={false}
                  isProfile={resolvedProfileIndex === item.idx}
                  compact
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <svg
                    className="w-6 h-6 text-white"
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
                <button
                  type="button"
                  aria-label="Abrir foto"
                  onClick={() => onPhotoClick(item.idx)}
                  className="absolute inset-0 z-10 cursor-pointer"
                />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePhoto(item.idx);
                  }}
                  className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-700 text-white p-1.5 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20 shadow-md"
                  aria-label="Excluir"
                  title="Excluir"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}

            {canAddMore && (
              <button
                type="button"
                onClick={onAddPhoto}
                aria-label="Adicionar foto"
                className="relative aspect-square bg-zinc-50 border border-dashed border-zinc-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-wine-50 text-zinc-400 hover:text-wine-700 hover:border-wine-300 transition-colors"
              >
                <svg
                  className="w-6 h-6 mb-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}

            {Array.from({ length: lockedSlots }).map((_, idx) => (
              <button
                key={`locked-${idx}`}
                type="button"
                onClick={onUpgradeClick}
                className="relative aspect-square rounded-xl border border-dashed border-[#DAA520]/40 bg-zinc-50/60 opacity-70 flex flex-col items-center justify-center gap-1 cursor-pointer text-zinc-400 transition-all hover:opacity-100 hover:border-[#DAA520]"
              >
                <Lock className="w-5 h-5 text-[#DAA520]" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#DAA520]">
                  Premium
                </span>
              </button>
            ))}
          </div>

          {atStandardLimit && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#DAA520]/40 bg-[#121212] p-5 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <p className="text-sm font-bold text-[#FFDF00]">
                  Seu portfólio está pronto para crescer
                </p>
                <p className="mt-1 text-xs text-zinc-300">
                  Você usou o limite de 10 fotos e 3 vídeos do Standard. No Premium, a mídia do
                  portfólio fica ilimitada.
                </p>
              </div>
              <ShinyButton size="sm" onClick={onUpgradeClick}>
                Desbloquear o Portfólio Ilimitado
              </ShinyButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PhotoGalleryModal({
  images,
  activeIndex,
  coverIndex,
  profileIndex,
  onClose,
  onChange,
  onSetCover,
  onSetProfile,
  onEditPhoto,
  onUpdateImage,
  canRevertBlur,
  canRevertEdit,
  onRevertBlur,
  onRevertEdit,
  onDelete,
  onAddPhoto,
}: {
  images: string[];
  activeIndex: number;
  coverIndex: number;
  profileIndex: number | null;
  onClose: () => void;
  onChange: (idx: number) => void;
  onSetCover: (idx: number) => void;
  onSetProfile: (idx: number) => void;
  onEditPhoto: (idx: number, mode: PhotoCropMode) => void;
  onUpdateImage: (idx: number, result: ImageBlurResult) => void;
  canRevertBlur: boolean;
  canRevertEdit: boolean;
  onRevertBlur: (idx: number) => void;
  onRevertEdit: (idx: number) => void;
  onDelete: (idx: number) => void;
  onAddPhoto: () => void;
}) {
  const [isBlurring, setIsBlurring] = useState(false);
  const [roleMenuForIndex, setRoleMenuForIndex] = useState<number | null>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const isSmUp = useSmUp();
  const roleMenuOpen = roleMenuForIndex === activeIndex;
  const isCoverActive = activeIndex === coverIndex;
  const isProfileActive = profileIndex !== null && activeIndex === profileIndex;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    if (!roleMenuOpen || !isSmUp) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!roleMenuRef.current?.contains(event.target as Node)) {
        setRoleMenuForIndex(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isSmUp, roleMenuOpen]);

  const loadImageRatio = async (src: string) => {
    const img = new window.Image();
    img.src = src;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    });
    return img.width / img.height;
  };

  const handleSelectRole = async (role: MediaRole) => {
    setRoleMenuForIndex(null);
    const src = images[activeIndex];
    if (!src) {
      return;
    }

    const alreadyActive = role === "cover" ? isCoverActive : isProfileActive;
    if (alreadyActive) {
      onEditPhoto(activeIndex, role);
      return;
    }

    try {
      const ratio = await loadImageRatio(src);
      const targetAspect = role === "cover" ? 21 / 9 : 3 / 4;

      if (!aspectsMatch(ratio, targetAspect)) {
        onEditPhoto(activeIndex, role);
        return;
      }

      if (role === "cover") {
        onSetCover(activeIndex);
      } else {
        onSetProfile(activeIndex);
      }
    } catch {
      onEditPhoto(activeIndex, role);
    }
  };

  const handleBlurComplete = (result: ImageBlurResult) => {
    setIsBlurring(false);
    onUpdateImage(activeIndex, result);
  };

  const roleOptions = (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        Usar esta mídia como
      </p>
      <button
        type="button"
        data-testid="set-role-cover"
        onClick={() => void handleSelectRole("cover")}
        className={cn(
          "flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors",
          isCoverActive
            ? "bg-zinc-800/80 text-zinc-500"
            : "bg-zinc-800 text-white hover:bg-zinc-700",
        )}
      >
        <span>
          <span className="block text-sm font-bold">Capa do perfil</span>
          <span className="block text-[11px] text-zinc-500">Header · crop 21:9</span>
        </span>
        <span className="text-[10px] font-black uppercase tracking-wider">
          {isCoverActive ? "Definido" : "Escolher"}
        </span>
      </button>
      <button
        type="button"
        data-testid="set-role-profile"
        onClick={() => void handleSelectRole("profile")}
        className={cn(
          "flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors",
          isProfileActive
            ? "bg-zinc-800/80 text-zinc-500"
            : "bg-zinc-800 text-white hover:bg-zinc-700",
        )}
      >
        <span>
          <span className="block text-sm font-bold">Foto de perfil (feed)</span>
          <span className="block text-[11px] text-zinc-500">Card do feed · crop 3:4</span>
        </span>
        <span className="text-[10px] font-black uppercase tracking-wider">
          {isProfileActive ? "Definido" : "Escolher"}
        </span>
      </button>
      {isCoverActive && !isProfileActive ? (
        <p className="px-1 text-[11px] leading-snug text-zinc-500">
          Capa já usa esta foto. Pode definir também como perfil (crops separados).
        </p>
      ) : null}
      {isProfileActive && !isCoverActive ? (
        <p className="px-1 text-[11px] leading-snug text-zinc-500">
          Perfil já usa esta foto. Pode definir também como capa (crops separados).
        </p>
      ) : null}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-[110] h-dvh bg-black flex flex-col items-center justify-center backdrop-blur-sm">
        <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-start gap-3 sm:gap-4 z-20 bg-linear-to-b from-black/90 via-black/40 to-transparent">
          <div className="grid flex-1 min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center pointer-events-auto">
            <div className="col-span-1 flex flex-col gap-2 sm:contents">
              {canRevertBlur && (
                <button
                  onClick={() => onRevertBlur(activeIndex)}
                  className="inline-flex h-9 sm:h-10 w-full sm:w-auto items-center justify-center gap-2 px-4 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 backdrop-blur-md rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all border border-emerald-500/30 shadow-lg"
                  title="Reverter apenas o borrão aplicado"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                  <span className="hidden sm:inline">Desfazer Borrão</span>
                  <span className="sm:hidden">Desf. Borrão</span>
                </button>
              )}

              <button
                onClick={() => setIsBlurring(true)}
                className="inline-flex h-9 sm:h-10 w-full sm:w-auto items-center justify-center gap-2 px-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all border border-white/20 shadow-lg"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 0 016 0z"
                  />
                </svg>
                <span className="hidden sm:inline">Borrar Detalhes</span>
                <span className="sm:hidden">Borrar</span>
              </button>
            </div>

            <div className="col-span-1 flex flex-col gap-2 sm:contents">
              {canRevertEdit && (
                <button
                  onClick={() => onRevertEdit(activeIndex)}
                  className="inline-flex h-9 sm:h-10 w-full sm:w-auto items-center justify-center gap-2 px-4 bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 backdrop-blur-md rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all border border-sky-500/30 shadow-lg"
                  title="Reverter apenas o recorte/enquadramento"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                  <span className="hidden sm:inline">Desfazer Enquadramento</span>
                  <span className="sm:hidden">Desf. Enquad.</span>
                </button>
              )}

              <button
                onClick={() => onEditPhoto(activeIndex, "edit")}
                className="inline-flex h-9 sm:h-10 w-full sm:w-auto items-center justify-center gap-2 px-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all border border-white/20 shadow-lg"
                title="Editar enquadramento"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Editar Enquadramento</span>
                <span className="sm:hidden">Editar</span>
              </button>
            </div>

            <div ref={roleMenuRef} className="relative col-span-2 sm:col-span-1">
              <button
                type="button"
                data-testid="define-as-role-trigger"
                onClick={() =>
                  setRoleMenuForIndex((current) => (current === activeIndex ? null : activeIndex))
                }
                className={cn(
                  "inline-flex h-9 sm:h-10 w-full sm:w-auto items-center justify-center gap-2 px-4 backdrop-blur-md rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all border shadow-lg",
                  roleMenuOpen
                    ? "bg-white/20 border-white/40 text-white"
                    : "bg-white/10 hover:bg-white/20 border-white/20 text-white",
                )}
                title="Definir papel da mídia"
                aria-expanded={roleMenuOpen}
              >
                <span>Definir como…</span>
                <ChevronDown
                  className={cn("w-4 h-4 transition-transform", roleMenuOpen && "rotate-180")}
                />
              </button>

              {roleMenuOpen && isSmUp ? (
                <div
                  data-testid="define-as-role-popover"
                  className="absolute left-0 top-full z-30 mt-2 min-w-[280px] rounded-2xl border border-white/10 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-md"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-white">Definir como…</p>
                    <button
                      type="button"
                      data-testid="define-as-role-close"
                      onClick={() => setRoleMenuForIndex(null)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/90 transition-colors hover:bg-white/20 hover:text-white"
                      aria-label="Fechar"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  {roleOptions}
                </div>
              ) : null}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all shrink-0 pointer-events-auto border border-white/10"
            aria-label="Fechar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {roleMenuOpen && !isSmUp ? (
          <div className="absolute inset-0 z-50 flex flex-col justify-end">
            <button
              type="button"
              className="absolute inset-0 bg-black/60"
              aria-label="Fechar menu"
              onClick={() => setRoleMenuForIndex(null)}
            />
            <div
              data-testid="define-as-role-sheet"
              className="relative rounded-t-3xl border-t border-white/10 bg-zinc-950 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700" />
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-white">Definir como…</p>
                <button
                  type="button"
                  data-testid="define-as-role-close"
                  onClick={() => setRoleMenuForIndex(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/90 transition-colors hover:bg-white/20 hover:text-white"
                  aria-label="Fechar"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {roleOptions}
            </div>
          </div>
        ) : null}

        <div className="relative w-full max-w-5xl flex-1 px-4 mt-24 mb-4 min-h-0 flex items-center justify-center">
          <div className="relative max-w-full max-h-full inline-block">
            <MediaRoleBadges isCover={isCoverActive} isProfile={isProfileActive} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[activeIndex]}
              alt="Fullscreen"
              className="block w-auto h-auto max-w-full max-h-full object-contain"
              style={{ maxHeight: "calc(100dvh - 240px)" }}
            />
          </div>
        </div>

        <div className="w-full max-w-5xl px-4 shrink-0 pb-safe mb-6">
          <div className="flex gap-3 overflow-x-auto px-1 py-2 pb-4 hide-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none snap-x scroll-smooth">
            {images.map((img, i) => (
              <div key={i} className="relative shrink-0 group snap-center">
                <button
                  onClick={() => onChange(i)}
                  className={cn(
                    "relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden transition-all block",
                    i === activeIndex
                      ? "outline-2 outline-offset-2 outline-wine-500 opacity-100 z-10 shadow-lg"
                      : "opacity-60 hover:opacity-100",
                  )}
                >
                  <Image
                    src={img}
                    fill
                    className="object-cover"
                    alt={`Thumb ${i}`}
                    sizes="(max-width: 640px) 80px, 96px"
                  />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(i);
                  }}
                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all z-20 shadow-md border border-white/20"
                  aria-label="Excluir"
                  title="Excluir"
                >
                  <svg
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}

            {images.length < 20 && (
              <button
                onClick={onAddPhoto}
                className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-2 border-dashed border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center snap-center transition-all text-white/50 hover:text-white group"
              >
                <svg
                  className="w-6 h-6 mb-1 sm:mb-2 group-hover:scale-110 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                  Mídia
                </span>
              </button>
            )}

            <div className="w-2 sm:w-4 shrink-0" />
          </div>
        </div>
      </div>

      {isBlurring && (
        <ImageBlurModal
          imageSrc={images[activeIndex]}
          onClose={() => setIsBlurring(false)}
          onBlurComplete={handleBlurComplete}
        />
      )}
    </>
  );
}

// ─── Inputs de Formulário e Seções Base ───────────────────────────

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full bg-zinc-50/50 border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-wine-500 focus:border-wine-500 focus:bg-white outline-none transition-all disabled:opacity-50",
          invalid ? "border-red-400 ring-1 ring-red-200" : "border-zinc-200",
        )}
      />
    </div>
  );
}

function HairTypeAndColorField({
  value,
  onChange,
  invalid,
}: {
  value: string;
  onChange: (nextValue: string) => void;
  invalid?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selection = parseHairSelection(value);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;

      if (target?.closest('[data-ui-select-floating-panel="true"]')) {
        return;
      }

      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, []);

  const updateSelection = (nextSelection: { type: string; color: string }) => {
    onChange(serializeHairSelection(nextSelection.type, nextSelection.color));
  };

  const summary = formatHairSelectionSummary(value);

  return (
    <div ref={rootRef} className="space-y-1.5">
      <h3 className="block text-[11px] font-black uppercase tracking-widest text-zinc-500">
        Tipo e Cor do Cabelo
      </h3>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm shadow-sm transition-all",
          invalid
            ? "border-red-400 ring-1 ring-red-200"
            : "border-zinc-200 hover:border-wine-300 focus:border-wine-500 focus:outline-none focus:ring-2 focus:ring-wine-200",
        )}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span
          className={cn(
            "truncate",
            isHairSelectionComplete(value) ? "text-zinc-900" : "text-zinc-500",
          )}
        >
          {summary}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-500 transition-transform",
            isOpen && "rotate-180",
          )}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 shadow-sm">
          <div className="grid grid-cols-1 gap-3">
            <Select
              label="Tipo"
              id="hairType"
              options={HAIR_TYPE_OPTIONS.map((option) => ({ label: option, value: option }))}
              value={selection.type}
              onChange={(event) => updateSelection({ ...selection, type: event.target.value })}
              premium
            />
            <Select
              label="Cor"
              id="hairColorTone"
              options={HAIR_COLOR_OPTIONS.map((option) => ({ label: option, value: option }))}
              value={selection.color}
              onChange={(event) => updateSelection({ ...selection, color: event.target.value })}
              premium
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Seções Específicas ──────────────────────────────────────────

function CharacteristicsSection({
  characteristics: c,
  onUpdate,
  invalidFields,
  errorMessage,
  isShaking,
}: {
  characteristics: AnnouncementCharacteristics;
  onUpdate: (key: keyof AnnouncementCharacteristics, value: string) => void;
  invalidFields: Array<keyof AnnouncementCharacteristics>;
  errorMessage: string | null;
  isShaking: boolean;
}) {
  const isInvalid = (key: keyof AnnouncementCharacteristics) => invalidFields.includes(key);

  return (
    <div
      className={cn(
        "space-y-4 rounded-xl border p-4",
        errorMessage ? "border-red-300 bg-red-50/30" : "border-zinc-200",
      )}
      style={isShaking ? { animation: "characteristics-shake 420ms ease-in-out" } : undefined}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div>
          <Select
            label="Gênero"
            id="gender"
            options={GENDER_OPTIONS.map((o) => ({ label: o, value: o }))}
            value={c.gender}
            onChange={(e) => onUpdate("gender", e.target.value)}
            className={cn(isInvalid("gender") && "border-red-400 ring-1 ring-red-200")}
          />
          {isInvalid("gender") && <p className="mt-1 text-xs text-red-500">Selecione uma opção.</p>}
        </div>

        <div>
          <Select
            label="Etnia"
            id="ethnicity"
            options={ETHNICITY_OPTIONS}
            value={c.ethnicity}
            onChange={(e) => onUpdate("ethnicity", e.target.value)}
            className={cn(isInvalid("ethnicity") && "border-red-400 ring-1 ring-red-200")}
          />
          {isInvalid("ethnicity") && (
            <p className="mt-1 text-xs text-red-500">Selecione uma opção.</p>
          )}
        </div>

        <FormInput
          label="Altura (cm)"
          value={formatHeightInput(c.height)}
          onChange={(v) => onUpdate("height", formatHeightInput(v))}
          placeholder="Ex: 170"
          invalid={isInvalid("height")}
        />
        <FormInput
          label="Peso (kg)"
          value={formatWeightInput(c.weight)}
          onChange={(v) => onUpdate("weight", v)}
          placeholder="Ex: 60"
          invalid={isInvalid("weight")}
        />

        <div>
          <HairTypeAndColorField
            value={c.hairColor}
            onChange={(nextValue) => onUpdate("hairColor", nextValue)}
            invalid={isInvalid("hairColor")}
          />
          {isInvalid("hairColor") && (
            <p className="mt-1 text-xs text-red-500">Selecione uma opção.</p>
          )}
        </div>

        <div>
          <Select
            label="Fumante"
            id="smoker"
            options={SMOKER_OPTIONS.map((o) => ({ label: o, value: o }))}
            value={c.smoker}
            onChange={(e) => onUpdate("smoker", e.target.value)}
            className={cn(isInvalid("smoker") && "border-red-400 ring-1 ring-red-200")}
          />
          {isInvalid("smoker") && <p className="mt-1 text-xs text-red-500">Selecione uma opção.</p>}
        </div>
      </div>

      {errorMessage && <p className="text-sm font-semibold text-red-700">{errorMessage}</p>}

      <style jsx>{`
        @keyframes characteristics-shake {
          0% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-8px);
          }
          40% {
            transform: translateX(8px);
          }
          60% {
            transform: translateX(-6px);
          }
          80% {
            transform: translateX(6px);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

function PricingSection({
  pricing,
  paymentMethods = [],
  onUpdate,
  onToggleDisabled,
  onToggleMethod,
  errorMessage,
  isShaking,
}: {
  pricing: Array<AnnouncementPricingItem & { isCustom?: boolean }>;
  paymentMethods?: string[];
  onUpdate: (idx: number, field: string, value: string | number) => void;
  onToggleDisabled: (idx: number) => void;
  onToggleMethod: (methodId: string) => void;
  errorMessage?: string | null;
  isShaking?: boolean;
}) {
  const paymentOptions = [
    { id: "pix", label: "Pix", icon: PixIcon },
    { id: "dinheiro", label: "Dinheiro", icon: CashIcon },
    { id: "debito", label: "Débito", icon: CreditCard },
    { id: "credito", label: "Crédito", icon: CreditCard },
  ];

  const getSelectedPaymentStyles = (methodId: string) => {
    if (methodId === "dinheiro") {
      return {
        button: "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm",
        icon: "border-emerald-200 text-emerald-600",
      };
    }
    if (methodId === "pix") {
      return {
        button: "bg-teal-50 border-teal-500 text-teal-700 shadow-sm",
        icon: "border-teal-200 text-teal-600",
      };
    }
    if (methodId === "credito" || methodId === "debito") {
      return {
        button: "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm",
        icon: "border-indigo-200 text-indigo-600",
      };
    }

    return {
      button: "bg-wine-50 border-wine-500 text-wine-700 shadow-sm",
      icon: "border-wine-200 text-wine-600",
    };
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {pricing.map((item, idx: number) => {
          const isPrimary = idx === 0;
          const billingType = resolvePricingBillingType(item);

          return (
            <div
              key={`${item.label}-${billingType}-${idx}`}
              className={cn(
                "rounded-xl border p-4 sm:p-5 transition-all",
                item.disabled && !isPrimary
                  ? "bg-zinc-50 border-zinc-200"
                  : "bg-white border-zinc-200 shadow-sm",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-50 rounded-lg flex items-center justify-center border border-zinc-200 shrink-0">
                    {isPrimary ? (
                      <Lock className="h-5 w-5 text-wine-700" />
                    ) : billingType === "hourly" ? (
                      <Clock3 className="h-5 w-5 text-wine-700" />
                    ) : (
                      <BadgeDollarSign className="h-5 w-5 text-wine-700" />
                    )}
                  </div>
                  <p className="truncate font-bold text-zinc-900">{item.label}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:gap-2">
                  <div className="flex min-w-0 flex-1 items-center bg-zinc-50 rounded-lg px-3 py-2 border border-zinc-200 focus-within:border-wine-500 focus-within:ring-1 focus-within:ring-wine-500">
                    <span className="text-sm font-bold text-zinc-400 mr-2">R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrencyInput(item.price)}
                      disabled={item.disabled && !isPrimary}
                      onChange={(e) => onUpdate(idx, "price", e.target.value)}
                      className={cn(
                        "w-full bg-transparent font-bold outline-none placeholder:text-zinc-300",
                        item.disabled && !isPrimary ? "text-zinc-400" : "text-zinc-900",
                      )}
                      placeholder="0,00"
                    />
                  </div>

                  {isPrimary ? (
                    <div
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-wine-200 bg-wine-50 text-wine-700"
                      aria-label="Serviço bloqueado"
                    >
                      <Lock className="h-4 w-4" />
                    </div>
                  ) : (
                    <Switch
                      checked={!item.disabled}
                      onCheckedChange={() => onToggleDisabled(idx)}
                      disabled={false}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-100">
        <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-3">
          Formas de pagamento aceita:
        </p>
        <div
          className={cn(
            "bg-zinc-50/50 rounded-2xl p-4 grid grid-cols-2 gap-3 border transition-all",
            errorMessage ? "border-red-300 bg-red-50/30" : "border-transparent",
          )}
          style={isShaking ? { animation: "pricing-shake 420ms ease-in-out" } : undefined}
        >
          {paymentOptions.map((option) => {
            const isSelected = paymentMethods.includes(option.id);
            const Icon = option.icon;
            const selectedStyles = getSelectedPaymentStyles(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onToggleMethod(option.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 w-full px-3 py-3 rounded-xl border transition-all cursor-pointer",
                  isSelected
                    ? selectedStyles.button
                    : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm border",
                    isSelected ? selectedStyles.icon : "border-zinc-100 text-zinc-400",
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold tracking-wide">{option.label}</span>
              </button>
            );
          })}
        </div>
        {errorMessage && <p className="text-sm font-semibold text-red-700 mt-2">{errorMessage}</p>}
      </div>

      <style jsx>{`
        @keyframes pricing-shake {
          0% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-8px);
          }
          40% {
            transform: translateX(8px);
          }
          60% {
            transform: translateX(-6px);
          }
          80% {
            transform: translateX(6px);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

function LocationSection({
  addresses,
  activeLocation,
  highlightedLocationId,
  onDetectLocation,
  onAddLocation,
  onEditLocation,
  onToggleActive,
  onToggleTravel,
  acceptsTravel,
  removingLocationId,
  canAddLocation,
  locationStatusMessage,
  locationStatusTone,
  suppressErrorOverlay,
}: {
  addresses: AnnouncementLocationAddress[];
  activeLocation: AnnouncementLocationAddress | null;
  highlightedLocationId: string | null;
  onDetectLocation: () => void;
  onAddLocation: () => void;
  onEditLocation: (location: AnnouncementLocationAddress) => void;
  onToggleActive: (locationId: string) => void;
  onToggleTravel: (enabled: boolean) => void;
  acceptsTravel: boolean;
  removingLocationId: string | null;
  canAddLocation: boolean;
  locationStatusMessage: string | null;
  locationStatusTone: LocationStatusTone;
  suppressErrorOverlay: boolean;
}) {
  const activeSummary = activeLocation
    ? formatLocationSummary(activeLocation)
    : "Nenhum endereço ativo no momento.";
  const [showSelectionWarning, setShowSelectionWarning] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!showSelectionWarning) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setShowSelectionWarning(false);
    }, GROUP_WARNING_AUTO_DISMISS_MS);

    return () => clearTimeout(timeoutId);
  }, [showSelectionWarning]);

  const statusStyles = {
    success: {
      container: "border-emerald-200 bg-emerald-50/95 text-emerald-900",
      iconWrap: "bg-emerald-100 text-emerald-700",
      iconPath: "M5 13l4 4L19 7",
    },
    error: {
      container: "border-red-200 bg-red-50/95 text-red-900",
      iconWrap: "bg-red-100 text-red-700",
      iconPath: "M12 8v4m0 4h.01",
    },
    info: {
      container: "border-zinc-300 bg-white/95 text-zinc-900",
      iconWrap: "bg-zinc-100 text-zinc-700",
      iconPath: "M12 16v-4m0-4h.01",
    },
  } as const;

  const handleToggleActive = (locationId: string, isCurrentlyActive: boolean) => {
    if (isCurrentlyActive) {
      setShowSelectionWarning(true);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 420);
      return;
    }

    setShowSelectionWarning(false);
    onToggleActive(locationId);
  };

  return (
    <div className="relative space-y-5">
      {locationStatusMessage && !suppressErrorOverlay ? (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
          <div
            className={cn(
              "w-full max-w-sm rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur-sm",
              statusStyles[locationStatusTone].container,
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  statusStyles[locationStatusTone].iconWrap,
                )}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={statusStyles[locationStatusTone].iconPath}
                  />
                </svg>
              </span>
              <p className="leading-relaxed">{locationStatusMessage}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "rounded-2xl border p-4 sm:p-5 transition-all",
          acceptsTravel
            ? "border-wine-200 bg-wine-50/70 shadow-sm"
            : "border-zinc-200 bg-white opacity-75",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p
              className={cn(
                "text-[11px] font-black uppercase tracking-[0.24em]",
                acceptsTravel ? "text-wine-700" : "text-zinc-500",
              )}
            >
              Aceito me deslocar
            </p>
            <p className={cn("text-sm", acceptsTravel ? "text-zinc-700" : "text-zinc-500")}>
              Ative para informar no anúncio que você também atende fora do endereço ativo.
            </p>
          </div>
          <Switch
            checked={acceptsTravel}
            onCheckedChange={onToggleTravel}
            aria-label="Aceita deslocamento"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">
            Endereço ativo
          </p>
          <p className="mt-1 text-sm text-zinc-700">{activeSummary}</p>
        </div>
        <button
          type="button"
          onClick={onDetectLocation}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-wine-200 bg-wine-50 px-3.5 py-2 text-sm font-bold text-wine-700 transition hover:bg-wine-100"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Detectar localização atual
        </button>
      </div>

      <div
        className="space-y-3"
        style={isShaking ? { animation: "location-shake 420ms ease-in-out" } : undefined}
      >
        {addresses.length > 0 ? (
          addresses.map((location) => {
            const isHighlighted = highlightedLocationId === location.id;
            const isRemoving = removingLocationId === location.id;

            return (
              <div
                key={location.id}
                className={cn(
                  "rounded-2xl border p-4 transition-all duration-200",
                  location.active
                    ? "border-wine-200 bg-wine-50/70 shadow-sm"
                    : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm",
                  isHighlighted && "ring-2 ring-zinc-300 animate-pulse",
                  isRemoving && "opacity-0 scale-[0.98] -translate-y-1",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-sm font-bold text-zinc-900">{location.label}</h4>
                      {location.active ? (
                        <span className="rounded-full bg-wine-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-wine-700">
                          Ativo
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                          Inativa
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-600">{formatLocationSummary(location)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditLocation(location)}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                    >
                      Editar
                    </button>
                    <Switch
                      checked={location.active}
                      onCheckedChange={() => handleToggleActive(location.id, location.active)}
                      aria-label={`Ativar ${location.label}`}
                    />
                  </div>
                </div>

                {location.addressLine ? (
                  <p className="mt-3 text-xs text-zinc-500">{location.addressLine}</p>
                ) : null}

                {isHighlighted ? (
                  <div className="mt-3 rounded-xl border border-zinc-300 bg-zinc-100/80 px-3 py-2 text-xs font-semibold text-zinc-700">
                    Este endereço foi selecionado agora.
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/60 p-5 text-sm text-zinc-600">
            Você ainda não cadastrou endereços de atendimento.
          </div>
        )}
      </div>

      {showSelectionWarning ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          Ao menos um endereço deve permanecer ativo no grupo obrigatório.
        </p>
      ) : null}

      <button
        type="button"
        onClick={onAddLocation}
        disabled={!canAddLocation}
        className={cn(
          "w-full rounded-2xl border-2 border-dashed px-4 py-4 text-sm font-bold transition",
          canAddLocation
            ? "border-zinc-300 bg-white text-zinc-600 hover:border-wine-300 hover:bg-wine-50 hover:text-wine-700"
            : "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400",
        )}
      >
        {canAddLocation
          ? "Cadastrar novo endereço"
          : `Limite de ${MAX_LOCATION_ADDRESSES} endereços atingido`}
      </button>

      <style jsx>{`
        @keyframes location-shake {
          0% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-8px);
          }
          40% {
            transform: translateX(8px);
          }
          60% {
            transform: translateX(-6px);
          }
          80% {
            transform: translateX(6px);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

function LocationDecisionModal({
  activeLocation,
  detectedLocation,
  onClose,
  onConfirm,
}: {
  activeLocation: AnnouncementLocationAddress | null;
  detectedLocation: DetectedLocation;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open
      title="Alterar localização ativa?"
      description="Detectamos uma localização diferente da ativa no seu dispositivo. Você deseja trocar agora?"
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Agora não
          </Button>
          <Button fullWidth onClick={onConfirm}>
            Sim, alterar
          </Button>
        </>
      }
      size="md"
    >
      <div className="space-y-3">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">
            Endereço ativo atual
          </p>
          <p className="mt-2 text-sm font-semibold text-zinc-900">
            {activeLocation ? formatLocationSummary(activeLocation) : "Nenhum endereço ativo"}
          </p>
        </div>
        <div className="rounded-2xl border border-wine-200 bg-wine-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-wine-700">
            Localização detectada
          </p>
          <p className="mt-2 text-sm font-semibold text-wine-950">{detectedLocation.label}</p>
          <p className="mt-1 text-sm text-wine-900/80">
            {detectedLocation.addressLine ||
              detectedLocation.displayName ||
              `${detectedLocation.city}${detectedLocation.state ? `, ${detectedLocation.state}` : ""}`}
          </p>
        </div>
      </div>
    </Modal>
  );
}

function LocationDraftModal({
  draft,
  locationStatusMessage,
  locationStatusTone,
  onClose,
  onChange,
  onConfirm,
  onDelete,
  onDetectLocation,
  isEditing,
}: {
  draft: LocationDraft;
  locationStatusMessage: string | null;
  locationStatusTone: LocationStatusTone;
  onClose: () => void;
  onChange: (draft: LocationDraft) => void;
  onConfirm: () => void;
  onDelete: () => void;
  onDetectLocation: () => Promise<void> | void;
  isEditing: boolean;
}) {
  const canSave =
    draft.city.trim().length > 0 &&
    draft.state.trim().length > 0 &&
    draft.country.trim().length > 0;

  return (
    <Modal
      open
      title={isEditing ? "Editar endereço de atendimento" : "Cadastrar novo endereço"}
      description="Preencha os campos abaixo ou use a detecção automática para ajustar os dados do local."
      onClose={onClose}
      size="md"
      mobileCentered
      actions={
        <>
          {isEditing ? (
            <Button variant="secondary" fullWidth onClick={onDelete}>
              Excluir endereço
            </Button>
          ) : (
            <Button variant="secondary" fullWidth onClick={onClose}>
              Cancelar
            </Button>
          )}
          <Button fullWidth onClick={onConfirm} disabled={!canSave}>
            Salvar endereço
          </Button>
        </>
      }
    >
      <div className="space-y-3 sm:space-y-4">
        {locationStatusMessage ? (
          <div
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-semibold",
              locationStatusTone === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : locationStatusTone === "error"
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : "border border-zinc-200 bg-zinc-50 text-zinc-700",
            )}
          >
            {locationStatusMessage}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900">Preenchimento automático</p>
            <p className="text-sm leading-snug text-zinc-600">
              Se quiser, detecte a localização atual e ajuste os campos em seguida.
            </p>
          </div>
          <button
            type="button"
            onClick={onDetectLocation}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-wine-200 bg-white px-3.5 py-2.5 text-sm font-bold text-wine-700 transition hover:bg-wine-50 sm:w-auto"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Detectar automaticamente
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <FormInput
            label="Nome do endereço"
            value={draft.label}
            onChange={(value) => onChange({ ...draft, label: value })}
            placeholder="Ex: Atendimento premium"
          />
          <FormInput
            label="País"
            value={draft.country}
            onChange={(value) => onChange({ ...draft, country: value })}
            placeholder="Ex: Brasil"
          />
          <FormInput
            label="Bairro"
            value={draft.addressLine}
            onChange={(value) => onChange({ ...draft, addressLine: value })}
            placeholder="Rua, bairro, hotel ou referência"
          />
          <FormInput
            label="Cidade"
            value={draft.city}
            onChange={(value) => onChange({ ...draft, city: sanitizeCityInput(value) })}
            placeholder="Ex: São Paulo"
          />
          <FormInput
            label="Estado"
            value={draft.state}
            onChange={(value) =>
              onChange({
                ...draft,
                state: value
                  .replace(/[^A-Za-z]/g, "")
                  .toUpperCase()
                  .slice(0, 2),
              })
            }
            placeholder="Ex: SP"
          />
          <FormInput
            label="Observações"
            value={draft.notes}
            onChange={(value) => onChange({ ...draft, notes: value })}
            placeholder="Opcional"
          />
        </div>
      </div>
    </Modal>
  );
}

function DescriptionSection({
  shortDescription,
  description,
  onShortDescChange,
  onDescChange,
}: {
  shortDescription: string;
  description: string;
  onShortDescChange: (value: string) => void;
  onDescChange: (value: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const headlineId = useId();
  const narrativeId = useId();
  const [isFocused, setIsFocused] = useState(false);

  // Sync initial description to editor content (only once or when externally changed significantly)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== description) {
      const html = description
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
        .replace(/_(.*?)_/g, "<i>$1</i>")
        .replace(/~(.*?)~/g, "<u>$1</u>")
        .replace(/\n- (.*)/g, "<li>$1</li>")
        .replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>");

      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount to avoid cursor issues

  const handleInput = () => {
    if (editorRef.current) {
      onDescChange(editorRef.current.innerHTML);
    }
  };

  const applyFormat = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onDescChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor={headlineId}
          className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2"
        >
          Resumo em uma frase (Headline)
        </label>
        <input
          id={headlineId}
          type="text"
          value={shortDescription}
          onChange={(e) => onShortDescChange(e.target.value)}
          placeholder="Ex: Atendimento discreto com experiência premium..."
          maxLength={150}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-wine-700 focus:ring-2 focus:ring-wine-700 outline-none transition-all"
        />
      </div>
      <div>
        <span
          id={narrativeId}
          className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2"
        >
          Narrativa Profissional Completa
        </span>
        <div className="mb-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 p-1.5">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              applyFormat("bold");
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-xs font-black text-zinc-700 hover:border-wine-300 hover:text-wine-700 focus:ring-2 focus:ring-wine-200"
            title="Negrito"
          >
            B
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              applyFormat("italic");
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-xs font-black italic text-zinc-700 hover:border-wine-300 hover:text-wine-700 focus:ring-2 focus:ring-wine-200"
            title="Itálico"
          >
            I
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              applyFormat("underline");
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-xs font-black underline text-zinc-700 hover:border-wine-300 hover:text-wine-700 focus:ring-2 focus:ring-wine-200"
            title="Sublinhado"
          >
            U
          </button>
          <div className="mx-1 h-4 w-px bg-zinc-300" />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              applyFormat("insertUnorderedList");
            }}
            className="flex h-8 px-2 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white text-[10px] font-bold text-zinc-700 hover:border-wine-300 hover:text-wine-700 focus:ring-2 focus:ring-wine-200"
            title="Lista com Marcadores"
          >
            • Lista
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              applyFormat("insertOrderedList");
            }}
            className="flex h-8 px-2 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white text-[10px] font-bold text-zinc-700 hover:border-wine-300 hover:text-wine-700 focus:ring-2 focus:ring-wine-200"
            title="Lista Numerada"
          >
            1. Lista
          </button>
          <div className="mx-1 h-4 w-px bg-zinc-300" />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              applyFormat("undo");
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:border-wine-300 hover:text-wine-700 focus:ring-2 focus:ring-wine-200"
            title="Desfazer"
          >
            <Undo className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              applyFormat("redo");
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:border-wine-300 hover:text-wine-700 focus:ring-2 focus:ring-wine-200"
            title="Avançar"
          >
            <Redo className="h-3.5 w-3.5" />
          </button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "w-full min-h-40 rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm outline-none transition-all prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-0.5",
            isFocused && "border-wine-700 ring-2 ring-wine-700 bg-white",
          )}
          style={{ wordBreak: "break-word" }}
          role="textbox"
          aria-multiline="true"
          aria-labelledby={narrativeId}
        />
        <p className="mt-1 text-right text-[10px] text-zinc-400">
          {description.replace(/<[^>]*>/g, "").length} / 1000 caracteres
        </p>
      </div>
    </div>
  );
}

function ServicesSection({
  services,
  onToggle,
}: {
  services: AnnouncementServiceOption[];
  onToggle: (idx: number) => void;
}) {
  return (
    <div className="max-h-84 overflow-y-auto pr-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {services.map((svc, idx: number) => (
          <button
            key={svc.label}
            onClick={() => onToggle(idx)}
            className={cn(
              "flex items-center justify-between p-4 rounded-xl border text-left transition-all",
              svc.selected
                ? "border-wine-500 bg-wine-50/50 shadow-sm"
                : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100",
            )}
          >
            <span
              className={cn("text-sm font-bold", svc.selected ? "text-wine-900" : "text-zinc-600")}
            >
              {svc.label}
            </span>
            <div
              className={cn(
                "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                svc.selected
                  ? "bg-wine-700 border-wine-700 text-white"
                  : "border-zinc-300 bg-white",
              )}
            >
              {svc.selected && (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AvailabilitySection({
  showAvailability,
  availability,
  onToggleShow,
  onDayToggle,
  onTimeChange,
}: {
  showAvailability: boolean;
  availability: AvailabilityDay[];
  onToggleShow: (value: boolean) => void;
  onDayToggle: (idx: number, enabled: boolean) => void;
  onTimeChange: (idx: number, field: "start" | "end", value: string) => void;
}) {
  const showAvailabilityId = useId();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-5 rounded-xl border border-zinc-200 bg-zinc-50/50">
        <label htmlFor={showAvailabilityId} className="cursor-pointer">
          <span className="text-base font-bold text-zinc-900 block">
            Exibir grade de horários pública
          </span>
          <span className="text-xs text-zinc-500">
            Deixe os clientes saberem exatamente quando você atende.
          </span>
        </label>
        <Switch
          id={showAvailabilityId}
          checked={showAvailability}
          onCheckedChange={(checked) => onToggleShow(checked)}
        />
      </div>

      {showAvailability && (
        <div className="grid grid-cols-1 gap-2.5">
          {availability.map((entry, idx: number) => (
            <div
              key={entry.day}
              className={cn(
                "flex items-center justify-between gap-2 sm:gap-3 rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 transition-all w-full",
                entry.enabled
                  ? "bg-white border-zinc-200 shadow-sm"
                  : "bg-zinc-50 border-zinc-100 opacity-60",
              )}
            >
              <div className="flex items-center gap-2.5 sm:gap-4 min-w-20 sm:w-28 shrink-0">
                <Switch
                  checked={entry.enabled}
                  onCheckedChange={(checked) => onDayToggle(idx, checked)}
                />
                <span className="text-xs sm:text-sm font-black text-zinc-700">{entry.day}</span>
              </div>

              <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1">
                <input
                  type="text"
                  value={entry.start}
                  disabled={!entry.enabled}
                  onChange={(e) => onTimeChange(idx, "start", e.target.value)}
                  className="w-14 sm:w-20 text-center border border-zinc-200 bg-zinc-50 rounded-md sm:rounded-lg text-xs sm:text-sm font-bold py-2 sm:py-2.5 focus:border-wine-500 outline-none disabled:opacity-50"
                />
                <span className="text-zinc-400 text-xs sm:text-sm font-bold">às</span>
                <input
                  type="text"
                  value={entry.end}
                  disabled={!entry.enabled}
                  onChange={(e) => onTimeChange(idx, "end", e.target.value)}
                  className="w-14 sm:w-20 text-center border border-zinc-200 bg-zinc-50 rounded-md sm:rounded-lg text-xs sm:text-sm font-bold py-2 sm:py-2.5 focus:border-wine-500 outline-none disabled:opacity-50"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PublishIndicator({
  status,
  lastSavedAt,
  isPublishing,
}: {
  status: "idle" | "saving" | "saved" | "error";
  lastSavedAt: Date | null;
  isPublishing: boolean;
}) {
  if (isPublishing || status === "saving")
    return (
      <>
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>{" "}
        Publicando
      </>
    );
  if (status === "saved")
    return (
      <>
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>{" "}
        Publicado
      </>
    );
  if (status === "error") return <span>Publicar</span>;
  if (!lastSavedAt) return <span>Publicar</span>;
  return <span>Publicar</span>;
}

function ProfileScoreBar({
  score,
  onOptimizeNow,
}: {
  score: { percentage: number };
  onOptimizeNow: () => void;
}) {
  const barColor =
    score.percentage >= 80
      ? "bg-emerald-500"
      : score.percentage >= 50
        ? "bg-amber-500"
        : "bg-red-400";
  const textColor =
    score.percentage >= 80
      ? "text-emerald-700"
      : score.percentage >= 50
        ? "text-amber-700"
        : "text-red-600";

  return (
    <div className="space-y-2.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-wine-700">
        Índice de Qualidade
      </span>
      <h3 className="text-xl font-bold text-zinc-900 leading-tight">Força do Perfil</h3>
      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", barColor)}
          style={{ width: `${score.percentage}%` }}
        />
      </div>
      <div className="flex justify-between items-center text-[10px] font-bold">
        <span className={cn("uppercase tracking-wider", textColor)}>
          {score.percentage}% Completo
        </span>
        <button
          type="button"
          onClick={onOptimizeNow}
          className="text-wine-700 cursor-pointer hover:underline uppercase"
        >
          Otimizar Agora
        </button>
      </div>
    </div>
  );
}
