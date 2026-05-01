// Edge middleware — gates the entire app behind a session cookie.
// Public routes (login, forgot/reset password, the auth API itself,
// static assets) are allowed through.
//
// Note: middleware deliberately does NOT call any Node APIs (no
// `node:crypto`, no Supabase) — only Web Crypto, so it runs in the Edge
// runtime where it's much cheaper.

import { NextRequest, NextResponse } from "next/server";
import { verifySessionEdge, SESSION_COOKIE } from "@/lib/auth-edge";

// Anything starting with these prefixes is allowed without a session.
// Everything else (pages AND API) requires a valid session cookie.
const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/api/auth/", // login / forgot / reset / logout / me
  // Cron endpoint — middleware lets it through, but the handler itself
  // requires a CRON_SECRET bearer token OR a valid admin session.
  "/api/run-scheduled-emails",
];

// File extensions that should never be gated (lets browsers fetch the
// favicon, logo etc. from the login page itself).
const PUBLIC_FILE_RE =
  /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|otf|txt|xml|json)$/i;

function isPublic(pathname: string): boolean {
  if (pathname === "/" + (pathname.startsWith("/") ? pathname.slice(1) : pathname)) {
    /* fallthrough */
  }
  if (PUBLIC_FILE_RE.test(pathname)) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/favicon")) return true;
  for (const p of PUBLIC_PATHS) {
    if (pathname === p || pathname.startsWith(p)) return true;
  }
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;
  const payload = await verifySessionEdge(token, secret);

  if (payload) {
    return NextResponse.next();
  }

  // For API routes, return JSON 401 instead of redirecting (avoids a redirect
  // chain that would confuse fetch callers).
  if (pathname.startsWith("/api/")) {
    return new NextResponse(
      JSON.stringify({ error: "Not authenticated" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  // Round-trip the original path so we can return there after login.
  loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Run on everything except static assets the matcher itself can drop
    // cheaply. We still re-check inside `isPublic` for belt-and-suspenders.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
