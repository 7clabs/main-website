import { graphInputs, graphOutputs } from "@/app/content";

function Node({ label }: { label: string }) {
  return (
    <li className="rounded-md border border-border bg-surface px-4 py-3 text-sm">{label}</li>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 80 12" className="hidden h-3 w-20 md:block" aria-hidden>
      <line x1="0" y1="6" x2="72" y2="6" stroke="var(--accent)" strokeWidth="2" strokeDasharray="6 6" className="flow" />
      <path d="M72 1 L80 6 L72 11 Z" fill="var(--accent)" />
    </svg>
  );
}

export function SignalGraph() {
  return (
    <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
      <ul className="grid gap-3">
        {graphInputs.map((n) => <Node key={n} label={n} />)}
      </ul>
      <Arrow />
      <div className="card-glow rounded-xl border border-accent/50 bg-accent/5 p-8 text-center">
        <p className="font-mono text-xs text-accent">7C Labs</p>
        <h3 className="mt-2 text-2xl font-semibold">Signal graph</h3>
        <p className="mt-2 text-muted">One shared view that links a change to its risk, its cost and its owner.</p>
      </div>
      <Arrow />
      <ul className="grid gap-3">
        {graphOutputs.map((n) => <Node key={n} label={n} />)}
      </ul>
    </div>
  );
}
