"use client";

import { useLayoutEffect, useState, type PropsWithChildren, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { animate, motion, useMotionValue } from "motion/react";
import { useAuthSession } from "@/lib/auth-session";
import { getNavigationItems } from "@/lib/navigation";
import {
  consumeTabDirection,
  getDirectionBetweenTabs,
  getTabDirectionSnapshot,
  getTabHrefForPathname,
  restoreTabScroll,
  type TabDirection,
} from "@/lib/tab-navigation";
import { TabActivityProvider } from "./tab-activity";

const panelTransition = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1] as const,
};

type PanelCache = {
  order: string[];
  nodes: Record<string, ReactNode>;
};

export function TabsKeepAlive({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { role } = useAuthSession();
  const items = getNavigationItems(role);
  const activeHref = getTabHrefForPathname(pathname, items) ?? pathname;
  const panelOpacity = useMotionValue(1);
  const [animating, setAnimating] = useState(false);
  const [cache, setCache] = useState<PanelCache>(() => ({
    order: [activeHref],
    nodes: { [activeHref]: children },
  }));
  const [transition, setTransition] = useState<{
    href: string;
    direction: TabDirection;
  }>(() => ({
    href: activeHref,
    direction: 0,
  }));

  if (!cache.nodes[activeHref]) {
    setCache((current) => {
      if (current.nodes[activeHref]) {
        return current;
      }

      return {
        order: current.order.includes(activeHref) ? current.order : [...current.order, activeHref],
        nodes: {
          ...current.nodes,
          [activeHref]: children,
        },
      };
    });
  }

  if (transition.href !== activeHref) {
    const snapshotDirection = getTabDirectionSnapshot();
    const fallbackDirection = getDirectionBetweenTabs(transition.href, activeHref, items);
    const direction = snapshotDirection !== 0 ? snapshotDirection : fallbackDirection;
    setTransition({
      href: activeHref,
      direction,
    });
    if (direction !== 0) {
      setAnimating(true);
    }
  }

  useLayoutEffect(() => {
    consumeTabDirection();

    if (transition.direction === 0) {
      panelOpacity.set(1);
      return;
    }

    panelOpacity.set(0.92);
    const opacityAnim = animate(panelOpacity, 1, {
      ...panelTransition,
      onComplete: () => {
        setAnimating(false);
      },
    });

    return () => {
      opacityAnim.stop();
    };
  }, [transition.href, transition.direction, panelOpacity]);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      restoreTabScroll(pathname, items);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, items]);

  const hrefOrder = items.map((item) => item.href);
  const entries = cache.order
    .filter((href) => cache.nodes[href])
    .slice()
    .sort((a, b) => {
      const aIndex = hrefOrder.indexOf(a);
      const bIndex = hrefOrder.indexOf(b);
      const safeA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
      const safeB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
      return safeA - safeB;
    });

  return (
    <>
      {entries.map((href) => {
        const active = href === activeHref;
        const node = cache.nodes[href];
        const motionActive = active && animating;

        return (
          <TabActivityProvider key={href} active={active}>
            <div
              aria-hidden={!active}
              inert={!active}
              style={{ display: active ? "block" : "none" }}
            >
              {motionActive ? (
                <motion.div style={{ opacity: panelOpacity }}>{node}</motion.div>
              ) : (
                <div>{node}</div>
              )}
            </div>
          </TabActivityProvider>
        );
      })}
    </>
  );
}
