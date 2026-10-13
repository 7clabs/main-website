"use client";

import dynamic from "next/dynamic";

const STAGES = 9;

// The WebGL engine is only needed for the tree, so it loads after the first screen has painted.
const Tree = dynamic(() => import("./SdlcTree").then((m) => m.SdlcTree), {
  ssr: false,
  loading: () => (
    <section aria-label="Plan to production in nine stages" style={{ height: `${STAGES * 30 + 100}vh` }}>
      <div className="sticky top-20 flex h-[calc(100svh-5rem)] items-center justify-center font-mono text-sm text-muted">Loading the tree…</div>
    </section>
  ),
});

export function SdlcTreeLazy() {
  return <Tree />;
}
