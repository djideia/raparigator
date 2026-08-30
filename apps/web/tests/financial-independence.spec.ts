import { test, expect, type Page } from "@playwright/test";
import { seedUserRole } from "./helpers/auth";

async function openCalculator(page: Page, width: number, height = 900) {
  await page.setViewportSize({ width, height });
  await page.goto("/popular/independencia-financeira");
  await expect(page.getByRole("heading", { name: "Calculadora de Liberdade" })).toBeVisible();
}

async function openPremiumJustification(page: Page, width = 375) {
  await openCalculator(page, width);
  await submitPanel(page);
  await page.getByRole("switch", { name: /Topo das Pesquisas/i }).click();
  await expect(page.getByTestId("freedom-premium-justification")).toBeVisible();
}

async function openPremiumFooterCta(page: Page, width = 375) {
  await openPremiumJustification(page, width);
  const footer = page.getByTestId("freedom-premium-footer-cta");
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toBeVisible();
}

async function submitPanel(page: Page) {
  await page.getByRole("button", { name: /Ver meu Painel da Liberdade/i }).click();
  await expect(page.getByTestId("freedom-hero")).toBeVisible();
}

test.describe("Independência financeira", () => {
  test("preview vivo atualiza ao mudar steppers (375)", async ({ page }) => {
    await openCalculator(page, 375);
    const preview = page.getByTestId("freedom-live-preview");
    await expect(preview).toBeVisible();
    await expect(preview).toContainText(/\/ mês/i);
    await expect(preview).toContainText(/Até R\$ 1 mi:/i);
    await expect(preview).not.toContainText(/anos a menos/i);
    const before = await preview.innerText();
    await page.getByRole("button", { name: "adiciona 50" }).first().click();
    await expect(preview).not.toHaveText(before);
  });

  test("não expõe fórmula no rodapé da calculadora", async ({ page }) => {
    await openCalculator(page, 375);
    await expect(page.getByText(/Cálculo base:/i)).toHaveCount(0);
  });

  test("CTA abre painel com manchete e montante (1280)", async ({ page }) => {
    await openCalculator(page, 1280);
    await submitPanel(page);
    await expect(page.getByRole("heading", { name: /chega a R\$ 1 milhão em/i })).toBeVisible();
    await expect(page.getByTestId("freedom-hero")).toContainText(/Anos|Meses/i);
    await expect(page.getByTestId("freedom-hero-amount")).toBeVisible();
  });

  test("hero sticky no desktop ao rolar", async ({ page }) => {
    await openCalculator(page, 1280);
    await submitPanel(page);
    const hero = page.getByTestId("freedom-hero");
    const before = await hero.boundingBox();
    await page.getByTestId("freedom-metrics-grid").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 400));
    await expect(hero).toBeVisible();
    const after = await hero.boundingBox();
    expect(before).toBeTruthy();
    expect(after).toBeTruthy();
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThan(80);
  });

  test("hero colapsa e reexpande suavemente no mobile", async ({ page }) => {
    await openCalculator(page, 375, 720);
    await submitPanel(page);
    const hero = page.getByTestId("freedom-hero");
    await expect(hero).toHaveAttribute("data-collapsed", "false");
    await expect(page.getByTestId("freedom-hero-expanded")).toBeVisible();

    await expect
      .poll(async () => (await hero.boundingBox())?.height ?? 0, { timeout: 5000 })
      .toBeGreaterThan(160);
    const heightBefore = (await hero.boundingBox())?.height ?? 0;
    await page.evaluate(() => window.scrollBy(0, 120));
    await expect(hero).toHaveAttribute("data-collapsed", "true", { timeout: 5000 });

    const midHeights: number[] = [];
    for (let i = 0; i < 8; i += 1) {
      await page.waitForTimeout(70);
      midHeights.push((await hero.boundingBox())?.height ?? 0);
      await expect(hero).toHaveAttribute("data-collapsed", "true");
    }
    const compact = page.getByTestId("freedom-hero-compact");
    await expect(compact).toBeVisible();
    await expect(compact).toContainText(/Você deixou de trabalhar/i);
    await expect(compact).toContainText(/Anos a menos/i);
    await expect(compact).toContainText(/Média salarial/i);
    await expect(compact).toContainText(/anos/i);
    await expect(compact).toContainText(/\/mês/i);
    await expect
      .poll(async () => Number(await compact.evaluate((el) => getComputedStyle(el).opacity)), {
        timeout: 5000,
      })
      .toBeGreaterThan(0.9);
    await expect
      .poll(
        async () =>
          Number(
            await page
              .getByTestId("freedom-hero-expanded")
              .evaluate((el) => getComputedStyle(el).opacity),
          ),
        { timeout: 5000 },
      )
      .toBeLessThan(0.15);
    await expect
      .poll(async () => (await hero.boundingBox())?.height ?? heightBefore, { timeout: 5000 })
      .toBeLessThan(heightBefore * 0.7);
    const box = await compact.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThan(24);
    expect(box!.height).toBeLessThan(120);
    const heightAfter = (await hero.boundingBox())?.height ?? 0;
    expect(heightAfter).toBeLessThan(heightBefore);
    expect(Math.min(...midHeights)).toBeLessThanOrEqual(heightBefore);

    await page.waitForTimeout(420);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(hero).toHaveAttribute("data-collapsed", "false", { timeout: 5000 });
    await expect(page.getByRole("heading", { name: /chega a R\$ 1 milhão em/i })).toBeVisible();
    await expect(page.getByTestId("freedom-hero-expanded")).toBeVisible();
  });

  test("scroll leve não colapsa o hero", async ({ page }) => {
    await openCalculator(page, 375, 720);
    await submitPanel(page);
    const hero = page.getByTestId("freedom-hero");
    await expect(hero).toHaveAttribute("data-collapsed", "false");
    await page.evaluate(() => window.scrollBy(0, 40));
    await page.waitForTimeout(400);
    await expect(hero).toHaveAttribute("data-collapsed", "false");
    await expect(page.getByRole("heading", { name: /chega a R\$ 1 milhão em/i })).toBeVisible();
  });

  test("com Premium expandido o hero aguarda mais scroll antes de colapsar", async ({ page }) => {
    await openPremiumJustification(page, 375);
    const hero = page.getByTestId("freedom-hero");
    await expect(hero).toHaveAttribute("data-collapsed", "false");
    await expect(hero).toHaveAttribute("data-premium", "true");
    await page.evaluate(() => window.scrollBy(0, 120));
    await page.waitForTimeout(400);
    await expect(hero).toHaveAttribute("data-collapsed", "false");
    await expect(page.getByTestId("freedom-premium-justification")).toBeVisible();
    await page.evaluate(() => window.scrollBy(0, 220));
    await expect(hero).toHaveAttribute("data-collapsed", "true", { timeout: 5000 });
  });

  test("colapsa no scroll e também no fim da página", async ({ page }) => {
    await openCalculator(page, 375, 720);
    await submitPanel(page);
    const hero = page.getByTestId("freedom-hero");
    await page.evaluate(() => window.scrollTo(0, 50));
    await page.waitForTimeout(300);
    await expect(hero).toHaveAttribute("data-collapsed", "false");
    await page.evaluate(() => window.scrollTo(0, 120));
    await expect(hero).toHaveAttribute("data-collapsed", "true", { timeout: 5000 });
    await page.waitForTimeout(420);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(hero).toHaveAttribute("data-collapsed", "false", { timeout: 5000 });
    await page.getByTestId("freedom-metrics-grid").scrollIntoViewIfNeeded();
    await expect(hero).toHaveAttribute("data-collapsed", "true", { timeout: 5000 });
    for (let i = 0; i < 6; i += 1) {
      await page.waitForTimeout(50);
      await expect(hero).toHaveAttribute("data-collapsed", "true");
    }
  });

  test("ao voltar ao topo o hero reexpande", async ({ page }) => {
    await openCalculator(page, 375, 720);
    await submitPanel(page);
    const hero = page.getByTestId("freedom-hero");
    await page.evaluate(() => window.scrollTo(0, 200));
    await expect(hero).toHaveAttribute("data-collapsed", "true", { timeout: 5000 });
    await page.waitForTimeout(420);
    await page.evaluate(async () => {
      for (let y = 200; y >= 0; y -= 40) {
        window.scrollTo(0, y);
        await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
      }
      window.scrollTo(0, 0);
    });
    await expect(hero).toHaveAttribute("data-collapsed", "false", { timeout: 5000 });
    await expect(page.getByTestId("freedom-hero-expanded")).toBeVisible();
    await expect(page.getByRole("heading", { name: /chega a R\$ 1 milhão em/i })).toBeVisible();
  });

  test("Premium usa borda estática sem clip nas laterais", async ({ page }) => {
    await openCalculator(page, 375, 720);
    await submitPanel(page);
    await page.getByRole("switch", { name: /Topo das Pesquisas/i }).click();
    const premiumCard = page.getByTestId("freedom-premium-card");
    const hero = page.getByTestId("freedom-hero");
    await expect(hero).toHaveAttribute("data-premium", "true");
    await expect(premiumCard).toBeVisible();
    const premiumBox = await premiumCard.boundingBox();
    const heroBox = await hero.boundingBox();
    expect(premiumBox).toBeTruthy();
    expect(heroBox).toBeTruthy();
    expect(premiumBox!.x).toBeGreaterThanOrEqual(12);
    expect(premiumBox!.x + premiumBox!.width).toBeLessThanOrEqual(375 - 12);
    expect(heroBox!.x).toBeGreaterThanOrEqual(12);
    expect(heroBox!.x + heroBox!.width).toBeLessThanOrEqual(375 - 12);
    const styles = await hero.evaluate((el) => {
      const computed = getComputedStyle(el);
      return {
        borderTopWidth: computed.borderTopWidth,
        borderLeftWidth: computed.borderLeftWidth,
        borderRightWidth: computed.borderRightWidth,
        borderBottomWidth: computed.borderBottomWidth,
        overflow: computed.overflow,
      };
    });
    expect(styles.borderLeftWidth).toBe(styles.borderTopWidth);
    expect(styles.borderRightWidth).toBe(styles.borderTopWidth);
    expect(styles.borderBottomWidth).toBe(styles.borderTopWidth);
    expect(styles.overflow).not.toBe("hidden");
  });

  test("explica o prazo até R$ 1 milhão", async ({ page }) => {
    await openCalculator(page, 375);
    await submitPanel(page);
    await expect(page.getByRole("heading", { name: /chega a R\$ 1 milhão em/i })).toBeVisible();
    await page.getByTestId("info-hint-trigger-years-back").click();
    const panel = page.getByTestId("info-hint-panel-years-back");
    await expect(panel).toBeVisible();
    await expect(panel.getByTestId("years-back-explanation")).toContainText(
      /prazo até R\$ 1 milhão/i,
    );
    await expect(panel).toContainText(/quase não muda/i);
    await expect(panel).toContainText(/100%/i);
  });

  test("justificativa Premium fica no card do Topo das Pesquisas", async ({ page }) => {
    await openPremiumJustification(page);
    const premiumCard = page.getByTestId("freedom-premium-card");
    const justification = page.getByTestId("freedom-premium-justification");
    await expect(premiumCard).toContainText(/Sem Premium/i);
    await expect(justification).toContainText(/Com Premium/i);
    await expect(justification).toContainText(/\/mês/);
    await expect(justification).toContainText(/até R\$ 1 mi/i);
    await expect(justification).toContainText(/no bolso/i);
    await expect(justification).toContainText(/a menos no caminho/i);
    const cta = page.getByTestId("freedom-premium-cta");
    await expect(cta).toContainText(/liberdade mais fácil/i);
    await expect(cta.getByRole("button", { name: /Experimentar o Premium/i })).toBeVisible();
  });

  test("CTA Premium do card abre modal de conversão", async ({ page }) => {
    await openPremiumJustification(page);
    await page
      .getByTestId("freedom-premium-cta")
      .getByRole("button", { name: /Experimentar o Premium/i })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Sigillus Premium/i)).toBeVisible();
  });

  test("footer Premium aparece abaixo das conquistas com seletor ligado", async ({ page }) => {
    await openCalculator(page, 1280);
    await submitPanel(page);
    await expect(page.getByTestId("freedom-premium-footer-cta")).toHaveCount(0);
    await page.getByRole("switch", { name: /Topo das Pesquisas/i }).click();
    const footer = page.getByTestId("freedom-premium-footer-cta");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(/liberdade mais fácil/i);
    const dreamsTitle = page.getByRole("heading", { name: /Linha do Tempo das Conquistas/i });
    const footerBox = await footer.boundingBox();
    const dreamsBox = await dreamsTitle.boundingBox();
    const gridBox = await page.getByTestId("freedom-dreams-grid").boundingBox();
    expect(footerBox).toBeTruthy();
    expect(dreamsBox).toBeTruthy();
    expect(gridBox).toBeTruthy();
    expect(footerBox!.y).toBeGreaterThan(dreamsBox!.y);
    expect(Math.abs(footerBox!.width - gridBox!.width)).toBeLessThan(8);
    await expect(footer.getByRole("button", { name: /Criar conta profissional/i })).toBeVisible();
    await expect(footer.getByRole("button", { name: /Experimentar o Premium/i })).toBeVisible();
  });

  test("footer Premium no mobile usa duas colunas de links", async ({ page }) => {
    await openPremiumFooterCta(page, 375);
    const footer = page.getByTestId("freedom-premium-footer-cta");
    const createBtn = footer.getByRole("button", { name: /Criar conta profissional/i });
    const tryBtn = footer.getByRole("button", { name: /Experimentar o Premium/i });
    const createBox = await createBtn.boundingBox();
    const tryBox = await tryBtn.boundingBox();
    expect(createBox).toBeTruthy();
    expect(tryBox).toBeTruthy();
    expect(Math.abs(createBox!.y - tryBox!.y)).toBeLessThan(12);
    expect(tryBox!.x).toBeGreaterThan(createBox!.x);
  });

  test("footer Premium visitante vai para login", async ({ page }) => {
    await openPremiumFooterCta(page);
    await page
      .getByTestId("freedom-premium-footer-cta")
      .getByRole("button", { name: /Experimentar o Premium/i })
      .click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("footer criar conta profissional abre cadastro", async ({ page }) => {
    await openPremiumFooterCta(page);
    await page
      .getByTestId("freedom-premium-footer-cta")
      .getByRole("button", { name: /Criar conta profissional/i })
      .click();
    await expect(page).toHaveURL(/\/auth\/cadastro\/profissional/);
  });

  test("footer Premium cliente vai para cadastro profissional", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await openPremiumFooterCta(page);
    await page
      .getByTestId("freedom-premium-footer-cta")
      .getByRole("button", { name: /Experimentar o Premium/i })
      .click();
    await expect(page).toHaveURL(/\/auth\/cadastro\/profissional/);
  });

  test("footer Premium profissional abre modal de conversão", async ({ page }) => {
    await seedUserRole(page, "profissional");
    await openPremiumFooterCta(page);
    const footer = page.getByTestId("freedom-premium-footer-cta");
    await expect(footer.getByRole("button", { name: /Criar conta profissional/i })).toHaveCount(0);
    await footer.getByRole("button", { name: /Experimentar o Premium/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Sigillus Premium/i)).toBeVisible();
  });

  test("prazo até R$ 1 mi muda com parâmetros altos", async ({ page }) => {
    await openCalculator(page, 375);
    const preview = page.getByTestId("freedom-live-preview");
    await expect(preview).toContainText(/3 Anos e 3 Meses/i);
    for (let i = 0; i < 2; i += 1) {
      await page.getByRole("button", { name: "adiciona 50" }).first().click();
    }
    await page.getByRole("button", { name: "adiciona 1" }).nth(0).click();
    await page.getByRole("button", { name: "adiciona 1" }).nth(1).click();
    await page.getByRole("button", { name: "adiciona 1" }).nth(1).click();
    await expect(preview).not.toContainText(/3 Anos e 3 Meses/i);
    await expect(preview).toContainText(/Até R\$ 1 mi:/i);
    await expect(preview).toContainText(/Ano|Anos|Mês|Meses/i);
  });

  test("InfoHints têm explicação própria por módulo", async ({ page }) => {
    await openCalculator(page, 768);
    await page.getByTestId("info-hint-trigger-calc-base").click();
    const calcPanel = page.getByTestId("info-hint-panel-calc-base");
    await expect(calcPanel.getByTestId("hint-calc-base")).toBeVisible();
    await expect(calcPanel).toContainText(/4,33 semanas/i);
    await expect(calcPanel.getByTestId("clt-payroll-breakdown")).toHaveCount(0);
    await expect(calcPanel).toContainText(/1\.621,00|R\$\s*1\.621/);
    await page.keyboard.press("Escape");

    await submitPanel(page);

    await page.getByTestId("info-hint-trigger-amount").click();
    const amountPanel = page.getByTestId("info-hint-panel-amount");
    await expect(amountPanel.getByTestId("hint-amount")).toBeVisible();
    await expect(amountPanel).toContainText(/Montante do seu cenário/i);
    await expect(amountPanel.getByTestId("clt-payroll-breakdown")).toHaveCount(0);
    await page.keyboard.press("Escape");

    await page.getByTestId("info-hint-trigger-race").click();
    const racePanel = page.getByTestId("info-hint-panel-race");
    await expect(racePanel.getByTestId("hint-race")).toBeVisible();
    await expect(racePanel.getByTestId("clt-payroll-breakdown")).toBeVisible();
    await expect(racePanel).toContainText("− INSS");
    await expect(racePanel).toContainText(/Decreto/i);
    await page.keyboard.press("Escape");

    await page.getByTestId("info-hint-trigger-equivalence").click();
    const eqPanel = page.getByTestId("info-hint-panel-equivalence");
    await expect(eqPanel.getByTestId("hint-equivalence")).toBeVisible();
    await expect(eqPanel).toContainText(/÷/);
    await expect(eqPanel.getByTestId("clt-payroll-breakdown")).toHaveCount(0);
  });

  test("InfoHint no mobile não gera scroll horizontal", async ({ page }) => {
    await openCalculator(page, 375);
    const before = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(before.scrollWidth).toBeLessThanOrEqual(before.clientWidth + 1);
    await page.getByTestId("info-hint-trigger-calc-base").click();
    const panel = page.getByTestId("info-hint-panel-calc-base");
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375 + 1);
    const after = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(after.scrollWidth).toBeLessThanOrEqual(after.clientWidth + 1);
  });

  test("Nova Simulação volta à calculadora", async ({ page }) => {
    await openCalculator(page, 375);
    await submitPanel(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    const hero = page.getByTestId("freedom-hero");
    await expect(hero).toHaveAttribute("data-collapsed", "false", { timeout: 5000 });
    await page
      .getByTestId("freedom-hero-expanded")
      .getByRole("button", { name: /Nova Simulação/i })
      .click();
    await expect(page.getByRole("heading", { name: "Calculadora de Liberdade" })).toBeVisible();
  });

  test("toggle Premium continua atualizando números", async ({ page }) => {
    await openCalculator(page, 1280);
    await submitPanel(page);
    const amount = page.getByTestId("freedom-hero-amount");
    const before = await amount.innerText();
    await page.getByRole("switch", { name: /Topo das Pesquisas/i }).click();
    await expect(amount).not.toHaveText(before);
  });

  for (const width of [375, 768, 1280] as const) {
    test(`fluxo completo em ${width}px`, async ({ page }) => {
      await openCalculator(page, width);
      await expect(page.getByTestId("freedom-live-preview")).toBeVisible();
      await submitPanel(page);
      await expect(page.getByTestId("freedom-metrics-grid")).toBeVisible();
    });
  }
});
