import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { CONTACT_EMAIL, roles } from "../content";

export const metadata: Metadata = {
  title: "Careers | 7C Labs",
  description: "Intern positions at 7C Labs for people with development and platform understanding.",
};

function applyHref(title: string) {
  const subject = encodeURIComponent(`Application: ${title}`);
  const body = encodeURIComponent(
    `Hello 7C Labs team,\n\nI would like to apply for the ${title} position.\n\nName:\nCollege / course:\nLinks (GitHub, portfolio, LinkedIn):\n\nA few lines about what you have built or learned:\n`,
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

export default function Careers() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
        <Reveal>
          <p className="font-mono text-sm text-accent">Careers &middot; Internships</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Help us make <span className="gradient-text">secure, compliant platforms</span> easy to run.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted sm:text-xl">
            Work alongside experienced engineers on the platform itself. We are looking for interns with a development
            or platform understanding who want to simplify how full-fledged platforms are managed.
          </p>
        </Reveal>

        <h2 className="mt-16 font-mono text-sm text-muted">Open intern positions</h2>
        <ul className="mt-4 grid gap-5 lg:grid-cols-3">
          {roles.map((r, i) => (
            <li key={r.id}>
              <Reveal delay={i * 100} className="h-full">
                <article
                  className="card-glow flex h-full flex-col rounded-2xl border bg-surface/80 p-6 backdrop-blur"
                  style={{ borderColor: `rgba(${r.color},0.4)` }}
                >
                  <p className="font-mono text-xs" style={{ color: `rgb(${r.color})` }}>&#9679; Intern</p>
                  <h3 className="mt-2 text-xl font-semibold">{r.title}</h3>
                  <p className="mt-2 text-sm text-muted">{r.pitch}</p>

                  <p className="mt-5 font-mono text-xs text-muted">YOU WILL WORK ON</p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {r.work.map((w) => (
                      <li key={w} className="flex gap-2">
                        <span aria-hidden style={{ color: `rgb(${r.color})` }}>&#10003;</span>
                        {w}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-5 font-mono text-xs text-muted">WHAT HELPS</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {r.skills.map((s) => (
                      <li key={s} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">{s}</li>
                    ))}
                  </ul>

                  <a
                    href={applyHref(r.title)}
                    className="mt-6 inline-block w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
                  >
                    Apply by email
                  </a>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>

        <p className="mt-10 max-w-2xl text-sm text-muted">
          Duration and other details are shared when we speak. Not sure which role fits? Write to{" "}
          <a className="text-accent underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and tell us what you
          have built.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
