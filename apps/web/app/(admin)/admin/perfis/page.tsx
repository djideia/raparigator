import type { Metadata } from "next";
import { AdminProfilesScreen } from "@/components/screens/admin/admin-profiles-screen";

export const metadata: Metadata = {
  title: "Perfis Profissionais | Admin Sigillus",
  description: "Validação e moderação de perfis profissionais.",
};

export default function AdminPerfisPage() {
  return <AdminProfilesScreen />;
}
