import Anthropic from "@anthropic-ai/sdk";
import { CONTACT_EMAIL } from "@/app/content";
import { loadDocs, searchDocs } from "@/lib/docs";
import { clientIp, createLimiter } from "@/lib/rateLimit";

const limited = createLimiter(20, 10 * 60 * 1000);
const MAX_TURNS = 12;
const MAX_CHARS = 1000;

type Turn = { role: "user" | "assistant"; content: string };

const SYSTEM_RULES = `You are the assistant on the 7C Labs website (7clabs.com).
Answer visitors' questions using only the documents below. They describe the company, its products, its SDLC lifecycle and AI agents, its services, and how to get in touch.
If the documents don't contain the answer, say you don't have that information and suggest emailing ${CONTACT_EMAIL}. Never invent prices, customers, certifications, numbers or commitments.
Keep answers short and friendly: two to five sentences, or a few lines starting with "- " when listing. Use plain text, no markdown headings or bold.
Questions unrelated to 7C Labs should be politely redirected to what you can help with.`;

let client: Anthropic | null = null;

function parseTurns(body: unknown): Turn[] | null {
  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const turns = raw.slice(-MAX_TURNS).map((m) => ({
    role: (m as Turn)?.role,
    content: typeof (m as Turn)?.content === "string" ? (m as Turn).content.slice(0, MAX_CHARS).trim() : "",
  }));
  if (turns.some((t) => (t.role !== "user" && t.role !== "assistant") || !t.content)) return null;
  // The API needs the conversation to start with a user turn and end on one.
  while (turns.length && turns[0].role !== "user") turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== "user") return null;
  return turns as Turn[];
}

/** Used when no ANTHROPIC_API_KEY is configured: answer with the best-matching doc sections. */
function localAnswer(question: string) {
  const hits = searchDocs(question);
  if (!hits.length) {
    return `I couldn't find that in our documentation. Please email ${CONTACT_EMAIL} and the team will help.`;
  }
  return hits.map((h) => `${h.heading}: ${h.text}`).join("\n\n");
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const turns = parseTurns(body);
  if (!turns) return Response.json({ error: "Please type a question." }, { status: 400 });
  if (limited(clientIp(req))) {
    return Response.json({ error: "You're sending messages quickly. Please wait a few minutes." }, { status: 429 });
  }

  const question = turns[turns.length - 1].content;

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ answer: localAnswer(question), mode: "search" });
  }

  client ??= new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      output_config: { effort: "low" },
      // If a safety classifier declines, the API re-runs the request on a fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      // Stable rules + docs first, cached; the conversation comes after.
      system: [{ type: "text", text: `${SYSTEM_RULES}\n\n<documents>\n${loadDocs().all}\n</documents>`, cache_control: { type: "ephemeral" } }],
      messages: turns,
    });

    if (response.stop_reason === "refusal") {
      return Response.json({ answer: `I can't help with that here. For anything about 7C Labs, email ${CONTACT_EMAIL}.`, mode: "ai" });
    }
    const answer = response.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("")
      .trim();
    return Response.json({ answer: answer || localAnswer(question), mode: "ai" });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      console.error("Chat: Claude rate limited", err.message);
    } else if (err instanceof Anthropic.AuthenticationError) {
      console.error("Chat: ANTHROPIC_API_KEY is invalid");
    } else if (err instanceof Anthropic.APIError) {
      console.error(`Chat: Claude API error ${err.status}`, err.message);
    } else {
      console.error("Chat: unexpected error", err);
    }
    // Keep the visitor unblocked with the local search answer.
    return Response.json({ answer: localAnswer(question), mode: "search" });
  }
}
