import type { Metadata } from "next";
import { FeedScreen } from "@/components/screens/feed-screen/feed-screen";

export const metadata: Metadata = {
  title: "Feed de anuncios | Sigillus",
  description:
    "Explore anuncios verificados por localidade, categoria e faixa de preco na Sigillus.",
};

export default function FeedPage() {
  return <FeedScreen />;
}
