import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config";

const baseEnv = {
  DATABASE_URL: "postgres://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(32),
  S3_ENDPOINT: "http://localhost:9000",
  S3_BUCKET: "b",
  S3_ACCESS_KEY_ID: "a",
  S3_SECRET_ACCESS_KEY: "s",
  BILLING_WEBHOOK_SECRET: "y".repeat(16),
};

describe("config", () => {
  it("recusa subir sem variáveis obrigatórias", () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
  });

  it("aplica defaults e deriva CORS do WEB_ORIGIN", () => {
    const config = loadConfig({ ...baseEnv });
    expect(config.PORT).toBe(4000);
    expect(config.corsOrigins).toEqual(["http://localhost:3000"]);
    expect(config.docsEnabled).toBe(true);
    expect(config.MIGRATE_ON_BOOT).toBe(true);
  });

  it("recusa billing fake e códigos de dev em produção", () => {
    expect(() =>
      loadConfig({ ...baseEnv, NODE_ENV: "production", BILLING_PROVIDER: "fake" }),
    ).toThrow(/BILLING_PROVIDER/);
    expect(() =>
      loadConfig({ ...baseEnv, NODE_ENV: "production", VERIFICATION_DEV_CODES: "true" }),
    ).toThrow(/VERIFICATION_DEV_CODES/);
  });

  it("em produção com fake reconhecido, sobe com billing desabilitado e sem docs", () => {
    const config = loadConfig({
      ...baseEnv,
      NODE_ENV: "production",
      BILLING_FAKE_ACKNOWLEDGED: "true",
    });
    expect(config.billingEnabled).toBe(false);
    expect(config.docsEnabled).toBe(false);
  });
});
