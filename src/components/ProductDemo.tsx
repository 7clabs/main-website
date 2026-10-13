"use client";

import { useEffect, useRef, useState } from "react";
import { demos, products } from "@/app/content";
import { OPEN_CHAT_EVENT } from "./ChatWidget";

const MOTION = "(prefers-reduced-motion: reduce)";

/** Steps 0..length-1 on an interval; jumps to the final state for reduced motion. */
function useTick(ms: number, length: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (window.matchMedia(MOTION).matches) {
      const id = setTimeout(() => setT(length - 1), 0);
      return () => clearTimeout(id);
    }
    const id = setInterval(() => setT((x) => (x + 1) % length), ms);
    return () => clearInterval(id);
  }, [ms, length]);
  return t;
}

/** Types the text out one character at a time (all at once for reduced motion). */
function useTyped(text: string, startDelay: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia(MOTION).matches) {
      const id = setTimeout(() => setN(text.length), 0);
      return () => clearTimeout(id);
    }
    let i = 0;
    let iv: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      iv = setInterval(() => {
        i += 2;
        setN(Math.min(text.length, i));
        if (i >= text.length && iv) clearInterval(iv);
      }, 24);
    }, startDelay);
    return () => {
      clearTimeout(start);
      if (iv) clearInterval(iv);
    };
  }, [text, startDelay]);
  return text.slice(0, n);
}

const glyphs: Record<string, React.ReactNode> = {
  "secure-delivery": (
    <>
      <path d="M12 2 L21 6 V12 C21 17 17 20.5 12 22 C7 20.5 3 17 3 12 V6 Z" />
      <polyline points="8,12 11,15 16,9" />
    </>
  ),
  resilience: <polyline points="2,13 7,13 10,5 14,20 17,10 19,13 22,13" />,
  "ai-monitor": (
    <>
      <rect x="4" y="13" width="4" height="8" />
      <rect x="10" y="7" width="4" height="14" />
      <rect x="16" y="10" width="4" height="11" />
    </>
  ),
  cloudops: <path d="M7 19 C3 19 3 12 8 12 C8.5 6 17 5.5 17.5 12 C22 12 22 19 17 19 Z" />,
};

function Frame({ file, badge, color, children }: { file: string; badge: string; color: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_60px_-30px_rgba(var(--rgb-accent),0.45)]">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-err/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-ok/70" />
          <span className="ml-3 font-mono text-xs text-muted">{file}</span>
        </div>
        <span className="rounded-full border px-2.5 py-0.5 font-mono text-[11px]" style={{ borderColor: `rgba(${color},0.5)`, color: `rgb(${color})` }}>
          {badge}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const checks = ["Secrets scan", "Dependency audit", "Code analysis", "Container scan", "Policy gate", "Sign artifact"];
const logs = [
  "14:30:22  pipeline triggered by merge to main (#1847)",
  "14:30:41  secrets scan: 0 findings",
  "14:30:55  dependency audit: 2 updates queued",
  "14:31:12  container image scanned: 0 critical",
  "14:31:30  policy gate: passed 6/6",
  "14:31:44  artifact signed, SBOM attached",
];

function DeliveryMock({ color }: { color: string }) {
  const t = useTick(900, checks.length + 3);
  return (
    <Frame file="pipeline / checkout-api" badge={`build #482 · ${Math.min(t, 6)}/6 gates`} color={color}>
      <ul className="grid gap-2 sm:grid-cols-2">
        {checks.map((c, i) => {
          const done = i < t;
          const running = i === t;
          return (
            <li key={c} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
              <span>{c}</span>
              <span className={`font-mono text-xs ${done ? "text-ok" : running ? "status-live text-accent" : "text-muted"}`}>
                {done ? "✓ passed" : running ? "● running" : "queued"}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 rounded-lg border border-border bg-background/60 p-3 font-mono text-xs leading-6 text-muted">
        {logs.slice(0, Math.max(1, t + 1)).map((l) => (
          <p key={l} className="fade-in">
            <span className="text-accent">→</span> {l}
          </p>
        ))}
      </div>
    </Frame>
  );
}

function ResilienceMock({ color }: { color: string }) {
  const t = useTick(1400, 4);
  const pct = [10, 25, 50, 50][t];
  const budget = 82 - t;
  const series = [212, 205, 219, 208, 214, 203, 212].map((v, i) => v + ((t + i) % 3) * 4);
  const max = 320;
  const pts = series.map((v, i) => `${(i / (series.length - 1)) * 100},${34 - (v / max) * 30}`).join(" ");
  return (
    <Frame file="slo / checkout-api" badge="rollback armed" color={color}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="font-mono text-xs text-muted">CANARY TRAFFIC</p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Canary traffic">
            <div className="bar h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
          <p className="tabular mt-1.5 text-sm">{pct}% on the new version</p>
          <p className="mt-5 font-mono text-xs text-muted">ERROR BUDGET (SLO 99.9%)</p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={budget} aria-valuemin={0} aria-valuemax={100} aria-label="Error budget remaining">
            <div className="bar h-full rounded-full bg-ok" style={{ width: `${budget}%` }} />
          </div>
          <p className="tabular mt-1.5 text-sm">{budget}% remaining</p>
        </div>
        <div>
          <p className="font-mono text-xs text-muted">P95 LATENCY (OBJECTIVE 300 MS)</p>
          <svg viewBox="0 0 100 40" className="mt-2 h-24 w-full" role="img" aria-label="p95 latency over time">
            <line x1="0" y1={34 - (300 / max) * 30} x2="100" y2={34 - (300 / max) * 30} stroke="var(--err)" strokeWidth="0.6" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
            <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
          </svg>
          <p className="tabular text-sm">{series[series.length - 1]} ms now</p>
        </div>
      </div>
      <p className="mt-5 rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-xs text-ok">✓ Automatic rollback armed, fires within 30 s of a breach</p>
    </Frame>
  );
}

const aiRows = [
  { svc: "support-assistant", model: "Model A", req: 12480, p95: 1.8, cost: 41.2 },
  { svc: "code-review-bot", model: "Model B", req: 3902, p95: 3.1, cost: 18.75 },
  { svc: "doc-summariser", model: "Model A", req: 7115, p95: 1.2, cost: 12.4 },
  { svc: "ops-copilot", model: "Model C", req: 960, p95: 4.4, cost: 9.05 },
];

function AiMock({ color }: { color: string }) {
  const t = useTick(1400, 40);
  const rows = aiRows.map((r, i) => ({ ...r, req: r.req + t * (i + 3) * 7, cost: r.cost + t * (i + 2) * 0.03, p95: Math.max(0.8, r.p95 + Math.sin(t / 2 + i) * 0.35) }));
  const total = rows.reduce((s, r) => s + r.cost, 0);
  const req = rows.reduce((s, r) => s + r.req, 0);
  const state = (p: number) => (p > 4 ? { l: "Breaching", c: "text-err" } : p > 3 ? { l: "Degraded", c: "text-warn" } : { l: "Healthy", c: "text-ok" });
  return (
    <Frame file="ai-usage / this week" badge="1 prompt blocked" color={color}>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-border p-3">
          <p className="font-mono text-xs text-muted">REQUESTS</p>
          <p className="tabular mt-1 text-2xl font-semibold">{req.toLocaleString("en-US")}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="font-mono text-xs text-muted">SPEND</p>
          <p className="tabular mt-1 text-2xl font-semibold">${total.toFixed(2)}</p>
        </div>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="tabular w-full min-w-[26rem] text-left text-sm">
          <caption className="sr-only">AI usage by service</caption>
          <thead className="text-muted">
            <tr>
              <th scope="col" className="py-2 pr-3 font-medium">Service</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Requests</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">p95</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Cost</th>
              <th scope="col" className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const s = state(r.p95);
              return (
                <tr key={r.svc} className="border-t border-border">
                  <td className="py-2 pr-3 font-mono text-xs">{r.svc}</td>
                  <td className="py-2 pr-3 text-right">{r.req.toLocaleString("en-US")}</td>
                  <td className="py-2 pr-3 text-right">{r.p95.toFixed(1)} s</td>
                  <td className="py-2 pr-3 text-right">${r.cost.toFixed(2)}</td>
                  <td className={`py-2 ${s.c}`}>● {s.l}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Frame>
  );
}

const costBase = [
  { name: "payments-api", v: 62 },
  { name: "ml-inference", v: 48 },
  { name: "data-pipeline", v: 35 },
  { name: "web-frontend", v: 22 },
];

function CloudMock({ color }: { color: string }) {
  const t = useTick(1600, 6);
  return (
    <Frame file="plan / eu-west" badge="awaiting approval" color={color}>
      <div className="grid gap-6 sm:grid-cols-[1.3fr_1fr]">
        <ul className="space-y-4">
          {costBase.map((c, i) => {
            const spike = i === 1 && t >= 3;
            const v = Math.min(100, c.v + ((t * (i + 3)) % 9) + (spike ? 28 : 0));
            return (
              <li key={c.name}>
                <div className="flex justify-between text-sm">
                  <span className="font-mono text-xs">{c.name}</span>
                  <span className={`font-mono text-xs ${spike ? "text-err" : "text-muted"}`}>{spike ? "▲ anomaly" : "normal"}</span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-border">
                  <div className={`bar h-full rounded-full ${spike ? "bg-err" : "bg-accent"}`} style={{ width: `${v}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <div className="rounded-lg border border-border bg-background/60 p-3 font-mono text-xs leading-6">
          <p className="text-muted">terraform plan</p>
          <p className="text-ok">+ 23 to add</p>
          <p className="text-warn">~ 2 to change</p>
          <p className="text-muted">- 0 to destroy</p>
          <p className="mt-2 text-foreground">est. $4,820 / month</p>
        </div>
      </div>
    </Frame>
  );
}

const mocks: Record<string, (p: { color: string }) => React.ReactNode> = {
  "secure-delivery": (p) => <DeliveryMock {...p} />,
  resilience: (p) => <ResilienceMock {...p} />,
  "ai-monitor": (p) => <AiMock {...p} />,
  cloudops: (p) => <CloudMock {...p} />,
};

/** The agent's side of the conversation: the question, a short "thinking" pause, then a typed answer. */
function AgentCard({ id, color }: { id: string; color: string }) {
  const d = demos[id];
  const answer = d.answer.join("\n");
  const typed = useTyped(answer, 1100);
  const lines = typed.split("\n");
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[0_20px_60px_-30px_rgba(var(--rgb-accent),0.35)]">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-mono text-xs text-muted">
          <span className="status-live text-ok" aria-hidden>&#9679;</span> 7C agent
        </p>
        <p className="font-mono text-[11px] text-muted">illustrative demo</p>
      </div>
      <p className="ml-auto mt-4 w-fit max-w-[90%] rounded-2xl rounded-br-sm bg-background px-4 py-2.5 text-sm ring-1 ring-border">{d.prompt}</p>
      <p className="mt-4 flex items-center gap-2 text-sm text-muted">
        <span aria-hidden className="font-mono text-xs" style={{ color: `rgb(${color})` }}>&#9656;</span>
        Thought for {d.thought} seconds
      </p>
      <div className="mt-3 min-h-40 space-y-2 text-[0.95rem] leading-relaxed" aria-live="polite">
        {lines.map((l, i) => (
          <p key={i} className="flex gap-2">
            <span aria-hidden className="mt-0.5 text-xs" style={{ color: `rgb(${color})` }}>&#10003;</span>
            <span className="min-w-0 break-words">{l}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

/** Product demo tabs: pick a product to watch its agent answer a question beside a live view. */
export function ProductDemo() {
  const [tab, setTab] = useState(0);
  const [auto, setAuto] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const p = products[tab];
  const d = demos[p.id];

  useEffect(() => {
    if (!auto || window.matchMedia(MOTION).matches) return;
    const id = setInterval(() => setTab((x) => (x + 1) % products.length), 14000);
    return () => clearInterval(id);
  }, [auto]);

  function pick(i: number) {
    setAuto(false);
    setTab(i);
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (tab + (e.key === "ArrowRight" ? 1 : products.length - 1)) % products.length;
    pick(next);
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  return (
    <div>
      <div ref={listRef} role="tablist" aria-label="Products" onKeyDown={onKey} className="flex gap-1 overflow-x-auto border-b border-border">
        {products.map((pr, i) => (
          <button
            key={pr.id}
            role="tab"
            id={`tab-${pr.id}`}
            aria-selected={i === tab}
            aria-controls={`panel-${pr.id}`}
            tabIndex={i === tab ? 0 : -1}
            onClick={() => pick(i)}
            className={`relative flex shrink-0 items-center gap-2 px-4 py-3 text-base font-medium transition-colors ${i === tab ? "text-foreground" : "text-muted hover:text-foreground"}`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={`rgb(${pr.color})`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {glyphs[pr.id]}
            </svg>
            {pr.name}
            <span
              aria-hidden
              className="absolute inset-x-3 -bottom-px h-0.5 origin-left rounded-full transition-transform duration-300"
              style={{ background: `rgb(${pr.color})`, transform: i === tab ? "scaleX(1)" : "scaleX(0)" }}
            />
          </button>
        ))}
      </div>

      <div key={p.id} role="tabpanel" id={`panel-${p.id}`} aria-labelledby={`tab-${p.id}`} className="fade-in">
        <p className="mt-6 max-w-2xl text-lg text-muted">{p.line}</p>
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[0.9fr_1.4fr]">
          <AgentCard id={p.id} color={p.color} />
          {mocks[p.id]({ color: p.color })}
        </div>

        <ul className="mt-10 grid gap-8 md:grid-cols-3">
          {d.features.map((f) => (
            <li key={f.title}>
              <h3 className="text-lg font-semibold" style={{ borderLeft: `3px solid rgb(${p.color})`, paddingLeft: "0.75rem" }}>{f.title}</h3>
              <p className="mt-2 text-muted">{f.text}</p>
            </li>
          ))}
        </ul>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT, { detail: "chat" }))}
          className="mt-8 text-base font-medium text-accent hover:underline"
        >
          Ask 7C about {p.name} &rarr;
        </button>
      </div>
    </div>
  );
}
