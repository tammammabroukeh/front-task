import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Base path without query string, e.g. "/products". */
  basePath: string;
}

/**
 * Server-rendered pagination. Uses plain links with `?page=` so navigation is
 * driven entirely by the server (SSR-friendly, no client JS required).
 */
export function Pagination({ page, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const hrefFor = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`);

  return (
    <nav
      className="flex items-center justify-center gap-4 pt-8"
      aria-label="Pagination"
    >
      <PageLink
        href={hrefFor(page - 1)}
        disabled={!hasPrev}
        rel="prev"
        label="Previous"
      />
      <span className="text-sm text-foreground/60" aria-current="page">
        Page {page} of {totalPages}
      </span>
      <PageLink
        href={hrefFor(page + 1)}
        disabled={!hasNext}
        rel="next"
        label="Next"
      />
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  rel,
  label,
}: {
  href: string;
  disabled: boolean;
  rel: "prev" | "next";
  label: string;
}) {
  const base =
    "inline-flex h-10 items-center rounded-full border px-5 text-sm font-medium transition-colors";

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={`${base} cursor-not-allowed border-foreground/10 text-foreground/30`}
      >
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      rel={rel}
      className={`${base} border-foreground/20 hover:bg-foreground/5`}
    >
      {label}
    </Link>
  );
}
