# Raparigator (Sigillus)

Monorepo da plataforma **Sigillus**: vitrine de anúncios de acompanhantes com feed, chat, painel da profissional, assinatura premium e backoffice. Frontend em Next.js e API em TypeScript compartilhando contrato e regras de domínio.

> A plataforma **não intermedeia serviço**: nenhum dinheiro de cliente transita por ela; o único fluxo monetário é a assinatura premium da profissional. Veja `docs/adr/README.md`.

## Layout

```
apps/web/            Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · Motion · Lucide
apps/api/            Hono + oRPC + Zod 4 · Drizzle (Postgres 17) · better-auth · pg-boss · pino · Vitest
packages/contracts/  Contrato oRPC + schemas Zod — a fonte de verdade dos tipos
packages/domain/     Regras de negócio puras compartilhadas (limites por plano, gate de avaliação, filtros do feed, rascunho, briefing)
docs/adr/            Decisões de arquitetura
compose.yaml         Postgres + MinIO locais
```

## Pré-requisitos

- **Node.js** 20.19+, 22.13+ ou 24+ (ver `engines`) e `npm`
- **Docker** (para Postgres e MinIO locais; só necessário para rodar a API)

## Rodando

```bash
git clone --filter=blob:none https://github.com/djlabz/raparigator.git
cd raparigator
npm install
```

Só o web (dados mockados, sem banco):

```bash
npm run dev
```

Web + API:

```bash
npm run db:up
cp apps/api/.env.example apps/api/.env
npm run db:migrate -w apps/api
npm run db:seed -w apps/api
npm run dev:api
NEXT_PUBLIC_DATA_SOURCE=api npm run dev
```

- Web: http://localhost:3000 · API: http://localhost:4000 (`/healthz`, `/api/docs` com a spec OpenAPI)
- MinIO console: http://localhost:9001 (credenciais em `compose.yaml`, só para dev)

## Scripts (raiz)

| Script                                      | O que faz                                                         |
| ------------------------------------------- | ----------------------------------------------------------------- |
| `npm run dev` / `dev:legacy`                | Next em dev (Turbopack / webpack)                                 |
| `npm run dev:api`                           | API em dev com reload (`tsx watch`)                               |
| `npm run build` / `build:web` / `build:api` | Build de produção                                                 |
| `npm run check`                             | lint + format:check + typecheck de todos os workspaces            |
| `npm run test`                              | Vitest do `domain` e da `api` (a `api` precisa de `DATABASE_URL`) |
| `npm run test:e2e`                          | Suíte Playwright do web (Chromium)                                |
| `npm run db:up` / `db:down`                 | Sobe/derruba Postgres + MinIO                                     |
| `npm run db:generate -w apps/api`           | Gera migration SQL a partir do schema Drizzle                     |
| `npm run db:migrate -w apps/api`            | Aplica migrations                                                 |
| `npm run db:seed -w apps/api`               | Seeds de catálogos e dados de desenvolvimento                     |
| `npm run share`                             | Expõe o web publicamente via Cloudflare tunnel (use com cuidado)  |

## Origem de dados no web

`NEXT_PUBLIC_DATA_SOURCE=mock|api` (default `mock`). Os módulos migram um a um do mock para a API; a ordem está em `docs/adr/README.md`. Em modo `api`, `NEXT_PUBLIC_API_URL` aponta para a API (default `http://localhost:4000`).

## Contribuindo

1. Commits semânticos em português (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `ci:`).
2. Branches descritivas; PRs contra `development`, nunca direto na `main`.
3. `npm run check` e `npm run test` verdes antes de abrir PR; `npm run test:e2e` antes de publicar o PR.
4. Convenções completas e proibições em `AGENTS.md`.
