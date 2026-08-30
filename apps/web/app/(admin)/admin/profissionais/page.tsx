import type { Metadata } from "next";
import { AdminActiveProfessionalsScreen } from "@/components/screens/admin/admin-active-professionals-screen";

export const metadata: Metadata = {
  title: "Profissionais | Admin Sigillus",
  description: "Gestão de profissionais aprovados na plataforma Sigillus.",
};

export default function AdminProfissionaisPage() {
  return <AdminActiveProfessionalsScreen />;
}
