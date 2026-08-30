export const USER_ROLE_COOKIE = "sigillus-user-role";
export const ADMIN_SESSION_COOKIE = "sigillus-admin-session";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function writeSessionCookie(name: string, value: string | null) {
  if (typeof document === "undefined") {
    return;
  }
  if (value === null) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    return;
  }
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax`;
}
