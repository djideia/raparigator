import { useEffect, useRef, useState, type CSSProperties } from "react";

export type MediaFrameSize = {
  width: number;
  height: number;
};

export function useMediaFrameSize() {
  const mediaFrameRef = useRef<HTMLDivElement>(null);
  const [mediaMaxSize, setMediaMaxSize] = useState<MediaFrameSize | null>(null);

  useEffect(() => {
    const frame = mediaFrameRef.current;
    if (!frame) {
      return;
    }

    const updateSize = () => {
      const rect = frame.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      setMediaMaxSize((current) => {
        if (current && current.width === width && current.height === height) {
          return current;
        }
        return { width, height };
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return { mediaFrameRef, mediaMaxSize };
}

export function mediaFitStyle(mediaMaxSize: MediaFrameSize | null): CSSProperties {
  if (mediaMaxSize) {
    return {
      maxWidth: mediaMaxSize.width,
      maxHeight: mediaMaxSize.height,
      width: "auto",
      height: "auto",
    };
  }

  return {
    maxWidth: "100%",
    maxHeight: "100%",
    width: "auto",
    height: "auto",
  };
}
