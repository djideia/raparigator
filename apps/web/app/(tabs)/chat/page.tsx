import type { Metadata } from "next";
import { ChatScreen } from "@/components/screens/chat-screen";

export const metadata: Metadata = {
  title: "Chat interno | Sigillus",
  description: "Converse com profissionais e suporte sem sair da plataforma.",
};

export default function ChatPage() {
  return <ChatScreen />;
}
