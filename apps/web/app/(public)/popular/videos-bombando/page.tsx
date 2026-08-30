import type { Metadata } from "next";
import { TrendingMediaScreen } from "@/components/screens/trending-media-screen";

export const metadata: Metadata = {
  title: "Videos bombando | Sigillus",
  description: "Videos mais curtidos e vistos por categoria.",
};

export default function TrendingVideosPage() {
  return <TrendingMediaScreen kind="video" title="Videos bombando" />;
}
