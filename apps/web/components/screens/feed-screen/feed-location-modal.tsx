"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";

interface FeedLocationModalProps {
  open: boolean;
  locationInput: string;
  locationMatches: string[];
  showSuccessToast: boolean;
  onClose: () => void;
  onLocationInputChange: (value: string) => void;
  onSelectLocation: (city: string) => void;
  onAutomaticLocation: () => void;
  onClearLocation: () => void;
}

export function FeedLocationModal({
  open,
  locationInput,
  locationMatches,
  showSuccessToast,
  onClose,
  onLocationInputChange,
  onSelectLocation,
  onAutomaticLocation,
  onClearLocation,
}: FeedLocationModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Localidade" description="" actions={null}>
      <div className="space-y-4">
        <h3 className="block text-sm font-semibold text-zinc-900">Selecionar nova localização</h3>

        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2">
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
            className="shrink-0 text-wine-700"
            aria-hidden="true"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <input
            value={locationInput}
            onChange={(event) => onLocationInputChange(event.target.value)}
            placeholder="Digite sua localização"
            className="h-9 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
          {locationInput ? (
            <button
              type="button"
              onClick={onClearLocation}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-wine-300 bg-wine-50 text-sm font-bold text-wine-700 transition hover:bg-wine-100 active:scale-95"
              title="Remover localização"
            >
              ×
            </button>
          ) : null}
        </div>

        {locationMatches.length > 0 ? (
          <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
            {locationMatches.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => onSelectLocation(city)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
              >
                <span>SP, {city}</span>
                <span className="text-xs text-zinc-400">Selecionar</span>
              </button>
            ))}
          </div>
        ) : null}

        <Button
          onClick={onAutomaticLocation}
          className="flex w-full items-center justify-center gap-2 bg-wine-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-wine-800 active:bg-wine-900"
        >
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
            aria-hidden="true"
          >
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="m4.93 4.93 2.83 2.83" />
            <path d="m16.24 16.24 2.83 2.83" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
            <path d="m4.93 19.07 2.83-2.83" />
            <path d="m16.24 7.76 2.83-2.83" />
          </svg>
          <span className="whitespace-nowrap">Usar localização automática</span>
        </Button>

        {showSuccessToast ? (
          <Toast
            title="Localização atual aplicada"
            message="São Paulo, SP foi definida automaticamente."
            type="success"
          />
        ) : null}
      </div>
    </Modal>
  );
}
