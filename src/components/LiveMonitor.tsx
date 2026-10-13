"use client";

import { useEffect, useState } from "react";

type Row = { service: string; model: string; requests: number; p95: number; cost: number };

const initial: Row[] = [
  { service: "support-assistant", model: "Model A", requests: 12480, p95: 1.8, cost: 41.2 },
  { service: "code-review-bot", model: "Model B", requests: 3902, p95: 3.1, cost: 18.75 },
  { service: "doc-summariser", model: "Model A", requests: 7115, p95: 1.2, cost: 12.4 },
  { service: "ops-copilot", model: "Model C", requests: 960, p95: 4.4, cost: 9.05 },
];

const SLO = 4; // seconds, p95

function status(p95: number) {
  if (p95 > SLO) return { label: "Breaching", cls: "text-err" };
  if (p95 > SLO * 0.75) return { label: "Degraded", cls: "text-warn" };
  return { label: "Healthy", cls: "text-ok" };
}

export function LiveMonitor() {
  const [rows, setRows] = useState(initial);
  const [history, setHistory] = useState<number[]>(() => Array(24).fill(0).map((_, i) => 30 + ((i * 7) % 14)));

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setRows((rs) =>
        rs.map((r) => {
          const reqs = Math.floor(Math.random() * 40) + 5;
          const p95 = Math.min(6, Math.max(0.8, r.p95 + (Math.random() - 0.5) * 0.7));
          return { ...r, requests: r.requests + reqs, p95, cost: r.cost + reqs * 0.0032 };
        }),
      );
      setHistory((h) => [...h.slice(1), 25 + Math.random() * 30]);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const total = rows.reduce((a, r) => a + r.cost, 0);
  const reqs = rows.reduce((a, r) => a + r.requests, 0);
  const max = Math.max(...history);
  const points = history.map((v, i) => `${(i / (history.length - 1)) * 100},${40 - (v / max) * 36}`).join(" ");

  return (
    <figure>
      <div className="rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-3 gap-px border-b border-border bg-border text-sm">
          <div className="bg-surface p-4">
            <p className="text-muted">Requests</p>
            <p className="tabular mt-1 text-2xl font-semibold">{reqs.toLocaleString("en-US")}</p>
          </div>
          <div className="bg-surface p-4">
            <p className="text-muted">Spend</p>
            <p className="tabular mt-1 text-2xl font-semibold">${total.toFixed(2)}</p>
          </div>
          <div className="bg-surface p-4">
            <p className="text-muted">Live</p>
            <svg viewBox="0 0 100 40" className="mt-2 h-8 w-full" role="img" aria-label="Request rate over the last 24 intervals">
              <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tabular w-full min-w-[34rem] text-left text-sm">
            <caption className="sr-only">Example AI usage by service</caption>
            <thead className="border-b border-border text-muted">
              <tr>
                <th scope="col" className="p-3 font-medium">Service</th>
                <th scope="col" className="p-3 font-medium">Model</th>
                <th scope="col" className="p-3 text-right font-medium">Requests</th>
                <th scope="col" className="p-3 text-right font-medium">p95 (SLO {SLO}s)</th>
                <th scope="col" className="p-3 text-right font-medium">Cost</th>
                <th scope="col" className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const s = status(r.p95);
                return (
                  <tr key={r.service} className="border-b border-border last:border-0">
                    <td className="p-3 font-mono">{r.service}</td>
                    <td className="p-3">{r.model}</td>
                    <td className="p-3 text-right">{r.requests.toLocaleString("en-US")}</td>
                    <td className="p-3 text-right">{r.p95.toFixed(1)} s</td>
                    <td className="p-3 text-right">${r.cost.toFixed(2)}</td>
                    <td className={`p-3 ${s.cls}`}>
                      <span aria-hidden className="status-live">&#9679; </span>
                      {s.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-muted">
        Simulated data for illustration, not customer figures.
      </figcaption>
    </figure>
  );
}
