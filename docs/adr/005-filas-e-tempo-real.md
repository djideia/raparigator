# ADR-005 — Filas e tempo real: pg-boss + LISTEN/NOTIFY + SSE

- Status: aceito (2026-08-15)

## Contexto

Jobs que existem de fato hoje: processamento de mídia (thumbnails/variantes com `sharp`, moderação), expiração de convite de avaliação (14 dias) e reprocessamento de webhooks de billing. Tempo real: chat 1-a-1 com status de entrega, unread e mídia view-once. Time de 2–3 pessoas; cada peça de infra a mais é operação a mais.

## Opções consideradas

**Filas**

- BullMQ + Redis/Valkey — padrão do ecossistema, mais throughput, mas exige Redis operado, monitorado, com backup, para volume que hoje é de dezenas de jobs por hora.
- **pg-boss** — filas sobre o próprio Postgres (`SKIP LOCKED`), retries, agendamento, cron, expiração, dead letter. Zero infra nova. Escala a centenas de jobs/s antes de doer.

**Tempo real do chat**

- WebSocket desde já — exige sticky session ou backplane, atravessa proxy com mais fricção, e o produto hoje não tem typing indicator fino nem presença robusta.
- **`LISTEN/NOTIFY` + SSE** — o Postgres é o barramento (`NOTIFY chat_events`), a API abre um listener por instância e reencaminha ao cliente por SSE (event iterator do oRPC). Envio continua por POST. Atravessa qualquer proxy, sem sticky session, sem infra nova.

## Decisão

- **pg-boss** no mesmo Postgres, schema `pgboss`. Filas iniciais: `media.process`, `media.moderate`, `review-invite.expire`, `billing.webhook`.
- **Chat: `LISTEN/NOTIFY` + SSE.** Um `ChatEventBus` com interface `publish(event)` / `subscribe(conversationId)`; implementação `PgNotifyChatEventBus`. Payload do NOTIFY carrega só ids (limite de 8 KB); o cliente busca a mensagem via procedimento normal.
- Presença = "online" derivado do último `seenAt` (heartbeat do SSE), sem estado em memória compartilhado.

## Fronteira desenhada para a troca futura

- `ChatEventBus` é a única coisa a trocar por Redis pub/sub se houver escala horizontal com muitas instâncias.
- O transporte SSE está isolado no router `chat.subscribe`; WebSocket entra como transporte alternativo quando o produto pedir typing/presença fina, sem tocar em service ou repositório.
- pg-boss → BullMQ só se o volume passar de dezenas de jobs/s sustentados; a fronteira é a interface `JobQueue` (`enqueue`, `work`).

## Consequências

- Uma única dependência de infra em produção: Postgres (+ storage S3-compatible para mídia).
- Latência do NOTIFY é de milissegundos; suficiente para chat 1-a-1.
- Sem Redis, não há rate limit distribuído; o rate limit é por instância (aceitável para 1–2 réplicas; registrado como limite conhecido).
