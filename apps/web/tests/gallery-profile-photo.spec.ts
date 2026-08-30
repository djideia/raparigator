import { test, expect } from "@playwright/test";
import { seedUserRole } from "./helpers/auth";

async function openGalleryPhoto(page: import("@playwright/test").Page) {
  await expect(page.getByRole("heading", { name: /Galeria/i })).toBeVisible();
  const cover = page.locator(".cursor-pointer").filter({ hasText: "Capa do Perfil" }).first();
  await expect(cover).toBeVisible();
  await cover.click({ force: true });
  await expect(page.getByTestId("define-as-role-trigger")).toBeVisible();
}

test.describe("Galeria — foto de perfil", () => {
  test("profissional define foto de perfil pelo Definir como…", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedUserRole(page, "profissional");
    await page.goto("/profissional/dashboard?tab=Anúncio");

    await openGalleryPhoto(page);

    await page.getByTestId("define-as-role-trigger").click();
    await page.getByTestId("set-role-profile").click();

    const saveCrop = page.getByRole("button", { name: "Salvar" });
    try {
      await saveCrop.waitFor({ state: "visible", timeout: 3000 });
      await saveCrop.click();
    } catch {
      // imagem já próxima de 3:4 — define o papel sem abrir o crop
    }

    await expect(page.getByText("Foto de Perfil").first()).toBeVisible({ timeout: 10000 });
  });

  test("mobile: Definir como… abre bottom sheet", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedUserRole(page, "profissional");
    await page.goto("/profissional/dashboard?tab=Anúncio");

    await openGalleryPhoto(page);

    await page.getByTestId("define-as-role-trigger").click();
    await expect(page.getByTestId("define-as-role-sheet")).toBeVisible();
    await expect(page.getByTestId("set-role-profile")).toBeVisible();
    await expect(page.getByTestId("set-role-cover")).toBeVisible();
    await page.getByTestId("define-as-role-close").click();
    await expect(page.getByTestId("define-as-role-sheet")).toHaveCount(0);
  });
});
