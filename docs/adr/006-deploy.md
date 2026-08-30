# ADR-006 — Deploy: agnóstico de provedor

- Status: aceito (2026-08-15)

## Contexto

A infraestrutura de destino não está definida. O provedor de pagamentos (PSP) tampouco — e neste vertical a aceitação do PSP é bloqueante e sensível: PSPs recusam ou encerram contas sem aviso, e a escolha restringe o que dá para fazer (Pix, cartão, recorrência nativa vs. cobrança avulsa por ciclo, webhooks e seus formatos de assinatura).

## Opções consideradas

- Amarrar a um provedor agora (Vercel + Neon, Fly, Railway, Kubernetes com Helm) — antecipa uma decisão que ninguém tomou e cria arquivo morto (`vercel.json`, charts) que precisará ser removido.
- **Entregar agnóstico**: tudo que qualquer orquestrador de container precisa e nada além.

## Decisão

- `apps/api/Dockerfile` multi-stage (`deps` → `build` → `runner` em `node:22-alpine`, usuário não-root, `HEALTHCHECK` no `/healthz`).
- Configuração **100% por variável de ambiente**, validada por Zod no boot (`apps/api/src/config.ts`); a API recusa subir com config incompleta em vez de cair em default silencioso (lição da audience divergente do JWT na API .NET). `.env.example` documenta cada chave.
- `/healthz` faz `SELECT 1` no Postgres e responde `503` se falhar; `/readyz` distingue "subiu" de "pronto" (migrations aplicadas).
- Migrations idempotentes no boot (ADR-004), desligáveis por `MIGRATE_ON_BOOT=false` para quem preferir job separado.
- `compose.yaml` na raiz sobe Postgres 17 e MinIO para desenvolvimento e CI local. Não é artefato de produção.
- Sentry nos dois apps por `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`; sem DSN, o SDK fica inerte.
- Sem Helm, sem manifests Kubernetes, sem `vercel.json`, sem `fly.toml`.

## O que o time precisa decidir depois

1. **Onde roda o container da API** (qualquer PaaS de container ou VM com Docker serve). Requisitos: 1 réplica basta no início; se >1, ver limite de rate limit por instância no ADR-005.
2. **Postgres gerenciado** (Neon, Supabase, RDS, Crunchy…) com `pg_trgm` habilitável (`CREATE EXTENSION` precisa de permissão — a migration 0000 tenta e falha claro se não puder).
3. **Storage S3-compatible**: Cloudflare R2 (egress zero) ou MinIO self-hosted. Só muda `S3_*` no env.
4. **PSP** — bloqueante para o billing real. A fronteira já está desenhada (`BillingProvider` com `FakeBillingProvider`); a escolha define: formato de verificação de assinatura do webhook, se há recorrência nativa, e se Pix é suportado. Validar aceitação do vertical **antes** de integrar.
5. **Onde roda o Next**: Vercel ou container (`output: "standalone"` já preparado). Se for outro domínio da API, `API_ORIGIN` e CORS já são env.

## Consequências

- Nenhum arquivo do repo precisa mudar quando o provedor for escolhido — só env e pipeline de deploy.
- Enquanto o PSP não existe, o fluxo premium roda com o provider fake atrás de `BILLING_PROVIDER=fake`, o que **nunca** deve ser o valor em produção (a API recusa subir com `NODE_ENV=production` e `BILLING_PROVIDER=fake`).
