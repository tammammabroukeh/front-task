import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { auth } from "@/lib/auth";

import { SignOutButton } from "./SignOutButton";

export const metadata: Metadata = {
  title: "Admin",
  description: "Protected admin area.",
};

/**
 * Protected admin area.
 *
 * The session is read on the server via `auth()` (which reads the session
 * cookie). If there is no valid session, we redirect to the login page before
 * any protected content is rendered — the check never happens only in the
 * browser. `proxy.ts` enforces the same rule at the edge as a first line of
 * defense.
 */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(ROUTES.ADMIN_LOGIN_WITH_CALLBACK(ROUTES.ADMIN));
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Admin dashboard
          </h1>
          <p className="text-sm text-foreground/60">
            Signed in as {session.user.email}
          </p>
        </div>
        <SignOutButton />
      </header>

      <section className="rounded-xl border border-foreground/10 p-6">
        <h2 className="text-lg font-medium">Protected content</h2>
        <p className="mt-2 text-sm text-foreground/70">
          This area is only visible to authenticated administrators. The session
          is verified server-side on every request.
        </p>
      </section>
    </main>
  );
}
