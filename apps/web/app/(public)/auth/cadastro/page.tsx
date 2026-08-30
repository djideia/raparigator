import { Metadata } from "next";
import { SignupSelectionScreen } from "@/components/screens/signup-selection-screen";

export const metadata: Metadata = {
  title: "Cadastro | Sigillus",
  description: "Selecione o tipo de conta para se cadastrar na Sigillus.",
};

export default function SignupSelectionPage() {
  return <SignupSelectionScreen />;
}
