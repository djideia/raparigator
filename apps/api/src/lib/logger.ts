import pino from "pino";
import { getConfig } from "../config";

const PII_PATHS = [
  "cpf",
  "*.cpf",
  "email",
  "*.email",
  "phone",
  "*.phone",
  "whatsappNumber",
  "*.whatsappNumber",
  "telegramUsername",
  "*.telegramUsername",
  "password",
  "*.password",
  "content",
  "*.content",
  "greeting",
  "*.greeting",
  "req.headers.authorization",
  "req.headers.cookie",
  'res.headers["set-cookie"]',
];

export function createLogger(options?: { level?: string; pretty?: boolean }) {
  const config = getConfig();
  const level = options?.level ?? config.LOG_LEVEL;
  const pretty = options?.pretty ?? (!config.isProduction && !config.isTest);
  return pino({
    level,
    redact: { paths: PII_PATHS, censor: "[redacted]" },
    base: { service: "sigillus-api" },
    ...(pretty
      ? {
          transport: {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "HH:MM:ss" },
          },
        }
      : {}),
  });
}

let root: pino.Logger | null = null;

export function getLogger(): pino.Logger {
  if (!root) {
    root = createLogger();
  }
  return root;
}

export type Logger = pino.Logger;
