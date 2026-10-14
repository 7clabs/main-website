import Link from "next/link";
import { NavLink } from "./NavLink";
import { Logo } from "./Logo";
import { NavPhysics } from "./NavPhysics";
import { OpenChatButton } from "./ChatWidget";
import { ThemeToggle } from "./ThemeToggle";

// Absolute "/#..." links work from every page and stay on the page when already on the home page.
const nav = [
  { href: "/#journey", label: "Journey" },
  { href: "/#products", label: "Products" },
  { href: "/#services", label: "Services" },
  { href: "/#about", label: "About us" },
  { href: "/careers", label: "Careers" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 bg-background/75 backdrop-blur-md">
      <NavPhysics className="mx-auto w-full max-w-[var(--page-max)] px-[var(--gutter)]">
        <div className="relative flex h-20 items-center justify-between">
          <Link href="/" aria-label="7C Labs home"><Logo /></Link>
          <nav aria-label="Primary" className="hidden gap-9 text-[1.0625rem] font-medium text-muted md:flex">
            {nav.map((n) => (
              <NavLink key={n.href} href={n.href} className="transition-colors hover:text-foreground">{n.label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <OpenChatButton className="whitespace-nowrap rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform hover:scale-105 sm:px-5 sm:py-2.5 sm:text-base">Talk to us</OpenChatButton>
            <details className="md:hidden">
              <summary className="cursor-pointer list-none whitespace-nowrap rounded-full border border-border px-3 py-2 text-sm sm:px-4 sm:py-2.5 sm:text-base">Menu</summary>
              <nav aria-label="Mobile" className="absolute right-0 top-[4.5rem] grid w-52 gap-1 rounded-2xl border border-border bg-surface p-2 text-base">
                {nav.map((n) => (
                  <NavLink key={n.href} href={n.href} className="rounded-lg px-3 py-2.5 hover:bg-border">{n.label}</NavLink>
                ))}
              </nav>
            </details>
          </div>
        </div>
      </NavPhysics>
    </header>
  );
}
