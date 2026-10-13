import { ContactForm } from "@/components/ContactForm";
import { LiveMonitor } from "@/components/LiveMonitor";
import { Logo } from "@/components/Logo";
import { PipelineDemo } from "@/components/PipelineDemo";
import { Reveal } from "@/components/Reveal";
import {
  aiSignals,
  clouds,
  COMPANY,
  CONTACT_EMAIL,
  INFO_EMAIL,
  lifecycle,
  nav,
  pillars,
  principles,
} from "./content";

function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-6">{children}</div>;
}

function Section({
  id,
  title,
  lede,
  children,
}: {
  id: string;
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-t border-border py-24 scroll-mt-14">
      <Wrap>
        <Reveal>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 max-w-2xl text-lg text-muted">{lede}</p>
        </Reveal>
        <div className="mt-12">{children}</div>
      </Wrap>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-foreground focus:px-3 focus:py-2 focus:text-background"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <Wrap>
          <div className="relative flex h-14 items-center justify-between">
            <a href="#" aria-label="7C Labs home"><Logo /></a>
            <nav aria-label="Primary" className="hidden gap-6 text-sm text-muted md:flex">
              {nav.map((n) => (
                <a key={n.href} href={n.href} className="hover:text-foreground">{n.label}</a>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <a href="#contact" className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background">
                Contact us
              </a>
              <details className="md:hidden">
                <summary className="cursor-pointer list-none rounded-md border border-border px-3 py-1.5 text-sm">Menu</summary>
                <nav aria-label="Mobile" className="absolute right-0 top-14 grid w-48 gap-1 rounded-md border border-border bg-surface p-2 text-sm">
                  {nav.map((n) => (
                    <a key={n.href} href={n.href} className="rounded px-3 py-2 hover:bg-border">{n.label}</a>
                  ))}
                </nav>
              </details>
            </div>
          </div>
        </Wrap>
      </header>

      <main id="main">
        <section className="relative">
          <div className="hero-bg" aria-hidden />
          <Wrap>
            <div className="relative grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-[1.1fr_1fr]">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted">
                  <span className="status-live text-ok" aria-hidden>&#9679;</span>
                  Secure, observable AI and cloud delivery
                </p>
                <h1 className="mt-5 text-5xl font-semibold tracking-tight sm:text-6xl">
                  Ship software and AI that is <span className="gradient-text">secure, resilient and measured</span> from day one.
                </h1>
                <p className="mt-6 max-w-xl text-lg text-muted">
                  7C Labs covers the journey from development to deployment, with DevSecOps and SRE
                  principles built in and clear monitoring of AI usage across your cloud platforms.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="#contact" className="rounded-md bg-foreground px-5 py-2.5 font-medium text-background">Talk to us</a>
                  <a href="#ai-monitoring" className="rounded-md border border-border px-5 py-2.5 font-medium hover:border-accent">See AI monitoring</a>
                </div>
              </div>
              <PipelineDemo />
            </div>
          </Wrap>
        </section>

        <Section
          id="lifecycle"
          title="One lifecycle, with security and reliability in every step."
          lede="From first idea to live operation, each stage has its own controls and its own evidence."
        >
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lifecycle.map((s, i) => (
              <li key={s.step}>
                <Reveal delay={i * 80}>
                  <div className="card-glow h-full rounded-xl border border-border bg-surface p-6">
                    <span className="font-mono text-sm text-accent">{s.step}</span>
                    <h3 className="mt-2 text-xl font-semibold">{s.name}</h3>
                    <p className="mt-2 text-muted">{s.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </Section>

        <Section
          id="platform"
          title="What the platform does."
          lede="Four capabilities that work together instead of four tools you have to join up."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 80}>
                <article className="card-glow h-full rounded-xl border border-border bg-surface p-8">
                  <h3 className="text-xl font-semibold">{p.title}</h3>
                  <p className="mt-3 text-muted">{p.text}</p>
                  <ul className="mt-5 space-y-1.5 text-sm">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex gap-2">
                        <span aria-hidden className="text-accent">&#10003;</span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section
          id="ai-monitoring"
          title="See how AI is used, what it costs, and when it goes wrong."
          lede="Monitoring for AI usage that is short and clear: a few signals tied to the teams and services that own them."
        >
          <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
            <Reveal>
              <ul className="space-y-5">
                {aiSignals.map((s) => (
                  <li key={s.name}>
                    <h3 className="font-semibold">{s.name}</h3>
                    <p className="text-muted">{s.text}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={120}>
              <LiveMonitor />
            </Reveal>
          </div>
        </Section>

        <Section
          id="principles"
          title="The principles behind the platform."
          lede="The same practices we expect of any team running production systems."
        >
          <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {principles.map((p, i) => (
              <Reveal key={p.title} delay={i * 60}>
                <dt className="font-semibold">{p.title}</dt>
                <dd className="mt-1 text-muted">{p.text}</dd>
              </Reveal>
            ))}
          </dl>
        </Section>

        <Section
          id="cloud"
          title="Built for the major cloud platforms."
          lede="One operating model across providers, with identity, network and cost controls applied the same way."
        >
          <ul className="flex flex-wrap gap-3">
            {clouds.map((c) => (
              <li key={c} className="card-glow rounded-md border border-border bg-surface px-4 py-2 font-medium">{c}</li>
            ))}
          </ul>
        </Section>

        <section id="contact" className="border-t border-border py-24 scroll-mt-14">
          <Wrap>
            <Reveal>
              <h2 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Tell us what you are building.</h2>
              <p className="mt-4 max-w-2xl text-lg text-muted">
                Write to <a className="text-accent underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or
                use the form. For general information, contact{" "}
                <a className="text-accent underline" href={`mailto:${INFO_EMAIL}`}>{INFO_EMAIL}</a>.
              </p>
              <div className="mt-10"><ContactForm /></div>
            </Reveal>
          </Wrap>
        </section>
      </main>

      <footer className="border-t border-border py-10 text-sm text-muted">
        <Wrap>
          <p>&copy; {COMPANY}. All rights reserved.</p>
          <p className="mt-1">7clabs.com &middot; {CONTACT_EMAIL} &middot; {INFO_EMAIL}</p>
        </Wrap>
      </footer>
    </>
  );
}
