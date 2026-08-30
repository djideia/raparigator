import { test, expect } from "@playwright/test";
import { clearAgeGate } from "./helpers/age-gate";

test.describe("Age gate", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("exibe o gate quando a idade não foi confirmada", async ({ page }) => {
    await clearAgeGate(page);
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: "Conteúdo exclusivo para maiores de 18 anos",
      }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sou maior de 18" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tenho menos de 18" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar no feed" })).toHaveCount(0);
  });

  test("confirmação libera o app e persiste", async ({ page }) => {
    await clearAgeGate(page);
    await page.goto("/");

    await page.getByRole("button", { name: "Sou maior de 18" }).click();

    await expect(
      page.getByRole("heading", {
        name: /Nem todo luxo se anuncia/i,
      }),
    ).toBeVisible();

    await expect
      .poll(async () => page.evaluate(() => window.localStorage.getItem("sigillus-age-verified")))
      .toBe("true");

    await page.reload();

    await expect(
      page.getByRole("heading", {
        name: /Nem todo luxo se anuncia/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Conteúdo exclusivo para maiores de 18 anos",
      }),
    ).toHaveCount(0);
  });

  test("menos de 18 redireciona para Google sem persistir negação", async ({ page }) => {
    await page.route("**/*google.com/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body>Google stub</body></html>",
      });
    });
    await clearAgeGate(page);
    await page.goto("/");

    await page.getByRole("button", { name: "Tenho menos de 18" }).click();

    await page.waitForURL(/google\.com/);
    await expect(page).toHaveURL(/google\.com/);

    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: "Conteúdo exclusivo para maiores de 18 anos",
      }),
    ).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => window.localStorage.getItem("sigillus-age-verified")))
      .toBeNull();
  });
});
