import type { Metadata } from "next";
import { FinancialIndependenceScreen } from "@/components/screens/financial-independence-screen";

export const metadata: Metadata = {
  title: "Independencia Financeira | Sigillus",
  description: "Simule projecoes com seus proprios numeros e compare com um cenario CLT padrao.",
};

export default function FinancialIndependencePage() {
  return <FinancialIndependenceScreen />;
}
