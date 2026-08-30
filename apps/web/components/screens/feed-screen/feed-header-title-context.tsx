"use client";

import type { RefObject } from "react";
import {
  publishFeedTitleFlightFlags,
  useFeedTitleFlightFlags,
  useFeedTitleFlightMotion,
} from "@/components/layout/header-title-flight/registry-facade";
import type {
  FeedTitleFlightFlags,
  FeedTitleFlightMotion,
  TitleFlightMode,
} from "@/components/layout/header-title-flight/surface-types";

export type FeedHeaderTitleMode = TitleFlightMode;
export type FeedHeaderTitleFlags = FeedTitleFlightFlags;
export type FeedHeaderTitleMotion = FeedTitleFlightMotion;
export type FeedHeaderTitleState = FeedHeaderTitleFlags & FeedHeaderTitleMotion;

export function publishFeedHeaderTitleFlags(flags: FeedHeaderTitleFlags) {
  publishFeedTitleFlightFlags(flags);
}

export function useFeedHeaderTitleFlags() {
  return useFeedTitleFlightFlags();
}

export function useFeedHeaderTitleMotion() {
  return useFeedTitleFlightMotion();
}

export function useOptionalFeedHeaderTitleMotion() {
  return useFeedTitleFlightMotion();
}

export function useFeedHeaderTitle(): FeedHeaderTitleState {
  const flags = useFeedHeaderTitleFlags();
  const motion = useFeedHeaderTitleMotion();
  return { ...flags, ...motion };
}

export type FeedSectionRefs = {
  mobileHeadingRef: RefObject<HTMLDivElement | null>;
  premiumSectionRef: RefObject<HTMLDivElement | null>;
  standardSectionRef: RefObject<HTMLDivElement | null>;
};
