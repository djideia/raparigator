# ADR-001 — Linguagem do backend: TypeScript

- Status: aceito (2026-08-15)
- Decisão autorizada pelos mantenedores, incluindo quem escreveu a API .NET. Custo de migração zerado; preferência pessoal não é critério.

## Contexto

O frontend (Next.js 16 / React 19) evoluiu ~172 commits em 4 meses e pivotou o produto duas vezes (premium por assinatura em julho; vitrine pura em 14/08/2026). A API em .NET 10 (`RaparigatorApi`, ~3,1k LOC, Clean Architecture, EF Core, JWT) andou 4 commits e parou em 04/04/2026, modelando um domínio que já não existe (`ListingPlan` como tier pago do anúncio). A falha número 1 documentada do projeto foi **drift de contrato** front↔back; a segunda foi **bus factor 1** no backend.

## Opções consideradas

1. Ressuscitar a API .NET e gerar client TS por OpenAPI.
2. Backend novo em TypeScript num monorepo com o front.

## Decisão

Backend em **TypeScript**, no mesmo repositório, com contrato tipado compartilhado (`packages/contracts`) e lógica de domínio compartilhada (`packages/domain`).

Critérios técnicos e medidos:

- **Contrato end-to-end em tempo de compilação.** Com oRPC o tipo do procedimento é o tipo consumido pelo Next: mudou o servidor, o `tsc` do front quebra. Com .NET o caminho é OpenAPI → codegen — funciona, mas depende de disciplina de processo, exatamente o que faltou.
- **Um runtime, um time.** As duas pessoas que mantêm o projeto escrevem TS todos os dias; só uma escrevia C#. Os dados de 4 meses mostram o que acontece nesse cenário.
- **Reaproveitamento literal.** `lib/` já tem 25+ módulos de regra de negócio (gate de avaliação, limites por plano, filtros do feed, rascunho de anúncio, simulador de encontro). Em TS eles viram o pacote `domain` executado pelos dois lados; em C# viram especificação para retraduzir à mão.
- **Ferramental agêntico já calibrado para TS** (skills, AGENTS.md, Playwright, oxc).

## Consequências

- A API .NET vira **inspiração de modelagem relacional** (o schema Postgres dela era bom): ownership check no service, validação completa de token, paginação com teto, índices explícitos, seeds versionadas. Não portamos a estrutura de 4 projetos.
- Precisamos compensar em processo o que o .NET dava de graça: pinagem de versões, lockfile, Renovate, supply chain observada.
- Realtime e filas se resolvem com Postgres (ADR-005) em vez de SignalR/Hangfire.
