/**
 * Best-effort, per-instance throttle. Serverless instances do not share memory,
 * so this slows abuse down but is not a hard guarantee.
 */
export function createLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return function limited(key: string) {
    const now = Date.now();
    // Drop stale keys so the map cannot grow without bound on a long-lived instance.
    if (hits.size > 1000) {
      for (const [k, times] of hits) if (now - times[times.length - 1] >= windowMs) hits.delete(k);
    }
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(key, recent);
    return recent.length > max;
  };
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
