import { AvailabilityStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusMap: Record<AvailabilityStatus, { label: string; classes: string }> = {
  livre: { label: "Livre", classes: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  em_atendimento: { label: "Em atendimento", classes: "bg-amber-50 text-amber-700 ring-amber-200" },
  indisponivel: { label: "Indisponivel", classes: "bg-zinc-100 text-zinc-600 ring-zinc-200" },
};

interface StatusBadgeProps {
  status: AvailabilityStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, classes } = statusMap[status];
  return (
    <span
      className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1", classes)}
    >
      {label}
    </span>
  );
}
