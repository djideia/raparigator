import { test, expect } from "@playwright/test";

async function headerTitleOpacity(
  page: import("@playwright/test").Page,
  variant: "premium" | "standard",
) {
  const node = page.locator(`[data-feed-desktop-title="${variant}"]`);
  await expect(node).toHaveCount(1);
  return node.evaluate((el) => Number(getComputedStyle(el).opacity));
}

async function premiumClearedHeader(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const premium = document.querySelector<HTMLElement>("[data-feed-premium-section]");
    if (!premium) {
      return true;
    }
    const headerBottom = window.matchMedia("(min-width: 768px)").matches ? 80 : 64;
    return premium.getBoundingClientRect().bottom <= headerBottom;
  });
}

async function scrollUntilPremiumClearsHeader(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => {
    const premium = document.querySelector<HTMLElement>("[data-feed-premium-section]");
    if (!premium) {
      return false;
    }

    const headerBottom = window.matchMedia("(min-width: 768px)").matches ? 80 : 64;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    let y = window.scrollY;

    while (premium.getBoundingClientRect().bottom > headerBottom && y < maxScroll) {
      y = Math.min(maxScroll, y + 24);
      window.scrollTo(0, y);
    }

    return premium.getBoundingClientRect().bottom <= headerBottom;
  });
}

async function scrollUntilPremiumAlmostClears(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => {
    const premium = document.querySelector<HTMLElement>("[data-feed-premium-section]");
    if (!premium) {
      return false;
    }

    const headerBottom = window.matchMedia("(min-width: 768px)").matches ? 80 : 64;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    let y = window.scrollY;
    let bottom = premium.getBoundingClientRect().bottom;

    while (bottom > headerBottom + 8 && y < maxScroll) {
      y = Math.min(maxScroll, y + 16);
      window.scrollTo(0, y);
      bottom = premium.getBoundingClientRect().bottom;
    }

    if (bottom <= headerBottom) {
      y = Math.max(0, y - 12);
      window.scrollTo(0, y);
      bottom = premium.getBoundingClientRect().bottom;
    }

    return bottom > headerBottom && bottom <= headerBottom + 24;
  });
}

async function assertTitleMatchesPremiumVisibility(page: import("@playwright/test").Page) {
  const cleared = await premiumClearedHeader(page);
  if (cleared) {
    await expect.poll(() => headerTitleOpacity(page, "premium")).toBeLessThan(0.05);
    await expect.poll(() => headerTitleOpacity(page, "standard")).toBeGreaterThan(0.9);
  } else {
    await expect.poll(() => headerTitleOpacity(page, "premium")).toBeGreaterThan(0.9);
    await expect.poll(() => headerTitleOpacity(page, "standard")).toBeLessThan(0.05);
  }
}

test.describe("Feed", () => {
  test("visitante acessa o feed e vê seções de anúncios", async ({ page }) => {
    await page.goto("/feed");

    await expect(page.getByText("Modelos Premium").first()).toBeVisible();
    await expect(page.getByText("Outras modelos").first()).toBeVisible();
    await expect(page.getByText("Luna Velvet").first()).toBeVisible();
  });

  test("filtros rápidos ficam acessíveis", async ({ page }) => {
    await page.goto("/feed");

    await expect(page.getByRole("button", { name: "Premium" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Livre Agora" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Com local/i }).first()).toBeVisible();
  });

  test("filtro Premium restringe a lista a anúncios premium", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/feed");

    await page
      .locator("[data-feed-filters-panel]")
      .getByRole("button", { name: "Premium" })
      .click();

    await expect(page.getByText("Luna Velvet").first()).toBeVisible();
    await expect(page.getByText("Valentina Noir")).toHaveCount(0);
    await expect(page.getByText("Outras modelos")).toHaveCount(0);
  });

  test("desktop: Outras modelos só aparece quando nenhum card premium está na visão", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/feed");

    await expect(page.locator("[data-feed-desktop-title-stack]")).toBeVisible();
    await expect(page.locator("[data-feed-premium-section]")).toBeVisible();
    await expect.poll(() => headerTitleOpacity(page, "premium")).toBeGreaterThan(0.9);
    await expect.poll(() => headerTitleOpacity(page, "standard")).toBeLessThan(0.05);

    await scrollUntilPremiumAlmostClears(page);
    await assertTitleMatchesPremiumVisibility(page);
    await expect.poll(() => headerTitleOpacity(page, "standard")).toBeLessThan(0.05);

    await scrollUntilPremiumClearsHeader(page);
    await assertTitleMatchesPremiumVisibility(page);

    await page.evaluate(() => window.scrollBy(0, 180));
    await page.waitForTimeout(200);
    await assertTitleMatchesPremiumVisibility(page);

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => headerTitleOpacity(page, "premium")).toBeGreaterThan(0.9);
    await expect.poll(() => headerTitleOpacity(page, "standard")).toBeLessThan(0.05);
  });

  test("desktop: rajadas de scroll respeitam exclusividade dos títulos", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/feed");

    const bursts = [120, 240, 80, 360, 160, 400, -180, 90, -40, 300];
    for (const delta of bursts) {
      await page.evaluate((amount) => window.scrollBy(0, amount), delta);
      await page.waitForTimeout(40);
      await assertTitleMatchesPremiumVisibility(page);
    }

    await scrollUntilPremiumClearsHeader(page);
    await assertTitleMatchesPremiumVisibility(page);

    await page.goto("/chat");
    await page.goto("/feed");
    await expect(page.locator("[data-feed-desktop-title-stack]")).toBeVisible();
    await expect.poll(() => headerTitleOpacity(page, "premium")).toBeGreaterThan(0.9);
    await expect.poll(() => headerTitleOpacity(page, "standard")).toBeLessThan(0.05);
    await scrollUntilPremiumClearsHeader(page);
    await assertTitleMatchesPremiumVisibility(page);
    await page.waitForTimeout(400);
    await assertTitleMatchesPremiumVisibility(page);
  });
});
