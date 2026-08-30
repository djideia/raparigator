import { buildBriefMessageText } from "@/lib/encounter-brief";
import type { EncounterBrief } from "@/lib/types";

export function getShareProfileUrl(slug: string): string {
  return `https://sigillus.app/p/${slug}`;
}

export function getShareCopyText(name: string, slug: string): string {
  const url = getShareProfileUrl(slug);
  return `Confira o perfil de ${name} na Sigillus. Acesse o link abaixo para ver o portfólio completo e as fotos exclusivas:\n${url}`;
}

function getChatText(name: string, slug: string, brief?: EncounterBrief | null): string {
  if (brief) {
    return buildBriefMessageText(brief);
  }

  const url = getShareProfileUrl(slug);
  return `Olá, ${name}.

Encontrei seu perfil na Sigillus e fiquei admirado com a sua apresentação. 
${url}

Gostaria de conversar e conhecer mais sobre você.

✨ *Padrão de Excelência Sigillus:*
🛡️ *Cavalheirismo:* O respeito e a cordialidade são inegociáveis durante todo o contato.
📸 *Privacidade:* Todo o portfólio visual já se encontra disponível no perfil.

Aguardo o seu retorno!`;
}

export function getWhatsAppShareUrl(name: string, slug: string): string {
  const text = getShareCopyText(name, slug);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getTelegramShareUrl(name: string, slug: string): string {
  const url = getShareProfileUrl(slug);
  const text = `Confira o perfil de ${name} na Sigillus.`;
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function getExternalContactText(
  name: string,
  slug: string,
  brief?: EncounterBrief | null,
): string {
  return getChatText(name, slug, brief);
}

export function getWhatsAppChatUrl(
  name: string,
  slug: string,
  phone: string,
  brief?: EncounterBrief | null,
): string {
  const text = getChatText(name, slug, brief);
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * O Telegram ignora `?text=` em links diretos de usuário — a mensagem precisa ser
 * copiada para a área de transferência pelo chamador (ver `getExternalContactText`).
 */
export function getTelegramChatUrl(
  name: string,
  slug: string,
  username: string,
  brief?: EncounterBrief | null,
): string {
  const text = getChatText(name, slug, brief);
  const cleanUsername = username.replace(/^@/, "");
  return `https://t.me/${cleanUsername}?text=${encodeURIComponent(text)}`;
}

export function vibrate(ms: number = 50): void {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch {
      // Ignore
    }
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.error("Failed to copy text: ", e);
    }
  }
  return false;
}
