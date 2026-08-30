"use client";

import { useMemo } from "react";
import { reviews as seededReviews } from "@/lib/mock-data";
import { useReviewInvites } from "@/lib/review-invites";
import type { AdReviewsSummary, ProfessionalAd, Review } from "@sigillus/contracts";

export type { AdReviewsSummary };

/**
 * Junta as avaliações semeadas com as enviadas por contatos convidados e
 * recalcula nota e contagem, para que a página do anúncio e o painel mostrem
 * sempre o mesmo número.
 */
export function useAdReviews(ad: ProfessionalAd | undefined): AdReviewsSummary {
  const { getReviewsForAd } = useReviewInvites();

  return useMemo(() => {
    if (!ad) {
      return { reviews: [], rating: 0, reviewsCount: 0 };
    }

    const seeded = seededReviews.filter((review) => review.adId === ad.id);
    const submitted: Review[] = getReviewsForAd(ad.slug).map((review) => ({
      id: review.id,
      adId: ad.id,
      author: review.author,
      score: review.score,
      comment: review.comment,
      createdAt: review.createdAt,
    }));

    const merged = [...submitted, ...seeded];
    const reviewsCount = ad.reviewsCount + submitted.length;

    if (merged.length === 0) {
      return { reviews: merged, rating: ad.rating, reviewsCount };
    }

    const seededWeight = ad.reviewsCount;
    const seededTotal = ad.rating * seededWeight;
    const submittedTotal = submitted.reduce((total, review) => total + review.score, 0);
    const rating = reviewsCount > 0 ? (seededTotal + submittedTotal) / reviewsCount : ad.rating;

    return { reviews: merged, rating, reviewsCount };
  }, [ad, getReviewsForAd]);
}
