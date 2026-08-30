import {
  ChangeEvent,
  KeyboardEvent,
  ReactNode,
  SelectHTMLAttributes,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  leadingIcon?: ReactNode;
  premium?: boolean;
}

function getStickyHeaderOffset() {
  if (typeof document === "undefined") {
    return 12;
  }

  const header = document.querySelector(
    "header.sticky, header.fixed, header[class*='sticky'], header[class*='fixed'], [data-app-shell] > header",
  );
  if (!header) {
    return 72;
  }

  return Math.max(12, Math.ceil(header.getBoundingClientRect().bottom) + 8);
}

export function Select({
  id,
  label,
  options,
  className,
  leadingIcon,
  premium = false,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listboxId = `${selectId}-listbox`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [floatingStyle, setFloatingStyle] = useState<{
    left: number;
    top: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const normalizedValue =
    typeof props.value === "string"
      ? props.value
      : typeof props.defaultValue === "string"
        ? props.defaultValue
        : "";
  const currentValue = normalizedValue || options[0]?.value || "";
  const placeholderOption = options.find(
    (option) =>
      option.value.trim().toLowerCase() === "selecionar" ||
      option.label.trim().toLowerCase() === "selecionar",
  );
  const placeholderValue = placeholderOption?.value ?? "";
  const visibleOptions = placeholderOption
    ? options.filter((option) => option.value !== placeholderValue)
    : options;
  const selectedOption = visibleOptions.find((option) => option.value === currentValue);
  const hasSelection = Boolean(selectedOption);
  const displayLabel = selectedOption?.label ?? placeholderOption?.label ?? "Selecionar";
  const visibleOptionsCount = visibleOptions.length;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const selectedIndex = Math.max(
      0,
      visibleOptions.findIndex((option) => option.value === currentValue),
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIndex(selectedIndex);
  }, [currentValue, isOpen, visibleOptions]);

  const syncFloatingPosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const spacing = 8;
    const viewportPadding = 12;
    const topSafeOffset = getStickyHeaderOffset();
    const availableBelow = Math.max(
      0,
      window.innerHeight - rect.bottom - spacing - viewportPadding,
    );
    const availableAbove = Math.max(0, rect.top - spacing - topSafeOffset);
    const panelHeight =
      panelRef.current?.scrollHeight ?? Math.min(280, visibleOptionsCount * 48 + 16);
    const openAbove = availableBelow < panelHeight && availableAbove > availableBelow;
    const availableSpace = openAbove ? availableAbove : availableBelow;
    const maxHeight = Math.max(0, Math.floor(Math.min(panelHeight, availableSpace)));
    const top = openAbove ? rect.top - spacing - maxHeight : rect.bottom + spacing;
    const left = Math.max(
      viewportPadding,
      Math.min(rect.left, window.innerWidth - rect.width - viewportPadding),
    );

    setFloatingStyle({
      left,
      top,
      width: rect.width,
      maxHeight,
    });
  }, [visibleOptionsCount]);

  useLayoutEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFloatingStyle(null);
      return;
    }

    syncFloatingPosition();

    const frameId = window.requestAnimationFrame(() => {
      syncFloatingPosition();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen, currentValue, syncFloatingPosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    };

    const handleResize = () => {
      syncFloatingPosition();
    };

    const handleScroll = (event: Event) => {
      const target = event.target;

      if (target instanceof Node && panelRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, syncFloatingPosition]);

  const emitChange = (nextValue: string) => {
    if (props.disabled) {
      return;
    }

    const syntheticEvent = {
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    } as ChangeEvent<HTMLSelectElement>;

    props.onChange?.(syntheticEvent);
    setIsOpen(false);
  };

  const openDropdown = () => {
    if (props.disabled) {
      return;
    }

    setIsOpen((current) => !current);
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (props.disabled) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDropdown();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (visibleOptions.length === 0) {
        return;
      }

      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }

      setActiveIndex((current) => {
        const direction = event.key === "ArrowDown" ? 1 : -1;
        const nextIndex = (current + direction + visibleOptions.length) % visibleOptions.length;
        return nextIndex;
      });
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const panel =
    isOpen && floatingStyle && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            data-ui-select-floating-panel="true"
            id={listboxId}
            role="listbox"
            aria-label={label}
            className="fixed z-40 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-black/5 backdrop-blur-sm"
            style={{
              left: floatingStyle.left,
              top: floatingStyle.top,
              width: floatingStyle.width,
              maxHeight: floatingStyle.maxHeight,
            }}
          >
            <div className="max-h-full overflow-y-auto pr-1">
              {visibleOptions.map((option, index) => {
                const isSelected = option.value === currentValue;
                const isActive = index === activeIndex;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => emitChange(option.value)}
                    className={cn(
                      "flex w-full items-center rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                      isSelected
                        ? "border-wine-200 bg-wine-50 font-medium text-wine-900 shadow-sm"
                        : "border-transparent text-zinc-700 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900",
                      isActive && !isSelected && "border-wine-200 bg-wine-50/70 text-zinc-900",
                      option.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-zinc-700">
        {label}
      </label>
      <div className="relative">
        {leadingIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            {leadingIcon}
          </span>
        ) : null}
        <button
          id={selectId}
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-disabled={props.disabled}
          onClick={openDropdown}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-linear-to-b from-white to-zinc-50/70 px-4 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-200",
            Boolean(leadingIcon) && "pl-10",
            premium && "border-zinc-300 bg-zinc-50/80",
            isOpen && "border-wine-300 ring-2 ring-wine-100",
            props.disabled && "cursor-not-allowed opacity-60",
            className,
          )}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-left",
              hasSelection ? "text-zinc-900" : "text-zinc-500",
            )}
          >
            {displayLabel}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {props.name ? <input type="hidden" name={props.name} value={currentValue} /> : null}

        {panel}
      </div>
    </div>
  );
}
