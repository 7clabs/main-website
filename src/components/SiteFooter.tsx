import Link from "next/link";
import { COMPANY, CONTACT_EMAIL, INFO_EMAIL } from "@/app/content";

export function SiteFooter() {
  return (
    <footer className="py-10 text-center text-xs text-muted">
      <nav aria-label="Footer" className="mb-3 flex justify-center gap-5">
        <Link href="/#about" className="hover:text-foreground">About us</Link>
        <Link href="/careers" className="hover:text-foreground">Careers</Link>
        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground">{CONTACT_EMAIL}</a>
        <a href={`mailto:${INFO_EMAIL}`} className="hover:text-foreground">{INFO_EMAIL}</a>
      </nav>
      &copy; {COMPANY} &middot; 7clabs.com
    </footer>
  );
}
