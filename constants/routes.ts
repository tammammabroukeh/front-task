/**
 * Central registry of application (page) routes.
 *
 * Keep every user-facing path here so links, redirects, and the proxy guard all
 * reference a single source of truth. Note: these are *app* routes, not the
 * FakeStoreAPI endpoints used inside the products repository.
 */
export const ROUTES = {
  HOME: "/",
  PRODUCTS: "/products",
  /** Product detail page for a given id. */
  PRODUCT_DETAIL: (id: number | string) => `/products/${id}`,
  PRODUCT_NOT_FOUND: "/product-not-found",
  ADMIN: "/admin",
  ADMIN_LOGIN: "/admin/login",
  /** Login page carrying a post-login redirect target. */
  ADMIN_LOGIN_WITH_CALLBACK: (callbackUrl: string) =>
    `/admin/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
} as const;
