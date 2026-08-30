import { test, expect } from "@playwright/test";
import { seedUserRole } from "./helpers/auth";

test.describe("Chat", () => {
  test("visitante vê bloqueio e CTAs de auth", async ({ page }) => {
    await page.goto("/chat");

    await expect(page.getByRole("heading", { name: "Chat privado" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Entrar" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Criar conta" }).first()).toBeVisible();
  });

  test("cliente logado acessa lista de conversas", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await page.goto("/chat");

    await expect(page.getByRole("heading", { name: "Conversas" })).toBeVisible();
  });

  test("cliente envia mensagem de texto na conversa ativa", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await seedUserRole(page, "cliente");
    await page.goto("/chat");

    await expect(page.getByRole("heading", { name: "Conversas" })).toBeVisible();

    const composer = page.getByPlaceholder("Mensagem...");
    await expect(composer).toBeVisible();

    const unique = `ping-store-${Date.now()}`;
    await composer.fill(unique);
    await page.getByRole("button", { name: "Enviar" }).click();

    await expect(page.locator("p.leading-relaxed").filter({ hasText: unique })).toBeVisible();
  });
});
