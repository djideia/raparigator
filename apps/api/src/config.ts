import { z } from "zod";

const booleanFromEnv = z
  .enum(["true", "false", "1", "0"])
  .transform((value) => value === "true" || value === "1");

const csv = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    HOST: z.string().default("0.0.0.0"),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
    DATABASE_URL: z.string().url(),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    MIGRATE_ON_BOOT: booleanFromEnv.default(true),
    API_ORIGIN: z.string().url().default("http://localhost:4000"),
    WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
    CORS_ORIGINS: csv,
    AUTH_SECRET: z.string().min(32),
    AUTH_TRUST_HOST: booleanFromEnv.default(false),
    COOKIE_DOMAIN: z.string().optional(),
    S3_ENDPOINT: z.string().url(),
    S3_REGION: z.string().default("auto"),
    S3_BUCKET: z.string().min(1),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),
    S3_FORCE_PATH_STYLE: booleanFromEnv.default(true),
    S3_PUBLIC_BASE_URL: z.string().url().optional(),
    MEDIA_UPLOAD_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
    MEDIA_VIEW_URL_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
    BILLING_PROVIDER: z.enum(["fake"]).default("fake"),
    BILLING_FAKE_ACKNOWLEDGED: booleanFromEnv.default(false),
    BILLING_WEBHOOK_SECRET: z.string().min(16),
    JOBS_ENABLED: booleanFromEnv.default(true),
    RATE_LIMIT_ENABLED: booleanFromEnv.default(true),
    SENTRY_DSN: z.string().url().optional(),
    SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
    OPENAPI_DOCS_ENABLED: booleanFromEnv.optional(),
    VERIFICATION_DEV_CODES: booleanFromEnv.default(false),
    SEED_ON_BOOT: booleanFromEnv.default(false),
  })
  .superRefine((env, ctx) => {
    if (
      env.NODE_ENV === "production" &&
      env.BILLING_PROVIDER === "fake" &&
      !env.BILLING_FAKE_ACKNOWLEDGED
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["BILLING_PROVIDER"],
        message:
          "BILLING_PROVIDER=fake não pode subir em produção sem BILLING_FAKE_ACKNOWLEDGED=true (assinatura fica desabilitada).",
      });
    }
    if (env.NODE_ENV === "production" && env.VERIFICATION_DEV_CODES) {
      ctx.addIssue({
        code: "custom",
        path: ["VERIFICATION_DEV_CODES"],
        message: "VERIFICATION_DEV_CODES não pode estar ligado em produção.",
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

export type AppConfig = Env & {
  isProduction: boolean;
  isTest: boolean;
  corsOrigins: string[];
  docsEnabled: boolean;
  billingEnabled: boolean;
};

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Configuração inválida (variáveis de ambiente):\n${details}`);
  }
  const env = parsed.data;
  const corsOrigins = env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : [env.WEB_ORIGIN];
  return {
    ...env,
    isProduction: env.NODE_ENV === "production",
    isTest: env.NODE_ENV === "test",
    corsOrigins,
    docsEnabled: env.OPENAPI_DOCS_ENABLED ?? env.NODE_ENV !== "production",
    billingEnabled: !(env.NODE_ENV === "production" && env.BILLING_PROVIDER === "fake"),
  };
}

let cached: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!cached) {
    cached = loadConfig();
  }
  return cached;
}

export function resetConfigForTests() {
  cached = null;
}
