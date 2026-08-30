import type { PremiumPlanOption } from "@sigillus/contracts";

export type { PremiumPlanOption };
export { PREMIUM_PLAN_OPTIONS, getBillingSavingsPercent, getPlanOption } from "@sigillus/domain";

export interface PremiumImmediateGain {
  id: string;
  label: string;
  from: string;
  to: string;
  exclusive?: boolean;
}

export const PREMIUM_EXCLUSIVE_FEATURES = [
  "Visualização única",
  "Apelido por cliente/conversa",
  "Acesso prioritário a novos recursos e benefícios",
] as const;

export function getSharedGains(): PremiumImmediateGain[] {
  return [
    {
      id: "visibility",
      label: "Perfil em destaque",
      from: "Listagem padrão",
      to: "Mais views e conversões + selo e card Premium",
    },
    {
      id: "portfolio",
      label: "Mídia no portfólio",
      from: "10 fotos e 3 vídeos",
      to: "Ilimitado",
    },
  ];
}

export function getImmediateGains(): PremiumImmediateGain[] {
  return [
    ...getSharedGains(),
    {
      id: "view-once",
      label: "Visualização única",
      from: "Não incluso",
      to: "Exclusivo Premium",
      exclusive: true,
    },
    {
      id: "alias",
      label: "Apelido por cliente/conversa",
      from: "Não incluso",
      to: "Exclusivo Premium",
      exclusive: true,
    },
    {
      id: "early-access",
      label: "Acesso prioritário a novos recursos e benefícios",
      from: "Não incluso",
      to: "Exclusivo Premium",
      exclusive: true,
    },
  ];
}
