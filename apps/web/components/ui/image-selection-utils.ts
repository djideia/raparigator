import type { Crop } from "react-image-crop";

const PRESET_LANDSCAPE = { width: 56, height: 40 };
const PRESET_PORTRAIT = { width: 56, height: 52 };
const PRESET_SQUARE = { width: 52, height: 52 };
export const ASPECT_MATCH_TOLERANCE = 0.04;

export function aspectsMatch(
  imageAspect: number,
  targetAspect: number,
  tolerance = ASPECT_MATCH_TOLERANCE,
) {
  if (!Number.isFinite(imageAspect) || !Number.isFinite(targetAspect) || targetAspect <= 0) {
    return false;
  }

  return Math.abs(imageAspect - targetAspect) / targetAspect <= tolerance;
}

type Size = {
  width: number;
  height: number;
};

function clampPercent(value: number) {
  return Math.min(96, Math.max(8, value));
}

export function createAdaptivePresetCrop(width: number, height: number): Crop {
  if (!width || !height) {
    return {
      unit: "%",
      x: 24,
      y: 24,
      width: PRESET_SQUARE.width,
      height: PRESET_SQUARE.height,
    };
  }

  const ratio = width / height;
  const preset = ratio > 1.15 ? PRESET_LANDSCAPE : ratio < 0.88 ? PRESET_PORTRAIT : PRESET_SQUARE;

  const cropWidth = clampPercent(preset.width);
  const cropHeight = clampPercent(preset.height);

  return {
    unit: "%",
    width: cropWidth,
    height: cropHeight,
    x: (100 - cropWidth) / 2,
    y: (100 - cropHeight) / 2,
  };
}

export function resolveMinSelectionSize(displaySize: Size): Size {
  const minEdge = Math.min(displaySize.width, displaySize.height);
  const minSize = Math.max(48, Math.round(minEdge * 0.12));

  return {
    width: Math.min(displaySize.width, minSize),
    height: Math.min(displaySize.height, minSize),
  };
}

export function buildMaxAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  if (!mediaWidth || !mediaHeight || !Number.isFinite(aspect) || aspect <= 0) {
    return {
      unit: "%",
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    };
  }

  const imageAspect = mediaWidth / mediaHeight;

  if (aspectsMatch(imageAspect, aspect)) {
    return {
      unit: "%",
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    };
  }

  if (imageAspect > aspect) {
    const widthPercent = (aspect / imageAspect) * 100;
    return {
      unit: "%",
      width: widthPercent,
      height: 100,
      x: (100 - widthPercent) / 2,
      y: 0,
    };
  }

  const heightPercent = (imageAspect / aspect) * 100;
  return {
    unit: "%",
    width: 100,
    height: heightPercent,
    x: 0,
    y: (100 - heightPercent) / 2,
  };
}

export function buildCenteredSelection(
  mediaWidth: number,
  mediaHeight: number,
  aspect?: number,
): Crop {
  if (!aspect) {
    return {
      unit: "%",
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    };
  }

  return buildMaxAspectCrop(mediaWidth, mediaHeight, aspect);
}
