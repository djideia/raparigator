export type BrazilMinimumWageEntry = {
  effectiveFrom: string;
  amount: number;
  legalAct: string;
};

const BRAZIL_MINIMUM_WAGE_SCHEDULE: BrazilMinimumWageEntry[] = [
  { effectiveFrom: "2024-01-01", amount: 1412, legalAct: "Decreto nº 11.864/2024" },
  { effectiveFrom: "2025-01-01", amount: 1518, legalAct: "Decreto nº 12.342/2024" },
  { effectiveFrom: "2026-01-01", amount: 1621, legalAct: "Decreto nº 12.797/2025" },
];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getBrazilMinimumWage(asOf: Date = new Date()): BrazilMinimumWageEntry {
  const key = toDateKey(asOf);
  const schedule = [...BRAZIL_MINIMUM_WAGE_SCHEDULE].sort((a, b) =>
    a.effectiveFrom.localeCompare(b.effectiveFrom),
  );
  let current = schedule[0];
  for (const entry of schedule) {
    if (entry.effectiveFrom <= key) current = entry;
  }
  return current;
}
