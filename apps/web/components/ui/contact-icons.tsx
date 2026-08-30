import type { HTMLAttributes } from "react";

/**
 * Ícone do WhatsApp usando CSS mask-image apontando para /icons/contact/whatsapp.svg.
 * Permite usar `currentColor` para se integrar ao tema do botão.
 */
export function WhatsAppIcon({ className = "", style, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "inline-block",
        width: "1em",
        height: "1em",
        backgroundColor: "currentColor",
        maskImage: "url(/icons/contact/whatsapp.svg)",
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: "url(/icons/contact/whatsapp.svg)",
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        ...style,
      }}
      {...props}
    />
  );
}

/**
 * Ícone do Telegram usando CSS mask-image apontando para /icons/contact/telegram.svg.
 * Permite usar `currentColor` para se integrar ao tema do botão.
 */
export function TelegramIcon({ className = "", style, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "inline-block",
        width: "1em",
        height: "1em",
        backgroundColor: "currentColor",
        maskImage: "url(/icons/contact/telegram.svg)",
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: "url(/icons/contact/telegram.svg)",
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        ...style,
      }}
      {...props}
    />
  );
}
