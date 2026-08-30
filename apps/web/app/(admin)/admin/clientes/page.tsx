import type { Metadata } from "next";
import { AdminClientsScreen } from "@/components/screens/admin/admin-clients-screen";

export const metadata: Metadata = {
  title: "Clientes | Admin Sigillus",
  description: "Gestão de clientes da plataforma Sigillus.",
};

export default function AdminClientesPage() {
  return <AdminClientsScreen />;
}
