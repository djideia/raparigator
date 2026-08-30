import type { Metadata } from "next";
import { Suspense } from "react";
import { PremiumSubscriptionCheckoutScreen } from "@/components/screens/premium-subscription-checkout-screen";

export const metadata: Metadata = {
  title: "Assinatura Premium | Sigillus",
  description: "Escolha o ciclo e confirme sua assinatura Premium Sigillus.",
};

export default function PremiumSubscriptionPage() {
  return (
    <Suspense fallback={null}>
      <PremiumSubscriptionCheckoutScreen />
    </Suspense>
  );
}
