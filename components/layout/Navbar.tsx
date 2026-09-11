"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ROUTES } from "@/constants/routes";

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "Home", href: ROUTES.HOME },
  { label: "Products", href: ROUTES.PRODUCTS },
  { label: "Admin", href: ROUTES.ADMIN },
];

export function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === ROUTES.HOME ? pathname === href : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <Link href={ROUTES.HOME} className="text-sm font-semibold tracking-tight">
          FakeStore
        </Link>

        <ul className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors ${
                    active
                      ? "bg-foreground text-background"
                      : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
