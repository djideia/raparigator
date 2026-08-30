import { ads } from "@/lib/mock-data";
import type { Conversation, ProfessionalAd } from "@/lib/types";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Resolve o anúncio de uma conversa. Prefere o `adSlug` gravado na conversa e
 * cai no nome artístico para dados legados que ainda não têm o vínculo.
 */
export function getConversationAd(conversation: Conversation | null): ProfessionalAd | null {
  if (!conversation) {
    return null;
  }

  if (conversation.adSlug) {
    const bySlug = ads.find((ad) => ad.slug === conversation.adSlug);
    if (bySlug) {
      return bySlug;
    }
  }

  return (
    ads.find((ad) =>
      normalizeText(ad.artisticName).includes(normalizeText(conversation.contactName)),
    ) ?? null
  );
}
