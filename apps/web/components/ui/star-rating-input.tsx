"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function StarRatingInput({ value, onChange, disabled }: StarRatingInputProps) {
  const groupName = useId();

  return (
    <fieldset className="flex items-center gap-1 border-0 p-0" disabled={disabled}>
      <legend className="sr-only">Nota do perfil</legend>
      {Array.from({ length: 5 }).map((_, index) => {
        const star = index + 1;
        const active = star <= value;
        return (
          <label
            key={star}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg text-2xl leading-none transition focus-within:ring-2 focus-within:ring-wine-500",
              active ? "bg-amber-50 text-amber-500" : "bg-zinc-100 text-zinc-400",
              disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-amber-100",
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={star}
              checked={star === value}
              onChange={() => onChange(star)}
              className="sr-only"
            />
            <span aria-hidden="true">★</span>
            <span className="sr-only">
              {star} estrela{star > 1 ? "s" : ""}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
