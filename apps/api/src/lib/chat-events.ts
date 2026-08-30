import { Client } from "pg";
import type { ChatEvent } from "@sigillus/contracts";
import type { Logger } from "./logger";

export type ChatEventListener = (event: ChatEvent) => void;

export interface ChatEventBus {
  publish(userIds: string[], event: ChatEvent): Promise<void>;
  subscribe(userId: string, listener: ChatEventListener): () => void;
  start(): Promise<void>;
  stop(): Promise<void>;
}

const CHANNEL = "sigillus_chat_events";

type Envelope = { userIds: string[]; event: ChatEvent };

class LocalFanout {
  private readonly listeners = new Map<string, Set<ChatEventListener>>();

  subscribe(userId: string, listener: ChatEventListener) {
    const set = this.listeners.get(userId) ?? new Set<ChatEventListener>();
    set.add(listener);
    this.listeners.set(userId, set);
    return () => {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(userId);
      }
    };
  }

  dispatch(envelope: Envelope) {
    for (const userId of envelope.userIds) {
      for (const listener of this.listeners.get(userId) ?? []) {
        listener(envelope.event);
      }
    }
  }
}

export function createMemoryChatEventBus(): ChatEventBus {
  const fanout = new LocalFanout();
  return {
    async publish(userIds, event) {
      fanout.dispatch({ userIds, event });
    },
    subscribe: (userId, listener) => fanout.subscribe(userId, listener),
    async start() {},
    async stop() {},
  };
}

export function createPgNotifyChatEventBus(databaseUrl: string, logger: Logger): ChatEventBus {
  const fanout = new LocalFanout();
  let listenerClient: Client | null = null;
  let publisherClient: Client | null = null;

  return {
    async start() {
      listenerClient = new Client({ connectionString: databaseUrl });
      publisherClient = new Client({ connectionString: databaseUrl });
      await listenerClient.connect();
      await publisherClient.connect();
      listenerClient.on("notification", (message) => {
        if (message.channel !== CHANNEL || !message.payload) {
          return;
        }
        try {
          fanout.dispatch(JSON.parse(message.payload) as Envelope);
        } catch (error) {
          logger.warn({ err: error }, "payload de NOTIFY inválido");
        }
      });
      listenerClient.on("error", (error) => logger.error({ err: error }, "listener LISTEN/NOTIFY"));
      await listenerClient.query(`LISTEN ${CHANNEL}`);
    },
    async stop() {
      await listenerClient?.end().catch(() => undefined);
      await publisherClient?.end().catch(() => undefined);
      listenerClient = null;
      publisherClient = null;
    },
    async publish(userIds, event) {
      const envelope: Envelope = { userIds, event };
      if (!publisherClient) {
        fanout.dispatch(envelope);
        return;
      }
      await publisherClient.query("select pg_notify($1, $2)", [CHANNEL, JSON.stringify(envelope)]);
    },
    subscribe: (userId, listener) => fanout.subscribe(userId, listener),
  };
}
