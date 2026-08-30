import type { HTMLAttributes } from "react";

/**
 * Ícone de Dinheiro (cash) como componente React.
 * Usa CSS mask-image referenciando o SVG em /icons/brand/cash.svg
 * para herdar `currentColor` do pai — compatível com o padrão de
 * ícones lucide-react usado no projeto.
 *
 * Aceita className (w-5 h-5, etc.) para manter compatibilidade
 * com a interface de ícones do grid de pagamento.
 */
export function CashIcon({ className = "", style, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "inline-block",
        width: "1em",
        height: "1em",
        backgroundColor: "currentColor",
        maskImage: "url(/icons/brand/cash.svg)",
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: "url(/icons/brand/cash.svg)",
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        transform: "scale(1.8)", // Aumenta visualmente o tamanho do ícone (pois o SVG tem muito espaço em branco)
        ...style,
      }}
      {...props}
    />
  );
}
