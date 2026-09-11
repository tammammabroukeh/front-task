import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { loadProduct } from "@/app/apis/services/products";
import { ROUTES } from "@/constants/routes";
import { formatPrice, titleCase } from "@/utils/format";

/**
 * Product detail is rendered dynamically on every request (true SSR).
 * `force-dynamic` documents this intent explicitly; the repository also uses
 * `cache: "no-store"` for the underlying fetch.
 */
export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;

  // Metadata generation must never throw — an error here breaks SSR before the
  // page's error boundary can render. Fall back to a safe title on failure.
  let product: Awaited<ReturnType<typeof loadProduct>> = null;
  try {
    product = await loadProduct(id); // memoized — no double fetch
  } catch {
    return { title: "Product" };
  }

  if (!product) {
    return {
      title: "Product not found",
      description: "The requested product does not exist.",
    };
  }

  return {
    title: product.title,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160),
      images: [{ url: product.image }],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await loadProduct(id);

  // Real server-side redirect for a missing product. FakeStoreAPI returns
  // 200 + empty body for unknown ids, so the repository resolves to null and
  // we redirect here (issues a 307 before any UI is sent).
  if (!product) {
    redirect(ROUTES.PRODUCT_NOT_FOUND);
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <nav className="mb-8 text-sm text-foreground/60">
        <Link href={ROUTES.PRODUCTS} className="hover:text-foreground">
          ← Back to products
        </Link>
      </nav>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="relative aspect-square w-full rounded-xl border border-foreground/10 bg-white p-8">
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain"
            priority
          />
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            {titleCase(product.category)}
          </span>
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
            {product.title}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">
              {formatPrice(product.price)}
            </span>
            <span
              className="flex items-center gap-1 text-sm text-foreground/60"
              aria-label={`Rating ${product.rating.rate} out of 5, ${product.rating.count} reviews`}
            >
              <span aria-hidden>★</span>
              {product.rating.rate.toFixed(1)}
              <span className="text-foreground/40">
                ({product.rating.count} reviews)
              </span>
            </span>
          </div>
          <p className="text-sm leading-7 text-foreground/70">
            {product.description}
          </p>
        </div>
      </div>
    </main>
  );
}
