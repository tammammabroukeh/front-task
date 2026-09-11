import type { Metadata } from "next";

import { productsRepository } from "@/app/apis/services/products";
import { Pagination } from "@/app/components/products/Pagination";
import { ProductCard } from "@/app/components/products/ProductCard";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse the full FakeStore catalog.",
};

/**
 * Caching decision (documented in README):
 * The product catalog changes infrequently, so the list is rendered with
 * Incremental Static Regeneration. The page is prerendered and revalidated
 * at most once every 5 minutes, giving fast, CDN-served responses while
 * staying reasonably fresh. Per-request freshness is reserved for the product
 * detail page, which uses `no-store`.
 */
export const revalidate = 300; // seconds (5 minutes)

interface ProductsPageProps {
  searchParams: Promise<{ page?: string | string[] }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const { page } = await searchParams;
  const requestedPage = Number(Array.isArray(page) ? page[0] : page) || 1;

  const { items, page: currentPage, totalPages, totalItems } =
    await productsRepository.getPaginatedProducts(requestedPage);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <header className="mb-8 flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
        <p className="text-sm text-foreground/60">
          {totalItems} items · page {currentPage} of {totalPages}
        </p>
      </header>

      <section
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Product list"
      >
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        basePath="/products"
      />
    </main>
  );
}
