export type FlagsStore<T> = {
  flags: T;
  listeners: Set<() => void>;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  setFlags: (flags: T) => void;
};

export function createFlagsStore<T>(
  defaultFlags: T,
  equals: (prev: T, next: T) => boolean,
): FlagsStore<T> {
  const listeners = new Set<() => void>();
  const store: FlagsStore<T> = {
    flags: defaultFlags,
    listeners,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => store.flags,
    setFlags: (next) => {
      if (equals(store.flags, next)) {
        return;
      }
      store.flags = next;
      listeners.forEach((listener) => listener());
    },
  };
  return store;
}

export function getOrCreateGlobal<T>(key: string, create: () => T): T {
  const scope = globalThis as typeof globalThis & Record<string, T | undefined>;
  if (!scope[key]) {
    scope[key] = create();
  }
  return scope[key]!;
}
