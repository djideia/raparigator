import type { Metadata, Viewport } from "next";
import { ProfessionalSignupScreen } from "@/components/screens/professional-signup-screen/professional-signup-screen";

export const metadata: Metadata = {
  title: "Cadastro de profissional | Sigillus",
  description: "Envie seus dados e verificacao para atuar como profissional na Sigillus.",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function ProfessionalSignupPage() {
  return <ProfessionalSignupScreen />;
}
