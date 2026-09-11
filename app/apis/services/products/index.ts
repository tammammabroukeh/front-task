import apiFetcher, { type ApiRequestOptions } from "@/app/apis/api.instance";

import {
  ProductListSchema,
  ProductSchema,
  type IProduct,
  type IProductList,
} from "./interface";

/** Default page size for the products list. */
export const PRODUCTS_PER_PAGE = 8;

/** Result of a paginated products query. */
export interface PaginatedProducts {
  items: IProductList;
  page: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
}

/**
 * Products repository — the only place that knows the FakeStoreAPI HTTP shape.
 *
 * Note on pagination: FakeStoreAPI has no offset/page parameter (only `limit`),
 * so we fetch the full, validated catalog and paginate on the server. The
 * dataset is tiny (20 items), so this is cheap and keeps pagination logic in
 * one place.
 */
export const productsRepository = {
  /** Fetch the full catalog (validated). */
  getAllProducts: (options?: ApiRequestOptions): Promise<IProductList> =>
    apiFetcher<IProductList>("/products", {
      ...options,
      schema: ProductListSchema,
    }),

  /**
   * Fetch a single product by id.
   * Returns `null` when the product does not exist — FakeStoreAPI answers a
   * missing id with `200` + an empty body, which the fetcher parses to `null`
   * (and which then fails schema validation, so we guard explicitly below).
   */
  getProduct: async (
    id: number | string,
    options?: ApiRequestOptions,
  ): Promise<IProduct | null> => {
    const raw = await apiFetcher<unknown>(`/products/${id}`, {
      // Product detail is rendered fresh per request (true SSR).
      cache: "no-store",
      ...options,
    });

    if (raw === null || raw === undefined) {
      return null;
    }

    const result = ProductSchema.safeParse(raw);
    return result.success ? result.data : null;
  },

  /**
   * Server-side pagination over the full catalog.
   * `page` is 1-based and clamped into range.
   */
  getPaginatedProducts: async (
    page = 1,
    perPage = PRODUCTS_PER_PAGE,
    options?: ApiRequestOptions,
  ): Promise<PaginatedProducts> => {
    const all = await productsRepository.getAllProducts(options);

    const totalItems = all.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
    const safePage = clamp(page, 1, totalPages);
    const start = (safePage - 1) * perPage;
    const items = all.slice(start, start + perPage);

    return { items, page: safePage, totalPages, totalItems, perPage };
  },
};

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}
