import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { auth } from "@/lib/auth";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin login",
  description: "Sign in to the admin area.",
};

export default async function AdminLoginPage() {
  // Already signed in — skip the form.
  const session = await auth();
  if (session?.user) {
    redirect(ROUTES.ADMIN);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-24">
      <header className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Admin login</h1>
        <p className="text-sm text-foreground/60">
          Sign in to access the admin area.
        </p>
      </header>

      <Suspense fallback={<div className="h-64" />}>
        <LoginForm />
      </Suspense>

      <p className="text-center text-xs text-foreground/50">
        Demo credentials are provided in the project&apos;s environment file.
      </p>
    </main>
  );
}
