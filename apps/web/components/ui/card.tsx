import { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends PropsWithChildren {
  className?: string;
  id?: string;
}

export function Card({ children, className, id }: CardProps) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-200/70",
        className,
      )}
    >
      {children}
    </div>
  );
}
