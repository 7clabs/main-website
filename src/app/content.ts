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
    color: "2,132,199",
  },
  {
    id: "resilience",
    name: "Resilience",
    line: "Objectives, canary rollouts and recovery you have rehearsed.",
    tags: ["SLOs", "Auto rollback", "Runbooks"],
    color: "22,163,74",
  },
  {
    id: "ai-monitor",
    name: "AI Monitor",
    line: "See who uses AI, what it costs and where it leaks.",
    tags: ["Usage by team", "Cost and latency", "Data guardrails"],
    color: "99,102,241",
  },
  {
    id: "cloudops",
    name: "CloudOps",
    line: "One way to run AWS, Azure and Google Cloud.",
    tags: ["Infrastructure as code", "Guardrails", "Cost alerts"],
    color: "59,111,246",
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
    title: "Architecture design", short: "Architecture", tagline: "Diagrams and threat model", tech: ["C4", "STRIDE", "ADR"], agent: "Architect agent", color: "139,92,246",
    does: "Drafts the diagram, service map and threat model from your requirements.",
    gate: "Lead architect signs off.",
    details: ["Context, container and data-flow diagrams from requirements", "Trust boundaries and threats marked on the design", "One service map shared by every later stage"],
    outputs: ["Diagram", "Threat model", "Service map"],
  },
  {
    title: "Decision making", short: "Decisions", tagline: "Options, trade-offs, records", tech: ["ADR", "RFC", "RACI"], agent: "Decision agent", color: "99,102,241",
    does: "Compares options and records each choice with its trade-offs.",
    gate: "Owners approve each decision.",
    details: ["Options scored on cost, latency and operability", "Every decision stored with its risks", "Conditions for reversing it written down up front"],
    outputs: ["Decision records", "Trade-offs", "Risks"],
  },
  {
    title: "FinOps", short: "FinOps", tagline: "Cost before you build", tech: ["FOCUS", "Budget", "Spot"], agent: "FinOps agent", color: "217,119,6",
    does: "Estimates run cost before anything is built and sets budgets.",
    gate: "Budget owner approves the estimate.",
    details: ["Run-cost estimate per service and region", "Budgets and 80% alerts set before the first deploy", "Cheaper equivalents suggested with trade-offs"],
    outputs: ["Cost estimate", "Budgets", "Savings"],
  },
  {
    title: "Infrastructure", short: "Infra", tagline: "IaC with approvals", tech: ["IaC", "Helm", "VPC"], agent: "Infra agent", color: "59,111,246",
    does: "Writes infrastructure as code, with alerts and runbooks ready.",
    gate: "Platform owner approves every plan.",
    details: ["Reusable infrastructure-as-code modules", "The full plan shown before anything is applied", "Alerts tied to objectives, runbooks linked"],
    outputs: ["IaC", "Change plan", "Alerts"],
  },
  {
    title: "Code compliance", short: "Compliance", tagline: "Policy and standards as code", tech: ["OPA", "CIS", "SOC2"], agent: "Compliance agent", color: "2,132,199",
    does: "Sets repository rules, licence policy and standards as code.",
    gate: "Security lead approves the policy set.",
    details: ["Signed commits and required reviews enforced", "Licence allow-list and dependency rules", "Standards checked on every pull request"],
    outputs: ["Policy as code", "Branch rules", "Licence rules"],
  },
  {
    title: "Code development", short: "Develop", tagline: "Code and tests with agents", tech: ["PR", "TDD", "Lint"], agent: "Developer agent", color: "8,145,178",
    does: "Writes code and tests against the agreed design.",
    gate: "An engineer reviews every change.",
    details: ["Agents draft code and tests inside the design", "Coverage and docs updated with each change", "Engineers review and merge, never the agent alone"],
    outputs: ["Pull requests", "Tests", "Docs"],
  },
  {
    title: "Security scans", short: "Security", tagline: "Scans on every change", tech: ["SAST", "SBOM", "Trivy"], agent: "Security agent", color: "244,63,94",
    does: "Scans every change and proposes fixes for what it finds.",
    gate: "High-severity findings block the merge.",
    details: ["Secrets, dependency, code and container scans", "A suggested fix attached to each finding", "Signed artifacts and a software bill of materials"],
    outputs: ["Scan reports", "Fixes", "SBOM"],
  },
  {
    title: "Issues and delivery", short: "Delivery", tagline: "Canary rollout, auto rollback", tech: ["Argo", "Canary", "SLO"], agent: "Delivery agent", color: "22,163,74",
    does: "Links issues to changes and ships with canary rollouts.",
    gate: "Release manager approves production.",
    details: ["Issues linked to the change that fixes them", "Canary steps at 10, 50 and 100 percent", "Automatic rollback when an objective is breached"],
    outputs: ["Release notes", "Canary report", "Closed issues"],
  },
  {
    title: "Observability", short: "Observe", tagline: "Health, cost and AI usage", tech: ["OTel", "SLI", "Trace"], agent: "Observability agent", color: "13,148,136",
    does: "Watches health, cost and AI usage, and feeds lessons back.",
    gate: "An on-call engineer owns every incident.",
    details: ["Metrics, traces, logs, cost and AI usage together", "A named on-call owner for every incident", "Lessons returned to the architecture backlog"],
    outputs: ["SLO dashboards", "AI usage", "Incident reviews"],
  },
];

/** Visionary lines for the About section. */
export const aboutLines = [
  "We are a team of experienced engineers.",
  "We have spent our careers carrying the weight of platform engineering, turning business goals into running solutions.",
  "We believe that weight can be lighter.",
  "So we built 7C Labs: agents do the repeatable work, secure and compliant by default, and people keep every decision.",
];

export const aboutVision = "Every team ships fast and safe, with nothing left to chance.";

export const aboutPillars = [
  { title: "Engineers first", text: "Built by people who run platforms." },
  { title: "Secure by default", text: "Compliance is part of the path, not a gate at the end." },
  { title: "Humans decide", text: "Agents prepare. People approve." },
];

export const roles = [
  {
    id: "platform-intern",
    title: "Platform Engineering Intern",
    pitch: "Help build the automation that makes secure, compliant platforms easy to run.",
    work: ["Infrastructure-as-code modules and pipelines", "Policy checks and platform guardrails", "Dashboards and alerts for platform health"],
    skills: ["Linux and Git basics", "Containers (Docker; Kubernetes is a plus)", "One cloud: AWS, Azure or Google Cloud", "Scripting in Python, Bash or similar"],
    color: "59,111,246",
  },
  {
    id: "fullstack-intern",
    title: "Full-Stack Development Intern",
    pitch: "Build the product people use to run their lifecycle with AI agents.",
    work: ["Product screens in React and Next.js", "APIs for agents, approvals and monitoring", "Tests and accessibility for every change"],
    skills: ["TypeScript or JavaScript", "React or a similar framework", "REST APIs and databases", "Interest in secure coding"],
    color: "99,102,241",
  },
  {
    id: "devsecops-intern",
    title: "DevSecOps and Cloud Security Intern",
    pitch: "Bring security and compliance into every stage, automatically.",
    work: ["Scans in the pipeline and fixes for findings", "Compliance rules written as code", "Monitoring for AI usage and data exposure"],
    skills: ["Security fundamentals", "CI/CD concepts", "Cloud basics and least-privilege access", "Curiosity about compliance standards"],
    color: "2,132,199",
  },
];

/** Scripts for the product demo tabs. Every figure is illustrative sample data. */
export const demos: Record<
  string,
  { file: string; prompt: string; thought: number; answer: string[]; features: { title: string; text: string }[] }
> = {
  "secure-delivery": {
    file: "pipeline / checkout-api",
    prompt: "Promote checkout-api to production.",
    thought: 6,
    answer: [
      "Build #482 passed all six gates: secrets, dependencies, code, container, policy and signing.",
      "The artifact is signed and traced to commit 3f9a2c1. Release manager approval is pending.",
      "Once approved, the canary starts at 10% with automatic rollback armed.",
    ],
    features: [
      { title: "Shift-left by default", text: "Secrets, dependency and code checks run on every commit, so problems are found while they are cheap to fix." },
      { title: "Policy as code", text: "Release rules are written once and enforced in the pipeline, with visible, expiring exceptions." },
      { title: "Signed, traceable artifacts", text: "Every release traces back to its source, its checks and the person who approved it." },
    ],
  },
  resilience: {
    file: "slo / checkout-api",
    prompt: "Roll back checkout-api if p95 latency breaches the objective.",
    thought: 4,
    answer: [
      "Objective: p95 under 300 ms and 99.9% availability.",
      "At 50% canary, p95 is 212 ms and the error budget stands at 82%.",
      "Rollback is armed and fires within 30 seconds of a breach.",
    ],
    features: [
      { title: "Objectives users can feel", text: "Service-level objectives and error budgets decide when to ship and when to slow down." },
      { title: "Progressive rollouts", text: "Canary releases move traffic in steps and roll back on their own when signals turn bad." },
      { title: "Rehearsed recovery", text: "Runbooks, on-call workflows and failure drills are tested before an incident, not during it." },
    ],
  },
  "ai-monitor": {
    file: "ai-usage / this week",
    prompt: "Which team spent the most on AI this week?",
    thought: 5,
    answer: [
      "Support spent the most: $412, up 9% on last week.",
      "Code review has the slowest responses, with a p95 of 3.1 s.",
      "One prompt in ops-copilot contained a sensitive field and was blocked.",
    ],
    features: [
      { title: "Usage by team and service", text: "See which models are called, by whom, and how often, tied to the service that owns them." },
      { title: "Cost and latency together", text: "Spend and response time sit beside your own objectives, with alerts for spikes." },
      { title: "Data and quality guardrails", text: "Prompts and outputs are checked for sensitive data, and quality drift is flagged after model changes." },
    ],
  },
  cloudops: {
    file: "plan / eu-west",
    prompt: "What will the new eu-west region cost per month?",
    thought: 7,
    answer: [
      "Estimated $4,820 a month across 11 resources in two zones.",
      "Right-sizing two node pools could save about 18%.",
      "A budget alert is set at 80%, and the plan awaits platform-owner approval.",
    ],
    features: [
      { title: "Infrastructure as code", text: "Environments are defined in code, reviewed like software, and rebuilt on demand." },
      { title: "Identity and network guardrails", text: "Least-privilege access and network rules are part of the baseline, not an afterthought." },
      { title: "Cost and capacity visibility", text: "Spend is broken down by team and service, with anomaly alerts before the invoice arrives." },
    ],
  },
};