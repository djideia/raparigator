import type { Metadata } from "next";
import { AdminProfileDetailScreen } from "@/components/screens/admin/admin-profile-detail-screen";

export const metadata: Metadata = {
  title: "Detalhes do Perfil | Admin Sigillus",
  description: "Revisão e validação de perfil profissional.",
};

export default async function AdminPerfisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminProfileDetailScreen profileId={id} />;
}
