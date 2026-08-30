import type { Metadata } from "next";
import { AdDetailsScreen } from "@/components/screens/ad-details";
import { ads } from "@/lib/mock-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ad = ads.find((item) => item.slug === slug);
  if (!ad)
    return {
      title: "Anuncio nao encontrado | Sigillus",
      description: "O perfil solicitado nao foi encontrado.",
    };

  const title = `${ad.artisticName} em ${ad.city} | Sigillus`;
  const description = `${ad.shortDescription} A partir de R$ ${ad.startingPrice}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ad.images[0], width: 1200, height: 630, alt: `Capa de ${ad.artisticName}` }],
      type: "profile",
      siteName: "Sigillus",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ad.images[0]],
    },
  };
}

export default async function AdDetailsPage({ params }: Props) {
  const { slug } = await params;
  return <AdDetailsScreen slug={slug} />;
}
