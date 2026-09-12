# Regras temporárias para o Antigravity (fase: integração web → API)

Este arquivo é TEMPORÁRIO. Ele existe só enquanto durar a migração dos módulos do `apps/web` de mock para a API (tasks RAP-01 a RAP-10). Quando a RAP-10 fechar, este arquivo é apagado. Nada aqui altera o `AGENTS.md`, que continua sendo a fonte das convenções do projeto; este arquivo só adiciona restrições e uma exceção de fluxo para esta fase.

## Leitura obrigatória antes de qualquer alteração

1. `AGENTS.md` (convenções, stack, scripts, o que nunca fazer)
2. `docs/adr/README.md` (restrição de produto e ordem de migração dos mocks)

## Exceção de fluxo, só nesta fase

- A branch de trabalho é `gemini`. Commite nela.
- PRs são abertos de `gemini` para `main`, um PR por task. A branch `development` citada no `AGENTS.md` e no `README.md` não existe no momento; não a crie e não tente fazer PR contra ela.

## Restrições desta fase

- Não altere `packages/contracts` nem `apps/api` a menos que a task diga explicitamente. Se o contrato não tiver a procedure de que você precisa, PARE e descreva o que falta em vez de inventar ou contornar.
- Não apague `apps/web/lib/mock-data.ts`, `mock-users.ts` nem o ramo `mock` de nenhum adaptador. O modo `NEXT_PUBLIC_DATA_SOURCE=mock` precisa continuar funcionando até a RAP-10.
- Padrão de referência para "mock ou api" é `apps/web/lib/feed-data.ts`: lê `isApiDataSource()` de `@/lib/data-source`, usa `getApiClient()` de `@/lib/api/client` no modo api e mantém o mock intacto no modo mock. Reproduza esse padrão em cada módulo.
- Telas (`components/screens`, `app/`) não decidem mock/api sozinhas nem importam `mock-data` diretamente; só os adaptadores em `apps/web/lib/` fazem isso.
- Regra de negócio não se reimplementa no web. Se existe em `@sigillus/domain`, use de lá. Se a API já valida, trate o erro do contrato (UNAUTHORIZED, FORBIDDEN, CONFLICT, NOT_FOUND) com mensagem em PT-BR.
- Nunca reintroduza escrow, custódia, split, taxa sobre serviço, booking, agendamento, valor de atendimento ou check-in/out. Se algo assim aparecer no mock, não migre para a API e avise.
- Versões de dependência sempre pinadas. Se precisar de uma lib nova no web que a API já usa (ex.: client do better-auth), pine a mesma versão.

## Ambiente local

- Banco e storage: `npm run db:up` (Postgres em 5432, MinIO em 9000/9001). A API sobe em 4000 com `npm run dev:api`.
- `apps/api/.env` já existe na máquina; não sobrescreva. `SENTRY_DSN` vazio quebra a validação de config; deixe a linha comentada.
- Testes de integração da API: `npm run test` (cria e migra `sigillus_test` sozinho).

## Antes de devolver uma task

1. `npm run check` verde (lint + format:check + typecheck).
2. `npm run test` verde.
3. `npm run test:e2e` verde nos dois modos: `NEXT_PUBLIC_DATA_SOURCE=mock` e `NEXT_PUBLIC_DATA_SOURCE=api` (com a API rodando). Só no fim da task, não a cada ajuste.
4. Devolva: lista de arquivos alterados; o que ficou fora e por quê; saída resumida de check, test e test:e2e.
