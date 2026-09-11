import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Store Product Showcase
        </h1>
        <p className="max-w-xl text-base leading-7 text-foreground/70">
          A focused, server-rendered storefront demonstrating true SSR,
          deliberate caching, dynamic metadata, and a protected admin area.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/products"
          className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Browse products
        </Link>
        <Link
          href="/admin"
          className="inline-flex h-11 items-center justify-center rounded-full border border-foreground/20 px-6 text-sm font-medium transition-colors hover:bg-foreground/5"
        >
          Admin area
        </Link>
      </div>
    </main>
  );
}
