import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import {
  createAdaptivePresetCrop,
  resolveMinSelectionSize,
} from "@/components/ui/image-selection-utils";
import type { Area } from "@/components/ui/image-cropper-modal";
import { mediaFitStyle, useMediaFrameSize } from "@/components/ui/use-media-frame-size";

export type ImageBlurResult = {
  src: string;
  mode: "crop" | "brush";
  cropArea?: Area;
  maskDataUrl?: string;
};

interface ImageBlurModalProps {
  imageSrc: string;
  onBlurComplete: (result: ImageBlurResult) => void;
  onClose: () => void;
}

export function ImageBlurModal({ imageSrc, onBlurComplete, onClose }: ImageBlurModalProps) {
  const [crop, setCrop] = useState<Crop | undefined>();
  const [minSelection, setMinSelection] = useState({ width: 72, height: 72 });
  const [mode, setMode] = useState<"crop" | "brush">("crop");
  const imageRef = useRef<HTMLImageElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const { mediaFrameRef, mediaMaxSize } = useMediaFrameSize();

  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const syncCanvas = () => {
      if (imageRef.current && maskCanvasRef.current && mode === "brush") {
        const img = imageRef.current;
        const cvs = maskCanvasRef.current;
        const rect = img.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const canvasWidth = Math.max(1, Math.round(rect.width * dpr));
        const canvasHeight = Math.max(1, Math.round(rect.height * dpr));

        if (cvs.width !== canvasWidth || cvs.height !== canvasHeight) {
          cvs.width = canvasWidth;
          cvs.height = canvasHeight;

          const ctx = cvs.getContext("2d");
          if (ctx) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          }
        }
      }
    };
    const timer = setTimeout(syncCanvas, 100);
    window.addEventListener("resize", syncCanvas);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", syncCanvas);
    };
  }, [mode, imageSrc, mediaMaxSize]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!maskCanvasRef.current) return null;
    const rect = maskCanvasRef.current.getBoundingClientRect();
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== "brush") return;
    const pos = getCoordinates(e);
    if (pos) {
      setIsDrawing(true);
      lastPos.current = pos;
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || mode !== "brush" || !maskCanvasRef.current) return;
    const pos = getCoordinates(e);
    if (pos && lastPos.current) {
      const ctx = maskCanvasRef.current.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 40;
        ctx.strokeStyle = "white";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "white";
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        setHasDrawn(true);
      }
      lastPos.current = pos;
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const applyBlur = useCallback(async () => {
    if (!imageRef.current) return;

    if (mode === "crop" && (!crop || !crop.width || !crop.height)) return;
    if (mode === "brush" && !hasDrawn) return;

    const image = imageRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(image, 0, 0);

    let cropArea: Area | undefined;
    let maskDataUrl: string | undefined;

    if (mode === "crop") {
      const isPercent = crop!.unit === "%";
      const displayRect = image.getBoundingClientRect();
      const displayWidth = Math.max(1, displayRect.width);
      const displayHeight = Math.max(1, displayRect.height);
      const scaleX = isPercent ? image.naturalWidth / 100 : image.naturalWidth / displayWidth;
      const scaleY = isPercent ? image.naturalHeight / 100 : image.naturalHeight / displayHeight;

      const rawX = crop!.x * scaleX;
      const rawY = crop!.y * scaleY;
      const rawWidth = crop!.width * scaleX;
      const rawHeight = crop!.height * scaleY;

      const cx = Math.max(0, Math.min(image.naturalWidth - 1, rawX));
      const cy = Math.max(0, Math.min(image.naturalHeight - 1, rawY));
      const cWidth = Math.max(1, Math.min(rawWidth, image.naturalWidth - cx));
      const cHeight = Math.max(1, Math.min(rawHeight, image.naturalHeight - cy));
      cropArea = {
        x: Math.round(cx),
        y: Math.round(cy),
        width: Math.round(cWidth),
        height: Math.round(cHeight),
      };

      ctx.save();
      ctx.beginPath();
      ctx.rect(cx, cy, cWidth, cHeight);
      ctx.clip();
      const blurAmount = Math.max(25, (image.naturalWidth / 1000) * 25);
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.drawImage(image, 0, 0);
      ctx.restore();
    } else {
      const blurCanvas = document.createElement("canvas");
      blurCanvas.width = image.naturalWidth;
      blurCanvas.height = image.naturalHeight;
      const blurCtx = blurCanvas.getContext("2d");
      if (blurCtx) {
        blurCtx.filter = "blur(25px)";
        blurCtx.drawImage(image, 0, 0);

        blurCtx.globalCompositeOperation = "destination-in";
        if (maskCanvasRef.current) {
          blurCtx.drawImage(maskCanvasRef.current, 0, 0, blurCanvas.width, blurCanvas.height);
        }
      }

      ctx.drawImage(blurCanvas, 0, 0);
      maskDataUrl = maskCanvasRef.current?.toDataURL("image/png");
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onBlurComplete({
          src: URL.createObjectURL(blob),
          mode,
          cropArea,
          maskDataUrl,
        });
      },
      "image/jpeg",
      0.95,
    );
  }, [crop, mode, hasDrawn, onBlurComplete]);

  const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const width = event.currentTarget.width;
    const height = event.currentTarget.height;

    if (!width || !height) {
      return;
    }

    setMinSelection(resolveMinSelectionSize({ width, height }));
    setCrop(createAdaptivePresetCrop(width, height));
  }, []);

  const mediaStyle = mediaFitStyle(mediaMaxSize);
  const mediaBoxStyle = mediaMaxSize
    ? { maxWidth: mediaMaxSize.width, maxHeight: mediaMaxSize.height }
    : undefined;

  return (
    <div className="fixed inset-0 z-200 bg-black/95 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-4 text-white shrink-0 mt-4">
        <h2 className="text-lg font-bold">Borrar Imagem</h2>
        <p className="text-sm text-zinc-400">Selecione a área que deseja borrar na foto</p>
        <div className="flex justify-center gap-2 mt-4 bg-white/10 p-1 rounded-lg w-fit mx-auto">
          <button
            onClick={() => setMode("crop")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === "crop" ? "bg-white text-black" : "text-white hover:bg-white/20"}`}
          >
            Caixa de Seleção
          </button>
          <button
            onClick={() => setMode("brush")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === "brush" ? "bg-white text-black" : "text-white hover:bg-white/20"}`}
          >
            Pincel Livre
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-5xl flex-1 bg-black/50 rounded-lg overflow-hidden border border-white/10 min-h-0 select-none p-4">
        <div
          ref={mediaFrameRef}
          className="flex h-full w-full min-h-0 items-center justify-center overflow-hidden"
        >
          {mode === "crop" ? (
            <ReactCrop
              key={`blur-crop-${imageSrc}`}
              crop={crop}
              onChange={(c) => setCrop(c)}
              minWidth={minSelection.width}
              minHeight={minSelection.height}
              keepSelection
              ruleOfThirds
              className="max-w-full max-h-full inline-block overflow-hidden [&_.ReactCrop__crop-mask]:h-[calc(100%+2px)] [&_.ReactCrop__crop-mask]:w-[calc(100%+2px)]"
              style={mediaBoxStyle}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Blur Area"
                className="block pointer-events-none select-none"
                crossOrigin="anonymous"
                onLoad={handleImageLoad}
                style={mediaStyle}
              />
            </ReactCrop>
          ) : (
            <div
              className="relative inline-block max-w-full max-h-full overflow-hidden"
              style={mediaBoxStyle}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Blur Area"
                className="block pointer-events-none select-none"
                crossOrigin="anonymous"
                style={mediaStyle}
              />
              <canvas
                ref={maskCanvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                onTouchCancel={stopDrawing}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                style={{ touchAction: "none" }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="my-6 flex gap-4 w-full max-w-sm shrink-0">
        <Button
          variant="secondary"
          className="w-full text-white border-white/20 hover:bg-white/10"
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button
          className="w-full bg-wine-700 hover:bg-wine-600 text-white disabled:opacity-50"
          onClick={applyBlur}
          disabled={
            (mode === "crop" && (!crop || !crop.width || !crop.height)) ||
            (mode === "brush" && !hasDrawn)
          }
        >
          Aplicar Borrão
        </Button>
      </div>
    </div>
  );
}
