"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

/** The current theme lives on <html data-theme>. A small inline script in layout.tsx sets it before first paint. */
export function getTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => "dark");
}

export function setTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem("theme", t);
  } catch {
    /* storage can be blocked; the choice then lasts for this visit only */
  }
}
