import type { Metadata } from "next";
import { MostViewedScreen } from "@/components/screens/most-viewed-screen";

export const metadata: Metadata = {
  title: "Mais vistas | Sigillus",
  description: "Ranking de perfis com mais visualizacoes por categoria.",
};

export default function MostViewedPage() {
  return <MostViewedScreen />;
}
