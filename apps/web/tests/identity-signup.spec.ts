import { test, expect } from "@playwright/test";

test.describe("Identity signup", () => {
  test("cliente não avança no passo 2 com senha curta", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/auth/cadastro/cliente");

    await page.getByLabel("Seu CPF").fill("529.982.247-25");
    await page.getByLabel("Nome completo civil").fill("Cliente Teste");
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByLabel("E-mail principal").fill("cliente.teste@sigillus.dev");
    await page.getByLabel("Confirmar e-mail").fill("cliente.teste@sigillus.dev");
    await page.getByLabel("Crie sua senha").fill("curta");
    await page.getByLabel("Confirmar senha").fill("curta");
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByText("A senha deve ter ao menos 8 caracteres.")).toBeVisible();
  });
});
