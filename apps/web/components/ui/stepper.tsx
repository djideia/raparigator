import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StepItem {
  id: number;
  label: string;
  icon: ReactNode;
}

interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("flex items-center justify-between w-full", className)}>
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-2 group shrink-0">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm",
                  isActive
                    ? "bg-wine-700 text-white ring-4 ring-wine-700/10"
                    : isCompleted
                      ? "bg-wine-700 text-white"
                      : "bg-white border border-zinc-200 text-zinc-400",
                )}
              >
                {step.icon}
              </div>
              <span
                className={cn(
                  "text-[9px] font-bold uppercase tracking-widest transition-colors duration-300",
                  isActive || isCompleted ? "text-wine-700" : "text-zinc-400",
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Linha conectiva entre os passos */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 sm:mx-4 mt-[-18px] h-[1px] bg-zinc-200 overflow-hidden relative">
                <div
                  className={cn(
                    "absolute left-0 top-0 h-full bg-wine-700 transition-all duration-500 ease-in-out",
                    isCompleted ? "w-full" : "w-0",
                  )}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
