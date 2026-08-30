import { useEffect } from "react";

let modalLockCount = 0;
let previousBodyOverflow: string | null = null;

function getAppShell() {
  return document.querySelector<HTMLElement>("[data-app-shell]");
}

export function acquireModalLock() {
  if (typeof document === "undefined") {
    return () => {};
  }

  if (modalLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.setAttribute("data-modal-open", "");

    const appShell = getAppShell();
    appShell?.setAttribute("inert", "");

    const active = document.activeElement;
    if (active instanceof HTMLElement && appShell?.contains(active)) {
      active.blur();
    }
  }

  modalLockCount += 1;

  return () => {
    modalLockCount = Math.max(0, modalLockCount - 1);

    if (modalLockCount === 0) {
      if (previousBodyOverflow !== null) {
        document.body.style.overflow = previousBodyOverflow;
        previousBodyOverflow = null;
      }

      document.body.removeAttribute("data-modal-open");
      getAppShell()?.removeAttribute("inert");
    }
  };
}

export function useModalLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    return acquireModalLock();
  }, [open]);
}
