"use client";

import { useEffect, useState } from "react";

const stages = [
  { name: "Plan", lines: ["threat-model.yaml  ok", "SLO defined: availability 99.9%"] },
  { name: "Build", lines: ["secrets scan        0 findings", "dependencies        2 updates queued"] },
  { name: "Verify", lines: ["tests              214 passed", "policy gate         passed"] },
  { name: "Ship", lines: ["artifact signed    ok", "canary 10% -> 50% -> 100%"] },
  { name: "Operate", lines: ["error budget       82% remaining", "runbook linked to alerts"] },
  { name: "Observe", lines: ["AI usage           tracked per team", "cost anomaly        none"] },
];

export function PipelineDemo() {
  const [stage, setStage] = useState(0);
  const [chars, setChars] = useState(0);

  const text = stages[stage].lines.join("\n");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (chars < text.length) {
      const t = setTimeout(() => setChars(reduced ? text.length : chars + 1), reduced ? 0 : 28);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setStage((s) => (s + 1) % stages.length);
      setChars(0);
    }, 1400);
    return () => clearTimeout(t);
  }, [chars, text]);

  return (
    <div className="rounded-xl border border-border bg-surface shadow-2xl shadow-accent/5">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-err/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-warn/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-ok/80" />
        <span className="ml-3 font-mono text-xs text-muted">7clabs pipeline</span>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
        {stages.map((s, i) => (
          <span
            key={s.name}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              i === stage
                ? "border-accent bg-accent/10 text-accent"
                : i < stage
                  ? "border-ok/40 text-ok"
                  : "border-border text-muted"
            }`}
          >
            {i < stage ? "✓ " : ""}
            {s.name}
          </span>
        ))}
      </div>
      <pre
        className="cursor min-h-28 whitespace-pre-wrap p-4 font-mono text-sm text-foreground"
        aria-live="off"
      >
        {text.slice(0, chars)}
      </pre>
    </div>
  );
}
