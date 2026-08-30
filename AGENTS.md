# Raparigator (monorepo)

Plataforma de anúncios de acompanhantes (marca **Sigillus**): feed, chat, painel da profissional, assinatura premium e backoffice admin. Desde 14/08/2026 a plataforma é **vitrine de anúncios**: nenhum dinheiro de cliente transita por ela, o único fluxo monetário é profissional → plataforma (assinatura premium) e ela não organiza, intermedeia nem acompanha encontro. Detalhes e decisões em `docs/adr/`.

## Layout

```
apps/web/            Next.js 16 (App Router + Turbopack), React 19, Tailwind 4
apps/api/            API TypeScript: Hono + oRPC + Drizzle (Postgres) + better-auth
packages/contracts/  Contrato oRPC + schemas Zod + tipos compartilhados (fonte de verdade do domínio)
packages/domain/     Regras de negócio puras (sem React/DOM), usadas pelo web e pela API
docs/adr/            Architecture Decision Records
compose.yaml         Postgres 17 + MinIO para desenvolvimento
```

## Stack

- TypeScript (strict) em tudo · Node LTS · **npm workspaces** (um `package-lock.json` na raiz)
- Web: Next.js 16 · React 19 · Tailwind CSS v4 · Motion (animações) · Lucide React (ícones)
- API: Hono · oRPC (contract-first) · Zod 4 · Drizzle ORM · better-auth · pg-boss · pino · Vitest
- Lint e formatação via oxc: `oxlint` (`.oxlintrc.json`) e `oxfmt` (`.oxfmtrc.json`) na raiz, cobrindo todos os workspaces — sem ESLint nem Prettier

## Como rodar

- Instalar: `npm install` (na raiz)
- Banco e storage locais: `npm run db:up` (Docker; sobe Postgres em `localhost:5432` e MinIO em `localhost:9000`)
- Web: `npm run dev` (porta 3000; `npm run dev:legacy` roda sem Turbopack)
- API: `npm run dev:api` (porta 4000; precisa de `apps/api/.env` — copie de `apps/api/.env.example`)
- Migrations: `npm run db:migrate -w apps/api` · gerar após mudar schema: `npm run db:generate -w apps/api` · seeds: `npm run db:seed -w apps/api`
- Lint: `npm run lint` (oxlint) — SEMPRE rode antes de finalizar tarefa
- Formatação: `npm run format` (oxfmt) · verificar sem escrever: `npm run format:check`
- Typecheck de todos os workspaces: `npm run typecheck`
- Testes unitários (domain + api): `npm run test` — os da API são de integração e precisam de `DATABASE_URL` (o `apps/api/.env` serve; eles criam e migram o banco `sigillus_test` sozinhos; `TEST_DB_NAME` muda o nome)
- Build: `npm run build` (todos) · `npm run build:web` · `npm run build:api`
- E2E: `npm run test:e2e` (Playwright em `apps/web/tests`, só Chromium; `PORT=3100 npm run test:e2e` se a 3000 estiver ocupada)
- Verificação local típica: `npm run check` (lint + format:check + typecheck) + `npm run test` + checagem visual quando mexer em motion/UI
- **E2E só na hora de abrir PR.** A suíte leva ~1 min e trava o fluxo se rodar a cada ajuste. Durante a implementação use `npm run check` + verificação visual. Rode `npm run test:e2e` quando o usuário pedir para commitar/abrir PR — e antes de abrir o PR. Exceção: pode rodar um arquivo específico (`npx playwright test tests/x.spec.ts` dentro de `apps/web`) quando estiver mexendo naquele fluxo.
- Logins de teste estão em `apps/web/tests/helpers/credentials.ts` (admin: `admin@sigillus.dev` / `Admin@123` em `apps/web/lib/mock-users.ts`)
- PWA / tela cheia: em aba normal a barra de endereço não some. Para experiência tipo app instale via "Adicionar à Tela de Início" (`display: standalone` em `apps/web/app/manifest.ts`) e valide nesse modo.

## Origem de dados no web

`apps/web` lê `NEXT_PUBLIC_DATA_SOURCE=mock|api` (default `mock`). Em `mock` tudo vem de `apps/web/lib/mock-data.ts` e `localStorage`, como sempre foi. Em `api` os módulos já migrados chamam a API pelo client oRPC tipado (`apps/web/lib/api/`); os demais continuam em mock. A ordem de migração está em `docs/adr/README.md`. `apps/web/proxy.ts` (convenção do Next 16 que substitui `middleware.ts`) protege `(private)` e `(admin)` nos dois modos.

## Estrutura do web

- `app/(tabs)` → abas principais com shell persistente (feed, chat, painel)
- `app/(public)` → rotas abertas (auth, anúncio, popular)
- `app/(private)` → rotas logadas fora das abas (conta, anúncios, assinatura premium)
- `app/(admin)` → backoffice de administradores
- `components/ui` → primitivos genéricos · `components/layout` → navbar/footer/sidebar · `components/screens` → blocos grandes de página
- `lib/` → adaptadores (stores em `useSyncExternalStore`, `localStorage`), mocks, client da API. Tipos vêm de `@sigillus/contracts` (`lib/types.ts` e `lib/*-types.ts` são re-exports finos); regras puras vêm de `@sigillus/domain`.

## Estrutura da API

- `src/modules/<área>/{router,service,repository}.ts` — router implementa o contrato de `@sigillus/contracts`; service tem a regra e o **ownership check**; repository fala com o Drizzle.
- `src/db/schema/` (tabelas), `drizzle/` (SQL gerado, commitado), `src/db/seed/` (catálogos)
- `src/lib/` — config (env validado por Zod), logger (pino com redaction de PII), auth (better-auth: instância de usuários e instância separada de admin), storage S3, filas (pg-boss), event bus do chat (LISTEN/NOTIFY), billing (`BillingProvider` + fake)
- Rotas fora do contrato ficam no Hono: `/healthz`, `/readyz`, `/api/auth/*`, `/api/admin-auth/*`, `/api/billing/webhook`, `/api/openapi.json`, `/api/docs`

## Convenções

- Importe sempre com o alias `@/` dentro de `apps/web` (aponta para `apps/web/`); entre pacotes use `@sigillus/contracts` e `@sigillus/domain`
- Componentes React em PascalCase; hooks começam com `use`
- Commits: conventional (`feat:`, `fix:`, `chore:`, `style:`, `docs:`, `refactor:`, `ci:`), mensagem em português
- Branches descritivas (`feature/...`, `fix/...`); PRs contra `development`; nunca commite direto na `main`
- Textos de UI em português (PT-BR)
- Não escreva comentários no código
- Versões de dependência sempre pinadas (sem `^`, `~`, `*` ou `latest`); Renovate cuida das atualizações

## Verificação de motion / browser ad hoc

- Para QA de animação e interação visual ad hoc, use a skill `refine-motion` (não há skill `webapp-testing` no catálogo).
- Preferir MCP Playwright quando conectado; senão o fallback Python em `.agents/skills/refine-motion/references/webapp-testing-fallback/`.
- Depois de escolher o produto, não misture MCP e fallback na mesma run.
- Suite E2E do repo (`npm run test:e2e` / `@playwright/test`) é independente desse fluxo.

## Nunca faça

- Nunca reintroduza intermediação de serviço: escrow, custódia, split, taxa sobre serviço, booking/agendamento, valor de atendimento, check-in/out de encontro — em schema, endpoint, tipo, tabela ou copy
- Nunca chame API externa nem crie `fetch` solto no web: consuma a API pelo client oRPC em `apps/web/lib/api/` (módulos migrados) ou os mocks de `lib/` (módulos ainda em mock)
- Nunca declare tipo compartilhado fora de `packages/contracts`; nunca declare tipo à mão em paralelo a um schema Zod
- Nunca coloque regra de negócio pura no web ou na API se ela couber em `packages/domain`
- Nunca edite `.next/`, `node_modules/`, `dist/` ou `*.tsbuildinfo`
- Nunca commite `.env*` nem segredo, nem como placeholder (use `.env.example`)
- Nunca instale outra lib de ícones ou animação — já usamos Lucide e Motion
- Nunca adicione ESLint/Prettier, nem search engine externo (busca é `tsvector`/`pg_trgm` no Postgres)
- Nunca logue corpo de mensagem de chat, CPF, e-mail, telefone ou handle de mensageiro
