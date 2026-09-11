# Store — SSR Product Showcase

A focused product-showcase application built with the **Next.js 16 App Router**,
**TypeScript**, and **Tailwind CSS**, powered by the free
[FakeStoreAPI](https://fakestoreapi.com). It demonstrates real server-side
rendering, a deliberate caching decision, dynamic metadata, a real server-side
not-found redirect, and a cookie/session-protected admin area (NextAuth).

> Package manager: **bun**. All commands below use `bun`.

---

## Tech Stack

| Concern         | Choice                                        |
| --------------- | --------------------------------------------- |
| Framework       | Next.js 16 (App Router, React Server Comp.)   |
| Language        | TypeScript 5 (strict), path alias `@/*` → root |
| Styling         | Tailwind CSS 4 (no UI kit)                     |
| Auth            | NextAuth v5 (Auth.js) — Credentials + JWT      |
| Validation      | Zod (API response validation)                  |
| Data source     | FakeStoreAPI (`https://fakestoreapi.com`)      |
| Package manager | bun                                            |

## Getting Started

```bash
bun install
bun run dev
```

Open http://localhost:3000.

### Environment variables

See `.env.example`. Required:

- `BASE_URL` — FakeStoreAPI base URL (`https://fakestoreapi.com`)
- `NEXTAUTH_SECRET` — session encryption secret
- `NEXTAUTH_URL` — deployment URL (e.g. `http://localhost:3000`)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — demo admin credentials

---

## Pages

| Route             | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `/products`       | Product list with server-side `?page=` pagination      |
| `/products/[id]`  | Product detail, dynamic metadata, not-found redirect   |
| `/admin`          | Session-protected admin area (server-side guard)       |

---

## Architectural Decisions

**Layered API access.** HTTP concerns live in one place and business/UI code
never touches `fetch` directly:

- `app/apis/api.instance.ts` — the base `apiFetcher<T>()`: URL resolution,
  `AbortController` timeout, retry-with-backoff for transient failures, optional
  Zod response validation, and normalization of every failure into a typed
  `FetchError`.
- `app/apis/services/products/` — a **repository** (`index.ts`) exposing typed
  methods, and `interface.ts` holding Zod schemas that are the single source of
  truth for the product types (`z.infer`).
- `constants/errors.ts` / `app/apis/types/fetch-error.ts` — shared, user-facing
  error messages and the `FetchError` class (`message`, `info`, `status`,
  `type`).

**Validation at the boundary.** Every response is parsed with Zod, so the rest
of the app can trust its types. A parse failure surfaces as a
`FetchError` of type `"validation"` rather than leaking malformed data.

**Error handling strategy.** Repositories throw typed `FetchError`s; route-level
`error.tsx` boundaries (Client Components using the Next 16 `retry` prop)
present a friendly message and a retry action. Missing resources are modeled
explicitly (see the FakeStore not-found note below) rather than as thrown
errors.

**Server-first.** Pages are Server Components that call repositories directly.
Interactivity (login form, sign-out) is delegated to small `"use client"`
components, keeping the data path on the server.

## Caching Decision

**The single explicit caching decision is on the product list:**

```ts
// app/(shop)/products/page.tsx
export const revalidate = 300; // Incremental Static Regeneration, 5 minutes
```

**Why ISR (time-based `revalidate`) for the list:**

- The FakeStore catalog changes infrequently, so re-fetching it on every single
  request would waste an upstream round-trip for data that is effectively
  static between updates.
- ISR gives the best of both worlds: responses are served from a prerendered,
  CDN-cacheable payload, and the data is transparently refreshed at most once
  every 5 minutes. Visitors never wait on the origin for stale-but-acceptable
  catalog data.
- It is the simplest decision to reason about and justify for a read-only,
  low-volatility list.

**Interaction with SSR:** because the list page reads `?page=` from
`searchParams`, the *route* is rendered dynamically per request (true SSR),
while the *data fetch* underneath (`productsRepository.getAllProducts`) inherits
the route-level `revalidate` and is therefore cached. So the page is
server-rendered on demand, but the catalog data is not re-fetched on every hit.

**Contrast with the detail page:** the product detail page uses
`cache: "no-store"` to demonstrate genuine per-request SSR where freshness
matters more than cache reuse.

## SSR Decisions Table

| Page             | Rendering type            | Reason |
| ---------------- | ------------------------- | ------ |
| `/products`      | SSR + ISR-cached data     | Rendered on demand because it reads `?page=` from `searchParams`, but the catalog fetch is cached via `revalidate = 300`. Low-volatility data served fast, refreshed every 5 minutes. |
| `/products/[id]` | SSR (fully dynamic)       | `dynamic = "force-dynamic"` + `cache: "no-store"`. Demonstrates genuine per-request rendering; also where the not-found redirect and dynamic metadata are decided per request. |
| `/admin`         | SSR (dynamic, auth-gated) | `dynamic = "force-dynamic"`; the session is read server-side via `auth()` on every request and unauthenticated users are redirected before any content renders. |

> Note on terminology: this project uses the **classic** rendering model
> (route segment config + `fetch` cache options). "ISR" here means the list's
> data is time-revalidated (`revalidate = 300`); "SSR" means the route is
> rendered per request. No client-side rendering (CSR) is used for these pages.

## Hardest Challenge

The most instructive challenge was that the target project runs **Next.js 16**,
not 14, and several assumptions differ from older App Router material:

- `params` and `searchParams` are now **Promises** and must be awaited.
- `error.tsx` receives a **`retry`** prop (not `reset`).
- Middleware is now **`proxy.ts`**.
- Next applies the reserved **`error` file convention** (which forces a Client
  Component) to *any* `error.ts` under `app/`. A plain `app/apis/types/error.ts`
  broke the production build the moment it entered a route's import graph. The
  fix was renaming it to `fetch-error.ts`.
- FakeStoreAPI returns **HTTP 200 with an empty body** for a missing product id
  (not a 404), so the detail page cannot rely on status codes. The repository
  detects the empty/invalid payload (parses empty body to `null`, Zod-guards the
  rest) and the page issues a real server redirect from there.

## Verification

```bash
bun run test    # bun's native test runner (fetcher + repository units)
bunx tsc --noEmit
bun run lint
bun run build
```