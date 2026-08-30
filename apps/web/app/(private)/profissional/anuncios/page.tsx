import type { Metadata } from "next";
import { ProfessionalAdsScreen } from "@/components/screens/professional-ads-screen";

export const metadata: Metadata = {
  title: "Anúncios profissionais | Sigillus",
  description: "Gestão dos anúncios publicados no perfil profissional.",
};

export default function ProfessionalAdsPage() {
  return <ProfessionalAdsScreen />;
}
