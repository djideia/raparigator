import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { OpenAPIGenerator } from "@orpc/openapi";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { contract } from "@sigillus/contracts";
import type { AppDeps } from "./deps";
import { captureException } from "./lib/sentry";
import { createAppContext, resolveClientIp } from "./orpc/context";
import { router } from "./router";
import { createBillingWebhookRoute } from "./routes/billing-webhook";

export function createApp(deps: AppDeps) {
  const { config, db, logger } = deps;
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: (origin) => (config.corsOrigins.includes(origin) ? origin : null),
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      maxAge: 600,
    }),
  );
  app.use("*", secureHeaders());

  app.use("*", async (c, next) => {
    const started = Date.now();
    await next();
    if (c.req.path === "/healthz" || c.req.path === "/readyz") {
      return;
    }
    logger.info(
      {
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs: Date.now() - started,
      },
      "request",
    );
  });

  app.get("/healthz", async (c) => {
    try {
      await db.execute(sql`select 1`);
      return c.json({ status: "ok", db: "up" });
    } catch (error) {
      logger.error({ err: error }, "healthz: banco indisponível");
      return c.json({ status: "degraded", db: "down" }, 503);
    }
  });

  app.get("/readyz", (c) =>
    deps.ready() ? c.json({ status: "ready" }) : c.json({ status: "starting" }, 503),
  );

  app.on(["GET", "POST"], "/api/auth/*", (c) => deps.auth.handler(c.req.raw));
  app.on(["GET", "POST"], "/api/admin-auth/*", (c) => deps.adminAuth.handler(c.req.raw));
  app.route(
    "/",
    createBillingWebhookRoute({
      db,
      billing: deps.billing,
      jobs: deps.jobs,
      logger,
    }),
  );

  const reportError = (error: unknown) => {
    const status = (error as { status?: number }).status;
    if (typeof status === "number" && status < 500) {
      return;
    }
    logger.error({ err: error }, "erro não tratado no handler oRPC");
    captureException(error);
  };

  const rpcHandler = new RPCHandler(router, { interceptors: [onError(reportError)] });
  const openApiHandler = new OpenAPIHandler(router, { interceptors: [onError(reportError)] });
  const openApiGenerator = new OpenAPIGenerator({
    schemaConverters: [new ZodToJsonSchemaConverter()],
  });

  app.all("/rpc/*", async (c) => {
    const { matched, response } = await rpcHandler.handle(c.req.raw, {
      prefix: "/rpc",
      context: createAppContext(deps, {
        headers: c.req.raw.headers,
        ip: resolveClientIp(c.req.raw.headers),
      }),
    });
    if (matched) {
      return c.newResponse(response.body, response);
    }
    return c.notFound();
  });

  app.get("/api/openapi.json", async (c) => {
    if (!config.docsEnabled) {
      return c.notFound();
    }
    const spec = await openApiGenerator.generate(contract, {
      info: { title: "Sigillus API", version: "0.1.0" },
      servers: [{ url: `${config.API_ORIGIN}/api` }],
    });
    return c.json(spec);
  });

  app.get("/api/docs", (c) => {
    if (!config.docsEnabled) {
      return c.notFound();
    }
    return c.html(
      `<!doctype html><html><head><meta charset="utf-8"><title>Sigillus API</title></head><body><script id="api-reference" data-url="/api/openapi.json"></script><script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script></body></html>`,
    );
  });

  app.all("/api/*", async (c) => {
    const { matched, response } = await openApiHandler.handle(c.req.raw, {
      prefix: "/api",
      context: createAppContext(deps, {
        headers: c.req.raw.headers,
        ip: resolveClientIp(c.req.raw.headers),
      }),
    });
    if (matched) {
      return c.newResponse(response.body, response);
    }
    return c.notFound();
  });

  app.onError((error, c) => {
    logger.error({ err: error, path: c.req.path }, "erro não tratado");
    captureException(error, { path: c.req.path });
    return c.json({ error: "internal_error" }, 500);
  });

  return app;
}

export type App = ReturnType<typeof createApp>;
