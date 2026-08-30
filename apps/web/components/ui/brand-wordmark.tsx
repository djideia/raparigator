import Link from "next/link";
import { cn } from "@/lib/utils";

const brandWordmarkBase =
  "inline-flex h-10 shrink-0 items-center font-display text-2xl font-medium leading-none tracking-wide";

const brandWordmarkTone = {
  wine: "text-wine-800",
  light: "text-white",
} as const;

interface BrandWordmarkProps {
  tone?: keyof typeof brandWordmarkTone;
  className?: string;
  href?: string;
}

export function BrandWordmark({ tone = "wine", className, href = "/" }: BrandWordmarkProps) {
  return (
    <Link href={href} className={cn(brandWordmarkBase, brandWordmarkTone[tone], className)}>
      Sigillus
    </Link>
  );
}
