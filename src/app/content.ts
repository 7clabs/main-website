export const CONTACT_EMAIL = "contact@7clabs.com";
export const INFO_EMAIL = "info@7clabs.co";
export const COMPANY = "7CLABS ENTERPRISE PRIVATE LIMITED";

export const nav = [
  { href: "#lifecycle", label: "Lifecycle" },
  { href: "#platform", label: "Platform" },
  { href: "#ai-monitoring", label: "AI monitoring" },
  { href: "#principles", label: "Principles" },
  { href: "#cloud", label: "Cloud" },
];

export const lifecycle = [
  { step: "01", name: "Plan", text: "Threat model and service-level objectives are written before the first line of code." },
  { step: "02", name: "Build", text: "Secrets scanning, dependency and licence checks, and signed commits run on every change." },
  { step: "03", name: "Verify", text: "Static and dynamic analysis, tests and policy checks gate the pipeline." },
  { step: "04", name: "Ship", text: "Signed artifacts, infrastructure as code and progressive rollouts with automatic rollback." },
  { step: "05", name: "Operate", text: "Error budgets, runbooks and on-call workflows keep services inside their objectives." },
  { step: "06", name: "Observe", text: "Metrics, traces, logs and AI usage signals feed back into planning." },
];

export const pillars = [
  {
    title: "Proactive security",
    text: "Security is a stage in every step, not a review at the end. Shift-left scanning, least-privilege access, and policy as code are part of the default pipeline.",
    points: ["Secrets and supply-chain scanning", "Policy as code and guardrails", "Continuous posture checks"],
  },
  {
    title: "SRE-grade resilience",
    text: "Services are designed to fail safely. We define objectives, test recovery, and automate the response so incidents stay small.",
    points: ["SLOs and error budgets", "Chaos and recovery drills", "Automated rollback and runbooks"],
  },
  {
    title: "AI-assisted operations",
    text: "AI helps triage alerts, summarise incidents and suggest fixes, with a human approving anything that changes production.",
    points: ["Alert correlation and noise reduction", "Incident summaries and timelines", "Human approval for changes"],
  },
  {
    title: "Cloud platform operations",
    text: "One operating model across cloud accounts and regions, with cost, identity and network controls built in.",
    points: ["Multi-account landing zones", "Infrastructure as code", "Cost and capacity visibility"],
  },
];

export const aiSignals = [
  { name: "Usage by team", text: "Who is calling which model, and how often." },
  { name: "Cost per request", text: "Spend tied to the service and feature that caused it." },
  { name: "Latency and errors", text: "Model response time and failure rate beside your own SLOs." },
  { name: "Data exposure", text: "Prompts and outputs checked for sensitive data and policy breaches." },
  { name: "Quality drift", text: "Changes in output quality after a model or prompt update." },
];

export const mockRows = [
  { service: "support-assistant", model: "Model A", requests: "12,480", p95: "1.8 s", cost: "$41.20", state: "ok" },
  { service: "code-review-bot", model: "Model B", requests: "3,902", p95: "3.1 s", cost: "$18.75", state: "warn" },
  { service: "doc-summariser", model: "Model A", requests: "7,115", p95: "1.2 s", cost: "$12.40", state: "ok" },
  { service: "ops-copilot", model: "Model C", requests: "960", p95: "6.4 s", cost: "$9.05", state: "err" },
] as const;

export const principles = [
  { title: "Secure by default", text: "The safe path is the easy path. Exceptions are visible and expire." },
  { title: "Measure what users feel", text: "Objectives come from user experience, not from server counts." },
  { title: "Automate the repeatable", text: "Toil is removed so engineers spend time on design and recovery." },
  { title: "Blameless learning", text: "Every incident produces a fix and a lesson, never a culprit." },
  { title: "Humans stay accountable", text: "AI proposes. People approve changes to production." },
  { title: "Evidence over claims", text: "Controls produce audit trails you can show a customer." },
];

export const clouds = ["AWS", "Microsoft Azure", "Google Cloud"];
