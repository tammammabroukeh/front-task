/** Loading skeleton for a single product detail page. */
export default function ProductDetailLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <div className="mb-8 h-4 w-32 animate-pulse rounded bg-foreground/10" />
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="aspect-square w-full animate-pulse rounded-xl bg-foreground/10" />
        <div className="flex flex-col gap-4">
          <div className="h-3 w-24 animate-pulse rounded bg-foreground/10" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-foreground/10" />
          <div className="h-9 w-32 animate-pulse rounded bg-foreground/10" />
          <div className="mt-2 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-foreground/10" />
            <div className="h-4 w-full animate-pulse rounded bg-foreground/10" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-foreground/10" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading product…</span>
    </main>
  );
}
