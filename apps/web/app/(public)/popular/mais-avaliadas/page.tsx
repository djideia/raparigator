import type { Metadata } from "next";
import { TopRatedScreen } from "@/components/screens/top-rated-screen";

export const metadata: Metadata = {
  title: "Mais avaliadas | Sigillus",
  description: "Profissionais com melhores avaliacoes por categoria na Sigillus.",
};

export default function TopRatedPage() {
  return <TopRatedScreen />;
}
