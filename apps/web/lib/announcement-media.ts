"use client";

import { useState } from "react";
import { getCroppedImg } from "@/lib/cropImage";
import type {
  AnnouncementMediaArea,
  AnnouncementMediaBlurInput,
  AnnouncementMediaHistoryEntry,
  AnnouncementMediaHistoryItem,
  AnnouncementMediaHistoryMap,
  AnnouncementMediaOperationKind,
  AnnouncementMediaRebuildResult,
  AnnouncementMediaSourceOffset,
} from "@/lib/announcement-media-types";

export function hasOperationInHistory(
  currentSrc: string,
  historyMap: AnnouncementMediaHistoryMap,
  operation: AnnouncementMediaOperationKind,
) {
  return getMediaHistoryChain(currentSrc, historyMap).some(
    (item) => item.entry.operation === operation,
  );
}

export function getMediaHistoryChain(currentSrc: string, historyMap: AnnouncementMediaHistoryMap) {
  const chain: AnnouncementMediaHistoryItem[] = [];
  let cursor = currentSrc;

  while (historyMap[cursor]) {
    const currentEntry = historyMap[cursor];
    chain.push({
      src: cursor,
      entry: currentEntry,
    });
    cursor = currentEntry.parent;
  }

  return chain.reverse();
}

export function getCurrentMediaOffset(
  currentSrc: string,
  historyMap: AnnouncementMediaHistoryMap,
): AnnouncementMediaSourceOffset {
  const chain = getMediaHistoryChain(currentSrc, historyMap);
  const latestCrop = [...chain]
    .reverse()
    .find((item) => item.entry.operation === "edit" && item.entry.cropArea);

  if (!latestCrop || !latestCrop.entry.cropArea) {
    return { x: 0, y: 0 };
  }

  return {
    x: latestCrop.entry.cropArea.x,
    y: latestCrop.entry.cropArea.y,
  };
}

export function translateAreaToSource(
  area: AnnouncementMediaArea,
  sourceOffset: AnnouncementMediaSourceOffset,
) {
  return {
    x: area.x - sourceOffset.x,
    y: area.y - sourceOffset.y,
    width: area.width,
    height: area.height,
  };
}

export function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export function canvasToObjectUrl(canvas: HTMLCanvasElement) {
  return new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Falha ao gerar imagem editada"));
          return;
        }

        resolve(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.95,
    );
  });
}

export async function applyBlurEntry(
  sourceSrc: string,
  entry: AnnouncementMediaHistoryEntry,
  sourceOffset: AnnouncementMediaSourceOffset,
) {
  const image = await loadImageElement(sourceSrc);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return sourceSrc;
  }

  ctx.drawImage(image, 0, 0);

  if (entry.blurMode === "brush") {
    const blurCanvas = document.createElement("canvas");
    blurCanvas.width = image.naturalWidth;
    blurCanvas.height = image.naturalHeight;

    const blurCtx = blurCanvas.getContext("2d");
    if (!blurCtx) {
      return sourceSrc;
    }

    blurCtx.filter = "blur(25px)";
    blurCtx.drawImage(image, 0, 0);

    blurCtx.globalCompositeOperation = "destination-in";
    if (entry.blurMaskDataUrl) {
      const maskImage = await loadImageElement(entry.blurMaskDataUrl);
      blurCtx.drawImage(
        maskImage,
        -sourceOffset.x,
        -sourceOffset.y,
        image.naturalWidth,
        image.naturalHeight,
      );
    }

    ctx.drawImage(blurCanvas, 0, 0);
    return canvasToObjectUrl(canvas);
  }

  if (!entry.cropArea) {
    return sourceSrc;
  }

  const localArea = translateAreaToSource(entry.cropArea, sourceOffset);
  const safeX = Math.max(0, Math.floor(localArea.x));
  const safeY = Math.max(0, Math.floor(localArea.y));
  const safeWidth = Math.min(
    Math.max(1, Math.floor(localArea.width)),
    Math.max(1, image.naturalWidth - safeX),
  );
  const safeHeight = Math.min(
    Math.max(1, Math.floor(localArea.height)),
    Math.max(1, image.naturalHeight - safeY),
  );

  ctx.save();
  ctx.beginPath();
  ctx.rect(safeX, safeY, safeWidth, safeHeight);
  ctx.clip();
  const blurAmount = Math.max(25, (image.naturalWidth / 1000) * 25);
  ctx.filter = `blur(${blurAmount}px)`;
  ctx.drawImage(image, 0, 0);
  ctx.restore();

  return canvasToObjectUrl(canvas);
}

export async function rebuildMediaChainAfterUndo(
  currentSrc: string,
  historyMap: AnnouncementMediaHistoryMap,
  operation: AnnouncementMediaOperationKind,
): Promise<AnnouncementMediaRebuildResult | null> {
  const chain = getMediaHistoryChain(currentSrc, historyMap);
  const targetIndex = chain.map((item) => item.entry.operation).lastIndexOf(operation);

  if (targetIndex === -1) {
    return null;
  }

  const baseSrc = chain.length > 0 ? chain[0].entry.parent : currentSrc;
  const remainingEntries = chain.filter((_, index) => index !== targetIndex);
  const rebuiltEntries: AnnouncementMediaHistoryItem[] = [];
  let sourceSrc = baseSrc;
  let sourceOffset: AnnouncementMediaSourceOffset = { x: 0, y: 0 };

  for (const item of remainingEntries) {
    let nextSrc: string;

    if (item.entry.operation === "edit") {
      if (!item.entry.cropArea) {
        return null;
      }

      const localArea = translateAreaToSource(item.entry.cropArea, sourceOffset);
      nextSrc = await getCroppedImg(sourceSrc, localArea);
      sourceOffset = {
        x: item.entry.cropArea.x,
        y: item.entry.cropArea.y,
      };
    } else {
      nextSrc = await applyBlurEntry(sourceSrc, item.entry, sourceOffset);
    }

    rebuiltEntries.push({
      src: nextSrc,
      entry: {
        ...item.entry,
        parent: sourceSrc,
      },
    });

    sourceSrc = nextSrc;
  }

  return {
    src: sourceSrc,
    entries: rebuiltEntries,
  };
}

export function useAnnouncementMedia() {
  const [historyMap, setHistoryMap] = useState<AnnouncementMediaHistoryMap>({});

  return {
    historyMap,
    hasOperation: (src: string, operation: AnnouncementMediaOperationKind) =>
      hasOperationInHistory(src, historyMap, operation),
    applyEdit: async (
      currentSrc: string,
      croppedAreaPixels: AnnouncementMediaArea,
    ): Promise<string | null> => {
      try {
        const sourceOffset = getCurrentMediaOffset(currentSrc, historyMap);
        const croppedUrl = await getCroppedImg(currentSrc, croppedAreaPixels);

        if (!croppedUrl) {
          return null;
        }

        if (historyMap[currentSrc] && currentSrc.startsWith("blob:")) {
          URL.revokeObjectURL(currentSrc);
        }

        setHistoryMap((prev) => {
          const next = { ...prev };
          next[croppedUrl] = {
            parent: currentSrc,
            operation: "edit",
            cropArea: {
              x: sourceOffset.x + croppedAreaPixels.x,
              y: sourceOffset.y + croppedAreaPixels.y,
              width: croppedAreaPixels.width,
              height: croppedAreaPixels.height,
            },
          };
          return next;
        });

        return croppedUrl;
      } catch {
        return null;
      }
    },
    applyBlur: (currentSrc: string, blurred: AnnouncementMediaBlurInput): string => {
      const sourceOffset = getCurrentMediaOffset(currentSrc, historyMap);

      if (historyMap[currentSrc] && currentSrc.startsWith("blob:")) {
        URL.revokeObjectURL(currentSrc);
      }

      setHistoryMap((prev) => {
        const next = { ...prev };
        next[blurred.src] = {
          parent: currentSrc,
          operation: "blur",
          blurMode: blurred.mode,
          cropArea: blurred.cropArea
            ? {
                x: sourceOffset.x + blurred.cropArea.x,
                y: sourceOffset.y + blurred.cropArea.y,
                width: blurred.cropArea.width,
                height: blurred.cropArea.height,
              }
            : undefined,
          blurMaskDataUrl: blurred.maskDataUrl,
        };
        return next;
      });

      return blurred.src;
    },
    revertOperation: async (
      currentSrc: string,
      operation: AnnouncementMediaOperationKind,
    ): Promise<string | null> => {
      const rebuilt = await rebuildMediaChainAfterUndo(currentSrc, historyMap, operation);

      if (!rebuilt) {
        return null;
      }

      if (currentSrc.startsWith("blob:")) {
        URL.revokeObjectURL(currentSrc);
      }

      setHistoryMap((prev) => {
        const next = { ...prev };
        rebuilt.entries.forEach((item) => {
          next[item.src] = item.entry;
        });
        return next;
      });

      return rebuilt.src;
    },
  };
}
