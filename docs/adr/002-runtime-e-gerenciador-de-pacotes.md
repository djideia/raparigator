# ADR-002 — Runtime e gerenciador de pacotes: Node LTS + npm workspaces

- Status: aceito (2026-08-15)

## Contexto

O repo é `npm` com `engines: node ^20.19 || ^22.13 || >=24`, `package-lock.json` commitado e `npm ci` no CI. Vira monorepo com `apps/web`, `apps/api`, `packages/contracts` e `packages/domain`. O time tem 2–3 pessoas e o fluxo local (`npm install`, `npm run dev`, `npm run check`) está internalizado.

## Opções consideradas

|                                 | Bun                                                                                                                                      | Node + pnpm                                                 | Node + npm workspaces                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------- |
| Next.js 16 + Turbopack          | Bun como _package manager_ funciona; como _runtime_ do Next não é suportado oficialmente — o time teria Node instalado de qualquer forma | Suportado                                                   | Suportado, sem mudança                 |
| Workspaces                      | Maduro                                                                                                                                   | O mais maduro (hoisting estrito, rápido)                    | Funcional; hoisting frouxo, mais lento |
| `playwright.yml`                | Troca `setup-node`+`npm ci` por `setup-bun`; Playwright precisa de Node para os browsers                                                 | Troca `npm ci` por `pnpm install --frozen-lockfile` + cache | **Nada muda**                          |
| Módulos nativos (`sharp`, `pg`) | Funcionam, com histórico de surpresas em atualizações                                                                                    | Funcionam                                                   | Funcionam                              |
| Custo de reaprendizado          | Alto: dois runtimes (Bun na API, Node no Next), `bun.lock` novo, `bunfig`                                                                | Médio: instalar pnpm, novo lockfile, `pnpm -F`              | **Zero**                               |
| Ganho                           | Install/test rápidos, TS nativo                                                                                                          | Install rápido, disco menor, isolamento de deps             | —                                      |

O que Bun paga: velocidade de install e de teste, e rodar TS sem build. Para 4 pacotes e um time pequeno o install já é rápido com cache do npm; TS sem build se resolve com `tsx` em dev e um bundle de 1 s com `tsup` em prod. Não paga um segundo runtime em produção.

O que pnpm paga: hoisting estrito (pega import fantasma) e velocidade. Ambos são bons, mas o oxlint com plugin `import` já pega o import fantasma no lint, e o ganho de velocidade em 4 pacotes é de segundos.

## Decisão

**Node LTS (22.x recomendado; `engines` mantido) + npm workspaces.**

- Raiz orquestra: `npm run check` roda lint + format + typecheck dos workspaces; `npm run dev -w apps/web`, `npm run dev -w apps/api`.
- Pacotes internos exportam **fonte TS** (`exports: ./src/index.ts`); o Next transpila via `transpilePackages`, a API roda com `tsx` em dev e bundla com `tsup` (workspace inlinado, `node_modules` externos) em prod.
- Um único `package-lock.json` na raiz.

## Consequências

- CI continua `setup-node` + `npm ci`. Zero mudança de fluxo para quem já tem o repo.
- Se o monorepo crescer (>10 pacotes) ou o hoisting frouxo do npm começar a esconder deps não declaradas, migrar para pnpm é mecânico (mesmo `package.json`, novo lockfile) e fica registrado aqui como caminho.
- Nada no código da API depende de API exclusiva de runtime; rodar sob Bun no futuro é possível sem reescrita.
