# FakeStore — SSR Product Showcase

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

_TODO (filled in as the project is built): API layer tiers, repository pattern,
Zod validation, error handling strategy._

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

| Page             | Rendering type | Reason |
| ---------------- | -------------- | ------ |
| `/products`      | _TODO_         | _TODO_ |
| `/products/[id]` | _TODO_         | _TODO_ |
| `/admin`         | _TODO_         | _TODO_ |

## Hardest Challenge

_TODO._

---

## Deployment

Deployed on Vercel. _Live URL: TODO._
