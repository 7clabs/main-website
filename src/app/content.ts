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
  {
    title: "Architecture design", short: "Architecture", agent: "Architect agent", color: "129,140,248",
    does: "Drafts the diagram, service map and threat model from your requirements.",
    gate: "Lead architect signs off.",
    details: ["Context, container and data-flow diagrams from requirements", "Trust boundaries and threats marked on the design", "One service map shared by every later stage"],
    outputs: ["Diagram", "Threat model", "Service map"],
  },
  {
    title: "Decision making", short: "Decisions", agent: "Decision agent", color: "167,139,250",
    does: "Compares options and records each choice with its trade-offs.",
    gate: "Owners approve each decision.",
    details: ["Options scored on cost, latency and operability", "Every decision stored with its risks", "Conditions for reversing it written down up front"],
    outputs: ["Decision records", "Trade-offs", "Risks"],
  },
  {
    title: "FinOps", short: "FinOps", agent: "FinOps agent", color: "245,165,36",
    does: "Estimates run cost before anything is built and sets budgets.",
    gate: "Budget owner approves the estimate.",
    details: ["Run-cost estimate per service and region", "Budgets and 80% alerts set before the first deploy", "Cheaper equivalents suggested with trade-offs"],
    outputs: ["Cost estimate", "Budgets", "Savings"],
  },
  {
    title: "Infrastructure", short: "Infra", agent: "Infra agent", color: "56,189,248",
    does: "Writes infrastructure as code, with alerts and runbooks ready.",
    gate: "Platform owner approves every plan.",
    details: ["Reusable infrastructure-as-code modules", "The full plan shown before anything is applied", "Alerts tied to objectives, runbooks linked"],
    outputs: ["IaC", "Change plan", "Alerts"],
  },
  {
    title: "Code compliance", short: "Compliance", agent: "Compliance agent", color: "45,212,191",
    does: "Sets repository rules, licence policy and standards as code.",
    gate: "Security lead approves the policy set.",
    details: ["Signed commits and required reviews enforced", "Licence allow-list and dependency rules", "Standards checked on every pull request"],
    outputs: ["Policy as code", "Branch rules", "Licence rules"],
  },
  {
    title: "Code development", short: "Develop", agent: "Developer agent", color: "96,165,250",
    does: "Writes code and tests against the agreed design.",
    gate: "An engineer reviews every change.",
    details: ["Agents draft code and tests inside the design", "Coverage and docs updated with each change", "Engineers review and merge, never the agent alone"],
    outputs: ["Pull requests", "Tests", "Docs"],
  },
  {
    title: "Security scans", short: "Security", agent: "Security agent", color: "255,92,92",
    does: "Scans every change and proposes fixes for what it finds.",
    gate: "High-severity findings block the merge.",
    details: ["Secrets, dependency, code and container scans", "A suggested fix attached to each finding", "Signed artifacts and a software bill of materials"],
    outputs: ["Scan reports", "Fixes", "SBOM"],
  },
  {
    title: "Issues and delivery", short: "Delivery", agent: "Delivery agent", color: "62,207,110",
    does: "Links issues to changes and ships with canary rollouts.",
    gate: "Release manager approves production.",
    details: ["Issues linked to the change that fixes them", "Canary steps at 10, 50 and 100 percent", "Automatic rollback when an objective is breached"],
    outputs: ["Release notes", "Canary report", "Closed issues"],
  },
  {
    title: "Observability", short: "Observe", agent: "Observability agent", color: "244,114,182",
    does: "Watches health, cost and AI usage, and feeds lessons back.",
    gate: "An on-call engineer owns every incident.",
    details: ["Metrics, traces, logs, cost and AI usage together", "A named on-call owner for every incident", "Lessons returned to the architecture backlog"],
    outputs: ["SLO dashboards", "AI usage", "Incident reviews"],
  },
];
