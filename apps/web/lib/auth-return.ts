const RETURN_SCROLL_KEY = "sigillus-return-scroll";
const RETURN_TARGET_KEY = "sigillus-return-target";
const REDIRECT_PARAM = "redirect";
const DEFAULT_REDIRECT = "/feed";

export function sanitizeRedirect(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  return value;
}

export function getCurrentReturnTo(): string {
  if (typeof window === "undefined") {
    return DEFAULT_REDIRECT;
  }
  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
}

/**
 * Guarda o destino de retorno fora da URL. O cadastro passa por mais de uma tela
 * (`/auth/cadastro` → `/auth/cadastro/cliente`) e o parâmetro se perderia no caminho.
 */
export function saveReturnTarget(returnTo: string) {
  if (typeof window === "undefined") {
    return;
  }

  const safe = sanitizeRedirect(returnTo);
  if (!safe) {
    return;
  }

  try {
    window.sessionStorage.setItem(RETURN_TARGET_KEY, safe);
  } catch {
    return;
  }
}

/**
 * Lê o destino de retorno — parâmetro da URL primeiro, sessão como reserva. Deve ser
 * chamado dentro de handlers, não durante o render: evita divergência de hidratação
 * e dispensa boundary de Suspense.
 */
export function readRedirectTarget(fallback: string = DEFAULT_REDIRECT): string {
  if (typeof window === "undefined") {
    return fallback;
  }

  const fromUrl = sanitizeRedirect(new URLSearchParams(window.location.search).get(REDIRECT_PARAM));

  let fromSession: string | null;
  try {
    fromSession = sanitizeRedirect(window.sessionStorage.getItem(RETURN_TARGET_KEY));
    window.sessionStorage.removeItem(RETURN_TARGET_KEY);
  } catch {
    fromSession = null;
  }

  return fromUrl ?? fromSession ?? fallback;
}

function readScrollMap(): Record<string, number> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.sessionStorage.getItem(RETURN_SCROLL_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function saveReturnScroll(path: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const next = { ...readScrollMap(), [path]: window.scrollY };
    window.sessionStorage.setItem(RETURN_SCROLL_KEY, JSON.stringify(next));
  } catch {
    return;
  }
}

export function consumeReturnScroll(path: string): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  const map = readScrollMap();
  const stored = map[path];
  if (typeof stored !== "number") {
    return null;
  }

  try {
    delete map[path];
    window.sessionStorage.setItem(RETURN_SCROLL_KEY, JSON.stringify(map));
  } catch {
    return stored;
  }

  return stored;
}
