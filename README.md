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

_TODO: the single explicit caching decision for the product list and its
justification._

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
