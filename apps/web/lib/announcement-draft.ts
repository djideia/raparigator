"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AnnouncementAdPreview,
  AnnouncementCharacteristics,
  AnnouncementDraftState,
  AnnouncementPricingItem,
  AnnouncementPublishResult,
  AnnouncementSaveResult,
  AnnouncementSaveSectionResult,
  AnnouncementSaveStatus,
  AnnouncementSectionDirtyState,
  AnnouncementSectionKey,
  AnnouncementSectionSnapshots,
  AnnouncementServiceOption,
} from "@sigillus/contracts";
import {
  ANNOUNCEMENT_PUBLISH_BLOCKED_MESSAGE,
  ANNOUNCEMENT_PUBLISH_ERROR_MESSAGE,
  buildInitialState,
  buildSectionSnapshots,
  calculateProfileScore,
  generateSmartTips,
  getPublishBlockingItems,
  isSectionReadyForOptimization,
  serializeAnnouncementDraft,
  validateSectionForSave,
} from "@sigillus/domain";
import { ads } from "@/lib/mock-data";

export {
  OPTIMIZE_SECTION_ORDER,
  SECTION_LABELS,
  buildInitialState,
  buildSectionSnapshots,
  calculateProfileScore,
  generateSmartTips,
  getPublishValidationErrors,
  isHairSelectionComplete,
  isSectionReadyForOptimization,
  isSelectUnselected,
  sanitizeNumericInput,
  serializeAnnouncementDraft,
} from "@sigillus/domain";

const SAVE_LATENCY_MS = 600;
const SAVED_STATUS_RESET_MS = 2000;
const NO_CHANGES_STATUS_RESET_MS = 1200;

export function syncDraftToMockAd(slug: string, form: AnnouncementDraftState) {
  const target = ads.find((item) => item.slug === slug);

  if (!target) {
    return false;
  }

  target.images = [...form.images];

  if (
    form.profileIndex !== null &&
    form.profileIndex >= 0 &&
    form.profileIndex < form.images.length
  ) {
    const preview = form.profilePreviews[form.profileIndex];
    target.profileImage = preview || form.images[form.profileIndex];
    target.profileImageIndex = form.profileIndex;
  } else {
    target.profileImage = undefined;
    target.profileImageIndex = undefined;
  }

  target.shortDescription = form.shortDescription;
  target.description = form.description;

  if (form.locationCity.trim()) {
    target.city = form.locationCity.trim();
  }

  if (form.locationState.trim()) {
    target.state = form.locationState.trim();
  }

  const activeAddress = form.locationAddresses.find((address) => address.active);
  if (activeAddress?.addressLine.trim()) {
    target.neighborhood = activeAddress.addressLine.trim();
  }

  const selectedServices = form.services
    .filter((service) => service.selected)
    .map((service) => service.label);
  if (selectedServices.length > 0) {
    target.services = selectedServices;
  }

  return true;
}

async function persistDraftMock(
  slug: string,
  form: AnnouncementDraftState,
): Promise<"saved" | "error"> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, SAVE_LATENCY_MS);
  });

  if (!syncDraftToMockAd(slug, form)) {
    return "error";
  }

  return "saved";
}

export type AnnouncementPublishOptions = {
  status: "Ativo" | "Pausado";
  onActivate: () => void;
};

export function useAnnouncementDraft(ad: AnnouncementAdPreview) {
  const [form, setForm] = useState<AnnouncementDraftState>(() => buildInitialState(ad));
  const [saveStatus, setSaveStatus] = useState<AnnouncementSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [savedEpoch, setSavedEpoch] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedSectionSnapshots, setSavedSectionSnapshots] = useState<AnnouncementSectionSnapshots>(
    () => buildSectionSnapshots(form),
  );

  const formRef = useRef(form);
  const isSavingRef = useRef(false);
  const idleStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSnapshotRef = useRef(serializeAnnouncementDraft(form));

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    return () => {
      if (idleStatusTimeoutRef.current) clearTimeout(idleStatusTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setHasUnsavedChanges(serializeAnnouncementDraft(form) !== lastSavedSnapshotRef.current);
  }, [form, savedEpoch]);

  useEffect(() => {
    const target = ads.find((item) => item.slug === ad.slug);

    if (!target) {
      return;
    }

    target.images = [...form.images];
  }, [ad.slug, form.images]);

  const score = calculateProfileScore(form);
  const tips = generateSmartTips(form);

  const sectionSnapshots = useMemo(() => buildSectionSnapshots(form), [form]);
  const sectionDirtyState = useMemo<AnnouncementSectionDirtyState>(
    () => ({
      characteristics: sectionSnapshots.characteristics !== savedSectionSnapshots.characteristics,
      pricing: sectionSnapshots.pricing !== savedSectionSnapshots.pricing,
      location: sectionSnapshots.location !== savedSectionSnapshots.location,
      description: sectionSnapshots.description !== savedSectionSnapshots.description,
      services: sectionSnapshots.services !== savedSectionSnapshots.services,
      availability: sectionSnapshots.availability !== savedSectionSnapshots.availability,
    }),
    [savedSectionSnapshots, sectionSnapshots],
  );

  const updateField = useCallback(
    <K extends keyof AnnouncementDraftState>(key: K, value: AnnouncementDraftState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updateNestedField = useCallback(
    <K extends keyof AnnouncementDraftState>(key: K, nestedKey: string, value: unknown) => {
      setForm((prev) => ({
        ...prev,
        [key]: { ...(prev[key] as Record<string, unknown>), [nestedKey]: value },
      }));
    },
    [],
  );

  const updateForm = useCallback(
    (updater: (current: AnnouncementDraftState) => AnnouncementDraftState) => {
      setForm((prev) => updater(prev));
    },
    [],
  );

  const persistDraft = useCallback(async (): Promise<AnnouncementSaveResult> => {
    const hasChanges = serializeAnnouncementDraft(formRef.current) !== lastSavedSnapshotRef.current;

    if (!hasChanges) {
      setSaveStatus("saved");
      setSavedEpoch((current) => current + 1);
      if (idleStatusTimeoutRef.current) clearTimeout(idleStatusTimeoutRef.current);
      idleStatusTimeoutRef.current = setTimeout(
        () => setSaveStatus("idle"),
        NO_CHANGES_STATUS_RESET_MS,
      );
      return "no_changes";
    }

    if (isSavingRef.current) {
      return "busy";
    }

    isSavingRef.current = true;
    setSaveStatus("saving");

    try {
      const result = await persistDraftMock(ad.slug, formRef.current);

      if (result === "error") {
        setSaveStatus("error");
        return "error";
      }

      lastSavedSnapshotRef.current = serializeAnnouncementDraft(formRef.current);
      setSavedEpoch((current) => current + 1);
      setSaveStatus("saved");
      setLastSavedAt(new Date());
      if (idleStatusTimeoutRef.current) clearTimeout(idleStatusTimeoutRef.current);
      idleStatusTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), SAVED_STATUS_RESET_MS);
      return "saved";
    } catch {
      setSaveStatus("error");
      return "error";
    } finally {
      isSavingRef.current = false;
    }
  }, [ad.slug]);

  const saveSection = useCallback(
    async (section: AnnouncementSectionKey): Promise<AnnouncementSaveSectionResult> => {
      if (!sectionDirtyState[section]) {
        return { ok: false, reason: "not_dirty" };
      }

      if (saveStatus === "saving") {
        return { ok: false, reason: "busy" };
      }

      const validationFailure = validateSectionForSave(section, formRef.current);
      if (validationFailure) {
        return validationFailure;
      }

      const saveResult = await persistDraft();

      if (saveResult === "error" || saveResult === "busy") {
        return { ok: false, reason: saveResult };
      }

      setSavedSectionSnapshots(buildSectionSnapshots(formRef.current));

      return { ok: true, saveResult };
    },
    [persistDraft, saveStatus, sectionDirtyState],
  );

  const cancelSection = useCallback(
    (section: AnnouncementSectionKey) => {
      if (!sectionDirtyState[section] || saveStatus === "saving") {
        return;
      }

      switch (section) {
        case "characteristics": {
          const savedCharacteristics = JSON.parse(
            savedSectionSnapshots.characteristics,
          ) as AnnouncementCharacteristics;
          updateField("characteristics", savedCharacteristics);
          return;
        }
        case "pricing": {
          const parsed = JSON.parse(savedSectionSnapshots.pricing) as
            | AnnouncementPricingItem[]
            | { pricing: AnnouncementPricingItem[]; paymentMethods?: string[] };
          const isLegacy = Array.isArray(parsed);
          updateForm((current) => ({
            ...current,
            pricing: isLegacy ? parsed : parsed.pricing,
            paymentMethods:
              isLegacy || !parsed.paymentMethods || parsed.paymentMethods.length === 0
                ? ["dinheiro"]
                : parsed.paymentMethods,
          }));
          return;
        }
        case "location": {
          const savedLocation = JSON.parse(savedSectionSnapshots.location) as Pick<
            AnnouncementDraftState,
            "locationState" | "locationCity" | "acceptsTravel" | "locationAddresses"
          >;
          updateForm((current) => ({
            ...current,
            locationState: savedLocation.locationState,
            locationCity: savedLocation.locationCity,
            acceptsTravel: savedLocation.acceptsTravel,
            locationAddresses: savedLocation.locationAddresses,
          }));
          return;
        }
        case "description": {
          const savedDescription = JSON.parse(savedSectionSnapshots.description) as Pick<
            AnnouncementDraftState,
            "shortDescription" | "description"
          >;
          updateForm((current) => ({
            ...current,
            shortDescription: savedDescription.shortDescription,
            description: savedDescription.description,
          }));
          return;
        }
        case "services": {
          const savedServices = JSON.parse(
            savedSectionSnapshots.services,
          ) as AnnouncementServiceOption[];
          updateField("services", savedServices);
          return;
        }
        case "availability": {
          const savedAvailability = JSON.parse(savedSectionSnapshots.availability) as Pick<
            AnnouncementDraftState,
            "showAvailability" | "availability"
          >;
          updateForm((current) => ({
            ...current,
            showAvailability: savedAvailability.showAvailability,
            availability: savedAvailability.availability,
          }));
          return;
        }
        default: {
          const exhaustiveCheck: never = section;
          return exhaustiveCheck;
        }
      }
    },
    [savedSectionSnapshots, saveStatus, sectionDirtyState, updateField, updateForm],
  );

  const publish = useCallback(
    async ({
      status,
      onActivate,
    }: AnnouncementPublishOptions): Promise<AnnouncementPublishResult> => {
      if (saveStatus === "saving") {
        return { ok: false, reason: "error", message: ANNOUNCEMENT_PUBLISH_ERROR_MESSAGE };
      }

      const dirtySections = (Object.keys(sectionDirtyState) as AnnouncementSectionKey[]).filter(
        (section) => sectionDirtyState[section],
      );
      const blockingItems = getPublishBlockingItems(formRef.current, dirtySections);

      if (blockingItems.length > 0) {
        return {
          ok: false,
          reason: "blocked",
          message: ANNOUNCEMENT_PUBLISH_BLOCKED_MESSAGE,
          items: blockingItems,
        };
      }

      const saveResult = await persistDraft();

      if (saveResult === "error") {
        return { ok: false, reason: "error", message: ANNOUNCEMENT_PUBLISH_ERROR_MESSAGE };
      }

      setSavedSectionSnapshots(buildSectionSnapshots(formRef.current));

      if (status !== "Ativo") {
        onActivate();
      }

      return { ok: true };
    },
    [persistDraft, saveStatus, sectionDirtyState],
  );

  return {
    form,
    saveStatus,
    hasUnsavedChanges,
    lastSavedAt,
    score,
    tips,
    sectionDirtyState,
    savedSectionSnapshots,
    setForm,
    updateField,
    updateNestedField,
    updateForm,
    saveSection,
    cancelSection,
    publish,
    isSectionReadyForOptimization: (section: AnnouncementSectionKey) =>
      isSectionReadyForOptimization(form, section),
  };
}

export type UseAnnouncementDraftReturn = ReturnType<typeof useAnnouncementDraft>;
