# Architecture Decision Records

Formato curto: Contexto / Opções consideradas / Decisão / Consequências. Um arquivo por decisão, numerado, imutável depois de aceito (mudou de ideia? novo ADR que substitui o antigo).

| ADR                                            | Decisão                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| [001](001-linguagem-do-backend.md)             | Backend em TypeScript, no monorepo, com contrato e domínio compartilhados |
| [002](002-runtime-e-gerenciador-de-pacotes.md) | Node LTS + npm workspaces                                                 |
| [003](003-framework-http.md)                   | Hono + oRPC contract-first + Zod 4                                        |
| [004](004-orm-e-migrations.md)                 | Drizzle SQL-first; migrations em CI e no boot                             |
| [005](005-filas-e-tempo-real.md)               | pg-boss no Postgres; chat por LISTEN/NOTIFY + SSE                         |
| [006](006-deploy.md)                           | Deploy agnóstico: Dockerfile, env, healthz, migrations idempotentes       |

## Restrição de produto que atravessa todos os ADRs

Desde 14/08/2026 a plataforma é **vitrine de anúncios**. Nenhum dinheiro de cliente transita pela plataforma; o único fluxo monetário é profissional → plataforma (assinatura premium). A plataforma não organiza, intermedeia nem acompanha encontro. É proibido reintroduzir em schema, endpoint, tipo, tabela ou copy: escrow, custódia, split, taxa sobre serviço, booking, agendamento, valor de atendimento, check-in/out de encontro. O `EncounterBrief` é estimativa de preço a partir do anúncio, viaja como payload de mensagem e não gera registro de serviço.

## Ordem sugerida de desligamento dos mocks no `apps/web`

Cada passo é um PR pequeno; a suíte E2E precisa continuar verde ao fim de cada um. A flag `NEXT_PUBLIC_DATA_SOURCE=mock|api` seleciona a origem por módulo, então a migração é serviço a serviço, não big-bang.

1. **Feed** (feito neste PR como prova de conceito): `feed.list` com filtros no servidor.
2. **Catálogos e anúncio público** (`anuncio/[slug]`, `popular`, `mediaHighlights`): leitura pura, sem sessão.
3. **Auth e sessão**: trocar `auth-session.ts`/`admin-session.ts` pelo client do better-auth; o `middleware.ts` já lê a sessão real no modo `api`. Atualizar os helpers de E2E para logar via API em vez de semear `localStorage`.
4. **Rascunho de anúncio**: `announcements.getDraft/saveSection/publish`; `useAnnouncementDraft` vira adaptador fino sobre o client.
5. **Mídia**: `media.createUpload` (URL pré-assinada) + polling de `media.get` até `ready`.
6. **Chat**: `chat.*` + `chat.subscribe` (SSE); o `chat-store.ts` mantém a camada otimista e troca `chat-service.ts` pelo client.
7. **Avaliações e convites**: `reviews.*`; remover `review-invites.ts` do `localStorage`.
8. **Notificações**: `notifications.*`.
9. **Premium**: `billing.*`; a fonte de verdade do plano passa a ser o servidor (o `premium-plan.ts` local some).
10. **Backoffice**: `admin.*` — último porque o painel admin é o menos coberto por E2E e o mais tolerante a latência.

Quando o último módulo virar, `NEXT_PUBLIC_DATA_SOURCE` e `lib/mock-data.ts` são removidos.
