"use client";

import { useEffect, useState } from "react";
import { LG_QUERY } from "./constants";
import { readIsDesktop } from "./math";

export function useMatchDesktop() {
  const [isDesktop, setIsDesktop] = useState(readIsDesktop);

  useEffect(() => {
    const desktopMq = window.matchMedia(LG_QUERY);

    const sync = () => {
      setIsDesktop(desktopMq.matches);
    };

    sync();
    desktopMq.addEventListener("change", sync);
    return () => desktopMq.removeEventListener("change", sync);
  }, []);

  return isDesktop;
}
