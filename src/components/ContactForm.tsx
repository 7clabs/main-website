"use client";

import { useState } from "react";
import { CONTACT_EMAIL } from "@/app/content";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`7C Labs enquiry from ${name}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${name} <${email}>`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  const field =
    "w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-accent";

  return (
    <form onSubmit={submit} className="grid max-w-xl gap-4">
      <label className="grid gap-1 text-sm">
        Name
        <input required value={name} onChange={(e) => setName(e.target.value)} className={field} autoComplete="name" />
      </label>
      <label className="grid gap-1 text-sm">
        Work email
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} autoComplete="email" />
      </label>
      <label className="grid gap-1 text-sm">
        What are you building?
        <textarea required rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className={field} />
      </label>
      <button className="w-fit rounded-md bg-foreground px-5 py-2.5 font-medium text-background">
        Send message
      </button>
    </form>
  );
}
