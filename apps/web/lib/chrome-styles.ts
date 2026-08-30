export const chromeGlassDarkSurface = "bg-zinc-950/50 backdrop-blur-xl backdrop-saturate-150";

export const chromeGlass = "sticky top-0 z-30 bg-white/45 backdrop-blur-xl backdrop-saturate-150";

export const chromeGlassDark = `sticky top-0 z-30 ${chromeGlassDarkSurface}`;

export const chromeGlassFixed = "fixed inset-x-0 top-0 z-30 isolate overflow-visible";

export const chromeScrim =
  "pointer-events-none absolute inset-x-0 top-0 z-0 h-[5rem] bg-[linear-gradient(to_bottom,rgba(250,250,250,0.98)_0%,rgba(250,250,250,0.88)_26%,rgba(250,250,250,0.55)_48%,rgba(250,250,250,0.22)_72%,rgba(250,250,250,0)_100%)] md:h-[5.5rem]";

export const chromeScrimBlur =
  "pointer-events-none absolute inset-x-0 top-0 z-0 h-[3.5rem] backdrop-blur-[9px] [mask-image:linear-gradient(to_bottom,black_22%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_22%,transparent_100%)] md:h-[3.75rem]";

export const chromeScrimDark =
  "pointer-events-none absolute inset-x-0 top-0 z-0 h-[4.5rem] bg-[linear-gradient(to_bottom,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.28)_45%,rgba(0,0,0,0)_100%)] md:h-[5rem]";

export const chromeScrimBlurDark =
  "pointer-events-none absolute inset-x-0 top-0 z-0 h-[3rem] backdrop-blur-[7px] [mask-image:linear-gradient(to_bottom,black_18%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_18%,transparent_100%)] md:h-[3.25rem]";

export const chromeControlsRow = "pointer-events-auto relative z-20 overflow-visible";

export const chromePillBase =
  "inline-flex h-10 shrink-0 items-center rounded-full border border-transparent shadow-[0_2px_10px_rgba(15,23,42,0.08)] transition";

export const chromePill = `${chromePillBase} border-zinc-200/80 bg-white hover:bg-white`;

export const chromePillActive = `${chromePillBase} border-wine-700 bg-wine-700 text-white hover:bg-wine-800`;

export const chromePillDark = `${chromePillBase} border-zinc-700 bg-zinc-900/80 hover:bg-zinc-900`;

export const chromeCircle = `inline-flex h-10 w-10 shrink-0 items-center justify-center text-zinc-900 ${chromePill}`;

export const chromeHeaderOffset =
  "pt-[calc(4rem+env(safe-area-inset-top,0px))] md:pt-[calc(5rem+env(safe-area-inset-top,0px))]";

export const chromeDesktopNavSticky = "sticky top-[calc(5rem+env(safe-area-inset-top,0px))] z-20";

export const chromeBelowDesktopNavStickyTop = "top-[calc(9rem+env(safe-area-inset-top,0px))]";

export const chromeBelowDesktopNavStickyMaxH =
  "max-h-[calc(100dvh-9rem-env(safe-area-inset-top,0px)-1.5rem)]";

export const chromeBelowDesktopNavStickyMinH =
  "lg:min-h-[calc(100dvh-9rem-env(safe-area-inset-top,0px)-1.5rem)]";

export const chromeBelowHeaderStickyTop = "top-[calc(5rem+env(safe-area-inset-top,0px))]";

export const chromeBelowHeaderStickyMaxH =
  "max-h-[calc(100dvh-5rem-env(safe-area-inset-top,0px)-1.5rem)]";

export const chromeBelowHeaderStickyMinH =
  "lg:min-h-[calc(100dvh-5rem-env(safe-area-inset-top,0px)-1.5rem)]";

export const chromeSafeTop = "pt-[max(0.75rem,env(safe-area-inset-top,0px))]";

export const shellContainerClass = "mr-auto w-full max-w-7xl px-4 sm:px-6 lg:max-w-430 lg:px-8";
