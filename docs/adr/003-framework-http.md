# ADR-003 — Framework HTTP: Hono + oRPC (contract-first)

- Status: aceito (2026-08-15)

## Contexto

Precisamos de: contrato tipado consumido pelo Next sem codegen, OpenAPI exportado (o time não perde o Scalar/spec que a API .NET tinha), SSE para o chat (ADR-005), rotas "cruas" fora do contrato (health, webhook de billing com corpo bruto para verificação de assinatura, handler do better-auth) e middlewares de CORS/rate limit. Runtime é Node (ADR-002).

## Opções consideradas

- **Elysia + oRPC** — ponto de partida sugerido. Elysia é Bun-first: no Node roda via adaptador (`@elysiajs/node`) tratado como segunda classe, e boa parte da DX (tipos de contexto, `t.*`) duplica o que oRPC/Zod já dão. Com Node como runtime, ela perde seu principal argumento.
- **Hono + oRPC** — Hono roda nativo em Node (`@hono/node-server`), Bun, Deno, Workers, sem adaptador de terceiros; API mínima e estável; middlewares first-party (`cors`, `secureHeaders`, `logger`). oRPC entra como handler montado no Hono.
- **tRPC** — maduro, ecossistema maior, mas OpenAPI é plugin de terceiros e o desenho contract-first (contrato num pacote separado da implementação) é menos natural. Perderíamos a spec de graça.
- **NestJS** — descartado. Seu argumento aqui seria familiaridade com ASP.NET, critério que os mantenedores retiraram da mesa; tecnicamente adiciona DI por decorator, módulos e uma camada de abstração que o domínio não pede, e ainda exigiria oRPC/ts-rest por cima para ter type-safety end-to-end.

## Decisão

**Hono como servidor HTTP + oRPC (`@orpc/contract` no `packages/contracts`, `@orpc/server` na API, `@orpc/client` no web) + Zod 4.**

- O contrato vive em `packages/contracts/src/router.ts` (`oc.input(...).output(...)`). A API `implement(contract)`; o web cria `ContractRouterClient<typeof contract>`. Mudança de contrato quebra o `tsc` dos dois lados.
- OpenAPI gerado por `@orpc/openapi` e servido em `/api/openapi.json`, com Scalar em `/api/docs` fora de produção.
- Camadas na API: `modules/<área>/{router,service,repository}.ts`. Sem Clean Architecture cerimonial.
- Chat em tempo real via **event iterator** do oRPC (SSE por baixo), dentro do contrato.
- Rotas fora do contrato ficam no Hono: `/healthz`, `/api/auth/*` (better-auth), `/api/admin-auth/*`, `/api/billing/webhook`.

## Consequências

- Não há codegen nem client gerado no CI: o client é o tipo do contrato.
- Toda validação de entrada é Zod no contrato; validação manual dentro de service é proibida.
- Se um dia o time quiser Bun ou edge, Hono e oRPC rodam sem mudança de código.
