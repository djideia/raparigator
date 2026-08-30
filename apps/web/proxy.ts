import { NextResponse, type NextRequest } from "next/server";
import { getApiUrl, getDataSource } from "@/lib/data-source";
import { ADMIN_SESSION_COOKIE, USER_ROLE_COOKIE } from "@/lib/session-cookies";

const ADMIN_LOGIN_PATH = "/admin/login";
const USER_LOGIN_PATH = "/auth/login";
const MOCK_ROLES = new Set(["cliente", "profissional"]);

async function hasApiSession(request: NextRequest, path: string): Promise<boolean> {
  const cookie = request.headers.get("cookie");
  if (!cookie) {
    return false;
  }
  try {
    const response = await fetch(`${getApiUrl()}${path}`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (!response.ok) {
      return false;
    }
    const body = (await response.json()) as unknown;
    return body !== null && typeof body === "object";
  } catch {
    return false;
  }
}

function hasMockUserSession(request: NextRequest): boolean {
  const role = request.cookies.get(USER_ROLE_COOKIE)?.value;
  return Boolean(role && MOCK_ROLES.has(role));
}

function hasMockAdminSession(request: NextRequest): boolean {
  return Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

function redirectToLogin(request: NextRequest, loginPath: string) {
  const url = request.nextUrl.clone();
  url.pathname = loginPath;
  url.search = "";
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const dataSource = getDataSource();

  if (pathname.startsWith("/admin")) {
    if (pathname === ADMIN_LOGIN_PATH) {
      return NextResponse.next();
    }
    const authorized =
      dataSource === "api"
        ? await hasApiSession(request, "/api/admin-auth/get-session")
        : hasMockAdminSession(request);
    return authorized ? NextResponse.next() : redirectToLogin(request, ADMIN_LOGIN_PATH);
  }

  const authorized =
    dataSource === "api"
      ? await hasApiSession(request, "/api/auth/get-session")
      : hasMockUserSession(request);
  return authorized ? NextResponse.next() : redirectToLogin(request, USER_LOGIN_PATH);
}

export const config = {
  matcher: [
    "/conta/:path*",
    "/profissional/anuncios/:path*",
    "/profissional/assinatura-premium/:path*",
    "/admin/:path*",
  ],
};
