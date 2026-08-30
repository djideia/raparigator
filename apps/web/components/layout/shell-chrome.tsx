"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { useIsTabActive } from "./tab-activity";

export type ShellChromeState = {
  hideMobileBottomNav: boolean;
  hideTopHeader: boolean;
  hideDesktopNav: boolean;
  mainClassName?: string;
  onBack?: () => void;
  desktopNavRight?: ReactNode;
};

const defaultChrome: ShellChromeState = {
  hideMobileBottomNav: false,
  hideTopHeader: false,
  hideDesktopNav: false,
};

type ShellChromeContextValue = {
  chrome: ShellChromeState;
  setChrome: (chrome: Partial<ShellChromeState>) => void;
  resetChrome: () => void;
};

const ShellChromeContext = createContext<ShellChromeContextValue | null>(null);

export function ShellChromeProvider({ children }: PropsWithChildren) {
  const [chrome, setChromeState] = useState<ShellChromeState>(defaultChrome);

  const setChrome = useCallback((next: Partial<ShellChromeState>) => {
    setChromeState({
      hideMobileBottomNav: next.hideMobileBottomNav ?? false,
      hideTopHeader: next.hideTopHeader ?? false,
      hideDesktopNav: next.hideDesktopNav ?? false,
      mainClassName: next.mainClassName,
      onBack: next.onBack,
      desktopNavRight: next.desktopNavRight,
    });
  }, []);

  const resetChrome = useCallback(() => {
    setChromeState(defaultChrome);
  }, []);

  const value = useMemo<ShellChromeContextValue>(
    () => ({
      chrome,
      setChrome,
      resetChrome,
    }),
    [chrome, setChrome, resetChrome],
  );

  return <ShellChromeContext.Provider value={value}>{children}</ShellChromeContext.Provider>;
}

export function useShellChrome(): ShellChromeState {
  const context = useContext(ShellChromeContext);
  return context?.chrome ?? defaultChrome;
}

export function useSetShellChrome(chrome: Partial<ShellChromeState>): void {
  const context = useContext(ShellChromeContext);
  const isTabActive = useIsTabActive();
  const setChrome = context?.setChrome;
  const resetChrome = context?.resetChrome;
  const hideMobileBottomNav = chrome.hideMobileBottomNav ?? false;
  const hideTopHeader = chrome.hideTopHeader ?? false;
  const hideDesktopNav = chrome.hideDesktopNav ?? false;
  const mainClassName = chrome.mainClassName;
  const onBack = chrome.onBack;
  const desktopNavRight = chrome.desktopNavRight;

  useLayoutEffect(() => {
    if (!setChrome || !resetChrome) {
      return;
    }

    if (!isTabActive) {
      return;
    }

    setChrome({
      hideMobileBottomNav,
      hideTopHeader,
      hideDesktopNav,
      mainClassName,
      onBack,
      desktopNavRight,
    });

    return () => {
      resetChrome();
    };
  }, [
    setChrome,
    resetChrome,
    isTabActive,
    hideMobileBottomNav,
    hideTopHeader,
    hideDesktopNav,
    mainClassName,
    onBack,
    desktopNavRight,
  ]);
}
