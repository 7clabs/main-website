import { AutonomyDial } from "@/components/AutonomyDial";
import { OpenChatButton } from "@/components/ChatWidget";
import { FlowRibbon } from "@/components/FlowRibbon";
import { ProductDemo } from "@/components/ProductDemo";
import { Reveal } from "@/components/Reveal";
import { SdlcTreeLazy } from "@/components/SdlcTreeLazy";
import { SiteFooter } from "@/components/SiteFooter";
import { SectionRail } from "@/components/SectionRail";
import { SiteHeader } from "@/components/SiteHeader";
import { aboutLines, aboutPillars, aboutVision, CONTACT_EMAIL, INFO_EMAIL, services } from "./content";

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

      <SiteHeader />
      <SectionRail />

      <main id="main">
        <section id="top" className="relative">
          <div className="hero-bg" aria-hidden />
          <Wrap>
            <div className="relative flex min-h-[calc(100svh-5rem)] flex-col justify-center gap-8 py-10 sm:py-14">
              <div>
                <p className="w-fit rounded-full border border-border px-3 py-1 font-mono text-xs text-muted">
                  <span className="status-live text-ok" aria-hidden>&#9679; </span>
                  Build secure &middot; Run reliable &middot; Scale intelligent
                </p>
                <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
                  Your software lifecycle, run by <span className="gradient-text inline-block">AI agents you control.</span>
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

        <div id="journey">
          <SdlcTreeLazy />
        </div>

        <section id="products" className="scroll-mt-20 py-20">
          <Wrap>
            <Title eyebrow="Product demo">Four products. One platform. See the agents work.</Title>
            <div className="mt-10"><ProductDemo /></div>
          </Wrap>
        </section>

        <section id="trust" className="scroll-mt-20 py-20">
          <Wrap>
            <div className="mx-auto max-w-2xl text-center">
              <Title eyebrow="Trust">AI proposes. You decide.</Title>
              <div className="mt-10 text-left"><AutonomyDial /></div>
            </div>
          </Wrap>
        </section>

        <section id="services" className="scroll-mt-20 py-20">
          <Wrap>
            <Title eyebrow="Services">Software, plus the people to land it.</Title>
            <ol className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((s, i) => (
                <li key={s.name}>
                  <Reveal delay={i * 80}>
                    <span className="font-mono text-xs text-accent">0{i + 1}</span>
                    <h3 className="mt-1 text-lg font-semibold">{s.name}</h3>
                    <p className="mt-1 text-sm text-muted">{s.text}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </Wrap>
        </section>

        <section id="about" className="scroll-mt-20 py-24">
          <Wrap>
            <Title eyebrow="About us">Built by platform engineers, for platform teams.</Title>
            <div className="mt-12 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
              <div className="space-y-5">
                {aboutLines.map((line, i) => (
                  <Reveal key={line} delay={i * 120}>
                    <p className={i === 2 ? "text-2xl font-semibold sm:text-3xl" : "text-lg text-muted sm:text-xl"}>{line}</p>
                  </Reveal>
                ))}
                <Reveal delay={600}>
                  <p className="pt-2 text-xl font-semibold sm:text-2xl">
                    <span className="font-mono text-sm text-accent">Our vision </span>
                    <span className="gradient-text">{aboutVision}</span>
                  </p>
                </Reveal>
              </div>
              <ul className="space-y-4">
                {aboutPillars.map((p, i) => (
                  <li key={p.title}>
                    <Reveal delay={i * 120}>
                      <div className="card-glow rounded-2xl border border-border bg-surface/80 p-5 backdrop-blur">
                        <h3 className="font-semibold">{p.title}</h3>
                        <p className="mt-1 text-sm text-muted">{p.text}</p>
                      </div>
                    </Reveal>
                  </li>
                ))}
                <li>
                  <a href="/careers" className="inline-block pt-1 text-sm text-accent hover:underline">Join the team &rarr;</a>
                </li>
              </ul>
            </div>
          </Wrap>
        </section>

        <section id="contact" className="scroll-mt-20 py-24">
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

      <SiteFooter />
    </>
  );
}
