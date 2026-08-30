import type { Metadata } from "next";
import { AccountScreen } from "@/components/screens/account-screen";

export const metadata: Metadata = {
  title: "Minha conta | Sigillus",
  description: "Dados e acesso do perfil logado na Sigillus.",
};

export default function ContaPage() {
  return <AccountScreen />;
}
