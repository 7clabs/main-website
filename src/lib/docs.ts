import fs from "node:fs";
import path from "node:path";

// Knowledge base for the chatbot. Add or edit .md files in /content/docs; "## " headings split sections.
const DOCS_DIR = path.join(process.cwd(), "content", "docs");

export type Section = { doc: string; heading: string; text: string };

let cache: { all: string; sections: Section[] } | null = null;

export function loadDocs() {
  if (cache) return cache;
  const files = fs.existsSync(DOCS_DIR) ? fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith(".md")).sort() : [];
  const sections: Section[] = [];
  const parts: string[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(DOCS_DIR, file), "utf8").replace(/\r/g, "");
    parts.push(`<doc name="${file}">\n${raw.trim()}\n</doc>`);
    const doc = raw.match(/^# (.+)$/m)?.[1] ?? file;
    for (const block of raw.split(/^## /m).slice(1)) {
      const [heading, ...body] = block.split("\n");
      sections.push({ doc, heading: heading.trim(), text: body.join(" ").replace(/\s+/g, " ").trim() });
    }
  }
  cache = { all: parts.join("\n\n"), sections };
  return cache;
}

const STOP = new Set(
  "a an and are as at be by can do does for from how i in is it me my of on or our the this to what when where which who why with you your we us much many there tell about".split(" "),
);
const words = (s: string) =>
  s.toLowerCase().match(/[a-z0-9]+/g)?.filter((w) => !STOP.has(w) && w.length > 1).map((w) => w.replace(/(ing|es|s)$/, "")) ?? [];

/** Simple keyword search: rarer words count more, heading matches count double. */
export function searchDocs(query: string, limit = 2) {
  const { sections } = loadDocs();
  const q = [...new Set(words(query))];
  if (!q.length) return [];
  const df = new Map<string, number>();
  const docWords = sections.map((s) => {
    const set = new Set(words(`${s.heading} ${s.text}`));
    set.forEach((w) => df.set(w, (df.get(w) ?? 0) + 1));
    return { set, head: new Set(words(s.heading)) };
  });
  const ranked = sections
    .map((s, i) => {
      let score = 0;
      for (const w of q) {
        if (!docWords[i].set.has(w)) continue;
        const idf = Math.log(1 + sections.length / (df.get(w) ?? 1));
        score += idf * (docWords[i].head.has(w) ? 2 : 1);
      }
      return { ...s, score };
    })
    .filter((s) => s.score > 0.8)
    .sort((a, b) => b.score - a.score);
  // Only add further sections when they are nearly as relevant as the best one.
  return ranked.filter((s, i) => i === 0 || s.score >= ranked[0].score * 0.8).slice(0, limit);
}
