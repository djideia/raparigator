"use client";

import { useEffect, useRef } from "react";

export function useDampedScrollLoop(
  active: boolean,
  onFrame: (dt: number, seeded: boolean) => boolean,
  restartToken?: unknown,
) {
  const onFrameRef = useRef(onFrame);

  useEffect(() => {
    onFrameRef.current = onFrame;
  });

  useEffect(() => {
    if (!active) {
      return;
    }

    let frame = 0;
    let running = true;
    let seeded = false;
    let lastTime = performance.now();

    const tick = (now: number) => {
      if (!running) {
        return;
      }

      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      seeded = onFrameRef.current(dt, seeded);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
    };
  }, [active, restartToken]);
}
