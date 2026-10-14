import Link from "next/link";
import { NavLink } from "./NavLink";
import { COMPANY, CONTACT_EMAIL, INFO_EMAIL } from "@/app/content";

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-10 text-[length:var(--text-small)] text-muted">
      <div className="mx-auto flex w-full max-w-[var(--page-max)] flex-col gap-5 px-[var(--gutter)] md:flex-row md:items-center md:justify-between">
        <p>
          &copy; {COMPANY} &middot; 7clabs.com
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-2">
          <NavLink href="/#about" className="hover:text-foreground">About us</NavLink>
          <Link href="/careers" className="hover:text-foreground">Careers</Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground">{CONTACT_EMAIL}</a>
          <a href={`mailto:${INFO_EMAIL}`} className="hover:text-foreground">{INFO_EMAIL}</a>
        </nav>
      </div>
    </footer>
  );
}
