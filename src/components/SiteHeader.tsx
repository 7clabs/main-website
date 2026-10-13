import Link from "next/link";
import { Logo } from "./Logo";
import { OpenChatButton } from "./ChatWidget";

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
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="relative flex h-20 items-center justify-between">
          <Link href="/" aria-label="7C Labs home"><Logo /></Link>
          <nav aria-label="Primary" className="hidden gap-9 text-[1.0625rem] font-medium text-muted md:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="transition-colors hover:text-foreground">{n.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <OpenChatButton className="whitespace-nowrap rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform hover:scale-105 sm:px-5 sm:py-2.5 sm:text-base">Talk to us</OpenChatButton>
            <details className="md:hidden">
              <summary className="cursor-pointer list-none whitespace-nowrap rounded-full border border-border px-3 py-2 text-sm sm:px-4 sm:py-2.5 sm:text-base">Menu</summary>
              <nav aria-label="Mobile" className="absolute right-0 top-[4.5rem] grid w-52 gap-1 rounded-2xl border border-border bg-surface p-2 text-base">
                {nav.map((n) => (
                  <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2.5 hover:bg-border">{n.label}</Link>
                ))}
              </nav>
            </details>
          </div>
        </div>
      </div>
    </header>
  );
}
