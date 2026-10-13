# The SDLC lifecycle and AI agents

## How the lifecycle works
The platform covers nine stages: architecture design, decision making, FinOps of the architecture, infrastructure with alerting and approval, code compliance setup, code development, security scan integrations, issue resolution and delivery, and observability. Lessons from observability feed back into architecture for the next cycle.

## AI agents and human approval
Each stage has an AI agent that does the routine work, such as drafting an architecture diagram, estimating cost, planning infrastructure changes or proposing a fix for a security finding. A named person approves every step that matters, for example the lead architect signs off the diagram, the budget owner approves the cost estimate, and the release manager approves a production rollout.

## Levels of autonomy
You choose how much AI can do for each workflow. Level 1, Suggest: AI summarises, correlates and recommends, and people do the work. Level 2, Act with approval: AI prepares the change and a named person approves it before it reaches production. Level 3, Act within guardrails: AI handles routine, low-risk actions inside limits you define, with a full audit trail.

## FinOps
The FinOps agent estimates the run cost of a chosen architecture before anything is built, sets budgets and alerts, and suggests cheaper equivalents. Cloud and AI spend are broken down by team and service.

## Security
Security is part of every stage rather than a review at the end. Secrets, dependency, code and container scans run on every change. High-severity findings block the merge. Releases are signed, and every check and decision is recorded as audit evidence.

## Observability
Metrics, traces, logs, cloud cost and AI usage are watched together. Every incident has an owner on call and produces a recorded lesson.
