"use client";

import { ReactNode } from "react";
import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-dashed border-wine-200/80 bg-gradient-to-b from-wine-50/70 to-zinc-50 p-6 text-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-wine-100 text-wine-700 shadow-[0_2px_10px_rgba(182,0,49,0.12)]"
      >
        {icon ?? <Heart size={18} strokeWidth={2} className="fill-wine-700/15" aria-hidden />}
      </motion.div>
      <h3 className="font-display text-lg font-semibold tracking-wide text-wine-800">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-zinc-600">{description}</p>
      {actionLabel ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.3 }}
          className="mt-4"
        >
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
