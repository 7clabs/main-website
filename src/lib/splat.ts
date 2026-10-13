/** Procedural paint splashes, drawn on a 2D canvas. Used behind the tree and across the page. */

export type Splat = {
  born: number;
  big: boolean;
  radii: number[];
  drops: { a: number; d: number; r: number }[];
  drips: { dx: number; len: number; w: number }[];
};

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function makeSplat(big: boolean, born: number): Splat {
  const rand = Math.random;
  return {
    born,
    big,
    radii: Array.from({ length: 14 }, () => 0.7 + rand() * 0.6),
    drops: Array.from({ length: big ? 18 : 8 }, () => ({ a: rand() * Math.PI * 2, d: 1.3 + rand() * (big ? 2.4 : 1.3), r: 1 + rand() * (big ? 4.5 : 3) })),
    drips: Array.from({ length: big ? 4 : 2 }, () => ({ dx: (rand() - 0.5) * 1.3, len: 1 + rand() * 2.2, w: 1 + rand() * 2 })),
  };
}

/**
 * Draws one splash centred on (x, y). `radius` is its final size in pixels, `age` is seconds since it
 * burst. It fades over `life` seconds down to `floor` (0 = disappears). Call with the canvas set to
 * additive ("lighter") blending for a glowing look.
 */
export function drawSplat(
  ctx: CanvasRenderingContext2D,
  s: Splat,
  x: number,
  y: number,
  radius: number,
  age: number,
  color: string,
  life: number,
  floor = 0,
  strength = 1,
) {
  const burst = easeOut(Math.min(1, age / 0.55));
  const alpha = Math.max(floor, 1 - age / life) * strength;
  if (alpha <= 0) return;
  const R = radius * burst;
  const unit = radius / 70;
  const n = s.radii.length;
  const pts = s.radii.map((rr, k) => ({
    x: x + Math.cos((k / n) * Math.PI * 2) * R * rr,
    y: y + Math.sin((k / n) * Math.PI * 2) * R * rr * 0.85,
  }));

  const blob = (shrink: number, fill: string) => {
    ctx.fillStyle = fill;
    const at = (k: number) => ({ x: x + (pts[k % n].x - x) * shrink, y: y + (pts[k % n].y - y) * shrink });
    const m0 = { x: (at(n - 1).x + at(0).x) / 2, y: (at(n - 1).y + at(0).y) / 2 };
    ctx.beginPath();
    ctx.moveTo(m0.x, m0.y);
    for (let k = 0; k < n; k++) {
      const p0 = at(k);
      const p1 = at(k + 1);
      ctx.quadraticCurveTo(p0.x, p0.y, (p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
    }
    ctx.fill();
  };
  blob(1, `rgba(${color},${0.2 * alpha})`);
  blob(0.55, `rgba(${color},${0.3 * alpha})`);

  const fall = age * age * 10 * unit;
  ctx.fillStyle = `rgba(${color},${0.55 * alpha})`;
  for (const d of s.drops) {
    ctx.beginPath();
    ctx.arc(x + Math.cos(d.a) * R * d.d, y + Math.sin(d.a) * R * d.d * 0.85 + fall, Math.max(0.6, d.r * burst * unit * 1.4), 0, Math.PI * 2);
    ctx.fill();
  }

  const grow = Math.min(1, age / 2.2);
  ctx.lineCap = "round";
  for (const d of s.drips) {
    const dx = x + d.dx * R * 0.5;
    const y0 = y + R * 0.55;
    const y1 = y0 + d.len * R * 0.3 * grow;
    ctx.strokeStyle = `rgba(${color},${0.4 * alpha})`;
    ctx.lineWidth = Math.max(1, d.w * unit * 1.6);
    ctx.beginPath();
    ctx.moveTo(dx, y0);
    ctx.lineTo(dx, y1);
    ctx.stroke();
    ctx.fillStyle = `rgba(${color},${0.5 * alpha})`;
    ctx.beginPath();
    ctx.arc(dx, y1, Math.max(1, d.w * unit * 1.4), 0, Math.PI * 2);
    ctx.fill();
  }
}
