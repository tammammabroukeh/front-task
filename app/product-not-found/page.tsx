import type { Metadata } from "next";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Product not found",
  description: "The product you are looking for does not exist.",
};

export default function ProductNotFoundPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="text-5xl" aria-hidden>
          🔍
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">
          Product not found
        </h1>
        <p className="max-w-md text-sm text-foreground/60">
          The product you are looking for doesn&apos;t exist or is no longer
          available.
        </p>
      </div>
      <Link
        href={ROUTES.PRODUCTS}
        className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Back to products
      </Link>
    </main>
  );
}
