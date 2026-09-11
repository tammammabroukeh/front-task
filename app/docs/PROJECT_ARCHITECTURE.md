# Project Architecture Blueprint
# Project Architecture Blueprint

A reusable reference for the architecture, conventions, and patterns of this
Next.js jobs & employment platform. Use it to bootstrap or align another
project with the same structure.

> This is a living reference. Paths, layers, and code patterns below reflect the
> actual project. Adapt names to your domain when reusing.

---

## 1. Tech Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, RSC) |
| UI runtime | React 19 (react-jsx transform) |
| Language | TypeScript 5 (strict), path alias `@/*` -> project root |
| UI library | Ant Design 6 (form inputs, tables, feedback) |
| Styling | Tailwind CSS 4 + semantic CSS variables, `tailwind-merge` |
| Auth | NextAuth 4 (JWT strategy, 1h maxAge, credentials provider) |
| Forms | react-hook-form 7 + Zod 4 (`@hookform/resolvers`) |
| Server actions | next-safe-action 8 |
| i18n | next-intl 4 (locales: `en`, `ar`; RTL for `ar`; cookie-based) |
| Toasts | sonner |
| Package manager | npm (bun.lock also present) |

Scripts (`package.json`):

```bash
npm run dev     # next dev -p 3001
npm run build   # next build
npm run start   # next start
npm run lint    # eslint
```

Required env vars (`.env`):

- `BASE_URL` — backend API base URL
- `AI_BASE_URL` — separate base URL for AI endpoints (optional override)
- `NEXT_PUBLIC_API_TIMEOUT` — fetch timeout ms (default 50000)
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

---

## 2. Top-Level Directory Layout

```
project-root/
├── app/                 # Next.js App Router (pages, layouts, API routes)
├── apis/                # API layer: instances, services, types, utils
├── auth/                # NextAuth handler barrel (re-exports authOptions)
├── components/          # React components, feature-grouped
│   └── Reusable-Components/   # Shared design-system wrappers
├── constants/           # routes, methods, roles, errors, nav links
├── context/             # React context providers (e.g. Theme)
├── docs/                # Project documentation
├── hooks/               # Custom hooks (incl. typed i18n hooks)
├── i18n/                # next-intl request config (request.ts)
├── lib/                 # auth options, safe-action client, helpers
├── messages/            # Translations: messages/{en,ar}/<namespace>.json
├── providers/           # App-wide providers wiring (session, intl, theme)
├── schemas/             # Shared Zod schemas
├── themes/              # Theme mode helpers
├── types/               # Shared TS types (incl. i18n key types)
├── utils/               # Framework-agnostic utilities
├── middleware.ts        # Pass-through; access control is page-level
├── next.config.ts
└── tsconfig.json        # paths: { "@/*": ["./*"] }
```

Convention: **feature-based grouping**. Each feature has co-located components
(`components/<feature>/`), API service (`apis/services/<feature>/`), and a
translation namespace (`messages/<locale>/<feature>.json`).

---

## 3. App Router Structure

```
app/
├── layout.tsx            # Root layout: providers, html lang/dir, fonts
├── globals.css           # Tailwind + semantic color tokens (light/dark)
├── (website)/            # Route group: public + authed site (shared layout)
│   ├── layout.tsx        # Navbar/footer shell
│   ├── page.tsx          # Homepage
│   ├── jobs/             # /jobs, /jobs/[id]
│   ├── matched-jobs/     # AI-matched jobs (job seeker)
│   ├── companies/        # /companies, /companies/[id]
│   ├── talents/          # public talent browsing
│   ├── candidates/       # employer: browse + /candidates/[userId]
│   ├── match-candidates/ # employer: AI candidate matching
│   ├── manage-jobs/      # employer: job management
│   ├── forsa/            # employer: create/edit job (/forsa, /forsa/[id])
│   ├── employer-profile/
│   ├── applications/     # job seeker applications
│   ├── offers/           # received offers
│   ├── meetings/         # /meetings, /meetings/create, /meetings/[id]
│   └── profile/          # job seeker profile
├── auth/                 # login, register, forgot/reset password, verify
│   └── layout.tsx        # Auth-only shell
├── dashboard/            # protected dashboard
├── unauthorized/         # 403 page (redirect target for wrong role)
└── api/
    ├── auth/[...nextauth]/route.ts   # NextAuth handler
    └── health/route.ts               # health check
```

Routing conventions:

- Route groups `(website)` don't appear in the URL; they scope a shared layout.
- Dynamic segments use `[id]` / `[userId]`; catch-all `[...nextauth]`.
- Public pages are server components; interactive pages delegate to a
  `*Client.tsx` component marked `"use client"`.

---

## 4. API Layer (three tiers)

```
apis/
├── api.instance.ts     # Base fetcher: apiFetcher<T>() — public calls
├── authInstace.ts      # authFetcher<T>() — adds Bearer token + 401 refresh
├── cookie.ts
├── services/
│   └── <feature>/
│       ├── index.ts        # repository object (HTTP calls) + barrel exports
│       ├── interface.ts    # request/response/model interfaces
│       └── actions.ts      # "use server" server actions (validation + revalidate)
├── types/
│   ├── error.ts        # FetchError, ActionError
│   └── index.ts
└── utils/
    ├── errorHelpers.ts # is401Error, etc.
    ├── queryBuilder.ts # buildQueryString(params)
    └── tokenManager.ts # refreshAccessToken()
```

### Tier 1 — Base fetcher (`apiFetcher`)

`"use server"` function with:

- Timeout via `AbortController` (`NEXT_PUBLIC_API_TIMEOUT`).
- Retry with exponential backoff (max 2) for timeout/network errors.
- Auto FormData detection — skips `Content-Type` so the browser sets the boundary.
- Cache/`next` reconciliation: when a caller passes `next.tags`/`revalidate`,
  it does **not** force `no-cache` (which would disable tag revalidation).
- Errors normalized to `FetchError { message, info, status, type }`.
- Optional `overridedBaseUrl` to target `AI_BASE_URL` instead of `BASE_URL`.

### Tier 2 — Authenticated fetcher (`authFetcher`)

Wraps `apiFetcher`, reads the NextAuth session, injects
`Authorization: Bearer <accessToken>`. On a `401` it refreshes the token once
via `tokenManager.refreshAccessToken()` and retries; otherwise rethrows.

### Tier 3 — Repository (per feature `index.ts`)

Plain object of typed methods. HTTP details only, no business logic.

```ts
export const jobSeekerRepository = {
  getProfile: (): Promise<IJobSeekerProfileResponse> =>
    authFetcher<IJobSeekerProfileResponse>('/job-seeker/profile', {
      method: Methods.GET,
      cache: 'no-store',           // per-user data: never share in Data Cache
    }),

  matchResumeToJobs: (): Promise<MatchResumeToJobsResponse> =>
    authFetcher<MatchResumeToJobsResponse>('/job-seeker/match-resume-to-jobs', {
      method: Methods.GET,
      cache: 'no-store',
    }),
};
```

Query strings: build with `buildQueryString(params)` from `apis/utils`.
FormData uploads: build `FormData`, pass `skipDefaultHeaders: true`.

Cached, shared (non-user-specific) reads use `next: { tags: [...], revalidate }`.
Per-user reads use `cache: 'no-store'`.

### Server Actions (`actions.ts`)

Built with `next-safe-action`. The shared client lives in `lib/safe-action.ts`
and maps `ActionError`/`FetchError` to user-facing messages.

```ts
// lib/safe-action.ts
export const actionClient = createSafeActionClient({
  async handleServerError(e) {
    if (e instanceof ActionError) return e.message;
    if (e instanceof FetchError) {
      if (e.status === 401) return "error.permission.actionAccess";
      return e.message;
    }
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});
```

Action pattern:

```ts
"use server";
const matchCandidatesSchema = z.object({
  job_description: z.string().min(10).max(5000),
  limit: z.number().int().min(1).max(50).optional(),
});

export const matchCandidatesAction = actionClient
  .schema(matchCandidatesSchema)
  .action(async ({ parsedInput }) => {
    try {
      const data = await employerRepository.matchCandidates(parsedInput);
      // revalidateTag('...') / revalidatePath('...') after mutations
      return { success: true, data };
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
      throw new Error("Failed to match candidates.");
    }
  });
```

Rules:

1. Validate every input with Zod (schema owned by the action).
2. Call the repository; do not put HTTP details in the action.
3. `revalidateTag`/`revalidatePath` after mutations.
4. Return `{ success, data?, message? }`; throw for failures (client catches).

Interface naming (`interface.ts`):

- Request: `I<Action>Request` (e.g. `IUpdatePersonalInfoRequest`)
- Response: `I<Action>Response`
- Model: `I<Model>` (e.g. `IJobSeekerProfile`)
- Feature-specific models may drop the `I` prefix (e.g. `Candidate`, `Job`) —
  keep it consistent within a service.

---

## 5. Authentication & Authorization

- `lib/auth.ts` defines `authOptions` (Credentials provider hitting
  `/auth/login`, JWT sessions, 1h `maxAge`, secure cookies in prod).
- `app/api/auth/[...nextauth]/route.ts` is the handler; `auth/index.ts`
  re-exports `authOptions` for convenient imports (`@/auth`).
- Roles: `"admin" | "owner" | "employer" | "employee"`. API `roles[]` is mapped
  to a single session role via `mapRole()` (also treats `"company"` as
  `"employer"`).
- **Token refresh happens in two places**:
  - Proactive (time-based) in the NextAuth `jwt` callback, 5-min buffer before
    expiry, calling `/auth/refresh`.
  - Reactive (error-based) in `authFetcher` on a `401`.
- **Route protection is page-level** (middleware is a pass-through). Guard a
  server page like:

```ts
const session = await getServerSession(authOptions);
if (!session?.user) redirect('/auth/login?callbackUrl=/match-candidates');
if (session.user.role !== 'employer') redirect('/unauthorized');
```

---

## 6. Internationalization (i18n)

- `i18n/request.ts` reads the `locale` cookie (defaults to `en`, validates
  against `["en", "ar"]`) and lazy-imports every namespace file for that locale.
- Messages live in `messages/<locale>/<namespace>.json`. Namespaces are
  feature-scoped (`jobs`, `candidates`, `employer`, `navbar`, `profile`, ...).
- RTL: `isRTL(locale)` returns `true` for `ar`; the root layout sets `dir`.
- Adding a namespace requires: create both `en` + `ar` JSON files, register the
  import in `i18n/request.ts`, and add it to `types/i18n.ts`.

Typed translation hooks (`hooks/use-translations.ts`):

```ts
// Fully typed, autocomplete on keys:
const t = useTypedTranslations('jobs');
t('matchedJobs.title');

// Namespace convenience hooks (loosely typed):
const t = useCandidatesTranslations();  // useTranslations('candidates')
```

Server components use `getTranslations` wrappers in `lib/get-translations.ts`:

```ts
export async function getJobsTranslations() { return getTranslations('jobs'); }
```

Translation rules:

- Translate all user-facing text: labels, buttons, placeholders, empty states,
  toasts, validation messages, dialog content. Never translate API endpoints,
  config values, or `console.log`.
- Use ICU plurals for counts: `"{count, plural, =0 {...} =1 {...} other {# ...}}"`.
- Interpolation: `t('greeting', { name })`.
- Keep keys camelCase and grouped by section.

Type source of truth (`types/i18n.ts`): `Messages` is derived from
`typeof import("../messages/en/<ns>.json")`, so JSON is the canonical shape and
adding keys automatically widens the types.

---

## 7. UI & Component Conventions

Design-system wrappers live in `components/Reusable-Components/` and must be
preferred over raw Ant Design:

| Use | Instead of |
| --- | --- |
| `ReusableButton` | antd `Button` |
| `ReusableDialog` | antd `Modal` |
| `Typography` | raw `h1..h6/p/span` |
| `Flex` | ad-hoc flex wrappers |
| `ReusableSelect`, `ReusableInput`, `ReusableBadge`, `ReusablePagination`, `ReusableTabs`, `ReusableCard`, `ReusableForm` | antd equivalents |

Ant Design is still used directly for: form inputs (`Input`, `TextArea`,
`Select`, `DatePicker`, `Checkbox`, `Radio`), data display (`Table`, `Tag`,
`Progress`, `Tooltip`), and `Spin`.

Component patterns:

- Server component page -> `*Client.tsx` (`"use client"`) for interactivity.
- Feature folders use `index.ts` barrels.
- Cards are composed of small pieces (see `home/recent-jobs/JobCard*` →
  `JobCardHeader`, `JobCardBadges`, `JobCardDetails`, `JobCardFooter`) so the
  same card renders in multiple contexts. New/variant data is passed as
  **optional props** rather than forking the component.
- Icons: Font Awesome classes (`fa-solid fa-...`) and `@ant-design/icons`.

File naming:

- Components `PascalCase.tsx`; hooks `useX.ts`; utils/constants `camelCase.ts`;
  interfaces file `interface.ts` (PascalCase exports).
- Absolute imports via `@/...`; avoid `../../../`.

---

## 8. Theming (light/dark)

Colors are **semantic CSS variables**, not inline `dark:` classes.

- Define tokens in `app/globals.css` under `:root` (light) and `:root.dark`
  (dark), then register them in the `@theme inline` block so Tailwind exposes
  utility classes.
- Use semantic classes: `bg-background`, `text-foreground`, `bg-card`,
  `border-border`, `text-primary`, `text-muted-foreground`, `text-success`,
  `text-warning`, `text-destructive`, plus component-scoped tokens
  (e.g. `bg-doc-section-bg`).
- Avoid `className="text-gray-900 dark:text-gray-100"` and inline hex.
- Naming: `--{component}-{element}-{property}` (e.g. `--doc-section-bg`).
- Theme state: `context/ThemeContext.tsx` + `themes/` helpers.

---

## 9. Forms & Validation

- `react-hook-form` + `zodResolver`; derive types with `z.infer<typeof schema>`.
- Wrap Ant Design inputs with `Controller`.
- Show inline errors, disable inputs while submitting, reset on success,
  surface success/error via `sonner` toasts.
- Validation messages come from translations.

```tsx
const schema = z.object({ email: z.string().email(t('validation.invalidEmail')) });
type FormData = z.infer<typeof schema>;
const { register, handleSubmit, formState: { errors, isSubmitting } } =
  useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: '' } });
```

---

## 10. State Management

- No global store. Local `useState` first; lift state only when shared.
- Server state fetched via repositories/actions; cached with Next.js tags or
  `no-store` for per-user data.
- Reusable logic extracted into `hooks/` (`useToggle`, `useDebounce`,
  data-fetching hooks, etc.).
- Prefer functional state updates and derived values over redundant state.

---

## 11. Error Handling

- `FetchError` (transport/API) carries `status`, `info`, `type`; `ActionError`
  for domain errors thrown inside actions.
- Repositories throw; actions catch and rethrow as user-friendly `Error`;
  clients wrap calls in `try/catch` and toast the message.
- 401 is handled centrally (refresh-and-retry) in `authFetcher`.

---

## 12. Constants & Navigation

- `constants/routes.ts` — the single `ROUTES` object (nested by area) with
  helpers like `getDetail(id)`. Also exports `NAVBAR_LINKS`.
- `NAVBAR_LINKS` entries carry visibility metadata:

```ts
{
  labelKey: "links.matchCandidates",     // navbar.json key
  href: ROUTES.EMPLOYER.MATCH_CANDIDATES,
  showInNavbar: true,
  authRequired: true,
  roles: ["employer"],                   // role gate ([] / omitted = all)
}
```

- `constants/methods.ts` — `Methods` enum (GET/POST/PUT/PATCH/DELETE).
- `constants/roles.ts` — role-to-route access maps.
- `constants/errors.ts` — default error messages.

---

## 13. How to Add a New Feature (end-to-end recipe)

Example follows the "employer: match candidates" feature.

1. **Interfaces** — add request/response/model types in
   `apis/services/<feature>/interface.ts`.
2. **Repository** — add a typed method in `apis/services/<feature>/index.ts`
   using `authFetcher` (or `apiFetcher` for public). Choose caching:
   `no-store` for per-user; `next.tags` for shared reads.
3. **Server action** — add to `actions.ts` with a Zod schema; revalidate after
   mutations; return `{ success, data }`.
4. **Translations** — add keys to `messages/en/<ns>.json` and
   `messages/ar/<ns>.json`; register new namespaces in `i18n/request.ts` and
   `types/i18n.ts`.
5. **UI** — build a server page under `app/(website)/<route>/page.tsx` with a
   role guard + translated metadata; delegate interactivity to a
   `components/<feature>/<Feature>Client.tsx`. Reuse existing cards/dialogs;
   extend them with optional props instead of forking.
6. **Route + nav** — add the path to `ROUTES` and, if user-facing, a
   `NAVBAR_LINKS` entry with `roles`.
7. **Verify** — `node ./node_modules/typescript/bin/tsc --noEmit` and
   `npx eslint <changed files>`.

### Reuse-a-component checklist

When a shared component needs to display extra data for a new context:

- Add the new fields as **optional props** (keep existing callers working).
- Guard optional data in render; provide sensible fallbacks.
- If the source shape differs (e.g. AI match response vs. browse list), write a
  small adapter (`toCandidate(match)`) to map into the component's expected shape.

---

## 14. Verification & Conventions Summary

- Typecheck: `node ./node_modules/typescript/bin/tsc --noEmit`
  (avoid bare `tsc` — it may prompt to install the global `tsc` package).
- Lint: `npx eslint <paths>` (or `npm run lint`).
- Do all user-facing text through i18n; use `ReusableButton`/`ReusableDialog`;
  validate forms with Zod; type all requests/responses; use the repository
  pattern; revalidate caches after mutations; test both `en` and `ar` (incl.
  RTL).

---

## 15. Related Docs

- `.kiro/steering/` — granular guides: `ui-patterns`, `translations`,
  `theme-colors`, `forms-validation`, `api-patterns`, `hooks-state`,
  `structure`, `tech`, `product`, `employer-feature`, `notifications-feature`.
- `docs/FRONTEND_GUIDE.md`, `docs/MEETINGS_IMPLEMENTATION.md`.
