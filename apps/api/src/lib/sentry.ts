import * as Sentry from "@sentry/node";
import type { AppConfig } from "../config";

export function initSentry(config: AppConfig) {
  if (!config.SENTRY_DSN) {
    return false;
  }
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    tracesSampleRate: config.SENTRY_TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
  });
  return true;
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
