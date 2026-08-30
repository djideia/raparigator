"use client";

import { ReactNode } from "react";
import { motion } from "motion/react";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShinyButtonProps {
  children: ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}

export function ShinyButton({
  children,
  onClick,
  fullWidth = false,
  size = "md",
  className,
  disabled = false,
}: ShinyButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      className={cn(
        "shiny-button-border relative inline-flex shrink-0 items-center justify-center rounded-full p-[1.5px]",
        fullWidth && "flex w-full",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#121212] font-semibold text-[#FFDF00]",
          size === "sm" ? "px-4 py-2 text-xs" : "px-6 py-3 text-sm",
        )}
      >
        <Crown className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden="true" />
        {children}
      </span>
    </motion.button>
  );
}
