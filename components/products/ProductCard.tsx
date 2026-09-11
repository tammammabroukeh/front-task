import Image from "next/image";
import Link from "next/link";

import type { IProduct } from "@/app/apis/services/products/interface";
import { ROUTES } from "@/constants/routes";
import { formatPrice, titleCase } from "@/utils/format";

export function ProductCard({ product }: { product: IProduct }) {
  return (
    <Link
      href={ROUTES.PRODUCT_DETAIL(product.id)}
      className="group flex flex-col overflow-hidden rounded-xl border border-foreground/10 bg-background transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <div className="relative aspect-square w-full bg-white p-6">
        <Image
          src={product.image}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-contain transition-transform duration-200 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-foreground/50">
          {titleCase(product.category)}
        </span>
        <h2 className="line-clamp-2 text-sm font-medium leading-snug">
          {product.title}
        </h2>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-base font-semibold">
            {formatPrice(product.price)}
          </span>
          <span
            className="flex items-center gap-1 text-xs text-foreground/60"
            aria-label={`Rating ${product.rating.rate} out of 5`}
          >
            <span aria-hidden>★</span>
            {product.rating.rate.toFixed(1)}
            <span className="text-foreground/40">({product.rating.count})</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
