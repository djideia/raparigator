"use client";

import { useEffect, useMemo, useState } from "react";
import type { FeedAdSummary, FeedFiltersCriteria } from "@sigillus/contracts";
import { PAGE_SIZE_MAX } from "@sigillus/contracts";
import { filterAds, serializeFeedFiltersCriteria } from "@sigillus/domain";
import { getApiClient } from "@/lib/api/client";
import { isApiDataSource } from "@/lib/data-source";
import { ads as mockAds } from "@/lib/mock-data";

export type FeedAdsResult = {
  ads: FeedAdSummary[];
  isLoading: boolean;
  error: string | null;
};

const EMPTY: FeedAdSummary[] = [];

export function useFeedAds(criteria: FeedFiltersCriteria): FeedAdsResult {
  const useApi = isApiDataSource();
  const fingerprint = serializeFeedFiltersCriteria(criteria);
  const [apiState, setApiState] = useState<{
    key: string;
    ads: FeedAdSummary[];
    error: string | null;
  }>({
    key: "",
    ads: EMPTY,
    error: null,
  });

  const mockResult = useMemo(
    () => (useApi ? EMPTY : filterAds(mockAds, criteria)),
    [criteria, useApi],
  );

  useEffect(() => {
    if (!useApi) {
      return;
    }
    let cancelled = false;
    getApiClient()
      .feed.list({ criteria, sort: "relevance", pagination: { page: 1, pageSize: PAGE_SIZE_MAX } })
      .then((page) => {
        if (!cancelled) {
          setApiState({ key: fingerprint, ads: page.items, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setApiState({
            key: fingerprint,
            ads: EMPTY,
            error: error instanceof Error ? error.message : "Não foi possível carregar o feed.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [criteria, fingerprint, useApi]);

  if (!useApi) {
    return { ads: mockResult, isLoading: false, error: null };
  }

  return {
    ads: apiState.ads,
    isLoading: apiState.key !== fingerprint,
    error: apiState.key === fingerprint ? apiState.error : null,
  };
}
