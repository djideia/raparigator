import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { users, verificationChannels } from "../src/db/schema";
import {
  createVerificationService,
  type VerificationNotifier,
  type VerificationUser,
} from "../src/modules/verification/service";
import { createTestHarness } from "./helpers/app";
import { signUp } from "./helpers/auth";

const harness = createTestHarness();

type Sent = { channel: string; target: string; code: string };

async function setup() {
  const sent: Sent[] = [];
  const notifier: VerificationNotifier = {
    async sendCode(channel, target, code) {
      sent.push({ channel, target, code });
    },
  };
  const service = createVerificationService({
    db: harness.db,
    config: { ...harness.config, VERIFICATION_DEV_CODES: true },
    logger: harness.deps.logger,
    notifier,
  });
  const signedUp = await signUp(harness, { email: "verif@teste.dev" });
  await harness.db.update(users).set({ phone: "11999998888" }).where(eq(users.id, signedUp.userId));
  const user: VerificationUser = {
    id: signedUp.userId,
    email: signedUp.email,
    phone: "11999998888",
  };
  return { service, sent, user };
}

describe("verificação de e-mail e telefone", () => {
  it("estado inicial: nada verificado, alvos vêm do usuário", async () => {
    const { service, user } = await setup();
    const state = await service.getState(user);
    expect(state.email).toEqual({
      target: "verif@teste.dev",
      verified: false,
      verifiedAt: null,
      codeSentAt: null,
      expiresAt: null,
      attempts: 0,
    });
    expect(state.phone.target).toBe("11999998888");
    expect(state.phone.verified).toBe(false);
  });

  it("fluxo feliz: envia, confirma, marca verificado e emailVerified", async () => {
    const { service, sent, user } = await setup();
    const result = await service.sendCode(user, "email");
    expect(result.devCode).toMatch(/^\d{6}$/);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.code).toBe(result.devCode);
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());

    const pending = await service.getState(user);
    expect(pending.email.codeSentAt).not.toBeNull();
    expect(pending.email.expiresAt).toBe(result.expiresAt);

    const confirmed = await service.confirmCode(user, "email", result.devCode!);
    expect(confirmed).toEqual({ success: true, message: "E-mail validado com sucesso." });

    const state = await service.getState(user);
    expect(state.email.verified).toBe(true);
    expect(state.email.verifiedAt).not.toBeNull();
    expect(state.email.codeSentAt).toBeNull();
    const [row] = await harness.db
      .select({ emailVerified: users.emailVerified, phoneVerified: users.phoneVerified })
      .from(users)
      .where(eq(users.id, user.id));
    expect(row?.emailVerified).toBe(true);
    expect(row?.phoneVerified).toBe(false);
    const [channel] = await harness.db.select().from(verificationChannels);
    expect(channel?.codeHash).toBeNull();
  });

  it("telefone verificado marca phoneVerified", async () => {
    const { service, user } = await setup();
    const { devCode } = await service.sendCode(user, "phone");
    const confirmed = await service.confirmCode(user, "phone", devCode!);
    expect(confirmed.message).toBe("Telefone validado com sucesso.");
    const [row] = await harness.db
      .select({ phoneVerified: users.phoneVerified })
      .from(users)
      .where(eq(users.id, user.id));
    expect(row?.phoneVerified).toBe(true);
  });

  it("devCode é null quando VERIFICATION_DEV_CODES está desligado", async () => {
    const { user } = await setup();
    const service = createVerificationService({
      db: harness.db,
      config: { ...harness.config, VERIFICATION_DEV_CODES: false },
      logger: harness.deps.logger,
    });
    const result = await service.sendCode(user, "email");
    expect(result.devCode).toBeNull();
  });

  it("código errado conta tentativa e não verifica; 5 erros invalidam o código", async () => {
    const { service, user } = await setup();
    const { devCode } = await service.sendCode(user, "email");
    const wrong = devCode === "000000" ? "111111" : "000000";
    const first = await service.confirmCode(user, "email", wrong);
    expect(first).toEqual({
      success: false,
      message: "Código inválido. Verifique e tente novamente.",
    });
    expect((await service.getState(user)).email.attempts).toBe(1);
    for (let index = 0; index < 4; index += 1) {
      await service.confirmCode(user, "email", wrong);
    }
    expect((await service.getState(user)).email.attempts).toBe(5);
    const afterLimit = await service.confirmCode(user, "email", devCode!);
    expect(afterLimit.success).toBe(false);
    expect(afterLimit.message).toBe("O código expirou. Envie outro para continuar.");
  });

  it("código expirado ou inexistente devolve mensagem de expirado e limpa", async () => {
    const { service, user } = await setup();
    const none = await service.confirmCode(user, "email", "123456");
    expect(none).toEqual({
      success: false,
      message: "O código expirou. Envie outro para continuar.",
    });
    const { devCode } = await service.sendCode(user, "email");
    await harness.db
      .update(verificationChannels)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(verificationChannels.userId, user.id));
    expect((await service.getState(user)).email.codeSentAt).toBeNull();
    const expired = await service.confirmCode(user, "email", devCode!);
    expect(expired.success).toBe(false);
    expect(expired.message).toBe("O código expirou. Envie outro para continuar.");
    const [row] = await harness.db.select().from(verificationChannels);
    expect(row?.codeHash).toBeNull();
  });

  it("target mudou reseta o estado do canal", async () => {
    const { service, user } = await setup();
    const { devCode } = await service.sendCode(user, "email");
    await service.confirmCode(user, "email", devCode!);
    expect((await service.getState(user)).email.verified).toBe(true);
    const changed: VerificationUser = { ...user, email: "outro@teste.dev" };
    const state = await service.getState(changed);
    expect(state.email.verified).toBe(false);
    expect(state.email.target).toBe("outro@teste.dev");
    const stale = await service.confirmCode(changed, "email", devCode!);
    expect(stale.success).toBe(false);
    const resent = await service.sendCode(changed, "email");
    const confirmed = await service.confirmCode(changed, "email", resent.devCode!);
    expect(confirmed.success).toBe(true);
    const rows = await harness.db.select().from(verificationChannels);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.target).toBe("outro@teste.dev");
  });

  it("sem telefone cadastrado não envia código", async () => {
    const { service, user } = await setup();
    await expect(service.sendCode({ ...user, phone: null }, "phone")).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});
