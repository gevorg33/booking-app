# AI-ROADMAP — OptiSchedule AI-first platform

**Supersedes:** `AI-TODO.md` (semantic intent matching) and `Regex.MD` (regex retirement + safety).
Both remain in the repo for provenance only; **this file is the single source of truth.**

**Date:** 2026-08-03
**Status:** PROPOSED — no implementation started
**Horizon:** ~2–3 quarters to the full end state; useful value lands from Phase 2 onward.

---

## 0. Executive summary

The goal is an AI assistant that **executes** across the whole product, not a chatbot: natural
language in → one or more validated commands out → reliably executed, with memory, follow-ups,
and topic changes handled.

Three decisions drive this roadmap:

1. **The command registry becomes the single source of truth.** Today an action's definition is
   smeared across ~6 places (registry, dispatch map, classifier schema, coverage list, promotion
   list, per-domain util). That is why actions silently become unreachable (e2e-bug.342) and why
   adding one intent touches six files.
2. **"Rescue" as an action-rewriting layer is deleted, not tuned.** 163 `tryRescue*` methods that
   can overwrite a correct classification *are* the steal machine. This is the direct answer to
   *"no wrong commands to be stolen from a right command."*
3. **A planner replaces the classifier.** The unit of understanding becomes a **CommandPlan**
   (N commands + dependencies), not a single `action` string. This is required by the headline
   use case and is the piece **both** source documents are missing entirely.

**Vector database: no.** Detailed reasoning in §5 — the corpus is ~1,100 vectors; in-memory
cosine already exists and is correct at this scale. If/when few-shot retrieval outgrows it, use
`pgvector` on the Postgres already in production. Adding a dedicated vector service would buy
nothing and add a hot-path network dependency.

---

## 1. Evidence base (measured, not assumed)

Both source docs quote inventory numbers that disagree. Ground truth from the current tree:

| Signal | AI-TODO claim | Regex.MD claim | **Measured** |
|---|---|---|---|
| `export function is*Prompt` | ~141 files w/ regex | ~780 / ~308 files | **786 across 310 files** |
| `tryRescue*` methods | 159 | "large" | **163** |
| Registry action groups | — | — | **110** |
| Golden eval cases | ~8,294 (claimed) | — | **594 `prompt:` rows** |
| Intent anchor bank | assumed populated | assumed populated | **empty (59-line stub)** |

Regex.MD's inventory is accurate; AI-TODO's is stale. **The anchor bank being empty matters a
lot**: both documents lean on "migrate detectors → semantic anchors," but that target layer does
not exist yet.

### 1.1 Production reality — 5,362 real traces in `ai_command_trace`

| Outcome | Count | Share |
|---|---:|---:|
| executed | 3,433 | **64.0%** |
| **failed** | **1,448** | **27.0%** |
| clarified | 377 | 7.0% |
| security_blocked | 77 | 1.4% |
| approval | 27 | 0.5% |

Worst actions by failure rate (≥40 calls):

| Action | Calls | % failed |
|---|---:|---:|
| `claim_referral_code` | 96 | **100.0%** |
| `error` | 59 | 100.0% |
| `confirm_my_booking_details` | 134 | 76.1% |
| **`compound_intent`** | **380** | **61.8%** |
| `explain_provider_specialty` | 44 | 61.4% |
| `pay_online` | 63 | 60.3% |
| `create_booking` | 113 | 58.4% |
| `book_appointment` | 44 | 52.3% |
| `reschedule_booking` | 105 | 41.9% |

**This inverts the priority of both source documents.** They are ~90% about *picking the right
action*. The data says: **more than 1 in 4 commands fails**, and the multi-command path
(`compound_intent`) — precisely the capability you want to make central — fails **62%** of the
time. Core mutations (`create_booking`, `book_appointment`, `reschedule_booking`) fail 42–58%.

Classification accuracy is a real problem, but **completion is the bigger one**, and no metric in
either document measures it.

### 1.2 We currently cannot measure steals

`source` is `llm` for 99.8% of traces (`deterministic` fires 13 times in 5,362). But rescue
rewrites the action *after* classification and the trace still records `source: llm`. So the
single most damaging failure mode — a regex stealing a correct action — **is invisible in
telemetry today**. Regex.MD's `A.2` (`rescuedFrom`/`rescuedTo`/`detectorId`) is therefore a
prerequisite for almost everything else, and is promoted to Phase 1 here.

### 1.3 Corroborating bug evidence (this session)

Every one of these is the same disease — independent detectors racing, order-dependent, each
able to overwrite the others:

- **e2e-bug.344** — `confirm_my_booking_details` stole availability questions via a greedy `.*`.
- **e2e-bug.346** — `explain_provider_specialty` stole "tell me about this booking"; the fix
  (a determiner rule) also resolved a *separately tracked* year-old bug, showing these are one
  family, not 780 individual bugs.
- **e2e-bug.349** — a **customer** cart action (`add_services_to_cart`) won a **dashboard**
  request: surface scoping is by convention, not enforcement.
- **e2e-bug.342** — two actions had no registry row → permanently unreachable, silently.
- **e2e-bug.347** — one prompt hit **five** independent parsing defects.

---

## 2. What was merged, and what was deleted

### 2.1 Duplicates collapsed

| Concern | AI-TODO | Regex.MD | Resolution |
|---|---|---|---|
| Rescue must not beat a confident classifier | Phase 3 | §8.4, B.5, S1 | **One item** → Phase 3 (delete override capability outright) |
| Surface scoping for rescue/detectors | Phase 4 | §7, inventory `surfaces[]` | **One item** → registry-declared surfaces, Phase 1 |
| Input normalization | Phase 7 | B.6 (`acc-3.7`) | **One item** → Phase 4 (resolution layer) |
| Clarify instead of guessing | Phase 6, S3 | §8.3 Ambiguity, F.1 | **One item** → Phase 6 |
| Paraphrase invariance eval | Phase 2, S5 | B.3, nightly eval | **One item** → Phase 2 |
| Production feedback loop | Phase 5 | Phase E, A.5 | **One item** → Phase 9 |
| Accuracy gate green + blocking | Phase 1 | A.3 | **One item** → Phase 2 |
| Replace regex with semantics | S4 (vague) | §5 waves W1–W13 (rigorous) | Keep **Regex.MD's** machinery; see 2.2 |

### 2.2 Deliberately removed / redesigned

- **AI-TODO Phases S1–S5 deleted as a separate track.** They restate foundation phases 1–7 with
  cross-references and add no distinct work.
- **Per-detector "migrate to anchors" factory (Regex.MD §5.3) is dropped for the majority of
  detectors.** Migrating 786 detectors one-by-one to anchors is ~786 units of work to rebuild a
  capability the planner provides for free. **Redesign:** once the planner owns a domain and
  passes that domain's eval, its detectors are deleted **in bulk by file**, not migrated
  individually. Only detectors that survive triage as `structural_slot` / `confirm_gate` /
  `compound_connector` are kept. Expected: ~786 → **<100 kept structural**, with perhaps 20–40
  genuinely needing an anchor equivalent.
- **The 13 domain waves (W1–W13) are re-cut as 6 domain slices** aligned to the registry's
  domains rather than to util-file layout, because the registry becomes the unit of truth.
- **"Semantic anchors as the primary paraphrase mechanism" is demoted.** With a registry-derived
  shortlist + few-shot retrieval from real traces, anchors are a tiebreaker, not the engine.
  Building 110×5×3-locale anchors by hand (Regex.MD's `acc-3.16`) is large, perishable, and
  mostly redundant.

### 2.3 Added (absent from both documents)

1. **CommandPlan / multi-command extraction** — the headline requirement.
2. **Execution engine** — dependency DAG, transactional grouping, partial-failure semantics,
   compensation.
3. **Conversation state & memory** — turn buffer, resolved-entity store, topic-change detection,
   follow-up reference resolution.
4. **Entity resolution as one service** — today ≥4 code paths re-parse names/dates independently.
5. **Completion-rate as the north-star metric** — the 27% failure rate is currently unowned.
6. **Bulk operations as a first-class command shape.**

---

## 3. Target architecture

```
                       ┌───────────────────────────────────────────┐
   user message ──────►│  1. Context Assembly                      │
                       │     turn buffer · resolved entities ·     │
                       │     pending clarify · surface · actor     │
                       └──────────────────┬────────────────────────┘
                                          ▼
                       ┌───────────────────────────────────────────┐
                       │  2. Planner  (LLM, structured output)     │
                       │     registry-derived shortlist (top-K)    │
                       │     + few-shot from real traces           │
                       │     → CommandPlan { steps[], deps[] }     │
                       └──────────────────┬────────────────────────┘
                                          ▼
                       ┌───────────────────────────────────────────┐
                       │  3. Resolution   (deterministic)          │
                       │     names→IDs · dates→ISO · times→24h ·   │
                       │     pronouns/anaphora → prior entities    │
                       └──────────────────┬────────────────────────┘
                                          ▼
                       ┌───────────────────────────────────────────┐
                       │  4. Validation   (registry JSON Schema)   │
                       │     required vars · types · permissions · │
                       │     surface legality · risk tier          │
                       └──────────────────┬────────────────────────┘
                                          ▼
                    ┌─────────────────────┴────────────────────┐
              all valid                                  anything unresolved,
              & confident                                ambiguous, or over-risk
                    ▼                                            ▼
      ┌─────────────────────────────┐              ┌──────────────────────────┐
      │ 5. Execution Engine         │              │ 5'. Clarify / Confirm    │
      │    DAG · transactions ·     │              │     targeted question,   │
      │    compensation · partial   │              │     top-2 options, or    │
      │    success is first-class   │              │     preview+confirm      │
      └──────────────┬──────────────┘              └────────────┬─────────────┘
                     ▼                                          │
      ┌─────────────────────────────┐                           │
      │ 6. Verify + Respond         │◄──────────────────────────┘
      │    post-exec assertions ·   │
      │    rollback on mismatch     │
      └──────────────┬──────────────┘
                     ▼
      ┌─────────────────────────────┐
      │ 7. Persist                  │  trace + memory + learning signal
      └─────────────────────────────┘
```

**Regex's remaining role:** step 3 only (structural extraction — IDs, codes, dates, tokens).
It never chooses a command. This is the one policy both source docs agree on and it is kept
verbatim.

### 3.1 The registry entry becomes the contract

Everything else is *generated* from this. One place to add a command:

```ts
{
  id: 'appointment.reschedule',
  aliases: ['reschedule_booking'],          // back-compat with today's flat names
  domain: 'appointment',
  surfaces: ['dashboard', 'provider', 'customer'],
  risk: 'T1',                                // T0 read · T1 mutate · T2 money/PII · T3 bulk
  description: 'Move an existing appointment to a new date/time.',
  variables: {                               // JSON Schema — the ONLY param definition
    appointmentId: { type: 'string', resolver: 'appointment', required: true },
    newStart:      { type: 'string', format: 'date-time', resolver: 'datetime', required: true },
    providerId:    { type: 'string', resolver: 'employee', required: false },
  },
  examples: [                                // few-shot seed + eval golden + paraphrase base
    'move John\'s 3pm to tomorrow at 4',
    'push my Tuesday facial back an hour',
  ],
  confirm: 'if-ambiguous',                   // never | if-ambiguous | always
  handler: 'BookingService.reschedule',
  bulkOf: null,                              // or the single-item command this batches
}
```

Derived automatically: classifier shortlist, tool/function definitions, validation, permission
checks, surface gating, coverage tests, docs, and the "is this action reachable?" meta-test that
would have caught e2e-bug.342.

**Naming:** adopt `domain.verb` (`appointment.update`, `patient.create`) as requested, with
`aliases` preserving today's flat names so nothing breaks during migration.

### 3.2 CommandPlan

```jsonc
{
  "planId": "…",
  "steps": [
    { "id": "s1", "command": "appointment.update",
      "variables": { "appointmentId": "…", "newStart": "2026-08-04T15:00:00Z" },
      "confidence": 0.94, "dependsOn": [] },
    { "id": "s2", "command": "appointment.cancel",
      "variables": { "appointmentId": "…" },
      "confidence": 0.91, "dependsOn": [] },
    { "id": "s3", "command": "patient.create",
      "variables": { "name": "David" },
      "confidence": 0.88, "dependsOn": [] },
    { "id": "s4", "command": "appointment.create",
      "variables": { "patientId": "$s3.id", "date": "2026-08-07" },
      "confidence": 0.85, "dependsOn": ["s3"] }
  ],
  "unresolved": [],
  "topicChanged": false
}
```

`$s3.id` is the dependency mechanism — step 4 consumes step 3's output. This is what makes
"create a patient **and** book them" work as one message.

### 3.3 Execution semantics

| Situation | Behavior |
|---|---|
| Independent steps | Execute in parallel where safe; **partial success is reported honestly**, never as blanket success |
| Dependent steps (`dependsOn`) | Sequential; downstream steps skipped (not failed) if upstream fails |
| Same aggregate, multiple writes | Single DB transaction |
| Cross-aggregate (booking + payment) | Saga with explicit compensation per step |
| Any T2/T3 step in the plan | Whole plan requires preview + confirm before any write |

**Partial-success honesty is a hard requirement.** This session found three separate false-success
bugs (e2e-bug.136 `clear_schedule`, e2e-bug.348 "category created" when it wasn't, e2e-bug.256
clinic compounds). The response must be built from execution *results*, never from restating the
request.

### 3.4 Memory — three tiers, none of them vector

| Tier | Contents | Store | Lifetime |
|---|---|---|---|
| **Turn buffer** | last N messages verbatim | request/session cache | session |
| **Entity store** | resolved refs: `"John" → employeeId`, `lastAppointmentId`, `activeCustomer` | Postgres, keyed by session | session + short TTL |
| **Profile facts** | durable prefs: default provider, locale, comms prefs | Postgres, keyed by user | permanent |

Follow-ups ("move it to 4 instead", "cancel that one") resolve against the **entity store** —
structured lookup, not similarity search. This is exact, debuggable, and cheap. Embedding-based
memory would be strictly worse here: "it" must resolve to a specific booking ID, and approximate
nearest-neighbour is the wrong tool for an exact reference.

**Topic change** is an explicit planner output (`topicChanged`), which invalidates stale entity
bindings so "cancel it" after a topic switch clarifies rather than cancelling the previous
subject.

---

## 4. Why the planner, not more detectors

The steal problem is structural. With 786 detectors + 163 rescue methods, any new command can be
hijacked by any of ~950 independent matchers, and the winner depends on execution order. Every
fix that inserts an earlier guard makes the ordering more fragile — Regex.MD §8.4 already
identifies this anti-pattern.

A single planner that receives a **shortlist of candidate commands with descriptions and
examples** has no ordering problem: there is exactly one decision point. "No wrong command stolen
from a right command" is achieved by *removing the entities capable of stealing*, not by tuning
them.

**Guardrails so the planner cannot become the new steal machine:**

1. Shortlist is filtered by **surface + permission before** the planner sees it — a customer cart
   command is not a candidate on a dashboard request (kills e2e-bug.349's class structurally).
2. Planner output is **validated against the registry schema**; unknown command → clarify, never
   fallback.
3. Confidence gate + top-2 margin → clarify (never guess).
4. Every plan is traced with the full candidate set, so steals become measurable for the first
   time.

---

## 5. Vector database: not needed — recommendation and reasoning

**Verdict: do not adopt a dedicated vector database (Pinecone / Weaviate / Qdrant / Chroma).**

**Sizing the actual corpora:**

| Corpus | Size today | Realistic ceiling |
|---|---:|---:|
| Intent anchors (110 commands × ~10) | ~1,100 vectors | ~3,000 |
| Few-shot examples from traces | 5,362 rows | ~1M over years |
| Product-guide / help content | small | ~10k |

At 1,100 vectors, brute-force cosine in Node is **sub-millisecond** and already implemented
(`ai-embedding-index.util.ts`). A network round-trip to a vector service would be ~100× slower
than the computation it replaces, on the hot path of every user message.

**When retrieval genuinely outgrows memory** (few-shot mining across ~1M traces), the answer is
**`pgvector` on the Postgres you already run** — not new infrastructure:

- The traces already live in Postgres (`ai_command_trace`, 5,362 rows and growing).
- Retrieval needs **filtering by `business_id`, `surface`, `outcome`, and recency** *combined
  with* similarity. That is a hybrid query. In a dedicated vector DB, metadata filtering is a
  second-class citizen; in Postgres it is a `WHERE` clause with real indexes.
- No sync pipeline, no dual-write consistency problem, no extra failure domain, no extra bill.
- HNSW in pgvector comfortably serves millions of rows at this query rate.

**The deeper point:** embeddings are not the accuracy lever here. Retrieval quality is bounded by
*how well each command is specified* — description, examples, variable schema. A precise registry
with a 10–15 command shortlist will beat a vector search over vague command descriptions every
time. Both source documents over-index on the semantic/anchor layer (and Regex.MD's `acc-3.16`
would hand-author 110×5×3 anchors); that effort is better spent on the registry and the planner.

**Decision:** in-memory cosine now → `pgvector` when trace-mined few-shot retrieval ships
(Phase 9) → revisit a dedicated vector DB only if a corpus exceeds ~10M vectors or needs
multi-region low-latency serving. Neither is on the horizon.

---

## 6. Phases

Effort estimates assume one focused engineer; they are rough.

### Phase 0 — Freeze & inventory *(1–2 weeks)*
- [ ] **Freeze:** no new `is*Prompt` paraphrase detector, no new `tryRescue*`. Exceptions need an
      inventory row + owner + 14-day expiry (Regex.MD §12.10, kept).
- [ ] AST scan → `ai-command-inventory.json`: every one of the 786 detectors labelled
      `legacy_paraphrase | structural_slot | confirm_gate | compound_connector | routing_shape`,
      with `mapsToActions`, `surfaces`, `wiredInRescue`, `fixtureIds`.
- [ ] CI `test:ai-inventory` — symbol count in repo == inventory rows; zero `unknown`.

### Phase 1 — Registry as single source of truth *(3–4 weeks)* ← foundational
- [ ] Define the entry shape (§3.1); migrate all 110 command groups, adding `domain.verb` ids +
      `aliases`, `risk`, `variables` JSON Schema, `examples`, `confirm`, `surfaces`.
- [ ] Generate from it: classifier shortlist, tool/function defs, validation, surface gating,
      permission checks.
- [ ] **Reachability meta-test** — every registry command must be reachable on every declared
      surface (catches e2e-bug.342 permanently).
- [ ] **Telemetry gap (Regex.MD A.2, promoted):** add `classifiedAction`, `finalAction`,
      `rescueDetectorId`, `candidateSet` to `ai_command_trace` — steals become measurable.

### Phase 2 — Make the gates real *(1–2 weeks)*
- [ ] Refresh the stale accuracy baseline; make the gate blocking (AI-TODO Phase 1).
- [ ] Fix/quarantine the pre-existing failing AI suites so red means red.
- [ ] Paraphrase-invariance fixtures generated from registry `examples` (AI-TODO Phase 2) — but
      generated from the registry, not hand-authored per intent.
- [ ] **New: completion-rate dashboard** by action/surface — the 27% number gets an owner.

### Phase 3 — Planner + multi-command extraction *(4–6 weeks)* ← headline
- [ ] Planner service: context + shortlist + few-shots → `CommandPlan` via structured output.
- [ ] Registry-schema validation of plan output; unknown/invalid → clarify.
- [ ] **Delete rescue's ability to change `action`.** Rescue survives only as structural
      enrichment / confirm / security. This is the steal fix.
- [ ] Golden plan fixtures — multi-command messages (incl. the John/Mary/David example) assert
      the exact extracted plan.
- [ ] Ship behind a flag; shadow-run against the live classifier and compare before switching.

### Phase 4 — Resolution layer *(3 weeks)*
- [ ] One `EntityResolutionService`: names→IDs, services→IDs, dates/times→ISO, relative ranges.
      Replaces ≥4 independent re-parsers (root cause of e2e-bug.169 and this session's
      `resolveService` gaps).
- [ ] Confidence on every resolution; below threshold → clarify, **never silent pick**.
- [ ] Anaphora resolution against the session entity store ("it", "that one", "the same time").

### Phase 5 — Execution engine *(4 weeks)*
- [ ] DAG executor with `dependsOn` + `$stepId.field` wiring.
- [ ] Transactional grouping per aggregate; saga + compensation cross-aggregate.
- [ ] **Honest partial success** — response built from results only.
- [ ] Bulk command shape (`bulkOf`) with blast-radius caps (Regex.MD `acc-5.7`, kept).
- [ ] Idempotency keys per step so retries cannot double-write.

### Phase 6 — Conversation state & clarify *(3–4 weeks)*
- [ ] Turn buffer + entity store + profile facts (§3.4).
- [ ] Topic-change detection invalidating stale bindings.
- [ ] Clarify as a **first-class outcome**: targeted question naming missing variables and top-2
      candidates. Fix the broken guide-handoff template (AI-TODO Phase 6).
- [ ] Multi-turn slot filling: a clarify answer merges into the pending plan rather than
      restarting understanding.

### Phase 7 — Safety rails *(parallel from Phase 3)*
Adopted wholesale from Regex.MD §8 — the strongest part of either document.
- [ ] Risk tiers T0–T3 with per-tier gates; T2/T3 always preview + confirm.
- [ ] Self-verify blocks execute on fail (not log-only).
- [ ] Post-exec assertion + rollback for T2/T3.
- [ ] New commands ship **propose-only** until they clear the accuracy bar.

### Phase 8 — Detector retirement *(2 quarters, parallel)*
Six slices by registry domain, not by util file: `appointment` → `catalog` → `payment` →
`customer` → `staff/schedule` → `long tail`.
Per slice: planner passes that domain's eval → shadow-compare 7 days → **bulk-delete the slice's
`legacy_paraphrase` detectors** → inventory + CI updated.
- [ ] Exit: zero `legacy_paraphrase` remaining; rescue cannot alter `action`.

### Phase 9 — Learning loop *(ongoing)*
- [ ] Mine traces for misses: undo-within-1-min, rephrase-retry, explicit feedback, failures.
- [ ] Each confirmed miss → registry `example` + eval case (**never** a new regex).
- [ ] Few-shot retrieval from labelled traces → this is where **pgvector** lands (§5).
- [ ] Ratcheting accuracy + completion floors.

---

## 7. Metrics

| Metric | Today | Target |
|---|---:|---:|
| **Command completion rate** | **64.0%** | **≥ 92%** |
| `compound_intent` / multi-command completion | **38.2%** | **≥ 90%** |
| Wrong silent mutation (T2/T3) | unmeasured | **≈ 0** (incident-reviewed) |
| Steal rate (`classifiedAction ≠ finalAction`) | **unmeasurable** | measured → ≈ 0 |
| Clarify → success next turn | unmeasured | ≥ 90% |
| `legacy_paraphrase` detectors | 786 | **0** |
| Commands reachable on all declared surfaces | unverified | 100% (meta-test) |
| Files touched to add one command | ~6 | **1** |

Completion rate is the north star. Everything else is diagnostic.

---

## 8. Working agreements

1. **Regex for slots; the planner for verbs.** Unchanged from Regex.MD — the one rule both docs
   share.
2. Nothing may overwrite the planner's chosen command. Ambiguity → clarify.
3. A command exists only if it is in the registry; the registry generates everything else.
4. Never report success for work that did not happen — build responses from results.
5. Below-threshold entity resolution clarifies; it never guesses.
6. Misses become registry examples + eval cases, never new regex.
7. Delete detectors by slice only after the planner owns that domain in shadow.
8. New commands are propose-only until they clear the bar; T2/T3 need confirm + post-exec plan.

---

## 9. Open decisions

1. **Planner model + budget.** One strong model for planning vs. a cheap router + strong planner
   for complex messages. Needs a latency/cost measurement on real traces before committing.
2. **`domain.verb` migration** — big-bang rename with aliases, or alias-only until Phase 8?
   (Recommendation: aliases from day one, flat names deprecated but never removed.)
3. **Shadow duration** before deleting a detector slice (recommendation: 7 days or 500 traces,
   whichever is later).
4. **Transaction boundaries** for cross-aggregate plans — full saga vs. best-effort + compensation
   only for T2/T3.
5. **Whether the planner may invent multi-step plans not explicitly requested** (e.g. "book David"
   implying `patient.create`). Recommendation: yes, but always surfaced in the preview.
6. Blast-radius caps per tier.
7. Whether `claim_referral_code` (100% failure, 96 attempts) is broken or simply unreachable —
   should be triaged immediately; it may be a quick win independent of this roadmap.

---

## 10. Sequencing at a glance

```
Q1  ── Phase 0 ── Phase 1 ────────── Phase 2 ──┐
                    (registry)      (gates)    │
                                               ▼
Q1/Q2 ─────────── Phase 3 (planner) ── Phase 4 (resolution) ── Phase 5 (execution)
                        │                                            │
                        └──────── Phase 7 (safety, parallel) ────────┘
                                               │
Q2/Q3 ─────────── Phase 6 (memory) ── Phase 8 (retirement, parallel) ── Phase 9 (learning)
```

Phases 1–3 are the critical path. Phase 8 (deleting 786 detectors) is the largest *volume* of
work but the lowest risk once the planner is authoritative — and it gets dramatically cheaper by
deleting in slices rather than migrating detector-by-detector.

---

*Merged from `AI-TODO.md` (2026-07-19) and `Regex.MD` (2026-08-01) on 2026-08-03. Inventory and
production figures measured against the tree and `ai_command_trace` at merge time.*
