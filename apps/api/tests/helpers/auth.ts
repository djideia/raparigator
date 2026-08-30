import type { TestHarness } from "./app";

export type SignedUp = {
  userId: string;
  cookie: string;
  email: string;
};

export async function signUp(
  harness: TestHarness,
  input: {
    email: string;
    password?: string;
    name?: string;
    role?: "cliente" | "profissional";
  },
): Promise<SignedUp> {
  const response = await harness.fetch("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: harness.config.WEB_ORIGIN },
    body: JSON.stringify({
      email: input.email,
      password: input.password ?? "Senha@12345",
      name: input.name ?? "Pessoa Teste",
      role: input.role ?? "cliente",
    }),
  });
  if (!response.ok) {
    throw new Error(`sign-up falhou: ${response.status} ${await response.text()}`);
  }
  const body = (await response.json()) as { user: { id: string } };
  return { userId: body.user.id, cookie: cookieHeader(response), email: input.email };
}

export async function signInAdmin(harness: TestHarness, email: string, password: string) {
  const response = await harness.fetch("/api/admin-auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: harness.config.WEB_ORIGIN },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(`admin sign-in falhou: ${response.status} ${await response.text()}`);
  }
  return cookieHeader(response);
}

export function cookieHeader(response: Response): string {
  const cookies = response.headers.getSetCookie?.() ?? [];
  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
}
