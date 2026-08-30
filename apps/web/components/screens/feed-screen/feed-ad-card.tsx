"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { motion, useMotionTemplate, useSpring } from "motion/react";
import type { FeedAdSummary } from "@sigillus/contracts";
import { isLocalImageSrc } from "@/lib/ad-profile-image";
import { cn, currency } from "@/lib/utils";
import { FEED_CARD_SIZE_CLASS } from "./constants";

const DESKTOP_HOVER_QUERY = "(min-width: 1024px) and (pointer: fine)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const MAX_TILT_DEG = 15;
const PRESS_TILT_DEG = 7;
const LIFT_Z_PX = 36;
const HOVER_SCALE = 1.025;
const PRESS_SCALE = 0.982;
const PRESS_SINK_Z_PX = -5;
const PRESS_MOVE_THRESHOLD_PX = 28;
const WAVE_DURATION_MS = 520;
const WAVE_DURATION_REDUCED_MS = 120;
const NAV_COMMIT_MS = 300;
const NAV_COMMIT_REDUCED_MS = 80;

const tiltSpring = { stiffness: 180, damping: 22, mass: 0.35 };
const liftSpring = { stiffness: 220, damping: 24, mass: 0.4 };

type PressRipple = {
  key: number;
  xPercent: number;
  yPercent: number;
  sizePx: number;
  durationMs: number;
};

type PressSession = {
  pointerId: number;
  startX: number;
  startY: number;
  cancelled: boolean;
  released: boolean;
  waveDone: boolean;
  navigating: boolean;
};

function subscribeDesktopHover(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_HOVER_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function useDesktopHoverEnabled() {
  return useSyncExternalStore(
    subscribeDesktopHover,
    () => window.matchMedia(DESKTOP_HOVER_QUERY).matches,
    () => false,
  );
}

function getWaveDurationMs() {
  if (typeof window === "undefined") {
    return WAVE_DURATION_MS;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
    ? WAVE_DURATION_REDUCED_MS
    : WAVE_DURATION_MS;
}

function getNavCommitMs() {
  if (typeof window === "undefined") {
    return NAV_COMMIT_MS;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches ? NAV_COMMIT_REDUCED_MS : NAV_COMMIT_MS;
}

function PremiumFeedCard({ ad, priority = false }: { ad: FeedAdSummary; priority?: boolean }) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const desktopHover = useDesktopHoverEnabled();
  const hoverActive = useRef(false);
  const pressSession = useRef<PressSession | null>(null);
  const waveTimer = useRef<number | null>(null);
  const rippleKey = useRef(0);
  const suppressNextClick = useRef(false);
  const [elevated, setElevated] = useState(false);
  const [ripple, setRipple] = useState<PressRipple | null>(null);

  const rotX = useSpring(0, tiltSpring);
  const rotY = useSpring(0, tiltSpring);
  const liftZ = useSpring(0, liftSpring);
  const scale = useSpring(1, liftSpring);
  const glareX = useSpring(50, tiltSpring);
  const glareY = useSpring(50, tiltSpring);
  const glareOpacity = useSpring(0, liftSpring);

  const transform = useMotionTemplate`perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(${liftZ}px) scale(${scale})`;
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,223,0,0.18) 0%, transparent 55%)`;
  const href = `/anuncio/${ad.slug}`;

  const clearWaveTimer = () => {
    if (waveTimer.current !== null) {
      window.clearTimeout(waveTimer.current);
      waveTimer.current = null;
    }
  };

  const resetTilt = () => {
    hoverActive.current = false;
    setElevated(false);
    rotX.set(0);
    rotY.set(0);
    liftZ.set(0);
    scale.set(1);
    glareX.set(50);
    glareY.set(50);
    glareOpacity.set(0);
  };

  const activateHover = () => {
    hoverActive.current = true;
    setElevated(true);
    liftZ.set(LIFT_Z_PX);
    scale.set(HOVER_SCALE);
    glareOpacity.set(1);
  };

  const applyPressPose = (x: number, y: number, width: number, height: number) => {
    const centerX = (x / width - 0.5) * 2;
    const centerY = (y / height - 0.5) * 2;
    setElevated(true);
    rotX.set(-centerY * PRESS_TILT_DEG);
    rotY.set(centerX * PRESS_TILT_DEG);
    liftZ.set(PRESS_SINK_Z_PX);
    scale.set(PRESS_SCALE);
    glareX.set((x / width) * 100);
    glareY.set((y / height) * 100);
    glareOpacity.set(0.55);
  };

  const finishPressNavigation = () => {
    const session = pressSession.current;
    if (!session || session.cancelled || session.navigating) {
      return;
    }
    if (!session.released || !session.waveDone) {
      return;
    }

    session.navigating = true;
    clearWaveTimer();
    setRipple(null);
    resetTilt();
    pressSession.current = null;
    router.push(href);
  };

  const cancelPress = () => {
    const session = pressSession.current;
    if (!session || session.cancelled || session.navigating) {
      return;
    }

    session.cancelled = true;
    suppressNextClick.current = false;
    clearWaveTimer();
    setRipple(null);
    resetTilt();
    pressSession.current = null;
  };

  const handleMouseEnter = () => {
    if (!desktopHover) {
      return;
    }
    activateHover();
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!desktopHover || !cardRef.current) {
      return;
    }

    const rect = cardRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = (x / rect.width - 0.5) * 2;
    const centerY = (y / rect.height - 0.5) * 2;

    rotX.set(-centerY * MAX_TILT_DEG);
    rotY.set(centerX * MAX_TILT_DEG);
    glareX.set((x / rect.width) * 100);
    glareY.set((y / rect.height) * 100);

    if (!hoverActive.current) {
      activateHover();
    }
  };

  const handleMouseLeave = () => {
    if (!desktopHover) {
      return;
    }
    resetTilt();
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (desktopHover || event.button !== 0 || !cardRef.current) {
      return;
    }

    if (
      pressSession.current &&
      !pressSession.current.cancelled &&
      !pressSession.current.navigating
    ) {
      return;
    }

    const rect = cardRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const durationMs = getWaveDurationMs();
    const navCommitMs = getNavCommitMs();

    clearWaveTimer();
    suppressNextClick.current = true;
    pressSession.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      cancelled: false,
      released: false,
      waveDone: false,
      navigating: false,
    };

    applyPressPose(x, y, rect.width, rect.height);
    router.prefetch(href);
    rippleKey.current += 1;
    const reach = Math.max(
      Math.hypot(x, y),
      Math.hypot(rect.width - x, y),
      Math.hypot(x, rect.height - y),
      Math.hypot(rect.width - x, rect.height - y),
    );
    setRipple({
      key: rippleKey.current,
      xPercent: (x / rect.width) * 100,
      yPercent: (y / rect.height) * 100,
      sizePx: Math.ceil(reach * 2.05),
      durationMs,
    });

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}

    waveTimer.current = window.setTimeout(() => {
      waveTimer.current = null;
      const session = pressSession.current;
      if (!session || session.cancelled) {
        return;
      }
      session.waveDone = true;
      finishPressNavigation();
    }, navCommitMs);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const session = pressSession.current;
    if (
      !session ||
      session.cancelled ||
      session.navigating ||
      session.pointerId !== event.pointerId
    ) {
      return;
    }

    const dx = event.clientX - session.startX;
    const dy = event.clientY - session.startY;
    if (Math.abs(dy) > PRESS_MOVE_THRESHOLD_PX && Math.hypot(dx, dy) > PRESS_MOVE_THRESHOLD_PX) {
      cancelPress();
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const session = pressSession.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    if (session.cancelled || session.navigating) {
      return;
    }

    session.released = true;
    finishPressNavigation();
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    const session = pressSession.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }
    cancelPress();
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (desktopHover || event.detail === 0) {
      return;
    }
    if (!suppressNextClick.current) {
      return;
    }
    event.preventDefault();
    suppressNextClick.current = false;
  };

  useEffect(() => {
    return () => {
      clearWaveTimer();
    };
  }, []);

  const premiumImage = ad.profileImage || ad.images[0];
  const premiumUnoptimized = isLocalImageSrc(premiumImage);
  const waveSeconds = (ripple?.durationMs ?? WAVE_DURATION_MS) / 1000;

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "group relative mx-auto block w-full max-w-[320px] perspective-[1000px] lg:max-w-none",
        elevated ? "z-30" : "z-0",
      )}
    >
      <motion.article
        ref={cardRef}
        className={cn(
          "relative cursor-pointer touch-manipulation transform-3d will-change-transform",
          FEED_CARD_SIZE_CLASS,
        )}
        style={{ transform }}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div className="absolute inset-0 overflow-hidden rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)]">
          <div className="absolute inset-0 bg-[#120d03]" />
          <div
            className="pointer-events-none absolute inset-[-150%] animate-spin bg-[conic-gradient(from_90deg,transparent_0%,transparent_75%,rgba(255,215,0,0.1)_80%,#FFD700_95%,#ffffff_98%,transparent_100%)]"
            style={{ animationDuration: "6.5s", animationTimingFunction: "linear" }}
          />

          <div className="absolute inset-[2.5px] z-10 overflow-hidden rounded-2xl border border-[#a88222]/30 bg-[#121212] shadow-sm transition-shadow duration-300 group-hover:shadow-[0_12px_36px_rgba(218,165,32,0.28)]">
            <Image
              src={premiumImage}
              alt={`${ad.artisticName} premium`}
              fill
              priority={priority}
              className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized={premiumUnoptimized}
            />

            <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/20 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,223,0,0.06)_0%,transparent_40%,rgba(218,165,32,0.1)_100%)]" />

            <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-[#DAA520]/70 bg-linear-to-br from-[#2a2a2a] to-[#0a0a0a] px-3 py-1.5 shadow-[0_4px_6px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md">
              <span className="text-[10px] text-[#FFDF00] drop-shadow-[0_0_4px_rgba(255,223,0,0.9)]">
                ★
              </span>
              <span className="bg-linear-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] bg-clip-text text-[10px] font-extrabold uppercase tracking-[0.2em] text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                Premium
              </span>
            </div>

            <div className="absolute right-4 top-4 z-20 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-[#FFDF00] shadow-sm ring-1 ring-[#DAA520]/60 backdrop-blur-sm">
              ★ {ad.rating.toFixed(1)}
            </div>

            <div className="absolute bottom-0 left-0 w-full px-5 pb-5">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                    ad.status === "livre"
                      ? "border border-emerald-800/50 bg-emerald-950/80 text-emerald-400"
                      : ad.status === "em_atendimento"
                        ? "border border-amber-800/50 bg-amber-950/80 text-amber-400"
                        : "border border-zinc-700/50 bg-zinc-900/80 text-zinc-400",
                  )}
                >
                  {ad.status === "livre"
                    ? "Livre"
                    : ad.status === "em_atendimento"
                      ? "Em atendimento"
                      : "Indisponivel"}
                </span>
              </div>
              <h3 className="font-display text-2xl font-semibold leading-tight text-[#FFDF00] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {ad.artisticName}
              </h3>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-zinc-300 drop-shadow-md">
                A partir de{" "}
                <span className="text-sm font-bold tracking-normal text-[#FFDF00]">
                  {currency(ad.startingPrice)}
                </span>
              </p>
            </div>

            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{
                background: glareBackground,
                opacity: glareOpacity,
                mixBlendMode: "overlay",
              }}
            />

            {ripple ? (
              <div
                data-premium-press-ripple="true"
                className="pointer-events-none absolute inset-0 z-40 overflow-hidden rounded-2xl"
              >
                <motion.div
                  key={`${ripple.key}-fill`}
                  className="absolute rounded-full will-change-transform"
                  style={{
                    left: `${ripple.xPercent}%`,
                    top: `${ripple.yPercent}%`,
                    width: ripple.sizePx,
                    height: ripple.sizePx,
                    marginLeft: -ripple.sizePx / 2,
                    marginTop: -ripple.sizePx / 2,
                    background:
                      "radial-gradient(circle, rgba(255,223,0,0.62) 0%, rgba(218,165,32,0.48) 20%, rgba(18,13,3,0.58) 46%, rgba(0,0,0,0.4) 68%, rgba(0,0,0,0) 86%)",
                  }}
                  initial={{ scale: 0.1, opacity: 0.88 }}
                  animate={{ scale: 1, opacity: [0.88, 0.8, 0.55, 0] }}
                  transition={{
                    duration: waveSeconds,
                    ease: [0.22, 0.1, 0.28, 1],
                    opacity: {
                      duration: waveSeconds,
                      times: [0, 0.35, 0.62, 1],
                      ease: "easeInOut",
                    },
                  }}
                />
                <motion.div
                  key={`${ripple.key}-ring`}
                  className="absolute rounded-full will-change-transform"
                  style={{
                    left: `${ripple.xPercent}%`,
                    top: `${ripple.yPercent}%`,
                    width: ripple.sizePx,
                    height: ripple.sizePx,
                    marginLeft: -ripple.sizePx / 2,
                    marginTop: -ripple.sizePx / 2,
                    border: "1.5px solid rgba(255,223,0,0.55)",
                    boxShadow:
                      "0 0 18px rgba(218,165,32,0.35), inset 0 0 22px rgba(255,223,0,0.18)",
                  }}
                  initial={{ scale: 0.1, opacity: 0.75 }}
                  animate={{ scale: 1, opacity: [0.75, 0.6, 0.3, 0] }}
                  transition={{
                    duration: waveSeconds,
                    ease: [0.22, 0.1, 0.28, 1],
                    opacity: { duration: waveSeconds, times: [0, 0.32, 0.6, 1], ease: "easeInOut" },
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

export function FeedAdCard({ ad, priority = false }: { ad: FeedAdSummary; priority?: boolean }) {
  const [imageIndex, setImageIndex] = useState(0);
  const isPremium = ad.adTier === "premium";

  useEffect(() => {
    if (!isPremium || ad.images.length < 2) return;

    const interval = window.setInterval(() => {
      setImageIndex((current) => (current + 1) % ad.images.length);
    }, 2800);

    return () => window.clearInterval(interval);
  }, [isPremium, ad.images.length]);

  const currentImage =
    (imageIndex === 0 ? ad.profileImage : undefined) ||
    ad.images[imageIndex] ||
    ad.profileImage ||
    ad.images[0];

  if (isPremium) {
    return <PremiumFeedCard ad={ad} priority={priority} />;
  }

  const statusLabel =
    ad.status === "livre"
      ? "LIVRE"
      : ad.status === "em_atendimento"
        ? "EM ATENDIMENTO"
        : "INDISPONIVEL";
  const statusClassName =
    ad.status === "livre"
      ? "border-emerald-800/30 bg-emerald-900/30 text-emerald-400"
      : ad.status === "em_atendimento"
        ? "border-amber-800/30 bg-amber-900/30 text-amber-500"
        : "border-zinc-700/50 bg-zinc-900/80 text-zinc-400";

  return (
    <Link
      href={`/anuncio/${ad.slug}`}
      className="group mx-auto block w-full max-w-[320px] cursor-pointer lg:max-w-none"
    >
      <article
        className={cn(
          "isolate relative overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#121212] shadow-md transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#4a4a4a] hover:shadow-xl active:scale-[0.98]",
          FEED_CARD_SIZE_CLASS,
        )}
      >
        <Image
          src={currentImage}
          alt={`${ad.artisticName} em ${ad.city}`}
          fill
          priority={priority}
          unoptimized={isLocalImageSrc(currentImage)}
          className="object-cover object-center opacity-90 transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, 320px"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/20 to-transparent" />

        <div className="absolute right-3 top-3 z-20 flex items-start justify-end">
          <div className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-zinc-900 shadow-sm">
            <span className="text-[11px]">★</span>
            <span className="text-[11px] font-bold">{ad.rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-5">
          <div className="mb-2">
            <span
              className={cn(
                "inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-widest",
                statusClassName,
              )}
            >
              {statusLabel}
            </span>
          </div>

          <h3 className="text-2xl font-semibold tracking-tight text-zinc-100 [text-shadow:0_2px_6px_rgba(0,0,0,0.85)]">
            {ad.artisticName}
          </h3>
          <p className="mt-1 text-xs text-zinc-300 [text-shadow:0_2px_4px_rgba(0,0,0,0.85)]">
            {ad.neighborhood}, {ad.city}
          </p>
          <p className="mt-1.5 text-[11px] font-medium uppercase tracking-widest text-zinc-300 [text-shadow:0_2px_4px_rgba(0,0,0,0.85)]">
            A partir de{" "}
            <span className="text-sm font-bold tracking-normal text-zinc-100">
              {currency(ad.startingPrice)}
            </span>
          </p>
        </div>
      </article>
    </Link>
  );
}
