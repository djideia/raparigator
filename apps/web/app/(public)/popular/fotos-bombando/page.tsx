import type { Metadata } from "next";
import { TrendingMediaScreen } from "@/components/screens/trending-media-screen";

export const metadata: Metadata = {
  title: "Fotos bombando | Sigillus",
  description: "Fotos mais curtidas e vistas por categoria.",
};

export default function TrendingPhotosPage() {
  return <TrendingMediaScreen kind="foto" title="Fotos bombando" />;
}
