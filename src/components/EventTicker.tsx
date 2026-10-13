const events = [
  { tone: "text-err", text: "anomaly detected  payments-api  p95 +340ms" },
  { tone: "text-ok", text: "auto-remediated  rollback to v2.14 in 12s" },
  { tone: "text-accent", text: "policy gate  build #482 passed 6/6 checks" },
  { tone: "text-warn", text: "cost alert  ml-inference +28% vs baseline" },
  { tone: "text-ok", text: "AI usage  support-assistant within SLO" },
  { tone: "text-accent", text: "canary  checkout-service 50% healthy" },
  { tone: "text-err", text: "data guardrail  sensitive field blocked in prompt" },
  { tone: "text-ok", text: "incident closed  timeline and fix recorded" },
];

export function EventTicker() {
  const items = [...events, ...events];
  return (
    <div className="relative overflow-hidden border-y border-border bg-surface/60 py-3 backdrop-blur" role="marquee" aria-label="Sample platform events">
      <div className="marquee flex w-max gap-10 font-mono text-xs">
        {items.map((e, i) => (
          <span key={i} className="flex items-center gap-2 whitespace-nowrap text-muted" aria-hidden={i >= events.length}>
            <span className={e.tone} aria-hidden>&#9679;</span>
            {e.text}
          </span>
        ))}
      </div>
    </div>
  );
}
