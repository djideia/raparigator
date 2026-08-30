# ADR-004 — ORM e migrations: Drizzle (SQL-first)

- Status: aceito (2026-08-15)

## Contexto

O schema Postgres da API .NET existe, é bom (19 índices, seeds de catálogo, FKs corretas) e migra melhor por um caminho que fale SQL. Precisamos de `tsvector`/`pg_trgm` para busca, `LISTEN/NOTIFY` para o chat, uma tabela de eventos de billing com índice único de idempotência, e um fluxo de migration que rode em CI e no boot do container sem passo manual. Runtime é Node (ADR-002).

## Opções consideradas

- **Prisma** — DSL própria, migrations boas, DX excelente para CRUD. Contra: `pg_trgm`, `tsvector`, índices GIN, `LISTEN/NOTIFY` e triggers só entram por SQL "escapado" no migration; o client tem custo de geração e um modelo mental extra (o schema não é TS). A partir da v6/v7 sem engine Rust, o peso caiu, mas o desenho continua schema-DSL-first.
- **Drizzle** — schema em TS, queries próximas do SQL, migrations geradas como **arquivos SQL** que aceitam SQL manual (extensões, índices GIN, funções, triggers) no mesmo fluxo. Sem geração de client. Adapter oficial do better-auth. `drizzle-kit` gera; `migrate()` aplica idempotentemente lendo a tabela `__drizzle_migrations`.

## Decisão

**Drizzle ORM** com driver `pg` (node-postgres).

Fluxo de migrations:

1. Alterar `apps/api/src/db/schema/*.ts`.
2. `npm run db:generate -w apps/api` → cria `apps/api/drizzle/NNNN_*.sql` (revisado e commitado; SQL manual — extensões, tsvector, triggers — vai no mesmo arquivo).
3. **CI**: job com Postgres como service container roda `npm run db:migrate -w apps/api` antes dos testes de integração; migration que não aplica derruba o PR.
4. **Boot do container**: `apps/api/src/db/migrate.ts` roda no `entrypoint` antes de subir o servidor (`MIGRATE_ON_BOOT=true`, default), idempotente. Em ambiente com múltiplas réplicas, `pg_advisory_lock` do próprio migrator do Drizzle evita corrida.
5. Seeds de catálogo (serviços, fetiches, etnia, cabelo, cidades) ficam em `apps/api/src/db/seed/` e rodam com `npm run db:seed`, idempotentes (`ON CONFLICT DO NOTHING`).

## Consequências

- O SQL gerado é o artefato de review; nada acontece "por baixo".
- Sem client gerado, o `tsc` da API é a única fonte de tipos de linha.
- Trocar de driver (`pg` → `postgres.js`) é uma linha, se um dia fizer sentido.
