"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StarRatingInput } from "@/components/ui/star-rating-input";
import { Toast } from "@/components/ui/toast";
import { useAuthSession } from "@/lib/auth-session";
import {
  getChatStoreSnapshot,
  getServerChatStoreSnapshot,
  subscribeChatStore,
} from "@/lib/chat-store";
import { getConversationAd } from "@/lib/conversation-ad";
import { getInviteStatus, submitReview, useReviewInvites } from "@/lib/review-invites";
import type { ProfessionalAd } from "@/lib/types";

interface ReviewCtaProps {
  ad: ProfessionalAd;
}

export function ReviewCta({ ad }: ReviewCtaProps) {
  const { role, user } = useAuthSession();
  const chat = useSyncExternalStore(
    subscribeChatStore,
    getChatStoreSnapshot,
    getServerChatStoreSnapshot,
  );
  const { getInvite } = useReviewInvites();
  const [modalOpen, setModalOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  const conversation =
    chat.conversations.find(
      (item) => !item.deletedFromInboxAt && getConversationAd(item)?.slug === ad.slug,
    ) ?? null;

  const invite = conversation ? getInvite(conversation.id) : undefined;
  const status = getInviteStatus(invite);
  const isClient = role === "cliente";

  useEffect(() => {
    if (!isClient || typeof window === "undefined" || status !== "open") {
      return;
    }

    const requested = new URLSearchParams(window.location.search).get("avaliar");
    if (requested && conversation && requested === conversation.id) {
      setModalOpen(true);
    }
  }, [conversation, isClient, status]);

  if (!isClient || !conversation) {
    return null;
  }

  const alias = conversation.currentUserAlias || user?.alias || "Cliente reservado";

  if (status === "used") {
    return (
      <div className="space-y-2">
        {sent ? (
          <Toast
            type="success"
            title="Avaliação enviada"
            message="Obrigado! Sua avaliação já aparece no perfil."
          />
        ) : null}
        <Note>
          Você já avaliou este perfil. Cada convite permite uma avaliação, que não pode ser editada.
        </Note>
      </div>
    );
  }

  if (status === "none") {
    return (
      <Note>
        Para avaliar este perfil, aguarde o convite da profissional. Ela libera a avaliação a partir
        da conversa de vocês no chat.
      </Note>
    );
  }

  if (status === "expired") {
    return <Note>O convite para avaliar este perfil venceu.</Note>;
  }

  return (
    <>
      <div className="flex flex-col gap-2 rounded-xl border border-wine-200 bg-wine-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-wine-900">
          {ad.artisticName} liberou uma avaliação para você. Conte como foi o contato.
        </p>
        <Button
          type="button"
          onClick={() => {
            setScore(0);
            setComment("");
            setModalOpen(true);
          }}
        >
          <Star className="mr-2 h-4 w-4" />
          Avaliar este perfil
        </Button>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Avaliar ${ad.artisticName}`}
        description={`Sua avaliação aparece publicamente como "${alias}".`}
        actions={
          <>
            <Button variant="secondary" fullWidth onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              fullWidth
              disabled={score === 0}
              onClick={() => {
                const ok = submitReview({
                  conversationId: conversation.id,
                  adSlug: ad.slug,
                  author: alias,
                  score,
                  comment,
                });

                setModalOpen(false);

                if (ok) {
                  setSent(true);
                  window.setTimeout(() => setSent(false), 4000);
                }
              }}
            >
              Enviar avaliação
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <StarRatingInput value={score} onChange={setScore} />
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            placeholder="Conte como foi o contato (opcional)"
            className="w-full rounded-xl border border-zinc-200 p-3 text-sm focus:border-wine-600 focus:ring-2 focus:ring-wine-200 focus:outline-none"
          />
        </div>
      </Modal>
    </>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
      {children}
    </p>
  );
}
