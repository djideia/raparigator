"use client";

import { usePathname, useRouter } from "next/navigation";
import { getCurrentReturnTo, saveReturnScroll, saveReturnTarget } from "@/lib/auth-return";
import { ensureConversationForAd } from "@/lib/chat-store";
import { requestBriefHandoff } from "@/lib/encounter-brief";
import type { EncounterBrief } from "@/lib/types";

export interface ContactCta {
  /** Guarda de onde o visitante saiu para que o login o traga de volta ao mesmo ponto */
  onLoginClick: () => void;
  /** Leva a simulação atual para a conversa da plataforma */
  openChatWithBrief: () => void;
}

export function useContactCta(brief: EncounterBrief | null): ContactCta {
  const router = useRouter();
  const pathname = usePathname();

  const onLoginClick = () => {
    saveReturnTarget(getCurrentReturnTo());
    saveReturnScroll(pathname);
  };

  const openChatWithBrief = () => {
    const conversationId = brief ? ensureConversationForAd(brief.adSlug) : null;
    if (brief && conversationId) {
      requestBriefHandoff(brief, conversationId);
    }
    router.push("/chat");
  };

  return { onLoginClick, openChatWithBrief };
}
