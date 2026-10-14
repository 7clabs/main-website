import { AutonomyDial } from "@/components/AutonomyDial";
import { OpenChatButton } from "@/components/ChatWidget";
import { FlowRibbon } from "@/components/FlowRibbon";
import { ProductDemo } from "@/components/ProductDemo";
import { Hairline, ScrollReveal } from "@/components/ScrollReveal";
import { JourneySection } from "@/components/JourneySection";
import { SiteFooter } from "@/components/SiteFooter";
import { SectionRail } from "@/components/SectionRail";
import { SiteHeader } from "@/components/SiteHeader";
import { aboutLines, aboutPillars, aboutVision, CONTACT_EMAIL, INFO_EMAIL, services } from "./content";

const primaryBtn = "rounded-md bg-foreground px-6 py-3 text-[length:var(--text-small)] font-medium text-background";
const ghostBtn = "rounded-md border border-border px-6 py-3 text-[length:var(--text-small)] font-medium hover:border-accent";

function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[var(--page-max)] px-[var(--gutter)]">{children}</div>;
}

function Title({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <ScrollReveal>
      <p className="label text-accent">{eyebrow}</p>
      <h2 className="mt-3 max-w-[22ch] text-[length:var(--text-h2)]">{children}</h2>
    </ScrollReveal>
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
          <Wrap>
            <div className="relative flex min-h-[calc(100svh-5rem)] flex-col justify-center gap-8 py-10 sm:py-14">
              <div>
                <p className="label w-fit rounded-full border border-border px-3 py-1 text-muted">
                  <span className="status-live text-ok" aria-hidden>&#9679; </span>
                  Build secure &middot; Run reliable &middot; Scale intelligent
                </p>
                <h1 className="mt-6 max-w-[16ch] text-[length:var(--text-display)]">
                  Your software lifecycle, run by <span className="gradient-text inline-block">AI agents you control.</span>
                </h1>
                <p className="mt-6 max-w-[40ch] text-[length:var(--text-body-lg)] text-muted">
                  Nine agents take you from architecture to observability, with security built in.
                  A person approves every step that matters.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="#journey" className={primaryBtn}>See it climb</a>
                  <OpenChatButton className={ghostBtn}>Ask 7C</OpenChatButton>
                </div>
              </div>
              <FlowRibbon />
            </div>
          </Wrap>
        </section>

        <div id="journey">
          <JourneySection />
        </div>

        <section id="products" className="scroll-mt-20 py-28 sm:py-36">
          <Wrap>
            <Title eyebrow="Product demo">Four products. One platform. See the agents work.</Title>
            <div className="mt-10"><ProductDemo /></div>
          </Wrap>
        </section>

        <section id="trust" className="scroll-mt-20 py-28 sm:py-36">
          <Wrap>
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-24">
              <Title eyebrow="Trust">AI proposes. You decide.</Title>
              <div><AutonomyDial /></div>
            </div>
          </Wrap>
        </section>

        <section id="services" className="scroll-mt-20 py-28 sm:py-36">
          <Wrap>
            <Title eyebrow="Services">Software, plus the people to land it.</Title>
            <div className="relative mt-12">
              {/* The timeline: a hairline that fills as you scroll down the four steps. */}
              <div aria-hidden className="absolute bottom-0 left-[0.3125rem] top-2 w-px bg-border" />
              <Hairline vertical scrubTo="services-steps" start="top 70%" end="bottom 60%" tone="bg-accent" className="absolute bottom-0 left-[0.3125rem] top-2 w-px" />
              <ol id="services-steps" className="relative">
                {services.map((s, i) => (
                  <li key={s.name} className="relative pb-10 pl-10 last:pb-0 sm:pl-14">
                    <span aria-hidden className="absolute left-0 top-2 h-[0.65rem] w-[0.65rem] rounded-full border border-accent bg-background" />
                    <ScrollReveal className="grid gap-2 sm:grid-cols-[7rem_16rem_1fr] sm:items-baseline sm:gap-8">
                      <span className="font-mono text-xs text-accent">0{i + 1}</span>
                      <h3 className="text-[length:var(--text-h3)]">{s.name}</h3>
                      <p className="max-w-3xl text-[length:var(--text-body-lg)] text-muted">{s.text}</p>
                    </ScrollReveal>
                  </li>
                ))}
              </ol>
            </div>
          </Wrap>
        </section>

        <section id="about" className="scroll-mt-20 py-28 sm:py-36">
          <Wrap>
            <Title eyebrow="About us">Built by platform engineers, for platform teams.</Title>
            <div className="mt-14 grid gap-16 lg:grid-cols-[1.6fr_1fr] lg:gap-28">
              <div className="space-y-5">
                {aboutLines.map((line, i) => (
                  <ScrollReveal key={line}>
                    <p className={i === 2 ? "text-2xl font-semibold sm:text-3xl" : "text-lg text-muted sm:text-xl"}>{line}</p>
                  </ScrollReveal>
                ))}
                <ScrollReveal>
                  <p className="pt-2 text-xl font-semibold sm:text-2xl">
                    <span className="font-mono text-sm text-accent">Our vision </span>
                    <span className="gradient-text">{aboutVision}</span>
                  </p>
                </ScrollReveal>
              </div>
              <ul>
                <li><Hairline /></li>
                {aboutPillars.map((p) => (
                  <li key={p.title}>
                    <ScrollReveal className="py-5">
                      <h3 className="font-semibold">{p.title}</h3>
                      <p className="mt-1 text-sm text-muted">{p.text}</p>
                    </ScrollReveal>
                    <Hairline />
                  </li>
                ))}
                <li>
                  <a href="/careers" className="inline-block pt-5 text-sm text-accent hover:underline">Join the team &rarr;</a>
                </li>
              </ul>
            </div>
          </Wrap>
        </section>

        <section id="contact" className="scroll-mt-20 py-28 sm:py-36">
          <Wrap>
            <Hairline className="mb-16 h-px w-full" />
            <div className="grid items-end gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-24">
              <Title eyebrow="Get started">Tell us what you are building.</Title>
              <div>
                <div className="flex flex-wrap gap-3">
                  <OpenChatButton className={primaryBtn}>Ask 7C</OpenChatButton>
                  <OpenChatButton tab="contact" className={ghostBtn}>Message the team</OpenChatButton>
                </div>
                <p className="mt-6 text-[length:var(--text-small)] text-muted">
                  <a className="hover:text-foreground" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                  {" · "}
                  <a className="hover:text-foreground" href={`mailto:${INFO_EMAIL}`}>{INFO_EMAIL}</a>
                </p>
              </div>
            </div>
          </Wrap>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
