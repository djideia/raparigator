import type { Metadata } from "next";
import { AdminReportsScreen } from "@/components/screens/admin/admin-reports-screen";

export const metadata: Metadata = {
  title: "Denúncias | Admin Sigillus",
  description: "Gestão de denúncias da plataforma Sigillus.",
};

export default function AdminDenunciasPage() {
  return <AdminReportsScreen />;
}
