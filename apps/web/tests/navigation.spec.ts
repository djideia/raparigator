import { test, expect, devices } from "@playwright/test";
import { seedUserRole } from "./helpers/auth";

test.use(devices["Pixel 7"]);

test.describe("Navegação por abas (mobile)", () => {
  test("cliente alterna entre Feed e Chat, sem aba de conta", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await page.goto("/feed");

    const nav = page.getByRole("navigation", { name: "Navegação principal" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link")).toHaveCount(2);
    await expect(nav.getByRole("link", { name: "Acompanhamento" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Conta" })).toHaveCount(0);

    await nav.getByRole("link", { name: "Chat" }).click();
    await expect(page).toHaveURL(/\/chat/);
    await expect(page.getByRole("heading", { name: "Conversas" })).toBeVisible();

    await nav.getByRole("link", { name: "Feed" }).click();
    await expect(page).toHaveURL(/\/feed/);
    await expect(page.getByText("Luna Velvet").first()).toBeVisible();
  });

  test("cliente gerencia a conta pelo menu do header", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await page.goto("/feed");

    await page.getByRole("button", { name: /Abrir opções da conta/ }).click();
    await page.getByRole("link", { name: "Gerenciar sua conta" }).click();
    await expect(page).toHaveURL(/\/conta/);
  });

  test("profissional tem aba Painel", async ({ page }) => {
    await seedUserRole(page, "profissional");
    await page.goto("/feed");

    const nav = page.getByRole("navigation", { name: "Navegação principal" });
    await expect(nav.getByRole("link", { name: "Painel" })).toBeVisible();
    await nav.getByRole("link", { name: "Painel" }).click();
    await expect(page).toHaveURL(/\/profissional\/dashboard/);
  });
});
