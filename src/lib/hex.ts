/**
 * Hexagonal "technical option" nodes drawn on a 2D canvas: small honeycomb clusters, each hexagon
 * carrying a DevSecOps / cloud / platform-engineering label. Used on the page background and next
 * to the tree's stages.
 */

export const TECH = [
  "K8s", "IaC", "CI/CD", "SBOM", "SAST", "DAST", "OPA", "SLO", "IAM", "VPC", "Helm", "GitOps",
  "mTLS", "KMS", "eBPF", "OTel", "Trivy", "Falco", "Argo", "Vault", "WAF", "SIEM", "FinOps", "RBAC",
];

export type HexCluster = {
  born: number;
  big: boolean;
  cells: { q: number; r: number; label: string }[];
};

// Axial offsets that always form a connected honeycomb, in the order they are filled.
const SHAPE: [number, number][] = [[0, 0], [1, 0], [0, 1], [-1, 1], [1, -1], [-1, 0], [0, -1]];
const SQ3 = Math.sqrt(3);
const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

export function makeHexCluster(big: boolean, born: number, labels?: string[]): HexCluster {
  const pool = [...TECH].sort(() => Math.random() - 0.5);
  const n = labels ? labels.length : big ? 5 : 3;
  return {
    born,
    big,
    cells: SHAPE.slice(0, n).map(([q, r], i) => ({ q, r, label: labels?.[i] ?? pool[i] })),
  };
}

/** Traces a flat-top hexagon of radius r centred on (x, y). */
export function hexPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k;
    const px = x + r * Math.cos(a);
    const py = y + r * Math.sin(a);
    if (k) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
}

/**
 * Draws the cluster centred on (cx, cy). `size` is the hexagon radius in pixels, `age` is seconds
 * since it started, and it fades over `life` seconds down to `floor` (0 = gone). `rgb` is "r,g,b".
 */
export function drawHexCluster(
  ctx: CanvasRenderingContext2D,
  c: HexCluster,
  cx: number,
  cy: number,
  size: number,
  age: number,
  rgb: string,
  life: number,
  dark: boolean,
  floor = 0,
  strength = 1,
) {
  const fade = Math.max(floor, Math.min(1, (life - age) / 1.2)) * strength;
  if (fade <= 0) return;
  const pos = c.cells.map((k) => ({ x: size * 1.5 * k.q, y: size * SQ3 * (k.r + k.q / 2) }));
  const mx = pos.reduce((s, p) => s + p.x, 0) / pos.length;
  const my = pos.reduce((s, p) => s + p.y, 0) / pos.length;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  c.cells.forEach((cell, i) => {
    const s = ease((age - 0.16 * i) / 0.5);
    if (s <= 0) return;
    const x = cx + pos[i].x - mx;
    const y = cy + pos[i].y - my;
    const r = size * (0.88 + 0.12 * s) * 0.94;
    const a = fade * s;
    hexPath(ctx, x, y, r);
    ctx.fillStyle = dark ? `rgba(${rgb},${0.15 * a})` : `rgba(255,255,255,${0.92 * a})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${rgb},${0.9 * a})`;
    ctx.lineWidth = Math.max(1, size / 14);
    ctx.stroke();
    // A small vertex marker, like a port on a device.
    ctx.fillStyle = `rgba(${rgb},${a})`;
    ctx.beginPath();
    ctx.arc(x + r, y, Math.max(1.4, size / 11), 0, Math.PI * 2);
    ctx.fill();
    const len = Math.max(2, cell.label.length);
    ctx.font = `${Math.round(Math.min(size * 0.52, (size * 1.55) / (len * 0.6)))}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.fillStyle = `rgba(${rgb},${a})`;
    ctx.fillText(cell.label, x, y + 0.5);
  });
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}
