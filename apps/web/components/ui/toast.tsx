"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ToastProps {
  title: string;
  message: string;
  type?: "success" | "error" | "info";
}

const tone = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-wine-200 bg-wine-50 text-wine-900",
  info: "border-wine-200 bg-wine-50 text-wine-800",
};

export function Toast({ title, message, type = "info" }: ToastProps) {
  return (
    <motion.output
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn("block rounded-xl border p-3 shadow-sm", tone[type])}
      aria-live="polite"
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs leading-relaxed opacity-90">{message}</p>
    </motion.output>
  );
}
