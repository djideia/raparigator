"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getChatStoreSnapshot,
  getServerChatStoreSnapshot,
  subscribeChatStore,
} from "@/lib/chat-store";
import { getConversationAd } from "@/lib/conversation-ad";
import {
  getInviteDaysLeft,
  getInviteStatus,
  hasTwoWayConversation,
  sendReviewInvite,
  useReviewInvites,
  withdrawReviewInvite,
  type InviteStatus,
} from "@/lib/review-invites";
import { cn } from "@/lib/utils";
import type { ContactFilter } from "./types";

const filterOptions: ContactFilter[] = ["Todos", "Pode avaliar", "Já avaliou"];

interface ContactsTabProps {
  adSlug: string;
  professionalName: string;
}

interface ContactRow {
  conversationId: string;
  name: string;
  lastMessageAt: string;
  isBlocked: boolean;
  eligible: boolean;
  inviteStatus: InviteStatus;
  daysLeft: number | null;
}

export function ContactsTab({ adSlug, professionalName }: ContactsTabProps) {
  const [activeFilter, setActiveFilter] = useState<ContactFilter>("Todos");
  const chat = useSyncExternalStore(
    subscribeChatStore,
    getChatStoreSnapshot,
    getServerChatStoreSnapshot,
  );
  const { getInvite } = useReviewInvites();

  const rows = useMemo<ContactRow[]>(() => {
    return chat.conversations
      .filter(
        (conversation) =>
          !conversation.deletedFromInboxAt && getConversationAd(conversation)?.slug === adSlug,
      )
      .map((conversation) => {
        const messages = chat.messages.filter(
          (message) => message.conversationId === conversation.id && !message.deletedAt,
        );
        const invite = getInvite(conversation.id);
        const inviteStatus = getInviteStatus(invite);

        return {
          conversationId: conversation.id,
          // A profissional vê o apelido que o cliente usa na conversa, nunca o nome real.
          name: conversation.currentUserAlias || "Cliente reservado",
          lastMessageAt: conversation.lastMessageAt,
          isBlocked: Boolean(conversation.isBlocked),
          eligible: hasTwoWayConversation(messages),
          inviteStatus,
          daysLeft: invite && inviteStatus === "open" ? getInviteDaysLeft(invite) : null,
        };
      });
  }, [adSlug, chat.conversations, chat.messages, getInvite]);

  const filteredRows = rows.filter((row) => {
    if (activeFilter === "Pode avaliar") {
      return row.inviteStatus === "open";
    }

    if (activeFilter === "Já avaliou") {
      return row.inviteStatus === "used";
    }

    return true;
  });

  return (
    <Card className="space-y-4 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap gap-2 border-b border-zinc-100 pb-4">
        {filterOptions.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              activeFilter === filter
                ? "bg-wine-700 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200",
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Contatos pelo chat ({rows.length})
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Quem conversou com você por aqui. Convide um contato para avaliar seu perfil — só quem
            recebe o convite consegue deixar uma avaliação.
          </p>
        </div>

        {filteredRows.length === 0 ? (
          <EmptyState
            title="Nenhum contato nesse filtro"
            description="Conversas iniciadas pelo chat da plataforma aparecem aqui."
          />
        ) : (
          filteredRows.map((row) => (
            <ContactRowItem
              key={row.conversationId}
              row={row}
              adSlug={adSlug}
              professionalName={professionalName}
            />
          ))
        )}
      </div>
    </Card>
  );
}

function ContactRowItem({ row, adSlug, professionalName }: { row: ContactRow } & ContactsTabProps) {
  const canInvite = row.eligible && !row.isBlocked;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:bg-white sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">{row.name}</p>
        <p className="mt-1 text-xs text-zinc-600">Último contato às {row.lastMessageAt}</p>
      </div>

      {row.inviteStatus === "used" ? (
        <span className="self-start rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold whitespace-nowrap text-emerald-700 sm:self-center">
          Já avaliou
        </span>
      ) : row.inviteStatus === "open" ? (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold whitespace-nowrap text-amber-700">
            Convite enviado · expira em {row.daysLeft}d
          </span>
          <button
            type="button"
            onClick={() => withdrawReviewInvite(row.conversationId)}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
          >
            Retirar
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={!canInvite}
          onClick={() =>
            sendReviewInvite({
              conversationId: row.conversationId,
              adSlug,
              professionalName,
            })
          }
          className="self-start rounded-full bg-wine-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-wine-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 sm:self-center"
          title={
            canInvite
              ? undefined
              : "Só é possível convidar depois de uma conversa com mensagens dos dois lados"
          }
        >
          Convidar para avaliar
        </button>
      )}
    </div>
  );
}
