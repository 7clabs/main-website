"use client";

import { useState } from "react";
import { CONTACT_EMAIL } from "@/app/content";

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      form.reset();
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  const field =
    "w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-accent";

  return (
    <form onSubmit={submit} className="grid max-w-xl gap-4">
      <label className="grid gap-1 text-sm">
        Name
        <input name="name" required maxLength={100} className={field} autoComplete="name" />
      </label>
      <label className="grid gap-1 text-sm">
        Work email
        <input name="email" type="email" required maxLength={200} className={field} autoComplete="email" />
      </label>
      <label className="grid gap-1 text-sm">
        What are you building?
        <textarea name="message" required rows={4} maxLength={5000} className={field} />
      </label>
      {/* Honeypot for bots; hidden from people and assistive tech. */}
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <button
        disabled={status === "sending"}
        className="w-fit rounded-md bg-foreground px-5 py-2.5 font-medium text-background disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>

      <p role="status" aria-live="polite" className="min-h-6 text-sm">
        {status === "sent" && <span className="text-ok">Thank you. Your message has been sent and we will reply soon.</span>}
        {status === "error" && (
          <span className="text-err">
            {error} You can also write to{" "}
            <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </span>
        )}
      </p>
    </form>
  );
}
