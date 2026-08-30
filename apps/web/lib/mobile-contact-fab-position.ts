export type MobileContactFabSide = "left" | "right";

const SIDE_STORAGE_KEY = "sigillus-mobile-contact-fab-side-v2";
const Y_STORAGE_KEY = "sigillus-mobile-contact-fab-y-v2";

export const MOBILE_CONTACT_FAB_SIZE = 56;
export const MOBILE_CONTACT_FAB_BOTTOM_OFFSET = 69;
export const MOBILE_CONTACT_FAB_EDGE_INSET = 16;
export const MOBILE_CONTACT_FAB_DRAG_THRESHOLD = 8;
export const MOBILE_CONTACT_FAB_SCROLL_THRESHOLD = 450;

export function readMobileContactFabSide(): MobileContactFabSide {
  if (typeof window === "undefined") {
    return "left";
  }

  const stored = window.localStorage.getItem(SIDE_STORAGE_KEY);
  return stored === "right" ? "right" : "left";
}

export function saveMobileContactFabSide(side: MobileContactFabSide) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SIDE_STORAGE_KEY, side);
}

export function readMobileContactFabY(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const stored = window.localStorage.getItem(Y_STORAGE_KEY);
  if (stored === null) {
    return 0;
  }

  const parsed = Number.parseFloat(stored);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function saveMobileContactFabY(y: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(Y_STORAGE_KEY, String(y));
}

export function clampMobileContactFabY(
  y: number,
  viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800,
) {
  const travelUp = Math.max(
    0,
    viewportHeight -
      MOBILE_CONTACT_FAB_SIZE -
      MOBILE_CONTACT_FAB_BOTTOM_OFFSET -
      MOBILE_CONTACT_FAB_EDGE_INSET,
  );
  return Math.min(0, Math.max(-travelUp, y));
}

export function getMobileContactFabTooltipSide(fabSide: MobileContactFabSide): "left" | "right" {
  return fabSide === "left" ? "right" : "left";
}

export function getMobileContactFabDragConstraints(viewportWidth: number, viewportHeight: number) {
  const maxUp = Math.max(
    0,
    viewportHeight -
      MOBILE_CONTACT_FAB_SIZE -
      MOBILE_CONTACT_FAB_BOTTOM_OFFSET -
      MOBILE_CONTACT_FAB_EDGE_INSET,
  );
  const maxHorizontal = Math.max(
    0,
    viewportWidth - MOBILE_CONTACT_FAB_SIZE - MOBILE_CONTACT_FAB_EDGE_INSET * 2,
  );

  return {
    top: -maxUp,
    bottom: 0,
    left: 0,
    right: maxHorizontal,
  };
}
