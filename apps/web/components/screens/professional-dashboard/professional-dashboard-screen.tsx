"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthSession } from "@/lib/auth-session";
import { useAccountNotifications } from "@/lib/account-notifications";
import type { AuthRole } from "@/lib/types";
import { ads } from "@/lib/mock-data";
import { chromeBelowDesktopNavStickyTop } from "@/lib/chrome-styles";
import { cn } from "@/lib/utils";
import { InfoBanner } from "@/components/ui/info-banner";
import { DashboardHeading } from "./dashboard-heading";
import { DashboardMobileTitleFlight } from "./dashboard-mobile-title-flight";
import { SummaryTab } from "./summary-tab";
import type { AdStatus } from "./types";
import { useDashboardTitleScroll } from "./use-dashboard-title-scroll";
import {
  confirmVerificationCode,
  getVerificationState,
  sendVerificationCode,
  type VerificationChannel,
  type VerificationState,
} from "@/lib/verification";

function DashboardTabSkeleton() {
  return <div className="min-h-80 rounded-2xl border border-zinc-100 bg-zinc-50/80" aria-hidden />;
}

const AnnouncementTab = dynamic(
  () => import("./announcement-tab").then((mod) => mod.AnnouncementTab),
  { loading: () => <DashboardTabSkeleton /> },
);

const ContactsTab = dynamic(() => import("./contacts-tab").then((mod) => mod.ContactsTab), {
  loading: () => <DashboardTabSkeleton />,
});

const ReviewsTab = dynamic(() => import("./reviews-tab").then((mod) => mod.ReviewsTab), {
  loading: () => <DashboardTabSkeleton />,
});

const TABS = [
  {
    id: "Resumo",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    ),
  },
  {
    id: "Anúncio",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    ),
  },
  {
    id: "Avaliações",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    ),
  },
  {
    id: "Contatos",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    id: "Verificação",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
] as const;

export function ProfessionalDashboardScreen() {
  const { role } = useAuthSession();
  const safeRole = role === "visitor" ? "profissional" : (role as Exclude<AuthRole, "visitor">);
  const { bannerClosed, setBannerClosed } = useAccountNotifications(safeRole);
  const headingRef = useRef<HTMLDivElement>(null);
  useDashboardTitleScroll({ headingRef });

  const [activeTab, setActiveTab] = useState<string>("Anúncio");
  const [adStatus, setAdStatus] = useState<AdStatus>("Ativo");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (!requestedTab) {
      return;
    }

    const isValidTab = TABS.some((tab) => tab.id === requestedTab);
    if (isValidTab) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(requestedTab);
    }
  }, []);

  const currentAd = ads[0];
  const adSlug = currentAd.slug;

  return (
    <>
      <DashboardMobileTitleFlight />
      <div className="grid min-w-0 gap-4 lg:grid-cols-[256px_1fr] lg:items-start lg:gap-8">
        <aside
          className={cn(
            "sticky hidden h-fit flex-col self-start rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:flex",
            chromeBelowDesktopNavStickyTop,
          )}
        >
          <nav className="space-y-1.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition-all",
                  activeTab === tab.id
                    ? "border-r-4 border-wine-700 bg-wine-700/10 text-wine-700"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
                )}
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {tab.icon}
                </svg>
                <span>{tab.id}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 lg:-mt-16">
          <DashboardHeading headingRef={headingRef} />

          {!bannerClosed && (
            <div className="mb-4">
              <InfoBanner
                title="Configure seu anúncio"
                description="Para começar sua nova independência, configure seu anúncio e complete as informações do seu perfil na guia correspondente."
                tone="info"
                onClose={() => setBannerClosed(true)}
              />
            </div>
          )}

          <div
            className={cn(
              "mb-2 -mx-1 flex gap-2 overflow-x-auto overscroll-x-contain touch-pan-x px-1 py-2 lg:hidden",
              "scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            )}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-bold shadow-[0_2px_10px_rgba(15,23,42,0.08)] transition-colors",
                  activeTab === tab.id
                    ? "border-wine-700 bg-wine-700 text-white"
                    : "border-zinc-200/80 bg-white text-zinc-600",
                )}
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {tab.icon}
                </svg>
                {tab.id}
              </button>
            ))}
          </div>

          {activeTab === "Resumo" && <SummaryTab />}
          {activeTab === "Anúncio" && (
            <AnnouncementTab
              ad={currentAd}
              adSlug={adSlug}
              status={adStatus}
              onToggleStatus={() => setAdStatus((prev) => (prev === "Ativo" ? "Pausado" : "Ativo"))}
            />
          )}
          {activeTab === "Avaliações" && <ReviewsTab adSlug={adSlug} />}
          {activeTab === "Contatos" && (
            <ContactsTab adSlug={adSlug} professionalName={currentAd.artisticName} />
          )}
          {activeTab === "Verificação" && <VerificationTab />}
        </div>
      </div>
    </>
  );
}

function VerificationTab() {
  const { role, user } = useAuthSession();
  const userId = user?.id ?? "anonymous";
  const verificationTargets = {
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  };
  const verificationSyncKey = `${userId}|${verificationTargets.email}|${verificationTargets.phone}`;
  const [verificationState, setVerificationState] = useState<VerificationState>(() =>
    getVerificationState(userId, verificationTargets),
  );
  const [codeInputs, setCodeInputs] = useState<Record<VerificationChannel, string>>({
    email: "",
    phone: "",
  });
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [infoTone, setInfoTone] = useState<"success" | "error" | "info">("info");
  const [revealedCodes, setRevealedCodes] = useState<Record<VerificationChannel, string | null>>({
    email: null,
    phone: null,
  });
  const [previousVerificationSyncKey, setPreviousVerificationSyncKey] =
    useState(verificationSyncKey);

  if (verificationSyncKey !== previousVerificationSyncKey) {
    setPreviousVerificationSyncKey(verificationSyncKey);
    setVerificationState(getVerificationState(userId, verificationTargets));
    setCodeInputs({ email: "", phone: "" });
    setRevealedCodes({ email: null, phone: null });
  }

  useEffect(() => {
    if (!infoMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setInfoMessage(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [infoMessage]);

  if (role === "visitor" || !user) {
    return (
      <Card className="border-zinc-200 bg-white shadow-sm shadow-zinc-200/70">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Verificação da conta
          </p>
          <h2 className="text-2xl font-semibold text-zinc-900">Acesse sua conta profissional</h2>
          <p className="text-sm text-zinc-600">
            Entre com uma conta de profissional para validar e-mail e telefone.
          </p>
        </div>
      </Card>
    );
  }

  const verifiedItems = [verificationState.email.verified, verificationState.phone.verified].filter(
    Boolean,
  ).length;
  const verificationProgress = Math.round((verifiedItems / 2) * 100);

  const pushInfo = (message: string, tone: "success" | "error" | "info") => {
    setInfoTone(tone);
    setInfoMessage(message);
  };

  const handleSendCode = (channel: VerificationChannel) => {
    const result = sendVerificationCode(userId, verificationTargets, channel, verificationState);
    setVerificationState(result.state);
    setRevealedCodes((current) => ({ ...current, [channel]: result.code }));
    pushInfo(
      channel === "email"
        ? `Código de teste enviado para ${verificationTargets.email}.`
        : `Código de teste enviado para ${verificationTargets.phone}.`,
      "info",
    );
  };

  const handleConfirmCode = (channel: VerificationChannel) => {
    const result = confirmVerificationCode(
      userId,
      verificationTargets,
      channel,
      codeInputs[channel],
      verificationState,
    );
    setVerificationState(result.state);
    pushInfo(result.message, result.success ? "success" : "error");

    if (result.success) {
      setCodeInputs((current) => ({ ...current, [channel]: "" }));
      setRevealedCodes((current) => ({ ...current, [channel]: null }));
    }
  };

  return (
    <Card className="space-y-5 border-zinc-200 bg-white shadow-sm shadow-zinc-200/70 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Verificação da conta
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-zinc-900">Confiança do perfil</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Conclua as etapas de e-mail e telefone para elevar a segurança da conta.
          </p>
        </div>
        <span className="self-start rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
          {verifiedItems}/2 concluídas
        </span>
      </div>

      <div className="mt-5 space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${verificationProgress}%` }}
          />
        </div>
        <p className="text-xs font-medium text-zinc-500">
          Progresso de verificação: {verificationProgress}%
        </p>
      </div>

      {infoMessage ? (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            infoTone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : infoTone === "error"
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-zinc-200 bg-zinc-50 text-zinc-700",
          )}
        >
          {infoMessage}
        </div>
      ) : null}

      <div className="mt-5 grid items-stretch gap-3 xl:grid-cols-3">
        <VerificationItem
          title="E-mail"
          description={`Confirme o contato principal em ${verificationTargets.email}.`}
          done={verificationState.email.verified}
          actionLabel={
            verificationState.email.verified
              ? "Validado"
              : verificationState.email.pendingCode
                ? "Reenviar código"
                : "Enviar código"
          }
          codeLabel="Código de e-mail"
          codeValue={codeInputs.email}
          revealedCode={revealedCodes.email}
          onCodeChange={(value) => setCodeInputs((current) => ({ ...current, email: value }))}
          onAction={() => handleSendCode("email")}
          onConfirm={() => handleConfirmCode("email")}
        />
        <VerificationItem
          title="Telefone"
          description={`Valide o número com DDD ${verificationTargets.phone}.`}
          done={verificationState.phone.verified}
          actionLabel={
            verificationState.phone.verified
              ? "Validado"
              : verificationState.phone.pendingCode
                ? "Reenviar código"
                : "Enviar SMS"
          }
          codeLabel="Código de SMS"
          codeValue={codeInputs.phone}
          revealedCode={revealedCodes.phone}
          onCodeChange={(value) => setCodeInputs((current) => ({ ...current, phone: value }))}
          onAction={() => handleSendCode("phone")}
          onConfirm={() => handleConfirmCode("phone")}
        />
        <VerificationItem
          title="Documento"
          description="Etapa prevista para a próxima fase do fluxo de validação."
          done={false}
          actionLabel="Em breve"
          disabled
        />
      </div>
    </Card>
  );
}

function VerificationItem({
  title,
  description,
  done,
  actionLabel,
  codeLabel,
  codeValue,
  revealedCode,
  onCodeChange,
  onAction,
  onConfirm,
  disabled = false,
}: {
  title: string;
  description: string;
  done: boolean;
  actionLabel: string;
  codeLabel?: string;
  codeValue?: string;
  revealedCode?: string | null;
  onCodeChange?: (value: string) => void;
  onAction?: () => void;
  onConfirm?: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-65 flex-col rounded-xl border p-4 sm:min-h-70",
        done ? "border-emerald-200 bg-emerald-50/70" : "border-zinc-200 bg-zinc-50",
        disabled && "opacity-70",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{title}</p>
      <p className="mt-2 min-h-12 text-sm text-zinc-600">{description}</p>
      {revealedCode && codeLabel ? (
        <div className="mt-3 rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-700">
          <span className="font-semibold text-zinc-500">{codeLabel}:</span>{" "}
          <span className="font-mono font-semibold tracking-[0.18em] text-zinc-900">
            {revealedCode}
          </span>
        </div>
      ) : null}
      {codeValue !== undefined && onCodeChange && onConfirm ? (
        <div className="mt-3 flex flex-1 flex-col">
          <div className="space-y-2">
            <Input
              id={`${title.toLowerCase()}-code`}
              label={codeLabel ?? "Código"}
              placeholder="Digite o código"
              value={codeValue}
              onChange={(event) => onCodeChange(event.target.value)}
              disabled={disabled || done}
            />
          </div>
          <div className="mt-auto flex items-center gap-2 pt-3">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onAction}
              disabled={disabled || done}
              className="min-w-27"
            >
              {actionLabel}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onConfirm}
              disabled={disabled || done || !codeValue.trim()}
              className="min-w-24"
            >
              Confirmar
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span
            className={cn("text-sm font-semibold", done ? "text-emerald-700" : "text-zinc-700")}
          >
            {done ? "Concluído" : disabled ? "Futuro" : "Pendente"}
          </span>
          <Button
            type="button"
            size="sm"
            variant={done ? "secondary" : "primary"}
            onClick={onAction}
            disabled={disabled || done}
            className="min-w-27"
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
