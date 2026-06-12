# Cursor skills (project rules)

These `.mdc` files are **Cursor skills** — domain knowledge Cursor loads to execute AI-feature work on OptiSchedule correctly. Each has YAML frontmatter (`description`, `globs`, `alwaysApply`). Rules auto-attach when their `globs` match the files you edit, and the agent can also pull one by `description`.

| Skill | When it fires | What it gives the agent |
|-------|---------------|--------------------------|
| `agent-project-memory.mdc` | always | Index of all mandatory rules, AI skills map, Sprint 54 clinic decisions — read at start of feature/clinic work. |
| `feature-ai-prompt-coverage.mdc` | always | Mandatory checklist: every feature gets AI prompts on all 4 surfaces (dashboard, provider mobile, customer mobile, public booking), 99% UX phrasings, compounds, rescue, eval. |
| `feature-test-coverage.mdc` | always | Mandatory unit + integration test checklist (100% scenario coverage from fixtures). |
| `feature-clinic-vertical.mdc` | clinic-test-results, clinic UI, ai-cmd-clinic | Generic clinic only: de-fertility clone, lab state machines, no patientPlanId — Sprint 54. |
| `ai-command-pipeline.mdc` | editing `backend/src/modules/ai/**`, provider/public assistants, AI command bar | **Mandatory pipe-1 flow** for every new AI feature; architecture map: gateway → understand pipeline (normalize → … → telemetry) → validate → execute; registry, rescue, eval. **Read this first for any AI prompt task.** |
| `ai-multi-command-handling.mdc` | editing decomposition / registry / check-and-book / eval | How to handle "do X and Y" compounds: detect → decompose (deterministic/golden), shared context across steps, per-step params, compound eval cases, false-compound guards. |
| `ai-accuracy-program.mdc` | acc-* tasks, editing AI module / eval / AI-ops dashboard | Sprints 38–43 playbook (acc-1…acc-6) to reach 99% accurate executions: telemetry (`ai_command_trace`), eval expansion + `test:ai-accuracy` CI gate, classification engine, smart clarification, execution verification/rollback, continuous-learning loop. |
| `feature-fast-intent-heuristics.mdc` | `fast-intent-heuristics.*`, understand pipeline | pipe-1.2.3 / acc-3.14: routing + structural hints only; forbidden paraphrase regex; boundary doc + CI gate. |

## How they map to the roadmap (`TODO.md`)

- **AI Accuracy Program — 99% accurate executions (Sprints 38–43)** → `ai-accuracy-program.mdc` (per-sprint hook points), backed by `ai-command-pipeline.mdc`.
- **AI product commands — 99% scenario coverage incl. multi commands** (`ai-cmd-*`, Phase H1–H4) → `feature-ai-prompt-coverage.mdc` + `ai-multi-command-handling.mdc` + `feature-test-coverage.mdc`.
- **Clinic vertical v2 — Sprint 54** (`vert-clinic-2.*`) → `feature-clinic-vertical.mdc` + `agent-project-memory.mdc` + `TODO.md` Sprint 54.

## Editing guidance

- Keep skills grounded in **real files/symbols** — verify a path exists before citing it (the AI module is large and evolving).
- Prefer deterministic levers (rescue, normalization, eval cases) over new LLM prompts; note token-cost implications.
- When a referenced "planned" file ships (e.g. LangGraph compound graphs, `test:ai-accuracy`), update the relevant skill to point at the real path.

