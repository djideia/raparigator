"use client";

import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAdReviews } from "@/lib/ad-reviews";
import { ads } from "@/lib/mock-data";

export function ReviewsTab({ adSlug }: { adSlug: string }) {
  const ad = ads.find((item) => item.slug === adSlug);
  const { reviews, rating, reviewsCount } = useAdReviews(ad);

  return (
    <Card className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-zinc-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Avaliações recebidas ({reviewsCount})
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Só contatos que você convidou na aba Contatos conseguem avaliar. Depois de enviada, a
            avaliação não pode ser removida.
          </p>
        </div>
        <div className="self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-1 sm:self-center">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
            <span className="text-xs font-black text-amber-800">{rating.toFixed(1)} / 5</span>
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          title="Nenhuma avaliação ainda"
          description="Convide um contato do chat para avaliar e as respostas aparecem aqui."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold text-zinc-900">{review.author}</p>
                <div className="flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                  <span className="text-xs font-bold text-amber-800">
                    {review.score.toFixed(1)}
                  </span>
                </div>
              </div>
              {review.comment ? (
                <p className="text-xs leading-relaxed text-zinc-600">
                  &ldquo;{review.comment}&rdquo;
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}
