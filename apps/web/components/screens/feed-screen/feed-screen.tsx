"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { cities } from "@/lib/mock-data";
import { useFeedAds } from "@/lib/feed-data";
import {
  chromeBelowDesktopNavStickyMaxH,
  chromeBelowDesktopNavStickyMinH,
  chromeBelowDesktopNavStickyTop,
  chromeBelowHeaderStickyMaxH,
  chromeBelowHeaderStickyMinH,
  chromeBelowHeaderStickyTop,
} from "@/lib/chrome-styles";
import { useAuthSession } from "@/lib/auth-session";
import { useIsTabActive } from "@/components/layout/tab-activity";
import { getNavigationItems } from "@/lib/navigation";
import { useShellChrome } from "@/components/layout/shell-chrome";
import { cn } from "@/lib/utils";
import {
  FEED_DEFAULT_LOCATION_LABEL,
  clearFeedFilters,
  createFeedFiltersCriteria,
  isFeedPremiumSelected,
  partitionFeedAds,
  serializeFeedFiltersCriteria,
  toggleFeedAdType,
  toggleFeedQuickFilter,
  toggleFeedSelection,
  withFeedCity,
  withFeedGender,
  withFeedMaxPrice,
} from "@/lib/feed-filters";
import type {
  FeedAdTypeLabel,
  FeedFiltersCriteria,
  FeedQuickFilterLabel,
  FeedSelectionField,
} from "@/lib/feed-filters-types";
import { FeedAdCard } from "./feed-ad-card";
import { FeedSectionDivider } from "./feed-section-divider";
import { FeedFiltersContent } from "./feed-filters-content";
import { FeedLocationModal } from "./feed-location-modal";
import { FeedMobileHeadingRow } from "./feed-mobile-heading-row";
import { FeedMobileTitleFlight } from "./feed-mobile-title-flight";
import { useFeedSectionTitleScroll } from "./use-feed-section-title-scroll";
import {
  FEED_CARDS_COLUMN_OFFSET_CLASS,
  FEED_CONTENT_GRID_CLASS,
  FEED_SIDE_COLUMN_CLASS,
} from "./constants";

export function FeedScreen() {
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const initialLocation = searchParams.get("location") || "";
  const initialCity = initialLocation ? initialLocation.split(", ")[1] || "all" : "all";

  const [visibleCount, setVisibleCount] = useState(6);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationToolsModal, setShowLocationToolsModal] = useState(false);
  const [showLocationToast, setShowLocationToast] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [locationInput, setLocationInput] = useState(initialLocation);
  const [criteria, setCriteria] = useState<FeedFiltersCriteria>(() =>
    createFeedFiltersCriteria({ selectedCity: initialCity }),
  );
  const [showAppliedHint, setShowAppliedHint] = useState(false);
  const appliedHintTimerRef = useRef<number | null>(null);
  const filtersFingerprintRef = useRef("");

  const normalizedLocationQuery = locationInput.toLowerCase().trim();
  const locationMatches =
    normalizedLocationQuery.length < 2
      ? []
      : cities.filter((city) => city.toLowerCase().includes(normalizedLocationQuery));

  const clearFilters = () => {
    setCriteria(clearFeedFilters());
  };

  const clearFiltersFromModal = () => {
    clearFilters();
  };

  const toggleQuickFilter = (filter: string) => {
    setCriteria((current) => toggleFeedQuickFilter(current, filter as FeedQuickFilterLabel));
  };

  const toggleAdTypeFilter = (type: string) => {
    setCriteria((current) => toggleFeedAdType(current, type as FeedAdTypeLabel));
  };

  const { ads: filteredAds, isLoading: isLoadingFeed } = useFeedAds(criteria);
  const { premium: premiumAds, standard: standardAds } = useMemo(
    () => partitionFeedAds(filteredAds),
    [filteredAds],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(6);
  }, [criteria]);

  const visibleStandardAds = standardAds.slice(0, visibleCount);
  const selectedLocation =
    criteria.selectedCity === "all" ? FEED_DEFAULT_LOCATION_LABEL : `SP, ${criteria.selectedCity}`;
  const mobileHeadingRef = useRef<HTMLDivElement>(null);
  const premiumSectionRef = useRef<HTMLDivElement>(null);
  const standardSectionRef = useRef<HTMLDivElement>(null);
  useFeedSectionTitleScroll({
    hasPremium: premiumAds.length > 0,
    hasStandard: standardAds.length > 0,
    mobileHeadingRef,
    premiumSectionRef,
    standardSectionRef,
  });

  const { role } = useAuthSession();
  const isTabActive = useIsTabActive();
  const { hideDesktopNav } = useShellChrome();
  const hasDesktopNav = !hideDesktopNav && getNavigationItems(role).length > 0;
  const filtersAnchorRef = useRef<HTMLDivElement>(null);
  const filtersScrollRef = useRef<HTMLDivElement | null>(null);
  const filtersScrollTopRef = useRef(0);
  const filtersUserScrollAllowedRef = useRef(false);
  const filtersUserScrollTimerRef = useRef(0);
  const [filtersFixedBox, setFiltersFixedBox] = useState<{ left: number; width: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const anchor = filtersAnchorRef.current;
    if (!anchor || !isTabActive) {
      return;
    }

    const sync = () => {
      const rect = anchor.getBoundingClientRect();
      if (rect.width <= 0) {
        return;
      }
      setFiltersFixedBox({ left: rect.left, width: rect.width });
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(anchor);
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [isTabActive]);

  const setFiltersScrollNode = useCallback((node: HTMLDivElement | null) => {
    const previous = filtersScrollRef.current as
      | (HTMLDivElement & { __filtersScrollCleanup?: () => void })
      | null;
    previous?.__filtersScrollCleanup?.();
    filtersScrollRef.current = node;

    if (!node) {
      return;
    }

    const allowUserScroll = () => {
      filtersUserScrollAllowedRef.current = true;
      window.clearTimeout(filtersUserScrollTimerRef.current);
      filtersUserScrollTimerRef.current = window.setTimeout(() => {
        filtersUserScrollAllowedRef.current = false;
      }, 180);
    };

    const onScroll = () => {
      if (!filtersUserScrollAllowedRef.current) {
        if (node.scrollTop !== filtersScrollTopRef.current) {
          node.scrollTop = filtersScrollTopRef.current;
        }
        return;
      }
      filtersScrollTopRef.current = node.scrollTop;
    };

    node.addEventListener("wheel", allowUserScroll, { passive: true });
    node.addEventListener("touchstart", allowUserScroll, { passive: true });
    node.addEventListener("keydown", allowUserScroll);
    node.addEventListener("scroll", onScroll);

    (node as HTMLDivElement & { __filtersScrollCleanup?: () => void }).__filtersScrollCleanup =
      () => {
        window.clearTimeout(filtersUserScrollTimerRef.current);
        node.removeEventListener("wheel", allowUserScroll);
        node.removeEventListener("touchstart", allowUserScroll);
        node.removeEventListener("keydown", allowUserScroll);
        node.removeEventListener("scroll", onScroll);
      };
  }, []);

  const applySelectedLocation = (city: string) => {
    setCriteria((current) => withFeedCity(current, city));
    setLocationInput(city);
    setShowLocationToolsModal(false);
  };

  const openLocationToolsModal = () => {
    setLocationInput(criteria.selectedCity === "all" ? "Sao Paulo" : criteria.selectedCity);
    setShowLocationToolsModal(true);
  };

  const clearLocation = () => {
    setLocationInput("");
    setCriteria((current) => withFeedCity(current, "all"));
  };

  const useAutomaticLocation = () => {
    setCriteria((current) => withFeedCity(current, "Sao Paulo"));
    setLocationInput("Sao Paulo");
    setShowLocationToast(true);
    setTimeout(() => setShowLocationToast(false), 3000);
  };

  const filtersFingerprint = useMemo(() => serializeFeedFiltersCriteria(criteria), [criteria]);

  useEffect(() => {
    if (!showFilters) {
      filtersFingerprintRef.current = filtersFingerprint;
      if (appliedHintTimerRef.current !== null) {
        window.clearTimeout(appliedHintTimerRef.current);
        appliedHintTimerRef.current = null;
      }
      const hideId = window.setTimeout(() => {
        setShowAppliedHint(false);
      }, 0);
      return () => {
        window.clearTimeout(hideId);
      };
    }

    if (!filtersFingerprintRef.current) {
      filtersFingerprintRef.current = filtersFingerprint;
      return;
    }

    if (filtersFingerprintRef.current === filtersFingerprint) {
      return;
    }

    filtersFingerprintRef.current = filtersFingerprint;

    if (appliedHintTimerRef.current !== null) {
      window.clearTimeout(appliedHintTimerRef.current);
    }

    const showId = window.setTimeout(() => {
      setShowAppliedHint(true);
      appliedHintTimerRef.current = window.setTimeout(() => {
        setShowAppliedHint(false);
        appliedHintTimerRef.current = null;
      }, 1800);
    }, 0);

    return () => {
      window.clearTimeout(showId);
      if (appliedHintTimerRef.current !== null) {
        window.clearTimeout(appliedHintTimerRef.current);
        appliedHintTimerRef.current = null;
      }
    };
  }, [filtersFingerprint, showFilters]);

  const filtersContentProps = {
    resultCount: filteredAds.length,
    selectedLocation,
    activeQuickFilters: [
      ...(isFeedPremiumSelected(criteria) ? (["Premium"] as const) : []),
      ...criteria.quickFilters,
    ],
    selectedGender: criteria.selectedGender,
    maxPrice: criteria.maxPrice,
    selectedAdTypes: [
      ...(isFeedPremiumSelected(criteria) ? (["Premium"] as const) : []),
      ...(criteria.adTiers.includes("normal") ? (["Comum"] as const) : []),
    ],
    selectedEthnicities: criteria.ethnicities,
    selectedHairs: criteria.hairs,
    selectedServices: criteria.services,
    onToggleQuickFilter: toggleQuickFilter,
    onSelectGender: (gender: string) => setCriteria((c) => withFeedGender(c, gender)),
    onSetMaxPrice: (value: number) => setCriteria((c) => withFeedMaxPrice(c, value)),
    onToggleAdTypeFilter: toggleAdTypeFilter,
    onToggleSelection: (field: FeedSelectionField, value: string) => {
      setCriteria((c) => toggleFeedSelection(c, field, value));
    },
    onOpenLocationToolsModal: openLocationToolsModal,
  };

  return (
    <>
      <FeedMobileTitleFlight />
      <div className="relative space-y-6 select-none">
        <section className={FEED_CONTENT_GRID_CLASS}>
          <div
            ref={filtersAnchorRef}
            className={cn(
              "relative hidden lg:block",
              FEED_SIDE_COLUMN_CLASS,
              hasDesktopNav ? chromeBelowDesktopNavStickyMinH : chromeBelowHeaderStickyMinH,
            )}
          >
            <aside
              data-feed-filters-panel
              className={cn(
                "z-10 flex h-fit w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm",
                FEED_SIDE_COLUMN_CLASS,
                "lg:fixed",
                hasDesktopNav ? chromeBelowDesktopNavStickyTop : chromeBelowHeaderStickyTop,
                hasDesktopNav ? chromeBelowDesktopNavStickyMaxH : chromeBelowHeaderStickyMaxH,
              )}
              style={
                filtersFixedBox
                  ? { left: filtersFixedBox.left, width: filtersFixedBox.width }
                  : undefined
              }
            >
              <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 bg-zinc-50 p-5">
                <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-red-500"
                  >
                    <line x1="21" x2="14" y1="4" y2="4" />
                    <line x1="10" x2="3" y1="4" y2="4" />
                    <line x1="21" x2="12" y1="12" y2="12" />
                    <line x1="8" x2="3" y1="12" y2="12" />
                    <line x1="21" x2="16" y1="20" y2="20" />
                    <line x1="12" x2="3" y1="20" y2="20" />
                    <line x1="14" x2="14" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="10" y2="14" />
                    <line x1="16" x2="16" y1="18" y2="22" />
                  </svg>
                  Filtros
                </h3>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-bold uppercase tracking-wider text-wine-700 hover:underline"
                >
                  Limpar
                </button>
              </div>

              <div
                ref={setFiltersScrollNode}
                data-feed-filters-scroll
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain overscroll-y-contain bg-white p-5 [overflow-anchor:none]"
                role="presentation"
                onMouseDown={(event) => {
                  const target = event.target as HTMLElement | null;
                  if (target?.closest("button, input, label, a, [role='button']")) {
                    event.preventDefault();
                  }
                }}
              >
                <FeedFiltersContent {...filtersContentProps} />
              </div>
            </aside>
          </div>

          <div
            data-feed-content-column
            className={cn(
              "relative space-y-4",
              FEED_CARDS_COLUMN_OFFSET_CLASS,
              hasDesktopNav ? chromeBelowDesktopNavStickyMinH : chromeBelowHeaderStickyMinH,
            )}
          >
            <FeedMobileHeadingRow
              headingRef={mobileHeadingRef}
              onOpenFilters={() => setShowFilters(true)}
            />

            {loadingMore || isLoadingFeed ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton
                    key={index}
                    className="mx-auto h-120 w-full max-w-[320px] lg:max-w-none"
                  />
                ))}
              </div>
            ) : filteredAds.length === 0 ? (
              <EmptyState
                title="Ops… sumiu todo mundo"
                description="Nenhum perfil combinou com esses filtros. Afrouxa um pouquinho a busca e a gente te mostra quem está no clima."
                actionLabel="Começar de novo"
                onAction={clearFilters}
              />
            ) : (
              <>
                {premiumAds.length > 0 && (
                  <div ref={premiumSectionRef} data-feed-premium-section className="relative z-10">
                    <FeedSectionDivider variant="premium" />
                    <div className="relative grid gap-4 overflow-visible sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {premiumAds.map((ad, index) => (
                        <FeedAdCard key={ad.id} ad={ad} priority={index === 0} />
                      ))}
                    </div>
                  </div>
                )}

                {visibleStandardAds.length > 0 && (
                  <div ref={standardSectionRef} data-feed-standard-section className="relative">
                    <FeedSectionDivider
                      variant="standard"
                      hasPremiumSection={premiumAds.length > 0}
                    />
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {visibleStandardAds.map((ad, index) => (
                        <FeedAdCard
                          key={ad.id}
                          ad={ad}
                          priority={premiumAds.length === 0 && index === 0}
                        />
                      ))}
                    </div>

                    {visibleCount < standardAds.length ? (
                      <div className="flex justify-center pt-6">
                        <Button
                          onClick={() => {
                            setLoadingMore(true);
                            setTimeout(() => {
                              setVisibleCount((value) => value + 6);
                              setLoadingMore(false);
                            }, 900);
                          }}
                        >
                          Carregar mais anúncios
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      <Modal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title={
          <span className="block space-y-1">
            <span className="block text-lg font-semibold text-zinc-900">Filtros avançados</span>
            {showAppliedHint ? (
              <span className="block text-xs font-medium text-emerald-600">
                Alterações aplicadas
              </span>
            ) : null}
          </span>
        }
        headerActions={
          <button
            type="button"
            onClick={clearFiltersFromModal}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
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
              <path d="M20 20H7l-4-4 10-10 7 7-6 7Z" />
              <path d="M11 11 17 17" />
            </svg>
            Limpar
          </button>
        }
        actions={null}
      >
        <FeedFiltersContent {...filtersContentProps} />
      </Modal>

      <FeedLocationModal
        open={showLocationToolsModal}
        onClose={() => setShowLocationToolsModal(false)}
        locationInput={locationInput}
        locationMatches={locationMatches}
        showSuccessToast={showLocationToast}
        onLocationInputChange={setLocationInput}
        onSelectLocation={applySelectedLocation}
        onAutomaticLocation={useAutomaticLocation}
        onClearLocation={clearLocation}
      />
    </>
  );
}
