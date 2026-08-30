"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAdDetails } from "./use-ad-details";
import { PremiumAdDetailsScreen } from "./premium-ad-details-screen";
import { StandardAdDetailsScreen } from "./standard-ad-details-screen";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { consumeReturnScroll } from "@/lib/auth-return";

interface AdDetailsScreenProps {
  slug: string;
}

export function AdDetailsScreen({ slug }: AdDetailsScreenProps) {
  const { ad, isPremium } = useAdDetails(slug);
  const pathname = usePathname();

  // Resolvidos no primeiro render e guardados: no StrictMode o efeito monta duas vezes e
  // a segunda passada não encontraria mais o valor na sessão.
  const [returnScroll] = useState(() => consumeReturnScroll(pathname));
  const [anchorId] = useState(() =>
    typeof window === "undefined" ? null : window.location.hash.slice(1) || null,
  );

  useEffect(() => {
    if (returnScroll === null && !anchorId) {
      return;
    }

    // Resolve o alvo a cada frame: a altura da página ainda cresce enquanto as imagens
    // carregam, então a posição da âncora muda. O App Router também zera o scroll depois
    // da montagem, por isso reaplicamos até estabilizar — com teto de tempo, e desistindo
    // no instante em que o usuário decide rolar por conta própria.
    let frame = 0;
    let cancelled = false;
    let settledAt: number | null = null;
    const deadline = performance.now() + 2000;

    const cancel = () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };

    const resolveTarget = () => {
      if (returnScroll !== null) {
        return returnScroll;
      }
      const element = anchorId ? document.getElementById(anchorId) : null;
      if (!element) {
        return null;
      }
      const scrollMargin = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
      return element.getBoundingClientRect().top + window.scrollY - scrollMargin;
    };

    const step = () => {
      if (cancelled) {
        return;
      }

      const desired = resolveTarget();
      const now = performance.now();

      if (desired === null) {
        // Âncora ainda não montou; segue tentando até o teto de tempo.
        if (now > deadline) {
          cancel();
          return;
        }
        frame = requestAnimationFrame(step);
        return;
      }

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const target = Math.max(0, Math.min(desired, maxScroll));
      window.scrollTo({ top: target, behavior: "instant" });

      const settled = Math.abs(window.scrollY - target) <= 1;
      settledAt = settled ? (settledAt ?? now) : null;

      if ((settledAt !== null && now - settledAt > 250) || now > deadline) {
        cancel();
        return;
      }

      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", cancel);

    return () => {
      cancel();
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", cancel);
    };
  }, [anchorId, returnScroll]);

  if (!ad) {
    return (
      <AppShell>
        <EmptyState
          title="Esse encanto não está mais aqui"
          description="O perfil pode ter saído do ar ou mudado de endereço. Volta e escolhe outro que te faça piscadinha."
        />
      </AppShell>
    );
  }

  if (isPremium) {
    return <PremiumAdDetailsScreen slug={slug} />;
  }

  return <StandardAdDetailsScreen slug={slug} />;
}
