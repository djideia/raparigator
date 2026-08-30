import { test, expect } from "@playwright/test";
import { ads } from "./helpers/credentials";
import { seedUserRole } from "./helpers/auth";

test.describe("Detalhe do anúncio", () => {
  test("visitante vê perfil premium e CTA de login", async ({ page }) => {
    await page.goto(`/anuncio/${ads.premiumSlug}`);

    await expect(page.getByText(ads.premiumName).first()).toBeVisible();
    await expect(page.getByText("Entrar para Interagir").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "WhatsApp" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Telegram" }).first()).toBeVisible();
  });

  test("alias /p aponta para o mesmo anúncio", async ({ page }) => {
    await page.goto(`/p/${ads.premiumSlug}`);

    await expect(page.getByText(ads.premiumName).first()).toBeVisible();
  });

  test("cliente logado vê CTA para iniciar chat", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await page.goto(`/anuncio/${ads.premiumSlug}`);

    await expect(page.getByText("Iniciar Chat").first()).toBeVisible();
    await page.getByText("Iniciar Chat").first().click();
    await page.waitForURL("**/chat**");
    await expect(page.getByRole("heading", { name: "Conversas" })).toBeVisible();
  });

  test("slug inexistente mostra estado vazio", async ({ page }) => {
    await page.goto("/anuncio/nao-existe-este-perfil");

    await expect(page.getByText("Esse encanto não está mais aqui")).toBeVisible();
  });
});
