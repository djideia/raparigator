import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantMap: Record<Variant, string> = {
  primary: "bg-wine-700 text-white hover:bg-wine-800 focus-visible:ring-wine-500",
  secondary:
    "bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50 focus-visible:ring-zinc-300",
  ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100 focus-visible:ring-zinc-300",
  danger: "bg-wine-700 text-white hover:bg-wine-800 focus-visible:ring-wine-500",
};

const sizeMap: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  fullWidth,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variantMap[variant],
        sizeMap[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
}
