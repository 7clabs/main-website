import { AutonomyDial } from "@/components/AutonomyDial";
import { OpenChatButton } from "@/components/ChatWidget";
import { FlowRibbon } from "@/components/FlowRibbon";
import { Logo } from "@/components/Logo";
import { ProductCards } from "@/components/ProductCards";
import { Reveal } from "@/components/Reveal";
import { SdlcTree } from "@/components/SdlcTree";
import { COMPANY, CONTACT_EMAIL, INFO_EMAIL, services } from "./content";

const nav = [
  { href: "#journey", label: "Journey" },
  { href: "#products", label: "Products" },
  { href: "#trust", label: "Trust" },
  { href: "#services", label: "Services" },
];

const primaryBtn = "rounded-md bg-foreground px-5 py-2.5 font-medium text-background";
const ghostBtn = "rounded-md border border-border px-5 py-2.5 font-medium hover:border-accent";

function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-6">{children}</div>;
}

function Title({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <p className="font-mono text-sm text-accent">{eyebrow}</p>
      <h2 className="mt-1 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">{children}</h2>
    </Reveal>
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
            <nav aria-label="Primary" className="hidden gap-7 text-sm text-muted md:flex">
              {nav.map((n) => (
                <a key={n.href} href={n.href} className="hover:text-foreground">{n.label}</a>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <OpenChatButton className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background">Talk to us</OpenChatButton>
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
            <div className="relative flex min-h-[calc(100svh-3.5rem)] flex-col justify-center gap-8 py-10 sm:py-14">
              <div>
                <p className="w-fit rounded-full border border-border px-3 py-1 font-mono text-xs text-muted">
                  <span className="status-live text-ok" aria-hidden>&#9679; </span>
                  SDLC &middot; ADLC &middot; AI monitoring
                </p>
                <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
                  Your software lifecycle, run by <span className="gradient-text">AI agents you control.</span>
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-muted sm:text-xl">
                  Nine agents take you from architecture to observability, with security built in.
                  A person approves every step that matters.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="#journey" className={primaryBtn}>See it climb</a>
                  <OpenChatButton className={ghostBtn}>Ask 7C</OpenChatButton>
                </div>
              </div>
              <FlowRibbon />
            </div>
          </Wrap>
        </section>

        <SdlcTree />

        <section id="products" className="scroll-mt-14 border-t border-border py-20">
          <Wrap>
            <Title eyebrow="Products">Four products. One platform.</Title>
            <div className="mt-10"><ProductCards /></div>
          </Wrap>
        </section>

        <section id="trust" className="scroll-mt-14 border-t border-border py-20">
          <Wrap>
            <div className="mx-auto max-w-2xl text-center">
              <Title eyebrow="Trust">AI proposes. You decide.</Title>
              <div className="mt-10 text-left"><AutonomyDial /></div>
            </div>
          </Wrap>
        </section>

        <section id="services" className="scroll-mt-14 border-t border-border py-20">
          <Wrap>
            <Title eyebrow="Services">Software, plus the people to land it.</Title>
            <ol className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((s, i) => (
                <li key={s.name} className="border-t border-border pt-4">
                  <Reveal delay={i * 80}>
                    <span className="font-mono text-xs text-muted">0{i + 1}</span>
                    <h3 className="mt-1 text-lg font-semibold">{s.name}</h3>
                    <p className="mt-1 text-sm text-muted">{s.text}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </Wrap>
        </section>

        <section id="contact" className="scroll-mt-14 border-t border-border py-24">
          <Wrap>
            <div className="mx-auto max-w-2xl text-center">
              <Title eyebrow="Get started">Tell us what you are building.</Title>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <OpenChatButton className={primaryBtn}>Ask 7C</OpenChatButton>
                <OpenChatButton tab="contact" className={ghostBtn}>Message the team</OpenChatButton>
              </div>
              <p className="mt-6 text-sm text-muted">
                <a className="hover:text-foreground" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                {" · "}
                <a className="hover:text-foreground" href={`mailto:${INFO_EMAIL}`}>{INFO_EMAIL}</a>
              </p>
            </div>
          </Wrap>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted">
        &copy; {COMPANY} &middot; 7clabs.com
      </footer>
    </>
  );
}
