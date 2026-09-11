"use client";

import { useEffect } from "react";
import Link from "next/link";

import { ErrorMessages } from "@/constants/errors";

/** Error boundary for the product detail route (Next 16 `retry` prop). */
export default function ProductDetailError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Product detail route error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="text-4xl" aria-hidden>
          ⚠️
        </span>
        <h1 className="text-2xl font-semibold">Couldn&apos;t load this product</h1>
        <p className="max-w-md text-sm text-foreground/60">
          {error.message || ErrorMessages.Default}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/products"
          className="inline-flex h-11 items-center justify-center rounded-full border border-foreground/20 px-6 text-sm font-medium transition-colors hover:bg-foreground/5"
        >
          Back to products
        </Link>
      </div>
    </main>
  );
}
