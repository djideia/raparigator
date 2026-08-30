import type {
  AnnouncementAdPreview,
  AnnouncementCharacteristics,
  AnnouncementDraftState,
  AnnouncementLocationAddress,
  AnnouncementLocationVenue,
  AnnouncementPricingItem,
  AnnouncementProfileScore,
  AnnouncementPublishWarningItem,
  AnnouncementRequiredCharacteristicKey,
  AnnouncementSaveSectionFailure,
  AnnouncementSectionKey,
  AnnouncementSectionSnapshots,
  AnnouncementServiceOption,
  AnnouncementSmartTip,
  AvailabilityDay,
} from "@sigillus/contracts";

export const SELECT_PLACEHOLDER = "Selecionar";
const HAIR_SELECTION_SEPARATOR = "::";
export const ANNOUNCEMENT_PUBLISH_ERROR_MESSAGE =
  "Não deu pra publicar agora, amor. Tenta de novo em um instante?";
export const ANNOUNCEMENT_PUBLISH_BLOCKED_MESSAGE = "Há pendências nos grupos abaixo.";
export const ANNOUNCEMENT_PRICING_PAYMENT_ERROR_MESSAGE =
  "Ao menos uma modalidade de pagamento deve ser selecionada.";

export const REQUIRED_CHARACTERISTIC_KEYS: AnnouncementRequiredCharacteristicKey[] = [
  "gender",
  "ethnicity",
  "height",
  "weight",
  "hairColor",
  "smoker",
];

export const CHARACTERISTICS_FIELD_LABELS: Record<AnnouncementRequiredCharacteristicKey, string> = {
  gender: "Gênero",
  ethnicity: "Etnia",
  height: "Altura (cm)",
  weight: "Peso (kg)",
  hairColor: "Tipo e Cor do Cabelo",
  smoker: "Fumante",
};

export const SECTION_LABELS: Record<AnnouncementSectionKey, string> = {
  characteristics: "Características físicas",
  pricing: "Tabela de preços",
  location: "Localização",
  description: "Descrição do Perfil",
  services: "Serviços Oferecidos",
  availability: "Horários de Disponibilidade",
};

export const OPTIMIZE_SECTION_ORDER: AnnouncementSectionKey[] = [
  "characteristics",
  "pricing",
  "location",
  "description",
  "services",
  "availability",
];

export function isSelectUnselected(value: string) {
  return value.trim().length === 0 || value === SELECT_PLACEHOLDER;
}

export function sanitizeNumericInput(value: string, maxLength = 4) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function isHairSelectionComplete(value: string) {
  if (!value.trim() || value === SELECT_PLACEHOLDER) {
    return false;
  }

  if (!value.includes(HAIR_SELECTION_SEPARATOR)) {
    return true;
  }

  const [type = SELECT_PLACEHOLDER, color = SELECT_PLACEHOLDER] =
    value.split(HAIR_SELECTION_SEPARATOR);

  return !isSelectUnselected(type) && !isSelectUnselected(color);
}

export function serializeAnnouncementDraft(state: AnnouncementDraftState) {
  return JSON.stringify(state);
}

function createLocationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `location-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toCurrencyMaskDigits(value: number | string) {
  const numericValue = typeof value === "number" ? value : Number(String(value).replace(/\D/g, ""));

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "";
  }

  return String(Math.round(numericValue * 100));
}

export const defaultCharacteristics: AnnouncementCharacteristics = {
  gender: "Selecionar",
  genitalia: "",
  sexualPreference: "",
  weight: "",
  height: "",
  ethnicity: "Selecionar",
  eyeColor: "",
  hairColor: "Selecionar",
  hairLength: "",
  silicone: "",
  tattoos: "",
  piercings: "",
  smoker: "Selecionar",
  languages: "",
};

export const defaultServices: AnnouncementServiceOption[] = [
  { label: "Atendimento em Hotel", selected: false },
  { label: "Casais", selected: false },
  { label: "Com Local", selected: false },
  { label: "Dominação", selected: false },
  { label: "Dupla Penetração", selected: false },
  { label: "Festas", selected: false },
  { label: "Fetiches", selected: false },
  { label: "Fisting", selected: false },
  { label: "Inversão de Papeis", selected: false },
  { label: "Jantar", selected: false },
  { label: "Massagens", selected: false },
  { label: "Namorada Fake", selected: false },
  { label: "Podolatria", selected: false },
  { label: "Squirt", selected: false },
  { label: "Submissão", selected: false },
  { label: "Viagens", selected: false },
];

export const defaultPricing: AnnouncementPricingItem[] = [
  { label: "1 hora", price: "30000", disabled: false, billingType: "hourly" },
  { label: "30 min", price: "", disabled: true, billingType: "hourly" },
  { label: "15 min", price: "", disabled: true, billingType: "hourly" },
  { label: "Diária", price: "", disabled: true, billingType: "fixed" },
  { label: "Pernoite", price: "", disabled: true, billingType: "fixed" },
  { label: "Sexo anal com preservativo", price: "", disabled: true, billingType: "fixed" },
];

export const defaultVenues: AnnouncementLocationVenue[] = [
  { key: "own", label: "Local próprio", checked: false },
  { key: "hotel", label: "Hotel", checked: false },
  { key: "events", label: "Eventos", checked: false },
  { key: "parties", label: "Festas", checked: false },
];

export const defaultAvailability: AvailabilityDay[] = [
  { day: "SEG", enabled: true, start: "10:00", end: "22:00" },
  { day: "TER", enabled: true, start: "10:00", end: "22:00" },
  { day: "QUA", enabled: true, start: "10:00", end: "22:00" },
  { day: "QUI", enabled: true, start: "10:00", end: "22:00" },
  { day: "SEX", enabled: true, start: "10:00", end: "00:00" },
  { day: "SAB", enabled: false, start: "--:--", end: "--:--" },
  { day: "DOM", enabled: false, start: "--:--", end: "--:--" },
];

export function buildInitialState(ad: AnnouncementAdPreview): AnnouncementDraftState {
  const pricing = defaultPricing.map((defaultItem) => {
    const match = ad.pricingTable?.find((p) => {
      const normalizedDefaultLabel = defaultItem.label
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
      const normalizedLabel = p.label
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

      if (normalizedLabel === normalizedDefaultLabel) {
        return true;
      }

      if (defaultItem.label === "Sexo anal com preservativo") {
        return normalizedLabel === "adicao de sexo anal";
      }

      return false;
    });

    if (defaultItem.label === "1 hora") {
      return { ...defaultItem, price: "30000", disabled: false };
    }

    if (defaultItem.label === "Pernoite") {
      return { ...defaultItem, price: "", disabled: true };
    }

    if (!match) {
      return defaultItem;
    }

    return { ...defaultItem, price: toCurrencyMaskDigits(match.price), disabled: false };
  });

  const services = defaultServices.map((defaultService) => ({
    ...defaultService,
    selected: false,
  }));

  const initialLocationAddress: AnnouncementLocationAddress = {
    id: createLocationId(),
    label: ad.neighborhood?.trim()
      ? `${ad.neighborhood.trim()}, ${ad.city}`
      : `${ad.city}, ${ad.state}`,
    addressLine: ad.neighborhood?.trim() ?? "",
    city: ad.city,
    state: ad.state,
    country: "Brasil",
    notes: "",
    active: true,
  };

  const imageCount = ad.images.length;
  const emptyPreviews = imageCount > 0 ? ad.images.map(() => "") : [];
  let profileIndex: number | null = null;
  const profilePreviews = [...emptyPreviews];

  if (imageCount > 0 && typeof ad.profileImageIndex === "number") {
    const safeProfileIndex = Math.min(Math.max(ad.profileImageIndex, 0), imageCount - 1);
    profileIndex = safeProfileIndex;
    if (ad.profileImage) {
      profilePreviews[safeProfileIndex] = ad.profileImage;
    }
  } else if (imageCount > 0 && ad.profileImage) {
    const exactIndex = ad.images.indexOf(ad.profileImage);
    if (exactIndex >= 0) {
      profileIndex = exactIndex;
    }
  }

  return {
    images: imageCount > 0 ? ad.images : [],
    coverIndex: 0,
    coverPreviews: [...emptyPreviews],
    profileIndex,
    profilePreviews,
    shortDescription: ad.shortDescription ?? "",
    description: ad.description ?? "",
    characteristics: {
      ...defaultCharacteristics,
      ethnicity: defaultCharacteristics.ethnicity,
      hairColor: defaultCharacteristics.hairColor,
      height: "",
      weight: "",
    },
    services,
    pricing,
    paymentMethods: ["dinheiro"],
    venues: defaultVenues,
    acceptsTravel: false,
    locationAddresses: [initialLocationAddress],
    locationState: ad.state,
    locationCity: ad.city,
    showAvailability: false,
    availability: defaultAvailability,
  };
}

export function calculateProfileScore(state: AnnouncementDraftState): AnnouncementProfileScore {
  const photosScore =
    state.images.length >= 3
      ? 15
      : state.images.length === 2
        ? 11
        : state.images.length === 1
          ? 6
          : 0;

  const hasCharacteristics =
    [
      state.characteristics.gender,
      state.characteristics.ethnicity,
      state.characteristics.height,
      state.characteristics.weight,
      state.characteristics.smoker,
    ].every((value) => value.trim().length > 0 && value !== SELECT_PLACEHOLDER) &&
    isHairSelectionComplete(state.characteristics.hairColor);
  const characteristicsScore = hasCharacteristics ? 20 : 0;

  const definedPrices = state.pricing.filter(
    (p) => !p.disabled && p.price.trim().length > 0,
  ).length;
  const pricingScore = definedPrices >= 1 ? 20 : 0;

  const hasLocation = state.locationState.trim().length > 0 && state.locationCity.trim().length > 0;
  const hasActiveAddress = state.locationAddresses.some((address) => address.active);
  const locationScore =
    hasLocation && hasActiveAddress ? 15 : hasLocation || hasActiveAddress ? 7 : 0;

  const hasShort = state.shortDescription.trim().length > 0;
  const hasLong = state.description.trim().length > 10;
  const descriptionScore = hasShort && hasLong ? 15 : hasShort || hasLong ? 8 : 0;

  const selectedServices = state.services.filter((s) => s.selected).length;
  const servicesScore = selectedServices > 0 ? 10 : 0;

  const hasAvailableDays = state.availability.some((day) => day.enabled);
  const availabilityScore =
    state.showAvailability && hasAvailableDays
      ? 5
      : state.showAvailability || hasAvailableDays
        ? 2
        : 0;

  const total =
    photosScore +
    characteristicsScore +
    pricingScore +
    locationScore +
    descriptionScore +
    servicesScore +
    availabilityScore;

  return {
    percentage: Math.min(total, 100),
    breakdown: {
      photos: photosScore,
      description: descriptionScore,
      pricing: pricingScore,
      services: servicesScore,
      location: locationScore,
    },
  };
}

export function generateSmartTips(state: AnnouncementDraftState): AnnouncementSmartTip[] {
  const tips: AnnouncementSmartTip[] = [];

  if (state.images.length < 3) {
    tips.push({
      id: "photos",
      text: `Adicione pelo menos 3 fotos para aumentar sua visibilidade (${state.images.length}/3)`,
      priority: "high",
    });
  }

  if (state.shortDescription.trim().length === 0) {
    tips.push({
      id: "short-desc",
      text: "Preencha uma descrição curta para aparecer melhor no feed",
      priority: "high",
    });
  }

  const definedPrices = state.pricing.filter(
    (p) => !p.disabled && p.price.trim().length > 0,
  ).length;
  if (definedPrices < 2) {
    tips.push({
      id: "pricing",
      text: "Perfis com preços definidos convertem até 40% mais",
      priority: "high",
    });
  }

  const selectedServices = state.services.filter((s) => s.selected).length;
  if (selectedServices === 0) {
    tips.push({
      id: "services",
      text: "Selecione os serviços que você realiza para atrair mais clientes",
      priority: "medium",
    });
  }

  if (state.description.trim().length < 50 && state.description.trim().length > 0) {
    tips.push({
      id: "long-desc",
      text: "Complete sua descrição com pelo menos 50 caracteres para mais conversões",
      priority: "medium",
    });
  }

  const hasAddress = state.locationAddresses.length > 0;
  if (!hasAddress && state.locationState.trim().length > 0) {
    tips.push({
      id: "venue",
      text: "Cadastre ao menos um endereço para facilitar o encontro com clientes",
      priority: "low",
    });
  }

  return tips;
}

export function buildSectionSnapshots(form: AnnouncementDraftState): AnnouncementSectionSnapshots {
  return {
    characteristics: JSON.stringify(form.characteristics),
    pricing: JSON.stringify({ pricing: form.pricing, paymentMethods: form.paymentMethods }),
    location: JSON.stringify({
      locationState: form.locationState,
      locationCity: form.locationCity,
      acceptsTravel: form.acceptsTravel,
      locationAddresses: form.locationAddresses,
    }),
    description: JSON.stringify({
      shortDescription: form.shortDescription,
      description: form.description,
    }),
    services: JSON.stringify(form.services),
    availability: JSON.stringify({
      showAvailability: form.showAvailability,
      availability: form.availability,
    }),
  };
}

export function getPublishValidationErrors(form: AnnouncementDraftState): string[] {
  const errors: string[] = [];
  const hasCharacteristics = ![
    isSelectUnselected(form.characteristics.gender),
    isSelectUnselected(form.characteristics.ethnicity),
    sanitizeNumericInput(form.characteristics.height).length === 0,
    sanitizeNumericInput(form.characteristics.weight).length === 0,
    !isHairSelectionComplete(form.characteristics.hairColor),
    isSelectUnselected(form.characteristics.smoker),
  ].some(Boolean);
  const hasPricing = form.pricing.some((item) => !item.disabled && item.price.trim().length > 0);
  const hasLocation = form.locationState.trim().length > 0 && form.locationCity.trim().length > 0;
  const hasPaymentMethods = (form.paymentMethods || []).length > 0;

  if (!hasCharacteristics)
    errors.push("Preencha os campos obrigatórios em Características físicas.");
  if (!hasPricing) errors.push("Defina ao menos um preço ativo na Tabela de preços.");
  if (!hasPaymentMethods)
    errors.push("Selecione ao menos uma forma de pagamento aceita na Tabela de preços.");
  if (!hasLocation) errors.push("Preencha Estado e Cidade na seção Localização.");

  return errors;
}

export function isSectionReadyForOptimization(
  form: AnnouncementDraftState,
  section: AnnouncementSectionKey,
): boolean {
  switch (section) {
    case "characteristics":
      return (
        [
          form.characteristics.gender,
          form.characteristics.ethnicity,
          form.characteristics.height,
          form.characteristics.weight,
          form.characteristics.smoker,
        ].every((value) => value.trim().length > 0 && value !== SELECT_PLACEHOLDER) &&
        isHairSelectionComplete(form.characteristics.hairColor)
      );
    case "pricing":
      return form.pricing.some((item) => !item.disabled && item.price.trim().length > 0);
    case "location":
      return (
        form.locationState.trim().length > 0 &&
        form.locationCity.trim().length > 0 &&
        form.locationAddresses.some((address) => address.active)
      );
    case "description":
      return form.shortDescription.trim().length > 0 && form.description.trim().length > 10;
    case "services":
      return form.services.some((service) => service.selected);
    case "availability":
      return form.showAvailability && form.availability.some((day) => day.enabled);
    default: {
      const exhaustiveCheck: never = section;
      return exhaustiveCheck;
    }
  }
}

export function getMissingCharacteristics(characteristics: AnnouncementCharacteristics) {
  return REQUIRED_CHARACTERISTIC_KEYS.filter((key) => {
    const value = characteristics[key];

    if (key === "hairColor") {
      return !isHairSelectionComplete(value);
    }

    if (key === "height" || key === "weight") {
      return sanitizeNumericInput(value).length === 0;
    }

    return isSelectUnselected(value);
  });
}

export function getPublishBlockingItems(
  form: AnnouncementDraftState,
  dirtySections: AnnouncementSectionKey[],
): AnnouncementPublishWarningItem[] {
  const validationErrors = getPublishValidationErrors(form);
  const requiredSections = new Set<AnnouncementSectionKey>();

  validationErrors.forEach((message) => {
    if (message.includes(SECTION_LABELS.characteristics)) {
      requiredSections.add("characteristics");
      return;
    }

    if (message.includes(SECTION_LABELS.pricing)) {
      requiredSections.add("pricing");
      return;
    }

    if (message.includes(SECTION_LABELS.location)) {
      requiredSections.add("location");
      return;
    }

    if (message.includes(SECTION_LABELS.description)) {
      requiredSections.add("description");
    }
  });

  const requiredItems: AnnouncementPublishWarningItem[] = Array.from(requiredSections).map(
    (section) => ({
      kind: "required" as const,
      section,
      label: SECTION_LABELS[section],
    }),
  );
  const unsavedItems: AnnouncementPublishWarningItem[] = dirtySections.map((section) => ({
    kind: "unsaved" as const,
    section,
    label: SECTION_LABELS[section],
  }));

  return [...requiredItems, ...unsavedItems];
}

export function validateSectionForSave(
  section: AnnouncementSectionKey,
  form: AnnouncementDraftState,
): AnnouncementSaveSectionFailure | null {
  if (section === "characteristics") {
    const missing = getMissingCharacteristics(form.characteristics);

    if (missing.length > 0) {
      return {
        ok: false,
        reason: "characteristics",
        missing,
        message: `Campo ${missing.map((field) => CHARACTERISTICS_FIELD_LABELS[field]).join(", ")} não preenchido`,
      };
    }
  }

  if (section === "pricing" && (form.paymentMethods || []).length === 0) {
    return { ok: false, reason: "pricing", message: ANNOUNCEMENT_PRICING_PAYMENT_ERROR_MESSAGE };
  }

  return null;
}

export function parseCurrencyMaskDigits(value: string): number {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return 0;
  }
  return Number(digits) / 100;
}

export function draftToPricingTable(
  form: AnnouncementDraftState,
): Array<{ label: string; price: number }> {
  return form.pricing
    .filter((item) => !item.disabled && item.price.trim().length > 0)
    .map((item) => ({ label: item.label, price: parseCurrencyMaskDigits(item.price) }))
    .filter((item) => item.price > 0);
}

export function draftStartingPrice(form: AnnouncementDraftState): number {
  const prices = draftToPricingTable(form).map((item) => item.price);
  return prices.length > 0 ? Math.min(...prices) : 0;
}

export function draftSelectedServices(form: AnnouncementDraftState): string[] {
  return form.services.filter((service) => service.selected).map((service) => service.label);
}
