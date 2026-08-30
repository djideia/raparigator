import { ChangeEvent, InputHTMLAttributes, ReactNode } from "react";
import { formatPhone } from "@/lib/identity";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
  premium?: boolean;
}

export function Input({
  id,
  label,
  hint,
  error,
  className,
  leadingIcon,
  premium = false,
  ...props
}: InputProps) {
  const shouldMaskPhone = props.type === "tel" || id?.toLowerCase().includes("phone");

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (shouldMaskPhone) {
      event.target.value = formatPhone(event.target.value);
    }

    props.onChange?.(event);
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700">
        {label}
      </label>
      <div className="relative">
        {leadingIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            {leadingIcon}
          </span>
        ) : null}
        <input
          id={id}
          className={cn(
            "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-200",
            Boolean(leadingIcon) && "pl-10",
            premium && "border-zinc-300 bg-zinc-50/70",
            error && "border-red-500 focus:border-red-600 focus:ring-red-200",
            className,
          )}
          {...props}
          onChange={handleChange}
        />
      </div>
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}
