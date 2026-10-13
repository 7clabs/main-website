import nodemailer from "nodemailer";
import { CONTACT_EMAIL } from "@/app/content";
import { clientIp, createLimiter } from "@/lib/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 5 messages per 10 minutes per IP.
const limited = createLimiter(5, 10 * 60 * 1000);

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/\r/g, "").trim().slice(0, max) : "";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: real visitors never fill this hidden field. Pretend success to bots.
  if (clean(body.company, 100)) return Response.json({ ok: true });

  const name = clean(body.name, 100).replace(/\n/g, " ");
  const email = clean(body.email, 200);
  const message = clean(body.message, 5000);

  if (!name || !message || !EMAIL_RE.test(email) || email.includes("\n")) {
    return Response.json({ error: "Please fill in your name, a valid email and a message." }, { status: 400 });
  }

  if (limited(clientIp(req))) {
    return Response.json({ error: "Too many messages. Please try again later." }, { status: 429 });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error("Contact form: SMTP_HOST, SMTP_USER and SMTP_PASS are not configured.");
    return Response.json({ error: "Messages cannot be sent right now. Please email us directly." }, { status: 503 });
  }

  const port = Number(SMTP_PORT ?? 465);
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transport.sendMail({
      from: `"7C Labs website" <${SMTP_USER}>`,
      to: process.env.CONTACT_TO ?? CONTACT_EMAIL,
      replyTo: `"${name.replace(/"/g, "")}" <${email}>`,
      subject: `7C Labs enquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Contact form: send failed", err);
    return Response.json({ error: "Messages cannot be sent right now. Please email us directly." }, { status: 502 });
  }
}
