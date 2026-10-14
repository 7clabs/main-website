"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { jumpTo } from "@/lib/nav";

/** A link that, for "/#section" targets on the home page, scrolls there sensibly instead of the browser default. */
export function NavLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        if (pathname === "/" && href.startsWith("/#")) {
          if (jumpTo(href.slice(2))) e.preventDefault();
        }
      }}
    >
      {children}
    </Link>
  );
}
