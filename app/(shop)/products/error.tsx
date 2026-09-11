"use client";

import { useEffect } from "react";

import { ErrorMessages } from "@/constants/errors";

/**
 * Route-level error boundary for the products list.
 * Must be a Client Component. In Next.js 16 the recovery callback is `retry`
 * (it re-renders the segment on the server).
 */
export default function ProductsError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // In a real app this would go to an error-reporting service.
    console.error("Products route error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="text-4xl" aria-hidden>
          ⚠️
        </span>
        <h1 className="text-2xl font-semibold">Couldn&apos;t load products</h1>
        <p className="max-w-md text-sm text-foreground/60">
          {error.message || ErrorMessages.Default}
        </p>
      </div>
      <button
        type="button"
        onClick={() => retry()}
        className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </main>
  );
}
