import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  buildCenteredSelection,
  resolveMinSelectionSize,
} from "@/components/ui/image-selection-utils";
import { mediaFitStyle, useMediaFrameSize } from "@/components/ui/use-media-frame-size";

export interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedAreaPixels: Area) => void;
  onClose: () => void;
  aspect?: number;
  canRevert?: boolean;
  onRevert?: () => void;
}

const MIN_SELECTION_PX = 64;

function toNaturalPixelCrop(img: HTMLImageElement, nextCrop: Crop): PixelCrop {
  const scaleX = img.naturalWidth / Math.max(1, img.width);
  const scaleY = img.naturalHeight / Math.max(1, img.height);
  const displayWidth = (nextCrop.width / 100) * img.width;
  const displayHeight = (nextCrop.height / 100) * img.height;
  const displayX = (nextCrop.x / 100) * img.width;
  const displayY = (nextCrop.y / 100) * img.height;

  return {
    unit: "px",
    x: Math.round(displayX * scaleX),
    y: Math.round(displayY * scaleY),
    width: Math.round(displayWidth * scaleX),
    height: Math.round(displayHeight * scaleY),
  };
}

export function ImageCropperModal({
  imageSrc,
  onCropComplete,
  onClose,
  aspect,
  canRevert = false,
  onRevert,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [initialCrop, setInitialCrop] = useState<Crop>();
  const [minSelection, setMinSelection] = useState({
    width: MIN_SELECTION_PX,
    height: MIN_SELECTION_PX,
  });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const { mediaFrameRef, mediaMaxSize } = useMediaFrameSize();

  const applyMaxSelection = useCallback(
    (img: HTMLImageElement) => {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      const displayWidth = img.width;
      const displayHeight = img.height;

      if (!naturalWidth || !naturalHeight || !displayWidth || !displayHeight) {
        return;
      }

      setMinSelection(resolveMinSelectionSize({ width: displayWidth, height: displayHeight }));
      const nextCrop = buildCenteredSelection(naturalWidth, naturalHeight, aspect);
      setCrop(nextCrop);
      setInitialCrop(nextCrop);
      setCroppedAreaPixels(toNaturalPixelCrop(img, nextCrop));
    },
    [aspect],
  );

  const onCropCompleteCallback = useCallback((pixelCrop: PixelCrop) => {
    if (!imageRef.current) {
      setCroppedAreaPixels(pixelCrop);
      return;
    }

    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;

    setCroppedAreaPixels({
      x: Math.round(pixelCrop.x * scaleX),
      y: Math.round(pixelCrop.y * scaleY),
      width: Math.round(pixelCrop.width * scaleX),
      height: Math.round(pixelCrop.height * scaleY),
      unit: "px",
    });
  }, []);

  const handleImageLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget;
      imageRef.current = img;
      applyMaxSelection(img);

      requestAnimationFrame(() => {
        if (imageRef.current) {
          applyMaxSelection(imageRef.current);
        }
      });
    },
    [applyMaxSelection],
  );

  useEffect(() => {
    const img = imageRef.current;
    if (!img || !mediaMaxSize) {
      return;
    }

    applyMaxSelection(img);
  }, [applyMaxSelection, mediaMaxSize]);

  const handleConfirm = () => {
    if (croppedAreaPixels) {
      onCropComplete(croppedAreaPixels);
    }
  };

  const handleRevert = () => {
    if (canRevert && onRevert) {
      onRevert();
      return;
    }

    if (imageRef.current) {
      applyMaxSelection(imageRef.current);
      return;
    }

    if (initialCrop) {
      setCrop(initialCrop);
    }
  };

  const mediaStyle = mediaFitStyle(mediaMaxSize);
  const mediaBoxStyle = mediaMaxSize
    ? { maxWidth: mediaMaxSize.width, maxHeight: mediaMaxSize.height }
    : undefined;

  const minWidth = Math.min(
    Math.max(MIN_SELECTION_PX, minSelection.width),
    Math.max(MIN_SELECTION_PX, Math.floor((mediaMaxSize?.width ?? MIN_SELECTION_PX) * 0.2)),
  );
  const minHeight = aspect
    ? Math.max(32, Math.floor(minWidth / aspect))
    : Math.max(48, minSelection.height);

  return (
    <div className="fixed inset-0 z-200 bg-black flex flex-col items-center justify-center p-3 sm:p-4">
      <div className="relative z-10 mb-3 flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-1 sm:mb-5 sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={onClose}
          className="h-9 shrink-0 rounded-full border border-white/20 bg-white/10 px-3 text-xs font-bold tracking-wide text-white transition-colors hover:bg-white/20 sm:h-10 sm:px-4 sm:text-sm"
        >
          Cancelar
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
          <button
            type="button"
            onClick={handleRevert}
            className="h-9 min-w-0 truncate rounded-full border border-white/20 bg-white/10 px-3 text-xs font-bold tracking-wide text-white transition-colors hover:bg-white/20 sm:h-10 sm:px-4 sm:text-sm"
            title={
              canRevert ? "Reverter recorte/enquadramento aplicado" : "Restaurar seleção máxima"
            }
          >
            <span className="sm:hidden">{canRevert ? "Reverter" : "Resetar"}</span>
            <span className="hidden sm:inline">
              {canRevert ? "Reverter Enquadramento" : "Reverter Seleção"}
            </span>
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!croppedAreaPixels}
            className="h-9 shrink-0 rounded-full bg-wine-700 px-4 text-xs font-black tracking-wide text-white transition-colors hover:bg-wine-600 disabled:opacity-50 sm:h-10 sm:px-5 sm:text-sm"
          >
            Salvar
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-5xl flex-1 bg-black/50 rounded-lg overflow-hidden border border-white/10 min-h-0 select-none p-2 sm:p-4">
        <div
          ref={mediaFrameRef}
          className="flex h-full w-full min-h-0 items-center justify-center overflow-hidden"
        >
          <ReactCrop
            crop={crop}
            onChange={(nextCrop) => setCrop(nextCrop)}
            onComplete={onCropCompleteCallback}
            aspect={aspect}
            minWidth={minWidth}
            minHeight={minHeight}
            className="max-w-full max-h-full inline-block overflow-hidden [&_.ReactCrop__crop-mask]:h-[calc(100%+2px)] [&_.ReactCrop__crop-mask]:w-[calc(100%+2px)]"
            style={mediaBoxStyle}
            keepSelection
            ruleOfThirds
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Editar enquadramento"
              className="block pointer-events-none select-none"
              crossOrigin="anonymous"
              onLoad={handleImageLoad}
              style={mediaStyle}
            />
          </ReactCrop>
        </div>
      </div>

      <div className="mt-3 px-2 text-center text-[11px] leading-snug text-zinc-400 sm:mt-4 sm:text-xs">
        Arraste e redimensione a caixa para definir o novo enquadramento.
        {aspect ? " A seleção começa no máximo possível para a proporção." : null}
      </div>
    </div>
  );
}
