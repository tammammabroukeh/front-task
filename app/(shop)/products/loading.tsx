/**
 * Instant loading UI for the products route.
 * Next.js wraps the page in a Suspense boundary and shows this skeleton grid
 * while the server renders the list (e.g. while the catalog is being fetched).
 */
export default function ProductsLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <header className="mb-8 flex flex-col gap-2">
        <div className="h-9 w-40 animate-pulse rounded bg-foreground/10" />
        <div className="h-4 w-56 animate-pulse rounded bg-foreground/10" />
      </header>

      <section
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        aria-hidden="true"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-xl border border-foreground/10"
          >
            <div className="aspect-square w-full animate-pulse bg-foreground/10" />
            <div className="flex flex-col gap-3 p-4">
              <div className="h-3 w-16 animate-pulse rounded bg-foreground/10" />
              <div className="h-4 w-full animate-pulse rounded bg-foreground/10" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-foreground/10" />
              <div className="mt-2 h-5 w-20 animate-pulse rounded bg-foreground/10" />
            </div>
          </div>
        ))}
      </section>

      <span className="sr-only">Loading products…</span>
    </main>
  );
}
