"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { chromeCircle } from "@/lib/chrome-styles";

interface BackButtonProps {
  className?: string;
  onBack?: () => void;
}

export function BackButton({ className, onBack }: BackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/") return null;

  const handleClick = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <button
      type="button"
      className={cn(chromeCircle, "group text-zinc-600 hover:text-wine-700", className)}
      onClick={handleClick}
      aria-label="Voltar"
      title="Voltar para a página anterior"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 transition-transform group-hover:-translate-x-0.5"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
  );
}
