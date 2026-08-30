import type { Metadata } from "next";
import { AdminLoginScreen } from "@/components/screens/admin-login-screen";

export const metadata: Metadata = {
  title: "Admin Login | Sigillus",
  description: "Acesso restrito ao painel administrativo Sigillus.",
};

export default function AdminLoginPage() {
  return <AdminLoginScreen />;
}
