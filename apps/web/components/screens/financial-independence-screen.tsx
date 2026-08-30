"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoHint } from "@/components/ui/info-hint";
import { Select } from "@/components/ui/select";
import { ShinyButton } from "@/components/ui/shiny-button";
import { PremiumConversionModal } from "@/components/ui/premium-conversion-modal";
import { useAuthSession } from "@/lib/auth-session";
import { chromeBelowHeaderStickyTop } from "@/lib/chrome-styles";
import {
  buildCltReference,
  CLT_FGTS_RATE,
  CLT_INSS_RATE,
  CLT_VT_RATE,
  type CltReference,
} from "@/lib/clt-reference";
import { usePremiumPlan, PREMIUM_VISIBILITY_MULTIPLIER } from "@/lib/premium-plan";
import { cn, currency } from "@/lib/utils";

const TARGET = 1_000_000;

function CltPayrollBreakdown({ clt }: { clt: CltReference }) {
  const { gross, inss, transport, fgtsEmployer, irrf, net, legalAct, effectiveFrom } = clt;
  const [year] = effectiveFrom.split("-");
  return (
    <div className="space-y-2" data-testid="clt-payroll-breakdown">
      <p className="font-semibold text-zinc-800">Salário mínimo vigente ({year})</p>
      <ul className="space-y-1 text-zinc-600">
        <li className="flex justify-between gap-3">
          <span>Bruto</span>
          <span className="shrink-0 font-medium text-zinc-800">{currency(gross)}</span>
        </li>
        <li className="flex justify-between gap-3">
          <span>− INSS ({(CLT_INSS_RATE * 100).toFixed(1).replace(".", ",")}%)</span>
          <span className="shrink-0 font-medium text-zinc-800">{currency(inss)}</span>
        </li>
        <li className="flex justify-between gap-3">
          <span>− Vale-transporte ({(CLT_VT_RATE * 100).toFixed(0)}%)</span>
          <span className="shrink-0 font-medium text-zinc-800">{currency(transport)}</span>
        </li>
        <li className="flex justify-between gap-3">
          <span>− IRRF</span>
          <span className="shrink-0 font-medium text-zinc-800">{currency(irrf)}</span>
        </li>
        <li className="flex justify-between gap-3 border-t border-zinc-100 pt-1 font-semibold text-zinc-800">
          <span>= Líquido na comparação</span>
          <span className="shrink-0">{currency(net)}</span>
        </li>
      </ul>
      <p className="text-[11px] leading-snug text-zinc-500">
        Fonte: {legalAct}. FGTS ({(CLT_FGTS_RATE * 100).toFixed(0)}% = {currency(fgtsEmployer)}) é
        depósito do empregador — não desconta do contracheque.
      </p>
    </div>
  );
}

// Metas tangíveis para o "Conceito C"
const DREAMS = [
  { id: "moto", label: "Moto Esportiva", price: 35_000, icon: IconMoto },
  { id: "carro", label: "Carro SUV", price: 120_000, icon: IconCar },
  { id: "casa", label: "Casa Própria", price: 350_000, icon: IconHome },
  {
    id: "milhao",
    label: "Liberdade (1 Milhão)",
    price: 1_000_000,
    icon: IconTrophy,
    highlight: true,
  },
];

// --- Ícones SVG Inline ---
function IconRocket(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.1 4-1 4-1" />
      <path d="M12 15v5s3.03-.55 4-2c1.1-1.62 1-4 1-4" />
    </svg>
  );
}
function IconTurtle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m19 7-7 5-7-5" />
      <path d="M12 22a10 10 0 0 1-10-10" />
      <path d="M22 12a10 10 0 0 1-10 10" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconCalendar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
function IconMoto(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M15 6h-5a1 1 0 0 0-1 1v4h-3v-3h2l1-4h3l2 2Z" />
      <path d="M12 11h7v3h-3" />
    </svg>
  );
}
function IconCar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
      <path d="M14 14h6" />
    </svg>
  );
}
function IconHome(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function IconTrophy(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
function IconRefresh(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
function IconMinus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="23"
        rx="11.5"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path d="M17.3334 12H6.66669" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="23"
        rx="11.5"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.3334 11.3333V7.33332C11.3334 6.96666 11.6334 6.66666 12 6.66666C12.3667 6.66666 12.6667 6.96666 12.6667 7.33332V11.3333H16.6667C17.0334 11.3333 17.3334 11.6333 17.3334 12C17.3334 12.3667 17.0334 12.6667 16.6667 12.6667H12.6667V16.6667C12.6667 17.0333 12.3667 17.3333 12 17.3333C11.6334 17.3333 11.3334 17.0333 11.3334 16.6667V12.6667H7.33335C6.96669 12.6667 6.66669 12.3667 6.66669 12C6.66669 11.6333 6.96669 11.3333 7.33335 11.3333H11.3334Z"
        fill="currentColor"
      />
    </svg>
  );
}
function IconUsers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconDollarSign(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="1" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function IconClock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// --- Componente Counter (input com botões +/-) ---
interface CounterProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  highlighted?: boolean;
}

function Counter({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  prefix,
  suffix,
  icon,
  highlighted = false,
}: CounterProps) {
  const adjust = (delta: number) => {
    const current = Number(value) || min;
    const next = Math.max(min, Math.min(max, current + delta));
    onChange(String(next));
  };

  return (
    <div className="space-y-1">
      <label className="text-xs sm:text-sm font-medium text-zinc-700 flex items-center gap-2">
        {icon && <span className="text-zinc-600">{icon}</span>}
        {label}
      </label>
      <div
        className={`flex h-10 items-center justify-between rounded-xl border px-3 transition-all ${
          highlighted ? "border-wine-300 bg-wine-50/30 shadow-sm" : "border-zinc-200 bg-white"
        }`}
      >
        <button
          type="button"
          onClick={() => adjust(-step)}
          className="flex shrink-0 items-center justify-center border-0 bg-transparent p-1.5 hover:bg-zinc-100 rounded-lg transition-colors -ml-1.5"
          aria-label={`diminui ${step}`}
        >
          <IconMinus className="w-5 h-5 text-zinc-700" />
        </button>
        <div className="flex items-center text-sm font-semibold text-zinc-900">
          {prefix && <span className="text-xs text-zinc-500 mr-1">{prefix}</span>}
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const num = e.target.value.replace(/\D/g, "");
              onChange(num);
            }}
            className="w-12 text-center text-sm rounded-none border-none bg-transparent font-semibold text-zinc-900 focus:outline-none"
            inputMode="numeric"
          />
          {suffix && <span className="text-xs text-zinc-500 ml-1">/{suffix}</span>}
        </div>
        <button
          type="button"
          onClick={() => adjust(step)}
          className="flex shrink-0 items-center justify-center border-0 bg-transparent p-1.5 hover:bg-zinc-100 rounded-lg transition-colors -mr-1.5"
          aria-label={`adiciona ${step}`}
        >
          <IconPlus className="w-5 h-5 text-zinc-700" />
        </button>
      </div>
    </div>
  );
}

// --- Funções Auxiliares ---
function formatDurationDetailed(totalMonths: number) {
  const years = Math.floor(totalMonths / 12);
  const months = Math.ceil(totalMonths % 12);
  const yearLabel = years === 1 ? "Ano" : "Anos";
  const monthLabel = months === 1 ? "Mês" : "Meses";

  if (years > 0) {
    if (months > 0) return `${years} ${yearLabel} e ${months} ${monthLabel}`;
    return `${years} ${yearLabel}`;
  }
  return `${months} ${monthLabel}`;
}

export function FinancialIndependenceScreen() {
  const [hourlyValue, setHourlyValue] = useState("300");
  const [contactsPerDay, setContactsPerDay] = useState("4");
  const [workDaysPerWeek, setWorkDaysPerWeek] = useState("5");

  const [projectionTime, setProjectionTime] = useState("");
  const [projectionUnit, setProjectionUnit] = useState("months");

  const [submitted, setSubmitted] = useState(false);
  const [infoOpenId, setInfoOpenId] = useState<string | null>(null);
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  const [topSearchBoost, setTopSearchBoost] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const router = useRouter();
  const { role } = useAuthSession();
  const { isPremium } = usePremiumPlan();
  const reduceMotion = useReducedMotion();
  const isProfessional = role === "profissional";

  const handleCreateProfessionalAccount = () => {
    router.push("/auth/cadastro/profissional");
  };

  const handleTryPremium = () => {
    switch (role) {
      case "visitor":
        router.push("/auth/login");
        return;
      case "cliente":
        router.push("/auth/cadastro/profissional");
        return;
      case "profissional":
        if (isPremium) {
          router.push("/profissional/assinatura-premium");
          return;
        }
        setUpsellOpen(true);
        return;
      default: {
        const _exhaustive: never = role;
        return _exhaustive;
      }
    }
  };

  const heroEase = [0.45, 0.05, 0.55, 0.95] as const;
  const heroMotionTransition = reduceMotion
    ? { duration: 0.12, ease: "easeInOut" as const }
    : { duration: 0.28, ease: heroEase };
  const premiumPopTransition = reduceMotion
    ? { duration: 0.14, ease: "easeOut" as const }
    : { type: "spring" as const, stiffness: 420, damping: 18, mass: 0.85 };
  const expandedFadeTransition = reduceMotion
    ? { duration: 0.12, ease: "easeInOut" as const }
    : heroCollapsed
      ? { duration: 0.22, delay: 0.06, ease: heroEase }
      : { duration: 0.3, delay: 0.14, ease: heroEase };
  const compactFadeTransition = reduceMotion
    ? { duration: 0.12, ease: "easeInOut" as const }
    : heroCollapsed
      ? { duration: 0.3, delay: 0.14, ease: heroEase }
      : { duration: 0.18, delay: 0.02, ease: heroEase };
  const premiumAccentStrong = topSearchBoost
    ? "bg-linear-to-r from-[#BF953F] via-[#B8860B] to-[#B38728] bg-clip-text text-transparent"
    : "text-emerald-600";
  const premiumLabel = topSearchBoost ? "text-[#B8860B]" : "text-emerald-700";
  const premiumSoftLabel = topSearchBoost ? "text-[#B8860B]/80" : "text-emerald-800/70";
  const expandedLayerRef = useRef<HTMLDivElement>(null);
  const compactLayerRef = useRef<HTMLDivElement>(null);
  const heroCollapsedRef = useRef(false);
  const topSearchBoostRef = useRef(topSearchBoost);
  const collapseLockUntilRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const [heroLayerHeights, setHeroLayerHeights] = useState({ expanded: 0, compact: 0 });

  useEffect(() => {
    heroCollapsedRef.current = heroCollapsed;
  }, [heroCollapsed]);

  useEffect(() => {
    topSearchBoostRef.current = topSearchBoost;
  }, [topSearchBoost]);

  useEffect(() => {
    if (!submitted) return;

    lastScrollYRef.current = window.scrollY || document.documentElement.scrollTop;

    const resolveCollapseThresholds = () => {
      const baseCollapseY = 88;
      const baseExpandY = 48;
      if (!topSearchBoostRef.current) {
        return { collapseY: baseCollapseY, expandY: baseExpandY };
      }
      const premiumEl = document.querySelector('[data-testid="freedom-premium-card"]');
      const premiumHeight = premiumEl instanceof HTMLElement ? premiumEl.offsetHeight : 0;
      const collapseY = Math.max(baseCollapseY + 140, Math.round(premiumHeight * 0.9));
      const expandY = Math.max(baseExpandY, Math.round(collapseY * 0.4));
      return { collapseY, expandY };
    };

    const onScroll = () => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      if (!isMobile) {
        setHeroCollapsed(false);
        return;
      }
      const y = window.scrollY || document.documentElement.scrollTop;
      const scrollingUp = y < lastScrollYRef.current - 0.5;
      lastScrollYRef.current = y;
      const maxScroll = Math.max(
        0,
        (document.documentElement.scrollHeight || 0) - window.innerHeight,
      );
      const nearBottom = maxScroll > 48 && y >= maxScroll - 16;
      const { collapseY, expandY } = resolveCollapseThresholds();
      const shouldCollapse = y > collapseY || nearBottom;
      if (shouldCollapse) {
        if (!heroCollapsedRef.current) {
          collapseLockUntilRef.current = performance.now() + 400;
        }
        setHeroCollapsed(true);
        setInfoOpenId(null);
        return;
      }
      if (
        heroCollapsedRef.current &&
        y < expandY &&
        performance.now() >= collapseLockUntilRef.current &&
        (scrollingUp || y <= 2)
      ) {
        setHeroCollapsed(false);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [submitted, topSearchBoost]);

  const parsed = useMemo(() => {
    const value = Number(hourlyValue);
    const contacts = Number(contactsPerDay);
    const days = Number(workDaysPerWeek);

    // Validação básica
    const valid = value > 0 && contacts > 0 && days > 0 && days <= 7;
    if (!valid) return null;

    const boostMultiplier = topSearchBoost ? PREMIUM_VISIBILITY_MULTIPLIER : 1;
    const baseMonthlyRevenue = value * contacts * days * 4.33;
    const premiumMonthlyRevenue = baseMonthlyRevenue * PREMIUM_VISIBILITY_MULTIPLIER;
    const monthlyRevenue = baseMonthlyRevenue * boostMultiplier;

    const monthsToMillionBase = Math.ceil(TARGET / baseMonthlyRevenue);
    const monthsToMillionPremium = Math.ceil(TARGET / premiumMonthlyRevenue);

    const clt = buildCltReference();

    const monthsToMillionUser = Math.ceil(TARGET / monthlyRevenue);
    const monthsToMillionCLT = Math.ceil(TARGET / clt.net);

    const monthsSaved = monthsToMillionCLT - monthsToMillionUser;
    const yearsSaved = Math.floor(monthsSaved / 12);

    const equivalenceRatio = monthlyRevenue / clt.net;

    const dreamsCalculated = DREAMS.map((dream) => ({
      ...dream,
      monthsToAchieve: Math.ceil(dream.price / monthlyRevenue),
    }));

    const effectiveTimeNum = Number(projectionTime) > 0 ? Number(projectionTime) : 1;
    const effectiveUnit = Number(projectionTime) > 0 ? projectionUnit : "months";

    const projectionMonths = effectiveUnit === "years" ? effectiveTimeNum * 12 : effectiveTimeNum;
    const projectedAmount = monthlyRevenue * projectionMonths;

    return {
      value,
      contacts,
      days,
      monthlyRevenue,
      baseMonthlyRevenue,
      premiumMonthlyRevenue,
      monthsToMillionUser,
      monthsToMillionBase,
      monthsToMillionPremium,
      monthsToMillionCLT,
      yearsSaved,
      monthsSaved,
      equivalenceRatio,
      dreamsCalculated,
      projectedAmount,
      effectiveTimeNum,
      effectiveUnit,
      monthsSavedWithPremium: monthsToMillionBase - monthsToMillionPremium,
      projectionMonths,
      clt,
    };
  }, [
    hourlyValue,
    contactsPerDay,
    workDaysPerWeek,
    projectionTime,
    projectionUnit,
    topSearchBoost,
  ]);

  const cltReference = useMemo(() => buildCltReference(), []);

  const handleReset = () => {
    setSubmitted(false);
    setInfoOpenId(null);
    setHeroCollapsed(false);
  };

  const hasProjection = Number(projectionTime) > 0;

  useLayoutEffect(() => {
    if (!submitted) return;
    let alive = true;
    const measure = () => {
      const expandedEl = expandedLayerRef.current;
      const compactEl = compactLayerRef.current;
      if (!expandedEl || !compactEl) return;
      const expanded = Math.ceil(
        Math.max(expandedEl.scrollHeight, expandedEl.getBoundingClientRect().height),
      );
      const compact = Math.ceil(
        Math.max(compactEl.scrollHeight, compactEl.getBoundingClientRect().height),
      );
      if (!alive || (expanded <= 0 && compact <= 0)) return;
      setHeroLayerHeights((prev) => {
        const next = {
          expanded: expanded > 0 ? expanded : prev.expanded,
          compact: compact > 0 ? compact : prev.compact,
        };
        if (prev.expanded === next.expanded && prev.compact === next.compact) return prev;
        return next;
      });
    };
    measure();
    const raf = window.requestAnimationFrame(() => {
      measure();
      window.requestAnimationFrame(measure);
    });
    const observer = new ResizeObserver(measure);
    if (expandedLayerRef.current) observer.observe(expandedLayerRef.current);
    if (compactLayerRef.current) observer.observe(compactLayerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      alive = false;
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [
    submitted,
    topSearchBoost,
    hourlyValue,
    contactsPerDay,
    workDaysPerWeek,
    projectionTime,
    projectionUnit,
  ]);

  const targetHeroHeight = heroCollapsed ? heroLayerHeights.compact : heroLayerHeights.expanded;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl min-w-0 space-y-4 md:space-y-5">
        {!submitted && (
          <>
            <header className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-zinc-900 md:text-2xl">
                  Calculadora de Liberdade
                </h1>
                <InfoHint
                  id="calc-base"
                  label="Como calculamos"
                  openId={infoOpenId}
                  onOpenChange={setInfoOpenId}
                >
                  <div className="space-y-2" data-testid="hint-calc-base">
                    <p className="font-semibold text-zinc-800">Seu ritmo na calculadora</p>
                    <p>
                      Valor por hora × contatos/dia × dias/semana × 4,33 semanas ≈ receita mensal
                      estimada.
                    </p>
                    <p className="text-[11px] leading-snug text-zinc-500">
                      A comparação com CLT no painel usa o salário mínimo vigente (
                      {currency(cltReference.gross)}, {cltReference.legalAct}) já com descontos de
                      contracheque.
                    </p>
                  </div>
                </InfoHint>
              </div>
              <p className="text-sm text-zinc-600">
                Descubra o quão rápido você pode atingir sua independência financeira.
              </p>
            </header>

            <Card className="space-y-4 p-4 md:space-y-5 md:p-6">
              <div className="grid gap-3 md:grid-cols-2 md:gap-4">
                <Counter
                  label="Valor por hora do seu anúncio"
                  value={hourlyValue}
                  onChange={setHourlyValue}
                  step={50}
                  min={50}
                  max={9999}
                  prefix="R$"
                  icon={<IconDollarSign className="w-4 h-4" />}
                />
                <Counter
                  label="Contatos por dia"
                  value={contactsPerDay}
                  onChange={setContactsPerDay}
                  step={1}
                  min={1}
                  max={20}
                  icon={<IconUsers className="w-4 h-4" />}
                />
                <Counter
                  label="Dias de trabalho por semana"
                  value={workDaysPerWeek}
                  onChange={setWorkDaysPerWeek}
                  step={1}
                  min={1}
                  max={7}
                  icon={<IconCalendar className="w-4 h-4" />}
                />

                <div
                  className={`flex gap-2 transition-all duration-300 ${hasProjection ? "opacity-100 grayscale-0" : "opacity-50 grayscale hover:opacity-100 hover:grayscale-0"}`}
                >
                  <div className="flex-1">
                    <Counter
                      label="Meta de tempo (Opcional)"
                      value={projectionTime}
                      onChange={(e) => setProjectionTime(Number(e) > 0 ? e : "")}
                      step={1}
                      min={0}
                      max={120}
                      icon={<IconClock className="w-4 h-4" />}
                      highlighted={hasProjection}
                    />
                  </div>
                  <div className="w-32">
                    <Select
                      id="unidade-tempo"
                      label="Unidade"
                      value={projectionUnit}
                      onChange={(e) => setProjectionUnit(e.target.value)}
                      options={[
                        { value: "months", label: "Meses" },
                        { value: "years", label: "Anos" },
                      ]}
                      className={
                        hasProjection
                          ? "border-wine-300 bg-wine-50/30 text-wine-900"
                          : "border-zinc-200 bg-white text-zinc-900"
                      }
                    />
                  </div>
                </div>
              </div>

              {parsed ? (
                <div
                  data-testid="freedom-live-preview"
                  className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-center"
                >
                  <p className="text-lg font-bold text-emerald-700 md:text-xl">
                    ≈ {currency(parsed.monthlyRevenue)} / mês
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-emerald-800/80 md:text-sm">
                    Até R$ 1 mi: {formatDurationDetailed(parsed.monthsToMillionUser)}
                  </p>
                </div>
              ) : null}

              <Button
                size="lg"
                className="w-full text-base font-semibold md:text-lg"
                onClick={() => {
                  setInfoOpenId(null);
                  setSubmitted(true);
                }}
              >
                Ver meu Painel da Liberdade 🚀
              </Button>
            </Card>
          </>
        )}

        {submitted && parsed ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 md:space-y-4">
            <div
              data-testid="freedom-premium-card"
              className={cn(
                "rounded-2xl border p-4 shadow-sm transition-colors sm:p-5",
                topSearchBoost
                  ? "border-[#DAA520]/55 bg-[#121212]"
                  : "border-zinc-200 bg-white shadow-zinc-200/70",
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p
                      className={cn(
                        "text-sm font-bold",
                        topSearchBoost ? "text-[#FFDF00]" : "text-zinc-900",
                      )}
                    >
                      Topo das Pesquisas
                    </p>
                    <InfoHint
                      id="premium"
                      label="Sobre o Topo das Pesquisas"
                      openId={infoOpenId}
                      onOpenChange={setInfoOpenId}
                      className={
                        topSearchBoost
                          ? "[&_button]:border-[#DAA520]/60 [&_button]:bg-zinc-900 [&_button]:text-[#FFDF00] [&_button]:hover:border-[#DAA520] [&_button]:hover:text-[#FFDF00]"
                          : undefined
                      }
                    >
                      Simula o efeito da visibilidade Premium nos seus números.
                    </InfoHint>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={topSearchBoost}
                  aria-label="Simular com Topo das Pesquisas"
                  data-testid="freedom-premium-switch"
                  onClick={() => setTopSearchBoost((prev) => !prev)}
                  className={cn(
                    "relative h-8 w-14 shrink-0 rounded-full p-[2.5px] transition-colors",
                    topSearchBoost ? "bg-[#DAA520]" : "shiny-switch-border",
                  )}
                >
                  <span
                    className={cn(
                      "relative block h-full w-full rounded-full",
                      topSearchBoost ? "bg-[#DAA520]" : "bg-zinc-300",
                    )}
                  >
                    <motion.span
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={cn(
                        "absolute top-0.5 h-5.5 w-5.5 rounded-full bg-white shadow-md ring-1 ring-zinc-200/80",
                        topSearchBoost ? "left-[calc(100%-1.5rem)] ring-[#DAA520]/30" : "left-0.5",
                      )}
                    />
                  </span>
                </button>
              </div>
              <AnimatePresence>
                {topSearchBoost ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-4 border-t border-[#DAA520]/25 pt-4">
                      <div
                        data-testid="freedom-premium-justification"
                        className="space-y-3 rounded-xl border border-[#DAA520]/25 bg-black/30 p-3"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                              Sem Premium
                            </p>
                            <p className="mt-1 text-sm font-bold text-zinc-200">
                              {currency(parsed.baseMonthlyRevenue)}/mês
                            </p>
                            <p className="text-xs text-zinc-400">
                              {formatDurationDetailed(parsed.monthsToMillionBase)} até R$ 1 mi
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-[#DAA520]">
                              Com Premium
                            </p>
                            <p className="mt-1 text-sm font-bold text-[#FFDF00]">
                              {currency(parsed.premiumMonthlyRevenue)}/mês
                            </p>
                            <p className="text-xs text-[#FFDF00]/80">
                              {formatDurationDetailed(parsed.monthsToMillionPremium)} até R$ 1 mi
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold leading-snug text-[#FFDF00]">
                          +{currency(parsed.premiumMonthlyRevenue - parsed.baseMonthlyRevenue)}/mês
                          no bolso e o milhão em{" "}
                          {formatDurationDetailed(parsed.monthsToMillionPremium)} —{" "}
                          {parsed.monthsSavedWithPremium}{" "}
                          {parsed.monthsSavedWithPremium === 1 ? "mês" : "meses"} a menos no
                          caminho.
                        </p>
                      </div>
                      <div data-testid="freedom-premium-cta" className="space-y-3">
                        <p className="text-center text-base font-semibold leading-snug text-white">
                          Pronta pra alcançar sua liberdade mais fácil?
                        </p>
                        {!isPremium ? (
                          <ShinyButton
                            size="sm"
                            className="w-full min-w-0"
                            onClick={() => setUpsellOpen(true)}
                          >
                            Experimentar o Premium
                          </ShinyButton>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div
              data-testid="freedom-hero"
              data-collapsed={heroCollapsed ? "true" : "false"}
              data-premium={topSearchBoost ? "true" : "false"}
              className={cn(
                "pointer-events-none z-10 w-full min-w-0 max-w-full border shadow-sm transition-[border-radius,background-color,border-color] duration-500 ease-in-out",
                topSearchBoost
                  ? "border-[#DAA520]/55 bg-[#FFF9E8]"
                  : "border-emerald-200/90 bg-emerald-50",
                "sticky [overflow-anchor:none]",
                chromeBelowHeaderStickyTop,
                "md:top-[calc(9rem+env(safe-area-inset-top,0px))]",
                heroCollapsed ? "rounded-xl" : "rounded-2xl",
              )}
            >
              <motion.div
                className="relative overflow-hidden will-change-[height] pointer-events-none"
                initial={false}
                animate={{ height: targetHeroHeight > 0 ? targetHeroHeight : "auto" }}
                transition={heroMotionTransition}
              >
                <motion.div
                  ref={expandedLayerRef}
                  data-testid="freedom-hero-expanded"
                  aria-hidden={heroCollapsed}
                  initial={false}
                  animate={{ opacity: heroCollapsed ? 0 : 1 }}
                  transition={expandedFadeTransition}
                  className={cn(
                    "absolute inset-x-0 top-0 w-full min-w-0 space-y-3 p-4 md:p-5",
                    heroCollapsed ? "pointer-events-none" : "pointer-events-auto",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <div className="flex items-start gap-2">
                        <h2 className="text-2xl font-bold text-zinc-900 md:text-3xl">
                          No seu ritmo, você chega a R$ 1 milhão em{" "}
                          <motion.span
                            key={`pace-${topSearchBoost}-${parsed.monthsToMillionUser}`}
                            initial={reduceMotion ? false : { scale: 0.86, opacity: 0.45 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={premiumPopTransition}
                            className={cn("inline-block font-bold", premiumAccentStrong)}
                          >
                            {formatDurationDetailed(parsed.monthsToMillionUser)}
                          </motion.span>
                          .
                        </h2>
                        <InfoHint
                          id="years-back"
                          label="Como lemos o prazo até R$ 1 milhão"
                          openId={infoOpenId}
                          onOpenChange={setInfoOpenId}
                          align="end"
                        >
                          <div className="space-y-2" data-testid="years-back-explanation">
                            <p className="font-semibold text-zinc-800">O número que importa</p>
                            <p>
                              O destaque é o seu prazo até R$ 1 milhão com a receita simulada. Ele
                              muda quando você altera valor, contatos ou dias.
                            </p>
                            <p>
                              A comparação com CLT (mínimo líquido) costuma ficar perto de ~
                              {parsed.yearsSaved} anos a menos porque o CLT sozinho levaria{" "}
                              {formatDurationDetailed(parsed.monthsToMillionCLT)} — depois que o seu
                              prazo já é curto, essa diferença quase não muda.
                            </p>
                            <p className="text-[11px] leading-snug text-zinc-500">
                              Simulação assume 100% do valor mensal na meta, sem gastos, juros nem
                              inflação.
                            </p>
                          </div>
                        </InfoHint>
                      </div>
                      <p className="text-sm text-zinc-600">
                        No CLT de referência: {formatDurationDetailed(parsed.monthsToMillionCLT)}.
                        Diferença aproximada: ~{parsed.yearsSaved} anos a menos até a mesma meta.
                      </p>
                    </div>
                    <div className="hidden shrink-0 md:block">
                      <Button
                        onClick={handleReset}
                        className="h-9 items-center gap-2 bg-zinc-100 px-3 text-sm text-zinc-700 hover:bg-zinc-200"
                      >
                        <IconRefresh className="h-4 w-4" />
                        Nova Simulação
                      </Button>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex flex-wrap items-end justify-between gap-3 border-t pt-3",
                      topSearchBoost ? "border-[#DAA520]/35" : "border-emerald-200/80",
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p
                          className={cn(
                            "text-[11px] font-bold uppercase tracking-wider",
                            topSearchBoost ? "text-[#B8860B]" : "text-emerald-800",
                          )}
                        >
                          Montante em {parsed.effectiveTimeNum}{" "}
                          {parsed.effectiveUnit === "years"
                            ? parsed.effectiveTimeNum === 1
                              ? "ano"
                              : "anos"
                            : parsed.effectiveTimeNum === 1
                              ? "mês"
                              : "meses"}
                        </p>
                        <InfoHint
                          id="amount"
                          label="Sobre o montante"
                          openId={infoOpenId}
                          onOpenChange={setInfoOpenId}
                          align="end"
                        >
                          <div className="space-y-2" data-testid="hint-amount">
                            <p className="font-semibold text-zinc-800">Montante do seu cenário</p>
                            <p>
                              {currency(parsed.monthlyRevenue)} / mês × {parsed.projectionMonths}{" "}
                              {parsed.projectionMonths === 1 ? "mês" : "meses"} ={" "}
                              <span className="font-semibold text-zinc-800">
                                {currency(parsed.projectedAmount)}
                              </span>
                            </p>
                            <p className="text-[11px] leading-snug text-zinc-500">
                              É só a projeção do seu ritmo (bruto da simulação). Não aplica INSS/VT
                              — esses descontos entram na comparação CLT da Corrida e da
                              Equivalência.
                            </p>
                          </div>
                        </InfoHint>
                      </div>
                      <motion.p
                        data-testid="freedom-hero-amount"
                        key={`amount-${topSearchBoost}-${parsed.projectedAmount}`}
                        initial={reduceMotion ? false : { scale: 0.9, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={premiumPopTransition}
                        className={cn("text-3xl font-bold md:text-4xl", premiumAccentStrong)}
                      >
                        {currency(parsed.projectedAmount)}
                      </motion.p>
                    </div>
                    <Button
                      onClick={handleReset}
                      className="inline-flex h-9 items-center gap-2 bg-zinc-100 px-3 text-sm text-zinc-700 hover:bg-zinc-200 md:hidden"
                    >
                      <IconRefresh className="h-4 w-4" />
                      Nova Simulação
                    </Button>
                  </div>
                </motion.div>

                <motion.div
                  ref={compactLayerRef}
                  data-testid="freedom-hero-compact"
                  aria-hidden={!heroCollapsed}
                  initial={false}
                  animate={{ opacity: heroCollapsed ? 1 : 0 }}
                  transition={compactFadeTransition}
                  className={cn(
                    "absolute inset-x-0 top-0 flex w-full min-w-0 items-center gap-2 px-3 py-2",
                    heroCollapsed ? "pointer-events-auto" : "pointer-events-none",
                  )}
                >
                  <div className="min-w-0 flex-1 overflow-x-clip">
                    <p
                      className={cn(
                        "truncate text-[10px] font-bold uppercase tracking-wider",
                        premiumSoftLabel,
                      )}
                    >
                      Você deixou de trabalhar
                    </p>
                    <div className="mt-0.5 grid min-w-0 grid-cols-2 gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[9px] font-medium uppercase tracking-wide text-zinc-500">
                          Anos a menos
                        </p>
                        <motion.p
                          key={`compact-years-${topSearchBoost}-${parsed.yearsSaved}`}
                          initial={reduceMotion ? false : { scale: 0.9, opacity: 0.55 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={premiumPopTransition}
                          className={cn("truncate text-sm font-bold leading-tight", premiumLabel)}
                        >
                          {parsed.yearsSaved} {parsed.yearsSaved === 1 ? "ano" : "anos"}
                        </motion.p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[9px] font-medium uppercase tracking-wide text-zinc-500">
                          Média salarial
                        </p>
                        <motion.p
                          key={`compact-salary-${topSearchBoost}-${parsed.monthlyRevenue}`}
                          initial={reduceMotion ? false : { scale: 0.9, opacity: 0.55 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={premiumPopTransition}
                          className={cn("truncate text-sm font-bold leading-tight", premiumLabel)}
                        >
                          {currency(parsed.monthlyRevenue)}/mês
                        </motion.p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className={cn(
                      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500",
                      topSearchBoost
                        ? "border-[#DAA520]/40 text-[#B8860B] hover:bg-[#FFF9E8]"
                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
                    )}
                    aria-label="Nova Simulação"
                  >
                    <IconRefresh className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              </motion.div>
            </div>

            <div data-testid="freedom-metrics-grid" className="grid gap-3 md:grid-cols-2 md:gap-4">
              <Card className="relative overflow-hidden border-zinc-200 p-4 shadow-sm md:col-span-1 md:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <h3 className="text-base font-semibold text-zinc-900">🏁 A Corrida do Milhão</h3>
                  <InfoHint
                    id="race"
                    label="Sobre a corrida do milhão"
                    openId={infoOpenId}
                    onOpenChange={setInfoOpenId}
                  >
                    <div className="space-y-3" data-testid="hint-race">
                      <div className="space-y-1">
                        <p className="font-semibold text-zinc-800">Corrida até R$ 1 milhão</p>
                        <p>
                          Seu ritmo: {currency(parsed.monthlyRevenue)}/mês →{" "}
                          {formatDurationDetailed(parsed.monthsToMillionUser)}.
                        </p>
                        <p>
                          Ritmo CLT (líquido {currency(parsed.clt.net)}/mês):{" "}
                          {formatDurationDetailed(parsed.monthsToMillionCLT)}.
                        </p>
                      </div>
                      <CltPayrollBreakdown clt={parsed.clt} />
                    </div>
                  </InfoHint>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-end justify-between text-sm">
                      <div className={cn("flex items-center gap-2 font-bold", premiumLabel)}>
                        <IconRocket className="h-5 w-5" /> SEU RITMO
                      </div>
                      <motion.span
                        key={`race-${topSearchBoost}-${parsed.monthsToMillionUser}`}
                        initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={premiumPopTransition}
                        className={cn("text-lg font-bold", premiumAccentStrong)}
                      >
                        {formatDurationDetailed(parsed.monthsToMillionUser)}
                      </motion.span>
                    </div>
                    <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-100">
                      <motion.div
                        key={`race-bar-${topSearchBoost}`}
                        initial={reduceMotion ? false : { scaleX: 0.72, opacity: 0.7 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={premiumPopTransition}
                        className={cn(
                          "h-full w-[95%] origin-left rounded-full",
                          topSearchBoost
                            ? "bg-linear-to-r from-[#BF953F] via-[#DAA520] to-[#FCF6BA] premium-glow-pulse"
                            : "animate-pulse bg-emerald-500",
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 opacity-60">
                    <div className="flex items-end justify-between text-sm">
                      <div className="flex items-center gap-2 font-semibold text-zinc-600">
                        <IconTurtle className="h-5 w-5" /> RITMO PADRÃO (CLT)
                      </div>
                      <span className="font-semibold text-zinc-500">
                        {formatDurationDetailed(parsed.monthsToMillionCLT)}
                      </span>
                    </div>
                    <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-full w-[15%] rounded-full bg-zinc-400"></div>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2 md:col-span-1">
                <Card className="flex flex-col items-center justify-center space-y-2 border-wine-100 bg-wine-50 p-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-wine-700">
                    Sua potência
                  </p>
                  <div className="text-3xl font-bold text-zinc-900 md:text-4xl">1 Mês</div>
                  <div className="flex items-center justify-center gap-2 text-sm text-zinc-600">
                    <IconCalendar className="h-5 w-5" />
                    <span>do seu trabalho</span>
                  </div>
                </Card>

                <Card
                  className={cn(
                    "relative flex flex-col items-center justify-center space-y-2 overflow-hidden p-4 text-center transition-colors",
                    topSearchBoost
                      ? "border-[#DAA520]/35 bg-[#FFF9E8]/70"
                      : "border-zinc-200 bg-zinc-50",
                  )}
                >
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <IconCalendar className="h-24 w-24" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p
                      className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        topSearchBoost ? "text-[#B8860B]" : "text-zinc-500",
                      )}
                    >
                      Equivale a
                    </p>
                    <InfoHint
                      id="equivalence"
                      label="Sobre a equivalência"
                      openId={infoOpenId}
                      onOpenChange={setInfoOpenId}
                      align="end"
                    >
                      <div className="space-y-2" data-testid="hint-equivalence">
                        <p className="font-semibold text-zinc-800">Potência do seu mês</p>
                        <p>
                          {currency(parsed.monthlyRevenue)} ÷ {currency(parsed.clt.net)} ={" "}
                          <span className="font-semibold text-zinc-800">
                            {parsed.equivalenceRatio.toFixed(1).replace(".", ",")}
                          </span>{" "}
                          meses de líquido CLT.
                        </p>
                        <p className="text-[11px] leading-snug text-zinc-500">
                          Em outras palavras: 1 mês no seu ritmo rende o que alguém no mínimo
                          vigente ({currency(parsed.clt.gross)} bruto → {currency(parsed.clt.net)}{" "}
                          líquido) juntaria em quase{" "}
                          {parsed.equivalenceRatio.toFixed(1).replace(".", ",")} meses.
                        </p>
                      </div>
                    </InfoHint>
                  </div>
                  <motion.div
                    key={`eq-${topSearchBoost}-${parsed.equivalenceRatio}`}
                    initial={reduceMotion ? false : { scale: 0.88, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={premiumPopTransition}
                    className={cn(
                      "text-3xl font-bold md:text-4xl",
                      topSearchBoost ? premiumAccentStrong : "text-zinc-700",
                    )}
                  >
                    {parsed.equivalenceRatio.toFixed(1).replace(".", ",")} Meses
                  </motion.div>
                  <div className="flex items-center justify-center gap-2 text-zinc-500">
                    <span className="text-sm">de um trabalho comum (CLT)</span>
                  </div>
                </Card>
              </div>

              <div className="md:col-span-2">
                <div className="mb-2 ml-1 flex items-center gap-2">
                  <h3 className="text-base font-semibold text-zinc-900">
                    🏆 Linha do Tempo das Conquistas
                  </h3>
                  <InfoHint
                    id="dreams"
                    label="Sobre as conquistas"
                    openId={infoOpenId}
                    onOpenChange={setInfoOpenId}
                  >
                    <div className="space-y-2" data-testid="hint-dreams">
                      <p className="font-semibold text-zinc-800">Linha do tempo das metas</p>
                      <p>
                        Cada conquista divide o preço pelo seu ritmo atual (
                        {currency(parsed.monthlyRevenue)}/mês). Ex.: moto a R$ 35.000 ≈{" "}
                        {Math.ceil(35000 / parsed.monthlyRevenue)}{" "}
                        {Math.ceil(35000 / parsed.monthlyRevenue) === 1 ? "mês" : "meses"} neste
                        cenário.
                      </p>
                      <p className="text-[11px] leading-snug text-zinc-500">
                        Assume poupança integral do valor simulado, sem juros nem gastos.
                      </p>
                    </div>
                  </InfoHint>
                </div>
                <div
                  data-testid="freedom-dreams-grid"
                  className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3"
                >
                  {parsed.dreamsCalculated.map((dream) => (
                    <Card
                      key={dream.id}
                      className={cn(
                        "flex h-full flex-col justify-between border-2 p-3 transition-all hover:scale-105 md:p-4",
                        dream.highlight
                          ? topSearchBoost
                            ? "border-[#DAA520]/40 bg-[#FFF9E8]/80"
                            : "border-emerald-100 bg-emerald-50/50"
                          : "border-transparent bg-white shadow-sm hover:border-zinc-200",
                      )}
                    >
                      <div className="space-y-2 md:space-y-3">
                        <div
                          className={cn(
                            "w-fit rounded-lg p-2",
                            dream.highlight
                              ? topSearchBoost
                                ? "bg-[#DAA520]/15 text-[#B8860B]"
                                : "bg-emerald-100 text-emerald-700"
                              : "bg-zinc-100 text-zinc-600",
                          )}
                        >
                          <dream.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p
                            className={cn(
                              "font-semibold leading-tight",
                              dream.highlight
                                ? topSearchBoost
                                  ? "text-[#B8860B]"
                                  : "text-emerald-700"
                                : "text-zinc-900",
                            )}
                          >
                            {dream.label}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">{currency(dream.price)}</p>
                        </div>
                      </div>
                      <div className="mt-3 border-t border-dashed border-zinc-200 pt-2 md:mt-4 md:pt-3">
                        <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">
                          Você conquista em
                        </p>
                        <motion.p
                          key={`dream-${dream.id}-${topSearchBoost}-${dream.monthsToAchieve}`}
                          initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={premiumPopTransition}
                          className={cn(
                            "text-xl font-bold",
                            topSearchBoost
                              ? premiumAccentStrong
                              : dream.highlight
                                ? "text-emerald-600"
                                : "text-zinc-800",
                          )}
                        >
                          {formatDurationDetailed(dream.monthsToAchieve)}
                        </motion.p>
                      </div>
                    </Card>
                  ))}
                </div>

                {topSearchBoost ? (
                  <div
                    data-testid="freedom-premium-footer-cta"
                    className="mt-4 w-full rounded-2xl border border-[#DAA520]/45 bg-[#121212] px-4 py-5 sm:px-6 sm:py-6"
                  >
                    <p className="text-center text-base font-semibold leading-snug text-white md:text-lg">
                      Pronta pra alcançar sua liberdade mais fácil?
                    </p>
                    {isProfessional && isPremium ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="mt-4 w-full border border-[#DAA520]/40 bg-transparent text-[#FFDF00] hover:bg-[#DAA520]/10"
                        onClick={() => router.push("/profissional/assinatura-premium")}
                      >
                        Você já está no Premium
                      </Button>
                    ) : (
                      <div
                        className={cn(
                          "mt-4 grid gap-2 sm:gap-3",
                          isProfessional ? "grid-cols-1" : "grid-cols-2",
                        )}
                      >
                        {!isProfessional ? (
                          <Button
                            type="button"
                            variant="secondary"
                            className="min-w-0 border border-[#DAA520]/40 bg-transparent px-2 text-sm text-[#FFDF00] hover:bg-[#DAA520]/10 sm:text-base"
                            onClick={handleCreateProfessionalAccount}
                          >
                            Criar conta profissional
                          </Button>
                        ) : null}
                        <ShinyButton
                          size="sm"
                          className="min-w-0 w-full"
                          onClick={handleTryPremium}
                        >
                          Experimentar o Premium
                        </ShinyButton>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <PremiumConversionModal
          open={upsellOpen}
          onClose={() => setUpsellOpen(false)}
          highlight="topSearch"
          from="topSearch"
        />

        {/* Empty State para erros */}
        {submitted && !parsed && (
          <div className="pt-4">
            <EmptyState
              title="Hmm, esses números não fecharam"
              description="Dá uma olhadinha nos valores — por aqui a gente só aceita números positivos, combinado?"
            />
            <Button variant="ghost" onClick={handleReset} className="mt-4 w-full">
              Tentar novamente
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
