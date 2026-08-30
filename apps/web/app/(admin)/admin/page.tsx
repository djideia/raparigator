import type { Metadata } from "next";
import { AdminDashboardScreen } from "@/components/screens/admin/admin-dashboard-screen";

export const metadata: Metadata = {
  title: "Dashboard | Admin Sigillus",
  description: "Visão geral da plataforma Sigillus.",
};

export default function AdminDashboardPage() {
  return <AdminDashboardScreen />;
}
