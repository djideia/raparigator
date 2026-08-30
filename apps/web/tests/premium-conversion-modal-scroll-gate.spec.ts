import { test, expect, type Page } from "@playwright/test";

async function openPremiumCompareStep(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto("/popular/independencia-financeira");
  await page.getByRole("button", { name: /Ver meu Painel da Liberdade/i }).click();
  await page.getByRole("switch", { name: /Topo das Pesquisas/i }).click();
  await page
    .getByTestId("freedom-premium-cta")
    .getByRole("button", { name: /Experimentar o Premium/i })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: /^Continuar$/i }).click();
  await expect(page.getByText(/2 · Comparar/i)).toBeVisible();
}

test.describe("Premium conversion modal scroll gate", () => {
  test("no mobile trava Continuar até rolar o passo Comparar", async ({ page }) => {
    await openPremiumCompareStep(page, 375, 700);

    const continueBtn = page.getByRole("button", { name: /Continuar para assinatura/i });
    await expect(continueBtn).toBeDisabled();
    await expect(page.getByTestId("modal-scroll-hint")).toBeVisible();

    await page.getByTestId("modal-scroll").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    await expect(page.getByTestId("modal-scroll-hint")).toHaveCount(0);
    await expect(continueBtn).toBeEnabled();
  });

  test("sem overflow o Continuar já nasce liberado", async ({ page }) => {
    await openPremiumCompareStep(page, 1280, 1200);

    const continueBtn = page.getByRole("button", { name: /Continuar para assinatura/i });
    await expect(continueBtn).toBeEnabled();
    await expect(page.getByTestId("modal-scroll-hint")).toHaveCount(0);
  });
});
