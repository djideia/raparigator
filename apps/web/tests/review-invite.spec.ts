import { test, expect } from "@playwright/test";
import { seedUserRole } from "./helpers/auth";

const AD_SLUG = "luna-velvet-sao-paulo";
const CONVERSATION_ID = "c1";

async function seedOpenInvite(page: import("@playwright/test").Page) {
  await page.addInitScript(
    ({ adSlug, conversationId }) => {
      const now = Date.now();
      window.localStorage.setItem(
        "sigillus-review-invites",
        JSON.stringify({
          invites: [
            {
              conversationId,
              adSlug,
              invitedAt: new Date(now).toISOString(),
              expiresAt: new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString(),
              usedAt: null,
            },
          ],
          reviews: [],
        }),
      );
    },
    { adSlug: AD_SLUG, conversationId: CONVERSATION_ID },
  );
}

test.describe("Avaliação por convite", () => {
  test("cliente sem convite não consegue avaliar", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await page.goto(`/anuncio/${AD_SLUG}`);

    await expect(page.getByText(/aguarde o convite da profissional/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Avaliar este perfil" })).toHaveCount(0);
  });

  test("visitante não vê nada sobre avaliar", async ({ page }) => {
    await page.goto(`/anuncio/${AD_SLUG}`);

    await expect(page.getByRole("button", { name: "Avaliar este perfil" })).toHaveCount(0);
    await expect(page.getByText(/aguarde o convite da profissional/i)).toHaveCount(0);
  });

  test("com convite aberto, cliente avalia uma única vez", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await seedOpenInvite(page);
    await page.goto(`/anuncio/${AD_SLUG}`);

    await page.getByRole("button", { name: "Avaliar este perfil" }).click();

    // O input é sr-only e a estrela cobre o ponto de clique; o usuário clica no label.
    await page.locator("label", { has: page.getByRole("radio", { name: "5 estrelas" }) }).click();
    await expect(page.getByRole("radio", { name: "5 estrelas" })).toBeChecked();

    await page.getByPlaceholder("Conte como foi o contato (opcional)").fill("Conversa ótima.");
    await page.getByRole("button", { name: "Enviar avaliação" }).click();

    await expect(page.getByText("Você já avaliou este perfil.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Avaliar este perfil" })).toHaveCount(0);
    await expect(page.getByText("Conversa ótima.")).toBeVisible();
  });

  test("profissional convida um contato pela aba Contatos", async ({ page }) => {
    await seedUserRole(page, "profissional");
    await page.goto("/profissional/dashboard?tab=Contatos");

    await expect(page.getByText("Cliente reservado").first()).toBeVisible();

    await page.getByRole("button", { name: "Convidar para avaliar" }).first().click();
    await expect(page.getByText(/Convite enviado · expira em/)).toBeVisible();

    await page.getByRole("button", { name: "Retirar" }).first().click();
    await expect(page.getByRole("button", { name: "Convidar para avaliar" }).first()).toBeVisible();
  });
});
