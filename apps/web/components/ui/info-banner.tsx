import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InfoBannerProps {
  title: string;
  description: string;
  tone?: "neutral" | "highlight" | "secure" | "info";
  icon?: ReactNode;
  onClose?: () => void;
}

export function InfoBanner({
  title,
  description,
  tone = "neutral",
  icon,
  onClose,
}: InfoBannerProps) {
  const toneClassName =
    tone === "highlight"
      ? "border-wine-200 bg-wine-50"
      : tone === "secure"
        ? "border-wine-300/80 bg-linear-to-br from-wine-50 to-zinc-100"
        : tone === "info"
          ? "border-wine-200 bg-wine-50"
          : "border-zinc-200 bg-zinc-50";

  const iconClassName = tone === "secure" ? "bg-wine-700 text-white" : "bg-white text-zinc-700";

  return (
    <div className={cn("rounded-2xl border p-4 relative", toneClassName)}>
      <div className="flex gap-3 pr-6">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm",
            iconClassName,
          )}
        >
          {icon ?? "i"}
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">{title}</p>
          <p className="text-sm text-zinc-600">{description}</p>
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
          aria-label="Fechar aviso"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
