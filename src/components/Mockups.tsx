"use client";

import { useEffect, useState } from "react";
import { LiveMonitor } from "./LiveMonitor";

/** Steps 0..length-1 on an interval; jumps to the final state for reduced motion. */
function useTick(ms: number, length: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = setTimeout(() => setT(length - 1), 0);
      return () => clearTimeout(id);
    }
    const id = setInterval(() => setT((x) => (x + 1) % length), ms);
    return () => clearInterval(id);
  }, [ms, length]);
  return t;
}

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-2xl shadow-accent/5">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-err/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-warn/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-ok/80" />
        <span className="ml-3 font-mono text-xs text-muted">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const checks = ["Secrets scan", "Dependency audit", "Code analysis", "Container scan", "Policy gate", "Sign artifact"];

function SecureMockup() {
  const t = useTick(900, checks.length + 3);
  return (
    <Frame title="secure-delivery / build #482">
      <ul className="space-y-2 font-mono text-sm">
        {checks.map((c, i) => {
          const done = i < t;
          const running = i === t;
          return (
            <li key={c} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <span>{c}</span>
              <span className={done ? "text-ok" : running ? "status-live text-accent" : "text-muted"}>
                {done ? "✓ Passed" : running ? "● Running" : "Queued"}
              </span>
            </li>
          );
        })}
      </ul>
    </Frame>
  );
}

const steps = [10, 50, 100];

function ResilienceMockup() {
  const t = useTick(1400, steps.length + 1);
  const pct = t === 0 ? 0 : steps[Math.min(t, steps.length) - 1];
  const budget = 82 - t * 3;
  return (
    <Frame title="resilience / checkout-service">
      <p className="text-sm text-muted">Canary rollout</p>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Canary traffic">
        <div className="bar h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <p className="tabular mt-2 text-sm">{pct}% of traffic on new version</p>

      <p className="mt-6 text-sm text-muted">Error budget remaining (SLO 99.9%)</p>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={budget} aria-valuemin={0} aria-valuemax={100} aria-label="Error budget remaining">
        <div className="bar h-full rounded-full bg-ok" style={{ width: `${budget}%` }} />
      </div>
      <p className="tabular mt-2 text-sm">{budget}% remaining</p>

      <p className="mt-6 rounded-md border border-border px-3 py-2 font-mono text-sm text-ok">
        ✓ Automatic rollback armed
      </p>
    </Frame>
  );
}

const costBase = [
  { name: "payments-api", v: 62 },
  { name: "ml-inference", v: 48 },
  { name: "data-pipeline", v: 35 },
  { name: "web-frontend", v: 22 },
];

function CloudMockup() {
  const t = useTick(1600, 6);
  return (
    <Frame title="cloudops / spend by service">
      <ul className="space-y-4">
        {costBase.map((c, i) => {
          const spike = i === 1 && t >= 3;
          const v = Math.min(100, c.v + ((t * (i + 3)) % 9) + (spike ? 28 : 0));
          return (
            <li key={c.name}>
              <div className="flex justify-between text-sm">
                <span className="font-mono">{c.name}</span>
                <span className={spike ? "text-err" : "text-muted"}>{spike ? "▲ Anomaly" : "Normal"}</span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-border">
                <div className={`bar h-full rounded-full ${spike ? "bg-err" : "bg-accent"}`} style={{ width: `${v}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 text-sm text-muted">Illustrative sample data.</p>
    </Frame>
  );
}

export function ProductMockup({ id }: { id: string }) {
  switch (id) {
    case "secure-delivery":
      return <SecureMockup />;
    case "resilience":
      return <ResilienceMockup />;
    case "ai-monitor":
      return <LiveMonitor />;
    default:
      return <CloudMockup />;
  }
}
