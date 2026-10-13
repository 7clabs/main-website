import { ContactForm } from "@/components/ContactForm";
import { EventTicker } from "@/components/EventTicker";
import { Logo } from "@/components/Logo";
import { ProductMockup } from "@/components/Mockups";
import { PipelineDemo } from "@/components/PipelineDemo";
import { Reveal } from "@/components/Reveal";
import { SignalGraph } from "@/components/SignalGraph";
import {
  COMPANY,
  CONTACT_EMAIL,
  governance,
  INFO_EMAIL,
  levels,
  products,
  services,
  strip,
} from "./content";

function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-6">{children}</div>;
}

function Heading({ eyebrow, title, lede }: { eyebrow?: string; title: string; lede?: string }) {
  return (
    <Reveal>
      {eyebrow && <p className="font-mono text-sm text-accent">{eyebrow}</p>}
      <h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {lede && <p className="mt-4 max-w-2xl text-lg text-muted">{lede}</p>}
    </Reveal>
  );
}

const primaryBtn = "rounded-md bg-foreground px-5 py-2.5 font-medium text-background";
const ghostBtn = "rounded-md border border-border px-5 py-2.5 font-medium hover:border-accent";

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

            <nav aria-label="Primary" className="hidden items-center gap-7 text-sm text-muted md:flex">
              <div className="group relative">
                <button className="hover:text-foreground group-focus-within:text-foreground" aria-haspopup="true">
                  Products &#9662;
                </button>
                <div className="invisible absolute left-1/2 top-full w-[34rem] -translate-x-1/2 pt-3 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-3 shadow-2xl">
                    {products.map((p) => (
                      <a key={p.id} href={`#${p.id}`} className="rounded-md p-3 hover:bg-border">
                        <span className="block font-medium text-foreground">{p.name}</span>
                        <span className="mt-0.5 block text-xs">{p.short}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <a href="#platform" className="hover:text-foreground">Platform</a>
              <a href="#governance" className="hover:text-foreground">Governance</a>
              <a href="#services" className="hover:text-foreground">Services</a>
            </nav>

            <div className="flex items-center gap-3">
              <a href="#contact" className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background">
                Talk to us
              </a>
              <details className="md:hidden">
                <summary className="cursor-pointer list-none rounded-md border border-border px-3 py-1.5 text-sm">Menu</summary>
                <nav aria-label="Mobile" className="absolute right-0 top-14 grid w-56 gap-1 rounded-md border border-border bg-surface p-2 text-sm">
                  {products.map((p) => (
                    <a key={p.id} href={`#${p.id}`} className="rounded px-3 py-2 hover:bg-border">{p.name}</a>
                  ))}
                  <a href="#platform" className="rounded px-3 py-2 hover:bg-border">Platform</a>
                  <a href="#governance" className="rounded px-3 py-2 hover:bg-border">Governance</a>
                  <a href="#services" className="rounded px-3 py-2 hover:bg-border">Services</a>
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
                  AI for everything after code
                </p>
                <h1 className="mt-5 text-5xl font-semibold tracking-tight sm:text-6xl">
                  Your platform for the <span className="gradient-text">secure, observable</span> software lifecycle.
                </h1>
                <p className="mt-6 max-w-xl text-lg text-muted">
                  7C Labs brings DevSecOps, SRE and AI usage monitoring together, across your cloud
                  platforms, with security built into every step.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="#contact" className={primaryBtn}>Request a demo</a>
                  <a href="#secure-delivery" className={ghostBtn}>Explore products</a>
                </div>
              </div>
              <PipelineDemo />
            </div>
          </Wrap>
        </section>

        <EventTicker />

        <section className="border-t border-border" aria-label="Highlights">
          <Wrap>
            <dl className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
              {strip.map((s) => (
                <div key={s.k} className="bg-background py-8 pr-4">
                  <dt className="font-semibold">{s.k}</dt>
                  <dd className="mt-1 text-sm text-muted">{s.v}</dd>
                </div>
              ))}
            </dl>
          </Wrap>
        </section>

        <div id="platform" className="scroll-mt-14">
          {products.map((p, i) => (
            <section key={p.id} id={p.id} className="scroll-mt-14 border-t border-border py-24">
              <Wrap>
                <div className="grid items-center gap-12 lg:grid-cols-2">
                  <div className={i % 2 ? "lg:order-2" : ""}>
                    <Reveal>
                      <p className="font-mono text-sm text-accent">{p.eyebrow}</p>
                      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{p.name}</h2>
                      <p className="mt-4 text-lg text-muted">{p.value}</p>
                    </Reveal>
                    <ul className="mt-8 space-y-5">
                      {p.features.map((f, j) => (
                        <li key={f.title}>
                          <Reveal delay={j * 90}>
                            <h3 className="font-semibold">{f.title}</h3>
                            <p className="mt-1 text-muted">{f.text}</p>
                          </Reveal>
                        </li>
                      ))}
                    </ul>
                    <ul className="mt-8 flex flex-wrap gap-2">
                      {p.tags.map((t) => (
                        <li key={t} className="rounded-full border border-border px-3 py-1 text-xs text-muted">{t}</li>
                      ))}
                    </ul>
                  </div>
                  <Reveal delay={120} className={i % 2 ? "lg:order-1" : ""}>
                    <ProductMockup id={p.id} />
                  </Reveal>
                </div>
              </Wrap>
            </section>
          ))}
        </div>

        <section className="border-t border-border py-24">
          <Wrap>
            <Heading
              eyebrow="One connected platform"
              title="Every signal in one graph, so you can see the cause behind a risk or a cost."
              lede="Builds, deployments, scans, cloud spend and AI usage feed a shared view. That is what lets a recommendation point to the real change behind it."
            />
            <div className="mt-12"><SignalGraph /></div>
          </Wrap>
        </section>

        <section id="governance" className="scroll-mt-14 border-t border-border py-24">
          <Wrap>
            <Heading
              eyebrow="Risk and governance"
              title="AI recommends. You decide how much it can do."
              lede="Choose the level of autonomy for each workflow, and change it any time."
            />
            <ol className="mt-12 grid gap-4 md:grid-cols-3">
              {levels.map((l, i) => (
                <li key={l.level}>
                  <Reveal delay={i * 90}>
                    <div className="card-glow h-full rounded-xl border border-border bg-surface p-6">
                      <span className="font-mono text-sm text-accent">{l.level}</span>
                      <h3 className="mt-2 text-xl font-semibold">{l.name}</h3>
                      <p className="mt-2 text-muted">{l.text}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
            <dl className="mt-12 grid gap-8 md:grid-cols-3">
              {governance.map((g) => (
                <div key={g.title}>
                  <dt className="font-semibold">{g.title}</dt>
                  <dd className="mt-1 text-muted">{g.text}</dd>
                </div>
              ))}
            </dl>
          </Wrap>
        </section>

        <section id="services" className="scroll-mt-14 border-t border-border py-24">
          <Wrap>
            <Heading
              eyebrow="Services"
              title="Software is one half. Our engineers are the other."
              lede="Work with us at the depth that suits you, from a first assessment to running operations together."
            />
            <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((s, i) => (
                <li key={s.name}>
                  <Reveal delay={i * 90}>
                    <div className="card-glow h-full rounded-xl border border-border bg-surface p-6">
                      <span className="font-mono text-sm text-muted">0{i + 1}</span>
                      <h3 className="mt-2 text-xl font-semibold">{s.name}</h3>
                      <p className="mt-2 text-muted">{s.text}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </Wrap>
        </section>

        <section id="contact" className="scroll-mt-14 border-t border-border py-24">
          <Wrap>
            <Heading
              eyebrow="Get started"
              title="Tell us what you are building."
              lede="Request a demo or a first assessment. We will reply with how the platform would fit your delivery and operations."
            />
            <div className="mt-8 text-muted">
              Write to <a className="text-accent underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, or for
              general information <a className="text-accent underline" href={`mailto:${INFO_EMAIL}`}>{INFO_EMAIL}</a>.
            </div>
            <div className="mt-10"><ContactForm /></div>
          </Wrap>
        </section>
      </main>

      <footer className="border-t border-border py-10 text-sm text-muted">
        <Wrap>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {products.map((p) => (
              <a key={p.id} href={`#${p.id}`} className="hover:text-foreground">{p.name}</a>
            ))}
            <a href="#services" className="hover:text-foreground">Services</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </div>
          <p className="mt-6">&copy; {COMPANY}. All rights reserved.</p>
          <p className="mt-1">7clabs.com &middot; {CONTACT_EMAIL} &middot; {INFO_EMAIL}</p>
        </Wrap>
      </footer>
    </>
  );
}
