"use client";

import { signOut } from "next-auth/react";

import { ROUTES } from "@/constants/routes";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: ROUTES.ADMIN_LOGIN })}
      className="inline-flex h-10 items-center justify-center rounded-full border border-foreground/20 px-5 text-sm font-medium transition-colors hover:bg-foreground/5"
    >
      Sign out
    </button>
  );
}
