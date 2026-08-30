import type { Metadata } from "next";
import { OnboardingScreen } from "@/components/screens/onboarding-screen/onboarding-screen";

export const metadata: Metadata = {
  title: "Sigillus | Plataforma discreta e segura",
  description:
    "Escolha localizacao e categoria para acessar anuncios verificados com discricao, seguranca e UX premium.",
};

export default function HomePage() {
  return <OnboardingScreen />;
}
