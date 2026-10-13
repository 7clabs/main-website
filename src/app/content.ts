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

/** Points of the feature polygon, written as what the visitor gets. `color` is "r,g,b". */
export const features = [
  {
    tag: "Architecture",
    title: "See your architecture before you build it",
    who: ["Architects", "Engineering leads"],
    benefit: "An agent drafts the architecture diagram and decision records from your requirements, so the team agrees on the design in hours, not weeks.",
    how: ["Diagram, threat model and service map drafted for you", "Every decision recorded with its trade-offs", "Lead architect signs off before work starts"],
    link: { href: "#sdlc-tree", label: "See it in the SDLC tree" },
    color: "129,140,248",
  },
  {
    tag: "FinOps",
    title: "Know what it will cost before you commit",
    who: ["Finance and FinOps", "Engineering leads"],
    benefit: "Get a run-cost estimate for the chosen design, with budgets and cheaper options, before a single resource exists.",
    how: ["Cost estimate per service and region", "Budget alerts set from day one", "Savings options flagged early"],
    link: { href: "#cloudops", label: "CloudOps" },
    color: "245,165,36",
  },
  {
    tag: "Infrastructure",
    title: "Infrastructure that asks before it changes",
    who: ["Platform teams", "SRE"],
    benefit: "Infrastructure is written as code, every change shows its plan, and nothing is applied without the owner's approval. Alerts and runbooks come with it.",
    how: ["Plan reviewed before every apply", "Alerts tied to service objectives", "Runbooks ready before the first deploy"],
    link: { href: "#cloudops", label: "CloudOps" },
    color: "56,189,248",
  },
  {
    tag: "Compliance",
    title: "Compliance in place from the first commit",
    who: ["Security leads", "Auditors"],
    benefit: "Branch protection, licence rules and coding standards are set up as code, so every repository starts compliant and stays that way.",
    how: ["Policy as code for every repository", "Signed commits and required reviews", "Evidence recorded for audits"],
    link: { href: "#secure-delivery", label: "Secure Delivery" },
    color: "45,212,191",
  },
  {
    tag: "Development",
    title: "AI agents that pair with your developers",
    who: ["Developers", "Tech leads"],
    benefit: "Developer agents write code and tests against the agreed design. Engineers review every change, so speed never costs quality.",
    how: ["Pull requests with tests and docs", "Works inside your compliance rules", "Every change reviewed by an engineer"],
    link: { href: "#sdlc-tree", label: "See it in the SDLC tree" },
    color: "96,165,250",
  },
  {
    tag: "Security",
    title: "Security checks on every change",
    who: ["Security teams", "Developers"],
    benefit: "Secrets, dependency, code and container scans run automatically, with fixes proposed for what they find. High-severity issues block the merge.",
    how: ["Four kinds of scan on every change", "Suggested fixes, not just findings", "Signed artifacts and a software bill of materials"],
    link: { href: "#secure-delivery", label: "Secure Delivery" },
    color: "255,92,92",
  },
  {
    tag: "Delivery",
    title: "Releases that undo themselves when they go wrong",
    who: ["Release managers", "SRE"],
    benefit: "Issues are linked to the changes that fix them, releases go out in canary steps, and a bad signal rolls them back automatically.",
    how: ["Canary rollouts in steps", "Automatic rollback on objective breach", "Issues closed with the release that fixed them"],
    link: { href: "#resilience", label: "Resilience" },
    color: "62,207,110",
  },
  {
    tag: "AI usage",
    title: "Clear monitoring of AI usage, cost and risk",
    who: ["Engineering leads", "Finance", "Security"],
    benefit: "See which teams use which models, what it costs, how fast it responds, and whether sensitive data is leaking, all in one view.",
    how: ["Usage by team and service", "Cost and latency against your objectives", "Sensitive-data and quality checks"],
    link: { href: "#ai-monitor", label: "AI Monitor" },
    color: "167,139,250",
  },
  {
    tag: "Observability",
    title: "One view of health, cost and incidents",
    who: ["On-call engineers", "Leadership"],
    benefit: "Metrics, traces, logs, cloud cost and AI usage are watched together. Every incident has an owner and becomes a lesson for the next design.",
    how: ["Service-level dashboards", "An owner for every incident", "Lessons fed back into architecture"],
    link: { href: "#resilience", label: "Resilience" },
    color: "244,114,182",
  },
];

/** Branches of the SDLC tree, bottom to top. `color` is an "r,g,b" string for canvas drawing. */
export const treeStages = [
  {
    title: "Architecture design",
    short: "Architecture",
    agent: "Architect agent",
    color: "129,140,248",
    does: "Drafts the architecture diagram from requirements: services, data flows, trust boundaries and dependencies.",
    gate: "Lead architect reviews and signs off the diagram.",
    outputs: ["Architecture diagram", "Threat model", "Service map"],
    log: ["parsing requirements: 14 user stories", "drafting context and container views", "trust boundaries marked: 3"],
  },
  {
    title: "Decision making",
    short: "Decisions",
    agent: "Decision agent",
    color: "167,139,250",
    does: "Compares options and records each choice as a decision record, with trade-offs and risks written down.",
    gate: "Owners approve each decision record.",
    outputs: ["Decision records", "Trade-off matrix", "Risk register"],
    log: ["comparing 3 options for the data store", "scoring cost, latency, operability", "decision 007 proposed: managed Postgres"],
  },
  {
    title: "FinOps of the architecture",
    short: "FinOps",
    agent: "FinOps agent",
    color: "245,165,36",
    does: "Estimates the run cost of the chosen design, sets budgets, and flags cheaper equivalents before anything is built.",
    gate: "Budget owner approves the monthly estimate.",
    outputs: ["Cost estimate", "Budgets and alerts", "Savings options"],
    log: ["pricing 11 resources across 2 regions", "estimate within budget, 2 savings found", "budget alert set at 80%"],
  },
  {
    title: "Infrastructure with alerting and approval",
    short: "Infrastructure",
    agent: "Infra agent",
    color: "56,189,248",
    does: "Writes infrastructure as code, plans the change, and wires alerts and runbooks before the first deploy.",
    gate: "Platform owner approves the plan before it is applied.",
    outputs: ["IaC modules", "Change plan", "Alerts and runbooks"],
    log: ["plan: 23 to add, 0 to destroy", "alerts attached to SLOs", "waiting for approval: platform owner"],
  },
  {
    title: "Code compliance setup",
    short: "Compliance",
    agent: "Compliance agent",
    color: "45,212,191",
    does: "Sets up repository rules, branch protection, licence policy and coding standards as code.",
    gate: "Security lead approves the policy set.",
    outputs: ["Branch protection", "Policy as code", "Licence rules"],
    log: ["signed commits and reviews enforced", "policy pack loaded: baseline-v3", "licence allowlist applied"],
  },
  {
    title: "Code development",
    short: "Development",
    agent: "Developer agent",
    color: "96,165,250",
    does: "Pairs with engineers to write code and tests against the agreed design, inside the compliance rules.",
    gate: "Every change is reviewed by an engineer.",
    outputs: ["Pull requests", "Tests", "Docs"],
    log: ["PR #128 opened: payment retries", "18 tests added, coverage 86%", "review requested from 2 engineers"],
  },
  {
    title: "Security scan integrations",
    short: "Security",
    agent: "Security agent",
    color: "255,92,92",
    does: "Runs secrets, dependency, code and container scans on every change, and proposes fixes for what it finds.",
    gate: "High-severity findings block the merge.",
    outputs: ["Scan reports", "Fix suggestions", "SBOM"],
    log: ["secrets scan: 0 findings", "dependency issue found: fix proposed", "container image signed"],
  },
  {
    title: "Issue resolution and delivery",
    short: "Delivery",
    agent: "Delivery agent",
    color: "62,207,110",
    does: "Triages issues, links them to changes, and releases with canary rollouts and automatic rollback.",
    gate: "Release manager approves the production rollout.",
    outputs: ["Release notes", "Canary report", "Closed issues"],
    log: ["6 issues linked to release 2.15", "canary 10% healthy, promoting to 50%", "rollback armed on SLO breach"],
  },
  {
    title: "Observability",
    short: "Observability",
    agent: "Observability agent",
    color: "244,114,182",
    does: "Watches metrics, traces, logs, cost and AI usage, and turns incidents into lessons fed back to architecture.",
    gate: "An on-call engineer owns every incident.",
    outputs: ["SLO dashboards", "AI usage report", "Incident reviews"],
    log: ["p95 latency within SLO", "AI spend +4% week on week", "lesson sent to architecture backlog"],
  },
];
