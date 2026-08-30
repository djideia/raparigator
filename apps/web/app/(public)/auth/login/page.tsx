import type { Metadata, Viewport } from "next";
import { LoginScreen } from "@/components/screens/login-screen";

export const metadata: Metadata = {
  title: "Login | Sigillus",
  description: "Acesse sua conta Sigillus com seguranca.",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function LoginPage() {
  return <LoginScreen />;
}
