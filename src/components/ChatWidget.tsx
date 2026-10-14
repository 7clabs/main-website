"use client";

import { useEffect, useRef, useState } from "react";
import { CONTACT_EMAIL } from "@/app/content";
import { ContactForm } from "./ContactForm";

type Msg = { role: "user" | "assistant"; content: string };

export const OPEN_CHAT_EVENT = "open-chat";

const GREETING: Msg = {
  role: "assistant",
  content: "Hi, I'm the 7C Labs assistant. Ask me about our products, the SDLC lifecycle, AI agents, services or how to get started.",
};

const SUGGESTIONS = [
  "What does 7C Labs do?",
  "How do AI agents and approvals work?",
  "Which clouds do you support?",
  "How do I get started?",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "contact">("chat");
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const show = (e: Event) => {
      setOpen(true);
      setTab((e as CustomEvent<string>).detail === "contact" ? "contact" : "chat");
    };
    window.addEventListener(OPEN_CHAT_EVENT, show);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", esc);
    };
  }, [open, tab]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const json = await res.json().catch(() => ({}));
      const answer = res.ok ? json.answer : json.error;
      setMessages((m) => [...m, { role: "assistant", content: answer || `Something went wrong. Please email ${CONTACT_EMAIL}.` }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: `I couldn't connect just now. Please try again or email ${CONTACT_EMAIL}.` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="7C Labs assistant"
          className="fade-in fixed bottom-24 right-4 z-40 flex h-[min(72vh,580px)] w-[min(92vw,390px)] flex-col overflow-hidden rounded-2xl border border-border bg-surface/95 shadow-2xl shadow-accent/10 backdrop-blur"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="font-semibold">7C Labs assistant</p>
              <p className="flex items-center gap-1.5 font-mono text-xs text-muted">
                <span className="status-live text-ok" aria-hidden>&#9679;</span> Answers from our docs
              </p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-md px-2 py-1 text-muted hover:text-foreground">
              &#10005;
            </button>
          </div>

          <div className="flex border-b border-border text-sm" role="tablist">
            {(["chat", "contact"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 ${tab === t ? "border-b-2 border-accent text-foreground" : "text-muted hover:text-foreground"}`}
              >
                {t === "chat" ? "Ask a question" : "Message the team"}
              </button>
            ))}
          </div>

          {tab === "chat" ? (
            <>
              <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <p
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        m.role === "user" ? "rounded-br-sm bg-accent text-background" : "rounded-bl-sm border border-border bg-background/70"
                      }`}
                    >
                      {m.content}
                    </p>
                  </div>
                ))}
                {busy && (
                  <div className="flex gap-1 px-2 text-accent" aria-label="Assistant is typing">
                    <span className="status-live">&#9679;</span>
                    <span className="status-live [animation-delay:200ms]">&#9679;</span>
                    <span className="status-live [animation-delay:400ms]">&#9679;</span>
                  </div>
                )}
                {messages.length === 1 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => send(s)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-end gap-2 border-t border-border p-3"
              >
                <label htmlFor="chat-input" className="sr-only">Your question</label>
                <textarea
                  id="chat-input"
                  ref={inputRef}
                  rows={1}
                  maxLength={1000}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder="Ask about products, agents, pricing…"
                  className="max-h-28 flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <button disabled={busy || !input.trim()} className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              <p className="mb-4 text-sm text-muted">Leave a message and the team will reply by email.</p>
              <ContactForm />
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close chat" : "Ask 7C: open chat with the 7C Labs assistant"}
        className="group fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent2 py-3 pl-4 pr-5 font-medium text-background shadow-xl shadow-accent/30 transition hover:scale-105"
      >
        {!open && <span className="chat-ping absolute inset-0 -z-10 rounded-full bg-accent/50" aria-hidden />}
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          ) : (
            <path d="M4 5h16v11H9l-5 4V5z" strokeLinejoin="round" />
          )}
        </svg>
        <span className="text-sm">{open ? "Close" : "Ask 7C"}</span>
      </button>
    </>
  );
}

/** Opens the chat panel from anywhere on the page. */
export function OpenChatButton({ children, tab = "chat", className }: { children: React.ReactNode; tab?: "chat" | "contact"; className?: string }) {
  return (
    <button className={className} onClick={() => window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT, { detail: tab }))}>
      {children}
    </button>
  );
}
