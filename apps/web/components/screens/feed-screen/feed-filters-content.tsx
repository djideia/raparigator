"use client";

import { X } from "lucide-react";
import { FEED_QUICK_FILTER_LABELS } from "@/lib/feed-filters";
import { cn, currency } from "@/lib/utils";

type SelectionField = "ethnicities" | "hairs" | "services";

function FilterChipClearBadge() {
  return (
    <span
      className="pointer-events-none absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-wine-700 shadow-[0_1px_3px_rgba(15,23,42,0.16)] ring-1 ring-wine-200"
      aria-hidden
    >
      <X size={9} strokeWidth={2.75} />
    </span>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative overflow-visible rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-wine-700 bg-wine-700 text-white"
          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
      )}
    >
      {label}
      {active ? <FilterChipClearBadge /> : null}
    </button>
  );
}

interface FeedFiltersContentProps {
  resultCount: number;
  selectedLocation: string;
  activeQuickFilters: string[];
  selectedGender: string;
  maxPrice: number;
  selectedAdTypes: string[];
  selectedEthnicities: string[];
  selectedHairs: string[];
  selectedServices: string[];
  onToggleQuickFilter: (filter: string) => void;
  onSelectGender: (gender: string) => void;
  onSetMaxPrice: (value: number) => void;
  onToggleAdTypeFilter: (type: string) => void;
  onToggleSelection: (field: SelectionField, value: string) => void;
  onOpenLocationToolsModal: () => void;
}

export function FeedFiltersContent({
  resultCount,
  selectedLocation,
  activeQuickFilters,
  selectedGender,
  maxPrice,
  selectedAdTypes,
  selectedEthnicities,
  selectedHairs,
  selectedServices,
  onToggleQuickFilter,
  onSelectGender,
  onSetMaxPrice,
  onToggleAdTypeFilter,
  onToggleSelection,
  onOpenLocationToolsModal,
}: FeedFiltersContentProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm whitespace-nowrap text-zinc-500">{resultCount} perfis encontrados</p>

      <section>
        <h3 className="mb-2.5 block text-sm font-bold text-zinc-900">Filtros rápidos</h3>
        <div className="flex flex-wrap gap-2 pt-1.5 pr-1">
          {FEED_QUICK_FILTER_LABELS.map((filter) => {
            const active = activeQuickFilters.includes(filter);

            return (
              <button
                key={filter}
                type="button"
                onClick={() => onToggleQuickFilter(filter)}
                className={cn(
                  "relative overflow-visible rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  active
                    ? "border-wine-700 bg-wine-700 text-white"
                    : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-wine-300 hover:bg-wine-50",
                )}
              >
                {filter}
                {active ? <FilterChipClearBadge /> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-zinc-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-wine-700"
            aria-hidden="true"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Localidade
        </h3>

        <button
          type="button"
          onClick={onOpenLocationToolsModal}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-left transition hover:border-wine-300 hover:bg-wine-50/50"
        >
          <span className="text-base font-medium text-zinc-900">{selectedLocation}</span>
          <span className="text-wine-700/70">▾</span>
        </button>
      </section>

      <section>
        <h3 className="mb-2.5 block text-sm font-bold text-zinc-900">Gênero & Categoria</h3>
        <div className="grid grid-cols-2 gap-2">
          {["Todas", "Mulher", "Homem", "Trans", "Casal"].map((gender) => (
            <button
              key={gender}
              onClick={() => onSelectGender(gender)}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                selectedGender === gender
                  ? "border-wine-700 bg-wine-700 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-wine-300 hover:bg-wine-50",
              )}
            >
              {gender}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900">Investimento (h)</h3>
          <span className="text-xs font-bold text-wine-700">Até {currency(maxPrice)}</span>
        </div>
        <input
          type="range"
          min={200}
          max={3000}
          step={50}
          value={maxPrice}
          onChange={(event) => onSetMaxPrice(Number(event.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-wine-700"
        />
        <div className="mt-2 flex justify-between text-[10px] font-bold uppercase text-zinc-400">
          <span>R$ 200</span>
          <span>R$ 3.000</span>
        </div>
      </section>

      <section>
        <h3 className="mb-2.5 block text-sm font-bold text-zinc-900">Modelos</h3>
        <div className="space-y-2">
          {["Premium", "Comum"].map((type) => (
            <label
              key={type}
              className="group flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-wine-50/50"
            >
              <input
                type="checkbox"
                checked={selectedAdTypes.includes(type)}
                onChange={() => onToggleAdTypeFilter(type)}
                className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-wine-700 focus:ring-wine-700"
              />
              <span className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                {type === "Premium" ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#DAA520]/70 bg-linear-to-br from-[#2a2a2a] to-[#0a0a0a] px-2.5 py-0.5 shadow-sm">
                    <span className="text-[9px] text-[#FFDF00] drop-shadow-[0_0_3px_rgba(255,223,0,0.8)]">
                      ★
                    </span>
                    <span className="bg-linear-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] bg-clip-text text-[9px] font-extrabold uppercase tracking-widest text-transparent drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.8)]">
                      Premium
                    </span>
                  </span>
                ) : (
                  type
                )}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h3 className="mb-2 block text-sm font-bold text-zinc-900">Tipo</h3>
          <div className="flex flex-wrap gap-2 pt-1.5 pr-1">
            {["Caucasiana", "Negra", "Asiática", "Latina", "Indígena"].map((eth) => (
              <FilterChip
                key={eth}
                label={eth}
                active={selectedEthnicities.includes(eth)}
                onClick={() => onToggleSelection("ethnicities", eth)}
              />
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 block text-sm font-bold text-zinc-900">Cabelo</h3>
          <div className="flex flex-wrap gap-2 pt-1.5 pr-1">
            {["Loira", "Morena", "Ruiva"].map((hair) => (
              <FilterChip
                key={hair}
                label={hair}
                active={selectedHairs.includes(hair)}
                onClick={() => onToggleSelection("hairs", hair)}
              />
            ))}
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2.5 block text-sm font-bold text-zinc-900">Serviços</h3>
        <div className="space-y-2">
          {["Viagem / Tour", "Jantares e Eventos", "Fetiches"].map((service) => (
            <label
              key={service}
              className="-ml-2 flex cursor-pointer items-center gap-3 rounded-lg p-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-wine-50/50"
            >
              <input
                type="checkbox"
                checked={selectedServices.includes(service)}
                onChange={() => onToggleSelection("services", service)}
                className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-wine-700 focus:ring-wine-700"
              />
              {service}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
