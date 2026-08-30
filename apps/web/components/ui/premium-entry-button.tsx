"use client";

import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumEntryButtonProps {
  onClick: () => void;
  className?: string;
}

export function PremiumEntryButton({ onClick, className }: PremiumEntryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl border border-[#DAA520]/40 bg-[#121212] px-4 py-4 text-sm font-bold text-[#FFDF00] transition hover:border-[#FFDF00]/60",
        className,
      )}
    >
      <Crown className="h-4 w-4" aria-hidden="true" />
      Desbloquear Premium
    </button>
  );
}
