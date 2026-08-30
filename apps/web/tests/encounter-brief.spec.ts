import { test, expect, type Page } from "@playwright/test";
import { ads, credentials } from "./helpers/credentials";
import { seedUserRole } from "./helpers/auth";

const SIMULATOR_DURATION = "2 horas";
const SIMULATOR_EXTRA = "Jantar";

async function buildSimulation(page: Page) {
  await page
    .getByRole("button")
    .filter({ hasText: new RegExp(`^Duração${SIMULATOR_DURATION}`) })
    .first()
    .click();
  await page
    .getByRole("button")
    .filter({ hasText: new RegExp(`^${SIMULATOR_EXTRA}`) })
    .first()
    .click();
}

test.describe("Briefing de encontro", () => {
  test("leva a simulação do anúncio para o chat e envia como card", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await page.goto(`/anuncio/${ads.premiumSlug}`);

    await buildSimulation(page);
    await page.getByRole("button", { name: "Chat Direto", exact: true }).click();
    await page.waitForURL("**/chat**");

    const preview = page.getByText("Seu interesse, pronto para enviar").first();
    await expect(preview).toBeVisible();

    await page.getByRole("button", { name: "Enviar interesse" }).first().click();

    await expect(page.getByText("Simulação de encontro").first()).toBeVisible();
    await expect(page.getByText(SIMULATOR_DURATION).first()).toBeVisible();
    await expect(preview).toBeHidden();
  });

  test("o link 'Ver anúncio' do card enviado pousa no simulador, não no topo", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await page.goto(`/anuncio/${ads.premiumSlug}`);

    await buildSimulation(page);
    await page.getByRole("button", { name: "Chat Direto", exact: true }).click();
    await page.waitForURL("**/chat**");
    await page.getByRole("button", { name: "Enviar interesse" }).first().click();

    await page
      .getByRole("link", { name: `Ver anúncio de ${ads.premiumName}` })
      .first()
      .click();
    await page.waitForURL(`**/anuncio/${ads.premiumSlug}#simulador-de-encontro`);

    await expect(async () => {
      const top = await page
        .locator("#simulador-de-encontro")
        .evaluate((el) => el.getBoundingClientRect().top);
      expect(top).toBeGreaterThan(0);
      expect(top).toBeLessThan(200);
    }).toPass();
  });

  test("permite editar a mensagem antes de enviar e restaurar a sugestão", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await page.goto(`/anuncio/${ads.premiumSlug}`);

    await buildSimulation(page);
    await page.getByRole("button", { name: "Chat Direto", exact: true }).click();
    await page.waitForURL("**/chat**");

    const greeting = page.getByLabel("Sua mensagem").first();
    // A sugestão já vem preenchida — a prévia costuma montar junto com o interesse.
    const suggestion = await greeting.inputValue();
    expect(suggestion.length).toBeGreaterThan(0);

    const custom = "Oi! Montei essa simulação, topa conversar sobre?";
    await greeting.fill(custom);
    await page.getByRole("button", { name: "Restaurar sugestão" }).first().click();
    await expect(greeting).toHaveValue(suggestion);

    await greeting.fill(custom);
    await page.getByRole("button", { name: "Enviar interesse" }).first().click();

    await expect(page.getByText(custom).first()).toBeVisible();
    await expect(page.getByText("Simulação de encontro").first()).toBeVisible();
  });

  test("mensagem vazia bloqueia o envio", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await page.goto(`/anuncio/${ads.premiumSlug}`);

    await buildSimulation(page);
    await page.getByRole("button", { name: "Chat Direto", exact: true }).click();
    await page.waitForURL("**/chat**");

    await page.getByLabel("Sua mensagem").first().fill("   ");
    await expect(page.getByRole("button", { name: "Enviar interesse" }).first()).toBeDisabled();
  });

  test("funciona mesmo com o chat já visitado antes, sem recarregar a página", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await page.goto("/chat");
    await expect(page.getByRole("heading", { name: "Conversas" })).toBeVisible();

    // Navegação client-side o caminho todo: o briefing não pode depender de a tela
    // do chat ser montada do zero nem de parâmetro na URL.
    await page.getByRole("link", { name: "Feed" }).first().click();
    await page.waitForURL("**/feed**");
    await page.locator(`a[href*="/anuncio/${ads.premiumSlug}"]`).first().click();
    await page.waitForURL(`**/anuncio/${ads.premiumSlug}`);

    await buildSimulation(page);
    await page.getByRole("button", { name: "Chat Direto", exact: true }).click();
    await page.waitForURL("**/chat**");

    await expect(page.getByText("Seu interesse, pronto para enviar").first()).toBeVisible();
  });

  test("clicar no corpo da prévia volta ao anúncio, mantendo o interesse pendente", async ({
    page,
  }) => {
    await seedUserRole(page, "cliente");
    await page.goto(`/anuncio/${ads.premiumSlug}`);

    await buildSimulation(page);
    await page.getByRole("button", { name: "Chat Direto", exact: true }).click();
    await page.waitForURL("**/chat**");

    await page.getByRole("button", { name: "Toque para ajustar a simulação" }).first().click();
    await page.waitForURL(`**/anuncio/${ads.premiumSlug}#simulador-de-encontro`);

    // Precisa cair no simulador, não no topo do anúncio — e sem ficar sob o cabeçalho fixo.
    await expect(async () => {
      const top = await page
        .locator("#simulador-de-encontro")
        .evaluate((el) => el.getBoundingClientRect().top);
      expect(top).toBeGreaterThan(0);
      expect(top).toBeLessThan(200);
    }).toPass();

    await page.getByRole("link", { name: "Chat" }).first().click();
    await page.waitForURL("**/chat**");
    await expect(page.getByText("Seu interesse, pronto para enviar").first()).toBeVisible();
  });

  test("descartar a prévia não envia nada", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await page.goto(`/anuncio/${ads.premiumSlug}`);

    await buildSimulation(page);
    await page.getByRole("button", { name: "Chat Direto", exact: true }).click();
    await page.waitForURL("**/chat**");

    await page.getByRole("button", { name: "Descartar simulação" }).first().click();

    await expect(page.getByText("Seu interesse, pronto para enviar")).toBeHidden();
    await expect(page.getByText("Simulação de encontro")).toBeHidden();
  });

  test("link de simulação remonta as seleções e ignora serviço inválido", async ({ page }) => {
    await page.goto(
      `/p/${ads.premiumSlug}?d=${encodeURIComponent(SIMULATOR_DURATION)}&e=${encodeURIComponent(
        `${SIMULATOR_EXTRA}|Servico Inexistente`,
      )}`,
    );

    const duration = page
      .getByRole("button")
      .filter({ hasText: new RegExp(`^Duração${SIMULATOR_DURATION}`) })
      .first();

    // Só a opção escolhida mostra o preço; as demais ficam sem valor no rótulo.
    await expect(duration).toContainText("R$");
    await expect(page.getByText("Servico Inexistente")).toHaveCount(0);
  });

  test("login preserva as seleções e devolve o visitante ao anúncio", async ({ page }) => {
    await page.goto(`/anuncio/${ads.premiumSlug}`);

    await buildSimulation(page);
    await page.getByRole("link", { name: "Entrar para Interagir" }).first().click();
    await page.waitForURL("**/auth/login**");

    await page.getByLabel("E-mail").fill(credentials.cliente.email);
    await page.getByLabel("Senha").fill(credentials.cliente.password);
    await page.getByRole("button", { name: "Entrar na plataforma" }).click();

    await page.waitForURL(`**/anuncio/${ads.premiumSlug}`);
    await expect(
      page
        .getByRole("button")
        .filter({ hasText: new RegExp(`^Duração${SIMULATOR_DURATION}`) })
        .first(),
    ).toContainText("R$");
  });
});
