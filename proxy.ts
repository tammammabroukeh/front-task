import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ROUTES } from "@/constants/routes";

/**
 * Request-level (edge) guard for the admin area.
 *
 * This is an *optimistic* check per Next.js guidance: Proxy should not do full
 * session management. It only verifies the presence of a NextAuth session
 * cookie and redirects to the login page early when it is missing. The
 * authoritative verification still happens server-side in `app/admin/page.tsx`
 * via `auth()`.
 *
 * The login route itself is excluded so users can reach the form.
 */

// NextAuth v5 cookie names (secure variant is used over HTTPS in production).
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSession = SESSION_COOKIES.some((name) =>
    request.cookies.has(name),
  );

  if (!hasSession) {
    const loginUrl = new URL(ROUTES.ADMIN_LOGIN, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Guard everything under /admin except the login page and NextAuth routes.
  matcher: ["/admin", "/admin/((?!login).*)"],
};
