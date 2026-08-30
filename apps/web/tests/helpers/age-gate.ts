import type { Page } from "@playwright/test";

const STORAGE_KEY = "sigillus-age-verified";

export async function seedAgeVerified(page: Page) {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, "true");
  }, STORAGE_KEY);
}

export async function clearAgeGate(page: Page) {
  await page.goto("/");
  await page.evaluate((key) => {
    window.localStorage.removeItem(key);
  }, STORAGE_KEY);
}
