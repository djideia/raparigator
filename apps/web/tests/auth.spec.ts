import { test, expect } from "@playwright/test";
import { credentials } from "./helpers/credentials";
import { loginViaUi } from "./helpers/auth";

test.describe("Autenticação", () => {
  test("login de cliente redireciona para o feed e grava role", async ({ page }) => {
    await loginViaUi(page, credentials.cliente);

    await expect(page).toHaveURL(/\/feed/);
    await expect
      .poll(async () => page.evaluate(() => window.localStorage.getItem("sigillus-user-role")))
      .toBe("cliente");
  });

  test("credenciais inválidas exibem erro", async ({ page }) => {
    await page.goto("/auth/login");

    await expect(page.getByRole("heading", { name: "Bem-vindo de volta" })).toBeVisible();
    await page.getByLabel("E-mail").fill("errado@sigillus.dev");
    await page.getByLabel("Senha").fill("senha-incorreta");
    await page.getByRole("button", { name: "Entrar na plataforma" }).click();

    await expect(
      page.getByText("Credenciais inválidas. Verifique seu e-mail e senha."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("login de profissional grava role profissional", async ({ page }) => {
    await loginViaUi(page, credentials.profissional);

    await expect(page).toHaveURL(/\/feed/);
    await expect
      .poll(async () => page.evaluate(() => window.localStorage.getItem("sigillus-user-role")))
      .toBe("profissional");
  });
});
