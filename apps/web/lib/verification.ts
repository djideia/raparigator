import type {
  VerificationChannel,
  VerificationChannelState,
  VerificationState,
  VerificationTargets,
} from "@sigillus/contracts";

export type {
  VerificationChannel,
  VerificationChannelState,
  VerificationState,
  VerificationTargets,
};

const STORAGE_KEY_PREFIX = "sigillus-verification-state";
const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;

function createChannelState(target: string): VerificationChannelState {
  return {
    target,
    verified: false,
    verifiedAt: null,
    pendingCode: null,
    codeSentAt: null,
    attempts: 0,
  };
}

function storageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}-${userId}`;
}

function normalizeTarget(value: string) {
  return value.trim().toLowerCase();
}

function normalizeCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

function readStoredState(userId: string): Partial<VerificationState> | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as Partial<VerificationState>) : null;
  } catch {
    return null;
  }
}

function writeStoredState(userId: string, state: VerificationState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey(userId), JSON.stringify(state));
}

function hydrateChannelState(
  storedState: VerificationChannelState | undefined,
  target: string,
): VerificationChannelState {
  if (!storedState) {
    return createChannelState(target);
  }

  if (normalizeTarget(storedState.target) !== normalizeTarget(target)) {
    return createChannelState(target);
  }

  const now = Date.now();
  const codeExpired = Boolean(
    storedState.codeSentAt && now - storedState.codeSentAt > VERIFICATION_CODE_TTL_MS,
  );

  return {
    target,
    verified: storedState.verified,
    verifiedAt: storedState.verifiedAt ?? null,
    pendingCode: codeExpired ? null : (storedState.pendingCode ?? null),
    codeSentAt: codeExpired ? null : (storedState.codeSentAt ?? null),
    attempts: storedState.attempts ?? 0,
  };
}

export function getVerificationState(
  userId: string,
  targets: VerificationTargets,
): VerificationState {
  const storedState = readStoredState(userId) ?? {};

  return {
    email: hydrateChannelState(storedState.email, targets.email),
    phone: hydrateChannelState(storedState.phone, targets.phone),
  };
}

function persistVerificationState(userId: string, state: VerificationState) {
  writeStoredState(userId, state);
}

export function sendVerificationCode(
  userId: string,
  targets: VerificationTargets,
  channel: VerificationChannel,
  state: VerificationState,
) {
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const now = Date.now();
  const nextState: VerificationState = {
    ...state,
    [channel]: {
      ...state[channel],
      target: targets[channel],
      verified: false,
      verifiedAt: null,
      pendingCode: code,
      codeSentAt: now,
      attempts: 0,
    },
  };

  persistVerificationState(userId, nextState);

  return {
    state: nextState,
    code,
    expiresAt: now + VERIFICATION_CODE_TTL_MS,
  };
}

export function confirmVerificationCode(
  userId: string,
  targets: VerificationTargets,
  channel: VerificationChannel,
  codeInput: string,
  state: VerificationState,
) {
  const currentChannel = hydrateChannelState(state[channel], targets[channel]);
  const enteredCode = normalizeCode(codeInput);
  const now = Date.now();
  const isExpired = Boolean(
    currentChannel.codeSentAt && now - currentChannel.codeSentAt > VERIFICATION_CODE_TTL_MS,
  );

  if (!currentChannel.pendingCode || !currentChannel.codeSentAt || isExpired) {
    const nextState: VerificationState = {
      ...state,
      [channel]: {
        ...currentChannel,
        verified: false,
        verifiedAt: null,
        pendingCode: null,
        codeSentAt: null,
        attempts: currentChannel.attempts,
      },
    };

    persistVerificationState(userId, nextState);

    return {
      state: nextState,
      success: false,
      message: "O código expirou. Envie outro para continuar.",
    };
  }

  if (enteredCode !== currentChannel.pendingCode) {
    const nextState: VerificationState = {
      ...state,
      [channel]: {
        ...currentChannel,
        attempts: currentChannel.attempts + 1,
      },
    };

    persistVerificationState(userId, nextState);

    return {
      state: nextState,
      success: false,
      message: "Código inválido. Verifique e tente novamente.",
    };
  }

  const nextState: VerificationState = {
    ...state,
    [channel]: {
      ...currentChannel,
      verified: true,
      verifiedAt: now,
      pendingCode: null,
      codeSentAt: null,
      attempts: currentChannel.attempts + 1,
    },
  };

  persistVerificationState(userId, nextState);

  return {
    state: nextState,
    success: true,
    message:
      channel === "email" ? "E-mail validado com sucesso." : "Telefone validado com sucesso.",
  };
}
