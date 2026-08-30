import { test, expect } from "@playwright/test";
import { credentials } from "./helpers/credentials";
import { seedAdminSession } from "./helpers/auth";

test.describe("Admin", () => {
  test("login válido abre o dashboard", async ({ page }) => {
    await page.goto("/admin/login");

    await page.getByLabel("E-mail administrativo").fill(credentials.admin.email);
    await page.getByLabel("Senha").fill(credentials.admin.password);
    await page.getByRole("button", { name: "Acessar painel" }).click();

    await page.waitForURL("**/admin");
    await expect(page.getByText("Dashboard").first()).toBeVisible();
    await expect(
      page.getByRole("navigation").getByRole("link", { name: "Clientes", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation").getByRole("link", { name: "Validação de Perfis" }),
    ).toBeVisible();
  });

  test("sessão seed acessa o painel sem formulário", async ({ page }) => {
    await seedAdminSession(page);
    await page.goto("/admin");

    await expect(page.getByText("Total de Clientes").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Denúncias" })).toBeVisible();
  });

  test("sem sessão redireciona para login admin", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/admin\/login/);
    await expect(page.getByRole("button", { name: "Acessar painel" })).toBeVisible();
  });
});
