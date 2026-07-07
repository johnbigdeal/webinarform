import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge-compatible middleware: check for the Auth.js session cookie
// without importing the Prisma-backed auth config (which needs Node runtime).

const PUBLIC_PATHS = ["/", "/login", "/signup", "/api/health", "/api/signup"];
const PUBLIC_PREFIXES = ["/f/", "/api/auth/", "/api/submit/"]; // public form + submit + auth endpoints

// The public submission endpoint /api/submit/<slug> is open (handled above by prefix).
// The dashboard endpoint /api/forms/<formId>/submissions stays protected.

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (pathname.startsWith("/_next") || pathname.includes(".")) return true;
  return false;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  // Protected routes need a session cookie.
  // Auth.js v5 JWT cookie names: authjs.session-token (http) / __Secure-authjs.session-token (https)
  const token =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes: we can't decode the JWT here without the secret + jose,
  // so we let the route guard (layout/page server-side auth()) enforce the role.
  // If a non-admin hits /admin, the page will redirect them.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
