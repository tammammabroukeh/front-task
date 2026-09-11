import { z } from "zod";

/**
 * Runtime shape of a FakeStoreAPI product.
 * Validating at the boundary means the rest of the app can trust the type.
 */
export const ProductRatingSchema = z.object({
  rate: z.number(),
  count: z.number(),
});

export const ProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
  description: z.string(),
  category: z.string(),
  image: z.url(),
  rating: ProductRatingSchema,
});

export const ProductListSchema = z.array(ProductSchema);

// Inferred types — the schema is the single source of truth.
export type IProductRating = z.infer<typeof ProductRatingSchema>;
export type IProduct = z.infer<typeof ProductSchema>;
export type IProductList = z.infer<typeof ProductListSchema>;

/** Parameters accepted by the products list query. */
export interface IGetProductsParams {
  /** 1-based page number. */
  page?: number;
  /** Items per page. */
  limit?: number;
}
