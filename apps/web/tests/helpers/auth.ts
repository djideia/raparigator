import { test, type Page } from "@playwright/test";
import { credentials } from "./credentials";

type UserRole = "cliente" | "profissional";

function baseUrl() {
  return test.info().project.use.baseURL ?? "http://localhost:3000";
}

export async function seedUserRole(page: Page, role: UserRole) {
  await page.context().addCookies([{ name: "sigillus-user-role", value: role, url: baseUrl() }]);
  await page.addInitScript((nextRole) => {
    window.localStorage.setItem("sigillus-user-role", nextRole);
  }, role);
}

export async function seedAdminSession(page: Page, email = credentials.admin.email) {
  await page
    .context()
    .addCookies([
      { name: "sigillus-admin-session", value: encodeURIComponent(email), url: baseUrl() },
    ]);
  await page.addInitScript((adminEmail) => {
    window.localStorage.setItem("sigillus-admin-session", adminEmail);
  }, email);
}

export async function loginViaUi(page: Page, user: { email: string; password: string }) {
  await page.goto("/auth/login");
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha").fill(user.password);
  await page.getByRole("button", { name: "Entrar na plataforma" }).click();
  await page.waitForURL("**/feed**");
}
