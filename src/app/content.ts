export const CONTACT_EMAIL = "contact@7clabs.com";
export const INFO_EMAIL = "info@7clabs.com";
export const COMPANY = "7CLABS ENTERPRISE PRIVATE LIMITED";

export type ProductId = "secure-delivery" | "resilience" | "ai-monitor" | "cloudops";

export const products: {
  id: ProductId;
  eyebrow: string;
  name: string;
  short: string;
  value: string;
  features: { title: string; text: string }[];
  tags: string[];
}[] = [
  {
    id: "secure-delivery",
    eyebrow: "Ship confidently",
    name: "Secure Delivery",
    short: "DevSecOps pipelines with security built in",
    value:
      "A delivery pipeline where scanning, signing and approvals are part of every change, from first commit to production.",
    features: [
      { title: "Shift-left by default", text: "Secrets, dependency and code checks run on every commit, so problems are found while they are cheap to fix." },
      { title: "Policy as code", text: "Release rules are written once and enforced in the pipeline, with visible, expiring exceptions." },
      { title: "Signed, traceable artifacts", text: "Every release can be traced back to its source, its checks and the person who approved it." },
    ],
    tags: ["Secrets scanning", "SAST and dependency checks", "Container scanning", "Artifact signing", "Policy gates"],
  },
  {
    id: "resilience",
    eyebrow: "Stay reliable",
    name: "Resilience",
    short: "SRE practices: objectives, rollouts, recovery",
    value:
      "Services that fail safely. Objectives, progressive rollouts and rehearsed recovery keep incidents small.",
    features: [
      { title: "Objectives users can feel", text: "Service-level objectives and error budgets decide when to ship and when to slow down." },
      { title: "Progressive rollouts", text: "Canary releases move traffic in steps and roll back on their own when signals turn bad." },
      { title: "Rehearsed recovery", text: "Runbooks, on-call workflows and failure drills are tested before an incident, not during it." },
    ],
    tags: ["SLOs and error budgets", "Canary and rollback", "Runbooks", "Chaos drills", "Incident timelines"],
  },
  {
    id: "ai-monitor",
    eyebrow: "Know your AI",
    name: "AI Monitor",
    short: "Clear monitoring of AI usage, cost and risk",
    value:
      "A short list of signals that show who uses AI, what it costs, how it performs and whether it is leaking data.",
    features: [
      { title: "Usage by team and service", text: "See which models are called, by whom, and how often, tied to the service that owns them." },
      { title: "Cost and latency together", text: "Spend and response time sit beside your own objectives, with alerts for spikes." },
      { title: "Data and quality guardrails", text: "Prompts and outputs are checked for sensitive data, and quality drift is flagged after model changes." },
    ],
    tags: ["Usage tracking", "Cost per request", "Latency SLOs", "Data exposure checks", "Quality drift"],
  },
  {
    id: "cloudops",
    eyebrow: "Operate efficiently",
    name: "CloudOps",
    short: "One operating model across cloud platforms",
    value:
      "Landing zones, infrastructure as code, identity and cost controls applied the same way on every cloud.",
    features: [
      { title: "Infrastructure as code", text: "Environments are defined in code, reviewed like software, and rebuilt on demand." },
      { title: "Identity and network guardrails", text: "Least-privilege access and network rules are part of the baseline, not an afterthought." },
      { title: "Cost and capacity visibility", text: "Spend is broken down by team and service, with anomaly alerts before the invoice arrives." },
    ],
    tags: ["AWS", "Microsoft Azure", "Google Cloud", "Landing zones", "Cost anomaly alerts"],
  },
];

export const strip = [
  { k: "Plan to production", v: "One lifecycle, end to end" },
  { k: "Security at every stage", v: "Not a review at the end" },
  { k: "AI usage, visible", v: "Cost, latency, risk" },
  { k: "Multi-cloud", v: "AWS, Azure, Google Cloud" },
];

export const graphInputs = ["Code and commits", "Pipelines and releases", "Cloud resources", "AI usage"];
export const graphOutputs = ["Risk and cost insights", "Recommended actions", "Audit evidence"];

export const levels = [
  { level: "Level 1", name: "Suggest", text: "AI summarises, correlates and recommends. People do the work." },
  { level: "Level 2", name: "Act with approval", text: "AI prepares the change. A named person approves before it reaches production." },
  { level: "Level 3", name: "Act within guardrails", text: "AI handles routine, low-risk actions inside limits you define, with a full audit trail." },
];

export const governance = [
  { title: "Humans stay accountable", text: "AI proposes. People approve changes to production." },
  { title: "Least privilege", text: "Automation gets only the access it needs, for as long as it needs it." },
  { title: "Evidence by default", text: "Every check and decision is recorded so you can show a customer or auditor." },
];

export const services = [
  { name: "Assess", text: "A review of your delivery pipeline, security posture and AI usage, with a prioritised plan." },
  { name: "Implement", text: "We design and build the pipelines, infrastructure and monitoring with your team." },
  { name: "Operate", text: "Ongoing support for reliability, on-call and cloud operations, as much or as little as you need." },
  { name: "Enable", text: "Hands-on training so your engineers can run the platform and the practices themselves." },
];
