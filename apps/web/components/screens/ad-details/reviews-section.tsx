"use client";

import { Star, ThumbsUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAdReviews } from "@/lib/ad-reviews";
import type { ProfessionalAd } from "@/lib/types";
import { ReviewCta } from "./review-cta";

interface ReviewsSectionProps {
  ad: ProfessionalAd;
}

export function ReviewsSection({ ad }: ReviewsSectionProps) {
  const { reviews, rating, reviewsCount } = useAdReviews(ad);

  return (
    <Card className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-zinc-100 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
            Avaliações dos Clientes ({reviewsCount})
          </h3>
          <p className="text-xs text-zinc-500 sm:text-sm">
            Só quem conversou pelo chat e recebeu convite da profissional pode avaliar
          </p>
        </div>
        <div className="self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-1 sm:self-center">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
            <span className="text-xs font-black text-amber-800">{rating.toFixed(1)} / 5</span>
          </div>
        </div>
      </div>

      <ReviewCta ad={ad} />

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-400">
            Nenhum comentário ou avaliação recente no momento.
          </p>
        ) : (
          reviews.map((review) => (
            <article
              key={review.id}
              className="space-y-2.5 rounded-xl border border-zinc-100/90 bg-[#fafafa]/50 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 font-display text-xs font-bold uppercase text-zinc-600 shadow-xs">
                    {review.author.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900">{review.author}</p>
                    <span className="mt-0.5 block text-xs leading-none font-semibold text-zinc-400">
                      Membro Verificado • Há poucos dias
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-md border border-amber-100/40 bg-amber-50 px-2 py-0.5">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                  <span className="text-xs font-bold text-amber-800">
                    {review.score.toFixed(1)}
                  </span>
                </div>
              </div>

              <p className="pl-10 text-xs leading-relaxed text-zinc-600">
                &ldquo;{review.comment}&rdquo;
              </p>

              <div className="animate-fade-in flex items-center gap-1 pl-10 pt-1 text-xs font-bold tracking-wider text-emerald-700 uppercase">
                <ThumbsUp className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                Perfil Recomendado
              </div>
            </article>
          ))
        )}
      </div>
    </Card>
  );
}
