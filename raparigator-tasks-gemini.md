# Raparigator (Sigillus): tasks de integração web → API

Contexto (gerado a 12/09/2026 a partir da `main`, commit `a4a6841`).

O PR #38 do Marco (`feat/monorepo-backend`) criou `apps/api`, `packages/contracts` e `packages/domain`. A API implementa todos os módulos do contrato. No `apps/web` só o feed (`lib/feed-data.ts`) fala com a API; todo o resto ainda lê `lib/mock-data.ts` e `localStorage`. A ordem de migração está em `docs/adr/README.md` e é a ordem das tasks abaixo.

Como usar: copie **um bloco de task por vez** (do `Work on task` até o fim do bloco) e cole no Gemini. Espere terminar, revise o diff, abra o PR contra `development`, depois mande a próxima. Não mande duas ao mesmo tempo, elas mexem nos mesmos arquivos.

---

## Preâmbulo (cole SEMPRE antes de cada task, é o que evita o Gemini inventar coisa)

```
Você vai trabalhar no monorepo djlabz/raparigator. Antes de qualquer alteração, leia AGENTS.md e docs/adr/README.md e siga-os à letra.

Regras fixas:
- Nunca commite na main. Crie a branch indicada e abra PR contra development.
- Commits em português no formato conventional (feat:, fix:, refactor:, test:, docs:).
- Não escreva comentários no código. Textos de UI em PT-BR. Imports com alias @/ dentro de apps/web; entre pacotes use @sigillus/contracts e @sigillus/domain.
- Não altere packages/contracts nem apps/api a menos que a task diga explicitamente. Se o contrato não tiver o que você precisa, PARE e me diga o que falta em vez de inventar.
- Nunca reintroduza escrow, custódia, split, booking, agendamento, valor de atendimento ou check-in/out. Se aparecer no mock, não migre para a API.
- Padrão de referência para "mock OU api" é apps/web/lib/feed-data.ts: lê isApiDataSource() de @/lib/data-source, usa getApiClient() de @/lib/api/client no modo api, e mantém o mock intacto no modo mock. Reproduza esse padrão; não delete o mock nesta fase.
- Antes de me devolver: npm run check (lint + format:check + typecheck) verde e npm run test verde. Rode npm run test:e2e (Playwright, apps/web) só no fim, antes de abrir o PR, e ele precisa passar nos dois modos: NEXT_PUBLIC_DATA_SOURCE=mock e NEXT_PUBLIC_DATA_SOURCE=api (API rodando com npm run db:up + npm run dev:api).
- Ao terminar, me devolva: (1) lista de arquivos alterados, (2) o que ficou fora e por quê, (3) a saída resumida de check, test e test:e2e.
```

---

## Task 1 — Catálogos e anúncio público pela API

```
Work on task RAP-01:

Suggested branch name: feature/rap-01-catalogos-anuncio-publico

<issue identifier="RAP-01">
<title>Ligar catálogos, anúncio público, "populares" e destaques de mídia à API (passo 2 da ADR)</title>
<description>
Leitura pura, sem sessão. Procedures do contrato (packages/contracts/src/router.ts): catalogs.get, ads.getBySlug, ads.listPopular ({kind: "most_viewed" | "top_rated", limit}), ads.mediaHighlights, ads.registerView.

Arquivos do web que hoje leem mock e passam a ter caminho api:
- app/(public)/anuncio/[slug]/page.tsx e components/screens/ad-details/use-ad-details.ts → ads.getBySlug; chamar ads.registerView uma vez por visita no modo api.
- components/screens/most-viewed-screen.tsx → ads.listPopular kind most_viewed
- components/screens/top-rated-screen.tsx → ads.listPopular kind top_rated
- components/screens/trending-media-screen.tsx → ads.mediaHighlights
- components/screens/popular-links-section.tsx → ads.listPopular
- Onde houver leitura de catálogos (cidades, categorias, filtros) a partir de mock-data, trocar por catalogs.get no modo api.

Crie um hook por recurso em apps/web/lib/ (ex.: lib/ad-public-data.ts, lib/popular-data.ts, lib/catalogs-data.ts) seguindo o padrão de lib/feed-data.ts (estado de loading/erro, chave de fingerprint para evitar refetch duplicado). As telas consomem o hook e não decidem mock/api sozinhas.
</description>
<aceite>
- [ ] Em NEXT_PUBLIC_DATA_SOURCE=api, /anuncio/[slug], /popular (mais vistos e mais avaliados) e destaques de mídia renderizam com dados vindos da API (verificar no Network do navegador chamadas a /rpc).
- [ ] Em modo mock nada mudou de comportamento.
- [ ] Nenhuma tela dessa task importa mock-data diretamente; só os hooks em lib/ importam.
- [ ] Estados de loading e erro tratados (skeleton ou mensagem, sem tela branca).
- [ ] npm run check, npm run test e npm run test:e2e verdes nos dois modos (tests/ad-details.spec.ts e tests/home.spec.ts em especial).
</aceite>
</issue>
```

---

## Task 2 — Auth e sessão pelo better-auth

```
Work on task RAP-02:

Suggested branch name: feature/rap-02-auth-sessao

<issue identifier="RAP-02">
<title>Trocar auth-session.ts e admin-session.ts pelo client do better-auth; helpers de E2E logam pela API (passo 3 da ADR)</title>
<description>
Hoje a sessão do web é semeada em localStorage (apps/web/lib/auth-session.ts, lib/admin-session.ts, lib/session-cookies.ts, lib/mock-users.ts) e as telas components/screens/login-screen.tsx, admin-login-screen.tsx e onboarding-screen/onboarding-screen.tsx leem mock. A API expõe better-auth em /api/auth/* (usuários) e /api/admin-auth/* (admin, instância separada) e o contrato tem auth.me e admin.me. apps/web/proxy.ts já lê a sessão real no modo api; leia-o antes de mexer para não duplicar.

O que fazer:
1. Instalar/usar o client do better-auth no web (verificar a versão pinada que apps/api usa e pinar a mesma; sem ^ ou ~). Criar apps/web/lib/api/auth-client.ts (usuários) e lib/api/admin-auth-client.ts (admin), ambos apontando para getApiUrl().
2. Fazer auth-session.ts e admin-session.ts virarem adaptadores: no modo mock mantêm o comportamento atual; no modo api usam o client (signIn, signUp, signOut, getSession). Manter a mesma interface pública para as telas não mudarem de contrato.
3. login-screen, admin-login-screen e onboarding (cadastro) passam a chamar o adaptador; tratar erros de credencial inválida com mensagem em PT-BR.
4. Cookies: a API usa credentials: "include" (já está em lib/api/client.ts). Confirmar CORS/origem na API para localhost:3000; se precisar de mudança em apps/api/src/lib de config de CORS, faça a menor possível e explique.
5. E2E: apps/web/tests/helpers/auth.ts e credentials.ts semeiam localStorage. Adicionar caminho que, quando NEXT_PUBLIC_DATA_SOURCE=api, loga via requisição HTTP ao better-auth e guarda o cookie no contexto do Playwright (storageState). Os usuários de teste precisam existir no seed da API (apps/api/src/db/seed); confira se há equivalentes ao admin@sigillus.dev / Admin@123 e demais credenciais; se não houver, adicione ao seed de desenvolvimento.
</description>
<aceite>
- [ ] Login, cadastro, logout e login de admin funcionam contra a API real; proxy.ts bloqueia (private) e (admin) sem sessão.
- [ ] Em modo mock tudo continua igual.
- [ ] tests/auth.spec.ts, tests/identity-signup.spec.ts e tests/admin.spec.ts passam nos dois modos usando o novo helper.
- [ ] Nenhuma senha ou credencial nova fora de tests/helpers/credentials.ts e do seed.
- [ ] npm run check e npm run test verdes.
</aceite>
</issue>
```

---

## Task 3 — Rascunho de anúncio

```
Work on task RAP-03:

Suggested branch name: feature/rap-03-rascunho-anuncio

<issue identifier="RAP-03">
<title>useAnnouncementDraft vira adaptador sobre announcements.* (passo 4 da ADR)</title>
<description>
Depende de RAP-02 (precisa de sessão). Procedures: announcements.getMine, saveDraft, saveSection, publish, setListingStatus, setAvailability, setContact. Tipos já vêm de @sigillus/contracts (AnnouncementDraftStateSchema etc.); regras puras (limites por plano, gate de publicação, score) já estão em @sigillus/domain.

Arquivos: apps/web/lib/announcement-draft.ts (hoje localStorage + mock), lib/announcement-draft-types.ts (re-export fino, não mexer), components/screens/professional-ads-screen.tsx, components/screens/professional-dashboard/*.tsx (summary-tab, traffic-discovery-card leem mock).

Fazer:
1. announcement-draft.ts: no modo api, carregar via getMine na montagem e persistir cada seção com saveSection (debounce de ~500 ms para não spammar); publish chama announcements.publish; disponibilidade e contato chamam setAvailability/setContact. Otimista no estado local, com rollback e toast em erro.
2. Não reimplementar regra de negócio no web; se uma validação existe em @sigillus/domain, usar de lá.
3. Manter o modo mock funcionando.
</description>
<aceite>
- [ ] Profissional logada edita seções, salva, publica e altera disponibilidade/contato; recarregar a página mantém o estado (veio do servidor).
- [ ] Erro de rede não perde o que foi digitado (estado local preservado + mensagem).
- [ ] Nenhum campo/copy de agendamento, valor de atendimento ou similar foi migrado.
- [ ] check, test e E2E verdes nos dois modos.
</aceite>
</issue>
```

---

## Task 4 — Mídia (upload por URL pré-assinada)

```
Work on task RAP-04:

Suggested branch name: feature/rap-04-midia-upload

<issue identifier="RAP-04">
<title>Upload de mídia via media.createUpload + PUT no MinIO + completeUpload + polling até ready (passo 5 da ADR)</title>
<description>
Depende de RAP-02. Procedures: media.createUpload, completeUpload, get, listMine, remove, reorder, setProfileImage. Fluxo: createUpload devolve URL pré-assinada → o browser faz PUT direto no MinIO/S3 → completeUpload → um worker (pg-boss) processa → media.get retorna status ready. Limites por plano vêm de @sigillus/domain.

Arquivos: apps/web/lib/announcement-media.ts, lib/ad-profile-image.ts, lib/cropImage.ts (mantém), telas de galeria/foto de perfil (procurar por announcement-media e gallery em components/).

Fazer:
1. Adaptador em announcement-media.ts: upload com barra de progresso (XMLHttpRequest ou fetch com stream), depois polling de media.get a cada ~1,5 s até ready ou failed, com timeout de 60 s e mensagem.
2. listMine na montagem, remove, reorder (drag já existe no mock? manter a UX), setProfileImage.
3. Verificar CORS do MinIO em compose.yaml para PUT a partir de localhost:3000; se precisar ajustar compose.yaml ou a config do bucket na API, mudança mínima e documentada no PR.
</description>
<aceite>
- [ ] Subir, reordenar, remover fotos e definir foto de perfil funcionam contra API + MinIO locais.
- [ ] Limite do plano é respeitado com a mesma mensagem do mock.
- [ ] Arquivo inválido ou upload falho mostra erro, sem travar a tela.
- [ ] tests/gallery-profile-photo.spec.ts verde nos dois modos; check e test verdes.
</aceite>
</issue>
```

---

## Task 5 — Chat (oRPC + SSE)

```
Work on task RAP-05:

Suggested branch name: feature/rap-05-chat-sse

<issue identifier="RAP-05">
<title>chat-store.ts mantém a camada otimista e troca chat-service.ts pelo client; tempo real via chat.subscribe (SSE) (passo 6 da ADR)</title>
<description>
Depende de RAP-02. Procedures: chat.listConversations, listMessages ({conversationId, before}), ensureConversationForAd, sendText, sendBrief, sendMedia, openViewOnce, markRead, setBlocked, deleteFromInbox, report, updateAlias, subscribe (SSE).

Arquivos: apps/web/lib/chat-store.ts (useSyncExternalStore, otimista), lib/chat-service.ts (fonte de dados), lib/chat-store-types.ts (re-export), lib/conversation-ad.ts, lib/encounter-brief.ts, telas em components/screens relacionadas a chat.

Fazer:
1. Só chat-service.ts muda de implementação: no modo api cada método chama a procedure correspondente. chat-store.ts continua dono do estado otimista e da reconciliação.
2. Assinar chat.subscribe (SSE) ao entrar na aba de chat; aplicar eventos no store (nova mensagem, lida, bloqueio); reconectar com backoff em queda.
3. Paginação de mensagens com "before" ao rolar para cima.
4. EncounterBrief: continua sendo payload de mensagem (sendBrief). Não criar nenhum registro de "serviço", "agendamento" ou valor fechado; se o mock tiver algo assim, não migrar e me avisar.
5. View-once: openViewOnce marca no servidor; a UI só revela depois da resposta.
</description>
<aceite>
- [ ] Dois usuários (dois contextos do navegador) trocam mensagens e a outra ponta recebe sem recarregar (SSE).
- [ ] Mensagem enviada aparece imediatamente (otimista) e reconcilia com o id do servidor; em falha volta com indicação de erro.
- [ ] Bloquear, denunciar, apagar da caixa e alias funcionam.
- [ ] tests/chat.spec.ts e tests/encounter-brief.spec.ts verdes nos dois modos; check e test verdes.
</aceite>
</issue>
```

---

## Task 6 — Avaliações e convites

```
Work on task RAP-06:

Suggested branch name: feature/rap-06-avaliacoes-convites

<issue identifier="RAP-06">
<title>reviews.* pela API; remover review-invites.ts do localStorage (passo 7 da ADR)</title>
<description>
Depende de RAP-02. Procedures: reviews.listForAd, getInvite, listMyInvites, invite, withdrawInvite, submit. O gate de avaliação (três camadas) é regra da API + @sigillus/domain; o web não decide sozinho.

Arquivos: apps/web/lib/ad-reviews.ts, lib/review-invites.ts (some no modo api), components/screens/professional-dashboard/reviews-tab.tsx, tela pública de avaliações no anúncio.

Fazer: adaptador em ad-reviews.ts com os dois modos; a página de convite lê getInvite pelo token da URL e envia submit; painel da profissional usa listMyInvites/invite/withdrawInvite. Mensagens de recusa do gate vêm do erro do contrato (FORBIDDEN/CONFLICT), traduzidas em PT-BR.
</description>
<aceite>
- [ ] Profissional convida, retira convite; convidado abre link, avalia; avaliação aparece no anúncio.
- [ ] Tentativa fora do gate mostra a mensagem certa e não grava.
- [ ] tests/review-invite.spec.ts verde nos dois modos; check e test verdes.
</aceite>
</issue>
```

---

## Task 7 — Notificações

```
Work on task RAP-07:

Suggested branch name: feature/rap-07-notificacoes

<issue identifier="RAP-07">
<title>notifications.* pela API (passo 8 da ADR)</title>
<description>
Depende de RAP-02. Procedures: notifications.list, markRead, markAllRead, remove. Arquivo: apps/web/lib/account-notifications.ts e a tela/badge que o consome.

Fazer: adaptador com os dois modos; polling leve (30 s) ou reaproveitar o canal SSE do chat se a API emitir notificações por ele (verificar em apps/api/src/modules/notifications antes de decidir e me dizer qual foi a escolha). Badge de não lidas vem de list.
</description>
<aceite>
- [ ] Lista, marcar uma/todas como lidas e remover funcionam; badge atualiza.
- [ ] check, test e E2E verdes nos dois modos.
</aceite>
</issue>
```

---

## Task 8 — Premium / billing

```
Work on task RAP-08:

Suggested branch name: feature/rap-08-premium-billing

<issue identifier="RAP-08">
<title>Plano vem do servidor via premium.*; premium-plan.ts local deixa de ser fonte de verdade (passo 9 da ADR)</title>
<description>
Depende de RAP-02. Procedures: premium.getState, plans, startSubscription, cancelSubscription. A API tem BillingProvider com implementação fake (apps/api/src/lib/billing/fake-provider.ts, BILLING_PROVIDER=fake em .env.example) e webhook em /api/billing/webhook. Não integrar gateway real nesta task.

Arquivos: apps/web/lib/premium-plan.ts, lib/premium-catalog.ts, telas de assinatura em app/(private) e o modal de conversão (tests/premium-conversion-modal-scroll-gate.spec.ts cobre).

Fazer: no modo api, getState na montagem e após startSubscription/cancelSubscription; plans substitui premium-catalog no modo api; onde @sigillus/domain calcula limites por plano, alimentar com o plano do servidor. Único fluxo monetário permitido: profissional → plataforma. Nada de valor por atendimento.
</description>
<aceite>
- [ ] Assinar e cancelar (provider fake) refletem em getState e nos limites do painel.
- [ ] Recarregar mantém o plano (veio do servidor, não do localStorage).
- [ ] tests/premium-conversion-modal-scroll-gate.spec.ts e tests/financial-independence.spec.ts verdes nos dois modos; check e test verdes.
</aceite>
</issue>
```

---

## Task 9 — Backoffice admin

```
Work on task RAP-09:

Suggested branch name: feature/rap-09-backoffice-admin

<issue identifier="RAP-09">
<title>admin.* pela API (passo 10 da ADR)</title>
<description>
Depende de RAP-02 (sessão admin). Procedures: admin.me, dashboard, activity, clients, suspendClient, reinstateClient, professionals, profile, approveProfile, rejectProfile, suspendProfessional, reinstateProfessional, reports, startReportReview, resolveReport, search.

Arquivos: apps/web/lib/admin-service.ts e as telas em app/(admin). Adaptador com os dois modos; ações destrutivas (suspender, rejeitar) com confirmação e refetch depois. Paginação onde o contrato tiver.
</description>
<aceite>
- [ ] Dashboard, listas, busca e todas as ações funcionam contra a API.
- [ ] tests/admin.spec.ts verde nos dois modos; check e test verdes.
</aceite>
</issue>
```

---

## Task 10 — Limpeza final

```
Work on task RAP-10:

Suggested branch name: chore/rap-10-remove-mocks

<issue identifier="RAP-10">
<title>Remover NEXT_PUBLIC_DATA_SOURCE, lib/mock-data.ts, lib/mock-users.ts e os ramos mock (fim da ADR)</title>
<description>
Só depois de RAP-01 a RAP-09 mergeadas e rodando com api. Remover a flag de data-source.ts, proxy.ts, README e AGENTS.md; apagar mock-data.ts, mock-users.ts e o ramo mock de cada adaptador; E2E passa a rodar sempre contra a API (ajustar playwright.config para subir/esperar a API ou documentar o pré-requisito). Atualizar docs/adr/README.md marcando a migração como concluída.
</description>
<aceite>
- [ ] grep por mock-data, mock-users e DATA_SOURCE em apps/web não devolve nada.
- [ ] check, test e test:e2e verdes.
</aceite>
</issue>
```
