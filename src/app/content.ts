export const CONTACT_EMAIL = "contact@7clabs.com";
export const INFO_EMAIL = "info@7clabs.com";
export const COMPANY = "7CLABS ENTERPRISE PRIVATE LIMITED";

/** Colours are "r,g,b" so the canvas and CSS can both use them. */
export const products = [
  {
    id: "secure-delivery",
    name: "Secure Delivery",
    line: "Security, signing and approvals built into every release.",
    tags: ["Scans on every commit", "Policy as code", "Signed artifacts"],
    color: "45,212,191",
  },
  {
    id: "resilience",
    name: "Resilience",
    line: "Objectives, canary rollouts and recovery you have rehearsed.",
    tags: ["SLOs", "Auto rollback", "Runbooks"],
    color: "62,207,110",
  },
  {
    id: "ai-monitor",
    name: "AI Monitor",
    line: "See who uses AI, what it costs and where it leaks.",
    tags: ["Usage by team", "Cost and latency", "Data guardrails"],
    color: "167,139,250",
  },
  {
    id: "cloudops",
    name: "CloudOps",
    line: "One way to run AWS, Azure and Google Cloud.",
    tags: ["Infrastructure as code", "Guardrails", "Cost alerts"],
    color: "56,189,248",
  },
];

export const levels = [
  { name: "Suggest", text: "AI recommends. People do the work." },
  { name: "Approve", text: "AI prepares the change. A named person approves it." },
  { name: "Guardrails", text: "AI handles routine, low-risk actions inside limits you set." },
];

export const services = [
  { name: "Assess", text: "Review your pipeline, security and AI usage." },
  { name: "Implement", text: "Build the platform with your team." },
  { name: "Operate", text: "Run reliability and cloud operations with you." },
  { name: "Enable", text: "Train your engineers to run it themselves." },
];

/** The nine stages, bottom to top of the tree. */
export const treeStages = [
  { title: "Architecture design", short: "Architecture", agent: "Architect agent", color: "129,140,248", does: "Drafts the diagram, service map and threat model from your requirements.", gate: "Lead architect signs off.", outputs: ["Diagram", "Threat model", "Service map"] },
  { title: "Decision making", short: "Decisions", agent: "Decision agent", color: "167,139,250", does: "Compares options and records each choice with its trade-offs.", gate: "Owners approve each decision.", outputs: ["Decision records", "Trade-offs", "Risks"] },
  { title: "FinOps", short: "FinOps", agent: "FinOps agent", color: "245,165,36", does: "Estimates run cost before anything is built and sets budgets.", gate: "Budget owner approves the estimate.", outputs: ["Cost estimate", "Budgets", "Savings"] },
  { title: "Infrastructure", short: "Infra", agent: "Infra agent", color: "56,189,248", does: "Writes infrastructure as code, with alerts and runbooks ready.", gate: "Platform owner approves every plan.", outputs: ["IaC", "Change plan", "Alerts"] },
  { title: "Code compliance", short: "Compliance", agent: "Compliance agent", color: "45,212,191", does: "Sets repository rules, licence policy and standards as code.", gate: "Security lead approves the policy set.", outputs: ["Policy as code", "Branch rules", "Licence rules"] },
  { title: "Code development", short: "Develop", agent: "Developer agent", color: "96,165,250", does: "Writes code and tests against the agreed design.", gate: "An engineer reviews every change.", outputs: ["Pull requests", "Tests", "Docs"] },
  { title: "Security scans", short: "Security", agent: "Security agent", color: "255,92,92", does: "Scans every change and proposes fixes for what it finds.", gate: "High-severity findings block the merge.", outputs: ["Scan reports", "Fixes", "SBOM"] },
  { title: "Issues and delivery", short: "Delivery", agent: "Delivery agent", color: "62,207,110", does: "Links issues to changes and ships with canary rollouts.", gate: "Release manager approves production.", outputs: ["Release notes", "Canary report", "Closed issues"] },
  { title: "Observability", short: "Observe", agent: "Observability agent", color: "244,114,182", does: "Watches health, cost and AI usage, and feeds lessons back.", gate: "An on-call engineer owns every incident.", outputs: ["SLO dashboards", "AI usage", "Incident reviews"] },
];
