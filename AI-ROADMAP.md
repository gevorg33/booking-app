# AI-ROADMAP — OptiSchedule AI-first platform

**Supersedes:** `AI-TODO.md` (semantic intent matching) and `Regex.MD` (regex retirement + safety).
Both remain in the repo for provenance only; **this file is the single source of truth.**

**Date:** 2026-08-03
**Status:** PROPOSED — no implementation started
**Horizon:** ~2–3 quarters to the full end state; useful value lands from Phase 2 onward.

---

## 0.0 How to read the numbers in this document — e2e-bug.416

**The trace corpus is a defect finder, not a priority signal.** Read before quoting any figure below
that is weighted by traffic.

`ai_command_trace` holds 5,362 rows from **5 businesses and 27 users**, 95% of them from a single
business. **75% of traces repeat an earlier prompt**: "Help me with this page" appears 125 times
across 2 days with zero distinct users. Customer-surface rows are recorded with `role = owner` and a
null `user_id`. It is the output of a QA script, and traffic stopped **2026-08-03**.

That does **not** weaken the defect evidence. A command failing 96 of 96 with empty params
(`e2e-bug.410`) is broken at any volume, and the routing and telemetry findings in §134–§138 were
established by reading and running code — the traces only pointed at them.

It does mean **every traffic-weighted claim in this document describes the script's shape, not
demand.** In particular:

| where | what to distrust |
|---|---|
| §1.1, `e2e-bug.361` | "customer carries 69% of traffic" — surface mix is the script's |
| §133 | the per-action *ranking* by volume; the per-command failure rates stand |
| §92, §119, §128, §130 | trace-weighted recovery; §130 showed one prompt can carry 4 traces, so a single flip moves it two points |
| §128 | per-domain sample sizes — already too small for a 90% bar (`e2e-bug.406`), and also not a sample of demand |

**Two rules that follow.** Prefer prompt-weighted counts to trace-weighted ones — §130's two identical
baseline runs scored 30.6% and 32.4% while both landed on 27 and 28 prompts. And prioritise by defect
evidence, never by volume, until real traffic exists.

Sections written before §139 quote these figures without the caveat. They are left as written — they
record what was believed when the decision was taken — and this note is the correction that applies to
all of them.

**Not yet solved:** distinguishing synthetic from live traffic *at write time*, so this is answerable
by query rather than by forensics. That needs whoever owns the QA harness to mark its requests;
adding a column nothing sets would repeat the failure this programme keeps finding.

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
| Registry seed groups | — | — | **110** |
| Registry entries (actual commands) | — | — | **696** |
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
- [x] **Freeze:** no new `is*Prompt` paraphrase detector, no new `tryRescue*`. Exceptions need an
      inventory row + owner + 14-day expiry (Regex.MD §12.10, kept).
      **Shipped 2026-08-03** — `ai-detector-freeze.boundary.spec.ts` ratchets both counts;
      they can only go down. `npm run test:ai-detector-freeze` prints the burn-down.
      *Amended 2026-08-05:* the scan root was `modules/ai`, so four detectors elsewhere were
      never frozen at all. Widened to `src`; baseline 786 → **790** (§22).
- [x] AST scan → `ai-command-inventory.json`: every one of the 786 detectors labelled
      `legacy_paraphrase | structural_slot | confirm_gate | compound_connector | routing_shape`,
      with `mapsToActions`, `surfaces`, `wiredInRescue`, `fixtureIds`.
      **Shipped 2026-08-05** — 785 rows, zero untriaged. See §22.
- [x] CI `test:ai-inventory` — symbol count in repo == inventory rows; zero `unknown`.
      **Shipped 2026-08-05** — plus a drift gate (`npm run build:ai-inventory` regenerates).
      **Phase 0 is complete.**

### Phase 1 — Registry as single source of truth *(3–4 weeks)* ← foundational
- [x] Define the entry shape (§3.1) — `ai-command-spec.types.ts`, **shipped 2026-08-03**.
- [x] Generate from it: classifier shortlist, tool/function defs, validation, surface gating —
      `ai-command-spec.derive.ts`, **shipped 2026-08-03**. See §13.
- [x] Pilot the shape on one domain (`appointment`, 8 commands) with a conformance suite proving
      it does not drift from the live registry — **shipped 2026-08-03**.
- [x] Second pilot domain (`catalog`, 8 commands) to test generalisation — **shipped 2026-08-03**.
      Forced two real extensions to the contract; see §14.
- [x] Port the remaining registry entries domain by domain, deleting each hand-maintained
      parallel list as its domain lands. **COMPLETE 2026-08-07: 696 of 696 specced**, across
      §56–§66. All 30 `apiModule` slices ported. The final one, `ai-command`, was the catch-all the
      roadmap flagged for splitting — 194 entries across **30 handlers**, split into eight real
      domains (§66). Remaining follow-up: deleting the hand-maintained parallel lists now that every
      command has a spec (e2e-bug.379).
### Phase 2 — Make the gates real *(1–2 weeks)*
- [x] Refresh the stale accuracy baseline; make the gate blocking (AI-TODO Phase 1) —
      **shipped 2026-08-05**, see §25. Baseline was five weeks stale (3,696 cases vs 8,464);
      the gate demanded zero failures and so had never passed. Now a ratchet on the committed
      baseline. Found 24 intents that regressed under cover of the permanent red — e2e-bug.358.
- [x] Fix/quarantine the pre-existing failing AI suites so red means red —
      **shipped 2026-08-05**, see §26. `scripts/ai-known-failures-gate.mjs` +
      `npm run test:ai-known-failures` ratchets the AI failure set both ways: a failure not in the
      manifest fails the build, and a quarantined test that starts passing must be un-quarantined.
      Baseline **105 suites / 463 failing tests**, categorised by cause. The suites are *quarantined,
      not fixed* — that burn-down is e2e-bug.351, and the sweep runtime that let them accumulate is
      e2e-bug.359.
- [x] Paraphrase-invariance fixtures generated from registry `examples` (AI-TODO Phase 2) —
      **shipped 2026-08-06**, see §27. Generated from `CommandSpec.examples`, replacing acc-3.16's
      hand-authored 5×3-locale corpus. Result inverts the expectation: mechanical variation breaks
      **0 of 116**, but **8 of 20** documented examples never reach their own detector
      (e2e-bug.360).
- [x] **New: completion-rate dashboard** by action/surface — **shipped 2026-08-06**, see §28.
      Four SQL views + `GET .../ai/completion-rate`, both reproducing §1.1 exactly. Found the 27%
      is concentrated on `customer` (60.6% completion vs provider's 82.5%) — e2e-bug.361.
      **Phase 2 is complete.**

### Phase 3 — Planner + multi-command extraction *(4–6 weeks)* ← headline
- [x] `CommandPlan` shape + **deterministic validation spine** — **shipped 2026-08-03**, see §15.
- [x] Registry-schema validation of plan output; unknown/invalid → clarify — **shipped**.
- [x] Prompt assembly generated from specs, per surface — **shipped 2026-08-03**, see §16.
- [x] Defensive structured-output decoding (never throws, repairs syntax, refuses to invent
      meaning) — **shipped 2026-08-03**, see §16.
- [x] `AiCommandPlannerService` wiring prompt → `openAi.chatCompletion` → decode → validate —
      **shipped 2026-08-03**, registered in `ai.module.ts`. See §17.
- [x] Record the resulting plan on `ai_command_trace` + shadow-comparison views —
      **shipped 2026-08-03**, see §18.
- [x] Call the planner from the surface gateways behind a flag — **shipped 2026-08-04**, see §19.
      `AI_PLANNER_SHADOW_SURFACES` opts a surface in; off by default, cannot add latency, cannot
      fail a request, cannot reach the user.
- [x] Few-shot retrieval from labelled traces (Phase 9) — **shipped 2026-08-07**, see §52. Built on
      the existing in-memory cosine index per §5's decision; pgvector remains unneeded at this
      scale. The load-bearing finding is that **"labelled" cannot mean "executed"**: only 68.2% of
      executed traces belong to intents the eval scores >=90%, and `compound_intent` has 139
      executed rows at 0%.
- [x] **Delete rescue's ability to change `action`** — *first slice shipped 2026-08-04*, see §20.
      Rescue can no longer swap a real classification for a **different mutating** command.
      Read-only→read-only changes remain until their detectors retire in Phase 8.
- [x] Golden plan fixtures — multi-command messages (incl. the John/Mary/David example) assert
      the exact extracted plan — **shipped 2026-08-04**, see §21.
- [x] Ship behind a flag; shadow-run against the live classifier — **shipped 2026-08-04** (§19).
      *Comparing* is now a data-gathering activity, not an engineering one: let the shadow run
      accumulate traffic, then work `ai_command_plan_shadow_disagreement` before switching.

### Phase 4 — Resolution layer *(3 weeks)*
- [x] One `EntityResolutionService`: names→IDs, services→IDs, dates/times→ISO, relative ranges.
      Replaces ≥4 independent re-parsers (root cause of e2e-bug.169 and this session's
      `resolveService` gaps).
      **Entities** (§29), **dates** (§30) and **times** (§31) shipped 2026-08-06 —
      `ai-entity-resolution.util.ts`, `ai-datetime-resolution.util.ts`.
      **Ranges** extended in place (§32) — `resolveDateRange` was already timezone-correct, so it
      gained the missing patterns rather than a competing parser.
      **The service** shipped 2026-08-07, see §46 — one injectable seam over §29–§32, registered in
      `AiModule`. The roadmap's "≥4" was measured at **15**; 14 are now held by a ratchet that can
      only shrink, so the count cannot grow while the migration proceeds.
      **Remaining:** the call-site migration itself (e2e-bug.367). Adoption is a behaviour change —
      the resolvers refuse where the old ones guessed — so each handler needs its clarify path
      wired before it can switch.
- [x] Confidence on every resolution; below threshold → clarify, **never silent pick** —
      **shipped 2026-08-06** for entity resolution, see §29. Every result carries a tier, a score
      and the alternatives that tied; ties refuse regardless of confidence.
- [x] Anaphora resolution against the session entity store ("it", "that one", "the same time") —
      **shipped 2026-08-07**, see §49, but **not against a session store**. Measuring 110 real
      anaphoric prompts shows **82% carry their referent in the same message** and only ~1 in 110 is
      genuine cross-turn. Intra-message resolution shipped; the session store is left to
      e2e-bug.357 with the measurement recorded, rather than built to serve 1%.

### Phase 5 — Execution engine *(4 weeks)*
- [x] DAG executor with `dependsOn` + `$stepId.field` wiring — **shipped 2026-08-06**, see §33.
      Pure orchestration with an injected step runner; refuses non-executable plans, wires step
      outputs into later steps, and skips (never fails) downstream steps.
- [x] Transactional grouping per aggregate; saga + compensation cross-aggregate —
      **shipped 2026-08-07**, see §47. `compensatedBy` landed as a tagged `CommandCompensation`
      union, because 6 of the 14 mutating specs cannot be undone at all and a bare command id
      cannot say so. Pure orchestration with an injected runner, as §33; handler wiring is
      e2e-bug.368.
      **Deliberately not started** — `CommandSpec` has no compensation model (no `compensatedBy`),
      and a transaction boundary needs real handlers behind `StepRunner`. Building the frame now
      would be an empty one. See §34.
- [x] **Honest partial success** — response built from results only — **shipped 2026-08-06**,
      see §34. `buildPlanResponse` takes `StepResult[]` and nothing else: the prompt and the plan
      are not parameters, so the response cannot restate the request.
- [x] Bulk command shape (`bulkOf`) with blast-radius caps (Regex.MD `acc-5.7`, kept) —
      **shipped 2026-08-06**, see §35. Per-tier confirm/refuse thresholds; confirmation can satisfy
      the confirm bar but never the refusal one. Also answers §9 open decision 6.
- [x] Idempotency keys per step so retries cannot double-write — **shipped 2026-08-06**, see §36.
      Deterministic per (request, step, command, resolved variables); nothing time-varying.

### Phase 6 — Conversation state & clarify *(3–4 weeks)*
- [x] Turn buffer + entity store + profile facts (§3.4) — all three tiers shipped 2026-08-07.
      **Turn buffer** (§50): already arriving as `AiCommandDto.history`, unconsumed; now bounded.
      **Entity store** (§53): its own tier, conversation-scoped by construction, keyed by §51's
      derived `session_id`. **Profile facts** (§54): a *read model*, not the table §3.4 assumed —
      `users.locale` already exists and default-provider is derivable from `bookings`, so storing
      either would create a second source of truth. Population/wiring: e2e-bug.373, e2e-bug.374.
- [x] Topic-change detection invalidating stale bindings — **shipped 2026-08-07**, see §48.
      `CommandPlan.topicChanged` was already prompted for and decoded, and consumed by nothing;
      the invalidation half is what was missing. Lexical similarity was measured on 40 real pairs
      and **rejected** — the corpus is trilingual, so token overlap measures language, not subject.
- [x] Clarify as a **first-class outcome**: targeted question naming missing variables and top-2
      candidates. Fix the broken guide-handoff template (AI-TODO Phase 6) —
      **shipped 2026-08-06**, see §37. Structured `ClarifyRequest` with renderable options, fed by
      the §29–§31 resolvers; clarify no longer swallowed by the guide fallback.
- [x] Multi-turn slot filling: a clarify answer merges into the pending plan rather than
      restarting understanding — **shipped 2026-08-06**, see §38. State round-trips through the
      client like compound resume already does, so this did **not** need the blocked session store.

### Phase 7 — Safety rails *(parallel from Phase 3)*
Adopted wholesale from Regex.MD §8 — the strongest part of either document.
- [x] Risk tiers T0–T3 with per-tier gates; T2/T3 always preview + confirm —
      **shipped 2026-08-06**, see §39. The tier now decides at runtime, not just the declared
      `confirm` policy, and the preview describes the operation rather than the request.
- [x] Self-verify blocks execute on fail (not log-only) — **shipped 2026-08-06**, see §40.
      A failed verification now blocks any **mutating** command whatever the confidence; reads keep
      the confidence gate. First live-pipeline behaviour change of this programme.
- [x] Post-exec assertion + rollback for T2/T3 — **shipped**. **Assertion** 2026-08-06 (§41): a
      T2/T3 step that reports success without evidencing the row it touched is treated as failed.
      **Rollback model** 2026-08-07 (§47). **Rollback wired into the executor** 2026-08-07 (§55):
      `executePlan` now captures pre-state before each step and runs the saga on a partial failure,
      via injected seams in the §33 style. Note §47's finding that T2 is declared *irreversible* by
      design, so "rollback for T2" resolves to strand-and-report, not undo. Concrete per-command
      capture readers remain handler work (e2e-bug.368, rescoped).
- [x] New commands ship **propose-only** until they clear the accuracy bar —
      **shipped 2026-08-06**, see §42. Joins §25's per-intent baseline to the rule; 184 of 527
      intents do not currently clear it, including `compound_intent` at 0%.

### Phase 8 — Detector retirement *(2 quarters, parallel)*
Six slices by registry domain, not by util file: `appointment` → `catalog` → `payment` →
`customer` → `staff/schedule` → `long tail`.
Per slice: planner passes that domain's eval → shadow-compare 7 days → **bulk-delete the slice's
`legacy_paraphrase` detectors** → inventory + CI updated.
- [ ] Exit: zero `legacy_paraphrase` remaining; rescue cannot alter `action`.
      **Second half mechanised 2026-08-07 (§67)**: `RESCUE_ACTION_LOCKED_DOMAINS` blocks *any*
      action change in a locked domain, not just one touching a mutation. Shipped empty on purpose —
      the planner is still shadow-only, so rescue currently compensates for classifier errors as
      well as causing them. The list may only grow; the exit is every domain locked and
      `GRANDFATHERED_MUTATING_RESCUES` empty (it already is).
      **First half measured 2026-08-07 (§68)**: 555 `legacy_paraphrase` detectors remain, of which
      **318 are retirement-ready today** and **four domains are fully slice-ready** —
      `recommendation` (8), `tour` (8), `guide` (7), `appointment` (5). The dominant blocker is
      `not_evaluated`, not planner accuracy — but §69 then measured that this **cannot be cleared
      by adding eval cases**: the deterministic harness tests the rescue path, so only §19's shadow
      comparison can show planner readiness. §69 also found **449 of 559** documented spec examples
      for uncovered commands do not reach their own command. Ratchets in
      `ai-detector-retirement.boundary.spec.ts` and `ai-command-eval.spec-coverage.spec.ts` stop
      both numbers regressing meanwhile. **§70 unblocked the gate itself**: the shadow was never
      enabled (`AI_PLANNER_SHADOW_SURFACES` unset, 0 disagreement rows) and traffic stopped
      2026-08-03, so the 7-day wait could never complete. Offline replay of the stored corpus
      replaces it, and 25 prompts already show the planner returns an **empty plan** for 18 of
      them — coverage, not accuracy, is what blocks retirement.

### Phase 9 — Learning loop *(ongoing)*
- [x] Mine traces for misses: rephrase-retry, explicit feedback, repeated failures —
      **shipped 2026-08-06**, see §43. 564 candidates from the 5,362-trace corpus.
      `undo-within-1-min` is **not** implemented: there are zero undo-shaped actions in the data.
- [x] Each confirmed miss → registry `example` + eval case (**never** a new regex) —
      **shipped 2026-08-06**, see §44. Data-only by construction; three corpus-protecting
      rejections. The freeze ratchet caught the new spec file on its first run.
- [x] Few-shot retrieval from labelled traces — **shipped 2026-08-07**, see §52. pgvector did
      **not** land and is not needed: §5's decision is in-memory cosine until ~1M vectors, and the
      pool here is the verified corpus (spec examples + eval goldens + §44 confirmed misses), not
      the trace table.
- [x] Ratcheting accuracy + completion floors — **shipped 2026-08-07**, see §45. Accuracy already
      ratcheted in CI (§25); this adds the completion half as a cron gate, because a floor on live
      traffic cannot live in a pull-request build.

---

## 7. Metrics

| Metric | Today | Target |
|---|---:|---:|
| **Command completion rate** | **64.0%** | **≥ 92%** |
| `compound_intent` / multi-command completion | **38.2%** | **≥ 90%** |
| Wrong silent mutation (T2/T3) | unmeasured | **≈ 0** (incident-reviewed) |
| Steal rate (`classifiedAction ≠ finalAction`) | **unmeasurable** | measured → ≈ 0 |
| Clarify → success next turn | unmeasured | ≥ 90% |
| `legacy_paraphrase` detectors | **555** (of 785 total, measured §22) | **0** |
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

---

## 11. Task 1 results — steal telemetry (shipped 2026-08-03)

The roadmap claimed steals were unmeasurable. They were in fact *derivable*: the pipeline has been
writing a per-stage `PipelineTrace[]` into `ai_command_trace.pipeline_trace` all along; only the
final action was ever promoted to a column. So Task 1 shipped as attribution over existing data —
**no new instrumentation, and all 5,362 historical rows backfilled.**

**Delivered**
- `ai-command-trace-attribution.util.ts` — pure derivation of `classifiedAction`, whether it
  survived, and which stage replaced it (21 tests).
- 4 new columns (`classified_action`, `action_changed_by`, `failure_reason`, `result_summary`),
  populated going forward and backfilled historically by
  `20260815120000-ai-command-trace-steal-attribution.sql`.
- `ai_command_steal_summary` view — steal pairs ranked by occurrences and % failed.
- Phase 0 freeze ratchet (§6).

**First measurements (n = 1,271 traces carrying a classify stage)**

| Result | Value |
|---|---:|
| Action changed after classification (**steal rate**) | **24.2%** (307) |
| ↳ attributed to the **`rescue`** layer | **216 (70%)** |
| ↳ after the traced pipeline (compound re-dispatch) | 86 |
| ↳ `self_verify` / `narrow_reclassify` | 5 |

Worst steals by measured harm:

| Steal | n | % failed |
|---|---:|---:|
| `update_bookings → mark_paid` (rescue) | 11 | **91%** |
| `compound_intent → reschedule_booking` / `→ create_booking` / `→ cancel_package_visit` | 33 | 0% |
| `bulk_create_catalog → create_service_category` (rescue) | 16 | 0% |
| `assign_employee_services → add_services_to_cart` (rescue) | — | — |

**Two findings that change the plan**

1. **`rescue` is confirmed as the primary stealer (70%)** — the roadmap's central bet is now
   backed by production data rather than inference. `assign_employee_services →
   add_services_to_cart` is a *customer* cart action winning a *dashboard* request: the
   e2e-bug.349 family, independently reproduced in telemetry.
2. **Not every steal is harmful, and the harmful ones are a minority.** Most steal pairs fail 0%
   of the time — they are the rescue layer *correcting* real classifier errors. Phase 3 must
   therefore kill steals **by measured harm** (mutating targets like `mark_paid`, and
   `compound_intent → single command`, which destroys multi-command execution), and treat the
   benign ones as evidence the classifier needs those cases as training examples — removing them
   only once it learns. §6 Phase 3 is worded as a blanket deletion; this is the correction.

**Caveat:** attribution is inferred from stage ordering, not from an explicit "I changed the
action" signal. The first version of this logic blamed `self_verify` for 221 of 307 steals; a
production trace showed `self_verify` merely echoes the action `rescue` had already replaced. The
rule is now "first stage to introduce the final action", which is correct for every trace shape
observed — but an explicit `rescueDetectorId` emitted by the rescue layer itself would be
stronger, and should land with Phase 3.

---

## 12. Phase 1 progress — reachability gate (shipped 2026-08-03)

**Delivered:** `ai-command-reachability.boundary.spec.ts`, wired as `npm run test:ai-reachability`
and bundled into `npm run test:ai-roadmap-gates` alongside the Phase 0 freeze and the attribution
tests.

It enforces four invariants across all 41 `*-dispatch.build.ts` maps:

1. **Every dispatchable action has a registry row** — the e2e-bug.342 guard. A handler without a
   row is silently unreachable: `getCommandEntry` returns `undefined`, the surface check does
   `undefined?.includes(...)` → `false`, and the rescue pipeline drops the result with no error.
2. **Every declared alias points at a real registry action.**
3. **No intent is claimed by two dispatch maps** (ambiguous ownership).
4. **Ratchet** on registry rows not yet routed through a dispatch map.

**Corrections to §1's inventory**

- The registry has **696 command entries**, not 110. The earlier figure counted `intents: [` seed
  *groups* in `ai-command-registry.build.ts`; `buildCommandRegistry()` expands those into 696
  individual commands. Phase 1's migration is therefore ~6× larger than first scoped — which
  strengthens, not weakens, the case for generating everything from one entry rather than
  hand-maintaining six parallel lists.
- Baseline: **696 registry / 415 dispatchable / 282 rows still routed by switch statements.**

**Finding: aliases are a real requirement with nowhere to live.** The first run flagged
`create_catalog_test_order` as an orphan. It is not a bug — it is a deliberate second classifier
name for `create_test_order`, routed to the identical handler. But `CommandRegistryEntry` has no
`aliases` field, so that fact exists only as an extra dispatch-map key plus a code comment,
invisible to the classifier schema, coverage tests and docs. This independently validates the
`aliases` field in §3.1. The test carries a documented `KNOWN_ALIASES` allowlist that should be
**deleted and derived from the registry** once §3.1 lands.

**Not yet started in Phase 1:** the `CommandSpec` shape itself (§3.1) — `domain.verb` ids,
`risk` tiers, `variables` JSON Schema, `examples`, `confirm` policy — and generating the
classifier shortlist / tool definitions / validation from it. The gates above are the safety net
that makes that migration checkable as it proceeds: any command that loses its handler or its row
during the move now fails CI instead of disappearing silently.

---

## 13. Phase 1 — CommandSpec + appointment pilot (shipped 2026-08-03)

**Delivered** (46 tests, `npm run test:ai-command-spec`, folded into `test:ai-roadmap-gates`):

| File | Role |
|---|---|
| `ai-command-spec.types.ts` | The contract: `domain.verb` id, `aliases`, `surfaces`, `risk` (T0–T3), `description`, `variables` (typed + `resolver` + `required`), `examples`, `confirm`, `handler`, `bulkOf`. |
| `ai-command-spec.derive.ts` | Everything generated from it — planner shortlist, tool/function JSON Schema, variable validation, surface gating, alias resolution, confirm policy. |
| `ai-command-spec.appointment.ts` | Pilot: 8 appointment commands. |
| `ai-command-spec.conformance.spec.ts` | Asserts specs never disagree with the live registry on surfaces / handler / mutating. |

**Why `appointment` first:** it holds the worst production failure rates
(`create_booking` 58%, `book_appointment` 52%, `reschedule_booking` 42%) and is the domain the
multi-command example exercises.

**What the spec adds that the registry cannot express**

1. **Risk tiers.** The registry has only `mutating: boolean`. That cannot distinguish
   `appointment.reschedule` (T1, one entity) from `appointment.cancel_bulk` (T3, filter-matched
   and therefore unbounded) or `appointment.mark_paid` (T2, money — and the target of the
   91%-failing `update_bookings → mark_paid` steal). A hygiene test enforces that every T2/T3
   command has `confirm: 'always'`.
2. **Variable contracts.** Types, required-ness, enums, and the named `resolver` that Phase 4's
   single `EntityResolutionService` will own — replacing ad-hoc per-handler checks and the ≥4 code
   paths that re-parse names and dates independently.
3. **Aliases as data.** The legacy flat name (`reschedule_booking`) is declared, so stored traces
   and today's classifier keep resolving while the canonical id moves to `domain.verb`.
4. **Hallucinated-param visibility.** `validateCommandVariables` reports `unknown` params rather
   than dropping them — e2e-bug.156 had the model inventing `customerName: "Test User"` on a
   price update, which then reached the confirmation UI.

**Migration safety.** The conformance suite is the mechanism that makes porting 696 commands
tractable: port one, and if its spec is wrong about a surface or handler, CI fails immediately
rather than the command silently becoming unreachable. Combined with §12's reachability gate, a
command cannot lose its row, its handler, or its surface mid-migration without a red build. Once a
domain is fully ported and registry rows are generated *from* specs, its conformance tests become
tautological and should be deleted.

**Status:** 8 of 696 commands specced. The shape is proven against reality — every conformance
assertion passed on first run — but the bulk port is the remaining multi-week body of Phase 1.

---

## 14. Phase 1 — second pilot domain: `catalog` (shipped 2026-08-03)

A second domain was ported specifically to find out whether the CommandSpec shape generalises or
was overfitted to `appointment`. It was **not** overfitted, but it did force two real extensions —
which is the point of a second pilot.

`catalog` was chosen because it breaks the first pilot's assumptions in two ways:

**1. Read-only commands (T0).** All 8 appointment specs were mutating, so the T0 tier was declared
but never exercised. `catalog.list_packages` / `catalog.list_subscription_plans` are the first
reads: `confirm: 'never'`, valid with no variables at all, and never gated even when the plan is
ambiguous.

**2. Nested variables.** `bulk_create_catalog` takes a *structured draft* — a category plus its
service lines — which the original `string | number | boolean | string[]` variable types could not
express. Flattening it would have lost the grouping the handler depends on, and the tool schema
has to describe it for the model to fill it in. So `CommandVariableSpec` gained `object` /
`object[]` with a recursive `properties` field, and three derivations were extended:

- `buildToolDefinition` emits nested JSON Schema (with per-level `required`);
- `typeMatches` validates object and object-array containers;
- `validateCommandVariables` **recurses, reporting dotted paths** — `catalogDraft.categoryName`,
  `catalogDraft.services[1].price`. That precision is what lets the clarify question say *"I need
  the price for service B"* instead of the useless *"I need catalogDraft"*.

Hallucinated params are now caught at any depth too (`catalogDraft.templateName`).

**Connection to e2e-bug.347.** That bug had one prompt hitting five independent parsing defects,
because the service-line shape (`name, duration, price`) existed only inside a regex that had to
recover it from free text. Declared as a schema, the planner fills the structure directly and the
parser stops being the single point of failure. The fixed regex remains useful as a fallback for
users who type prose — but it is no longer the only path.

**Status:** 16 of 696 commands specced across 2 domains (78 tests). Every conformance assertion
passed on first run for both domains, so the shape holds against two independently-shaped areas of
the product. Remaining Phase 1 work is the bulk port; the contract itself now looks stable enough
to port against.

---

## 15. Phase 3 — plan validation spine (shipped 2026-08-03)

The planner splits into two halves: the LLM call that *produces* a plan, and the deterministic
layer that decides whether that plan may touch the database. The second half shipped first,
because it is the part that has to be trustworthy — and it is fully testable without a model.

**Delivered** (28 tests, `npm run test:ai-command-plan`):

| File | Role |
|---|---|
| `ai-command-plan.types.ts` | `CommandPlan` / `PlanStep` / `PlanProblem` — steps, `dependsOn`, `$sN.field` output refs, `unresolved`, `topicChanged`. |
| `ai-command-plan.validate.ts` | Pure validation: surface enforcement, unknown-command rejection, variable checks, dependency ordering, cycle detection, risk/confirm rollup, and the clarify sentence. |
| `ai-command-plan.fixtures.ts` | Golden plans, including the headline multi-command message. |

**Guarantees enforced**

1. **A command not legal on this surface is rejected, not remapped.** There is no stage after this
   that can substitute a different action — that is the structural answer to *"no wrong command
   stolen from a right command"*. A test asserts the same command validates on its own surface,
   so this is a scoping rule and not a blanket ban.
2. **An unknown command clarifies; it never fuzzy-matches.** A typo'd `appointment.reschedul`
   produces `unknown_command`, not a silent correction to the neighbour.
3. **Nothing executes if any step is invalid.** Partial application of a multi-command plan is not
   a reachable state.
4. **Dependency cycles and dangling `$refs` are caught before execution**, so ordering is proven
   ahead of any write.
5. **Hallucinated params are reported but non-blocking** — visible, dropped, not fatal.

**The headline example turned out to be the most valuable fixture.**

> *"Move John's appointment to tomorrow at 3 PM, cancel Mary's appointment, and create a new
> patient named David for Friday."*

The first two commands exist. The third **does not**: there is no `create_customer` /
`patient.create` anywhere in the platform — only `update_customer`, `lookup_customer`,
`merge_customers`. Customers are created implicitly during booking, never as a standalone command.

So the correct behaviour is to accept two steps, refuse the third **by name**, and execute
nothing. A fuzzy matcher would have happily stolen "create a new patient named David" to
`update_customer` — mutating a real person — or to `appointment.create`. The validator refuses,
and the clarify sentence names the gap.

**That is also a product finding worth acting on independently:** if "create a patient/customer"
is something users will ask for — and the example implies it is — the platform needs that command.
Until it exists, no amount of planner quality can satisfy that request.

**Not yet built:** the LLM call that produces the plan (prompt assembly, structured-output
decoding, few-shot retrieval), and the execution engine that consumes `orderedStepIds`
(Phase 5). The contract between them is now fixed and tested from both sides.

---

## 16. Phase 3 — prompt assembly + response decoding (shipped 2026-08-03)

The two remaining deterministic pieces around the LLM call. 31 further tests
(`npm run test:ai-command-plan`, 59 total for the plan layer).

### Prompt is generated, never hand-written

`ai-command-plan.prompt.ts` builds the system prompt from CommandSpecs. Today the four surface
classifier schemas are hand-maintained and drift from each other and from the registry; here,
adding a command to a spec file changes the prompt on every surface that command declares.

The prompt carries, per surface: the command shortlist with descriptions, required/optional
variables and examples; today's date and time zone (so "tomorrow" is grounded rather than
guessed); known entities from the conversation (so "move **it**" can bind); and the JSON output
contract. Tests assert that a dashboard prompt does not contain `appointment.cancel_mine` — the
surface filter applies *before the model ever sees the option*, which is the structural version of
the anti-steal rule.

### Decoding is defensive, and deliberately narrow

`ai-command-plan.decode.ts` turns the raw completion string into a `CommandPlan`. Models routinely
return markdown fences, a sentence of preamble, a bare array instead of the object, `85` instead
of `0.85`, or a missing `dependsOn`. Production shows what happens when that is unhandled: an
`error` action recorded 59 times at a 100% failure rate.

It **repairs syntax** (fence stripping, prose trimming, 0–100 → 0–1 confidence, defaulted
`dependsOn`, assigned/de-duplicated step ids) and records every repair. It **never repairs
meaning**: a step with no `command` is dropped and reported rather than guessed at.

Two decisions worth calling out:

- **Unreadable confidence decodes to `0`, not to a default like `0.5`.** A mutating step must
  never slip through the confidence gate because the model returned `"very sure"`. A test asserts
  `appointment.mark_paid` with unparseable confidence ends up non-executable.
- **Decoding never judges whether a command is real.** `patient.create` decodes cleanly and is
  then rejected by `validatePlan` as `unknown_command`. Keeping syntax and semantics apart means
  there is exactly one place that decides what may execute.

### Still to wire

A `PlannerService` that calls `openAi.chatCompletion({ responseFormat: 'json_object' })` with
`buildPlannerMessages(...)`, decodes, validates, and records the plan on `ai_command_trace`. That
is now assembly of tested parts rather than new design.

---

## 17. Phase 3 — the planner service (shipped 2026-08-03)

`ai-command-planner.service.ts` assembles the tested parts into one call and is registered in
`ai.module.ts`. 13 tests drive the whole path with a stubbed gateway.

```
specs + surface + context → prompt        (ai-command-plan.prompt)
LLM completion            → CommandPlan   (ai-command-plan.decode)
CommandPlan + surface     → verdict       (ai-command-plan.validate)
```

It returns one of three outcomes and nothing else:

| Outcome | Meaning |
|---|---|
| `executable` | Every step is legal, complete and ordered; `orderedStepIds` is safe to run. |
| `clarify` | Carries a question naming the exact gap — a missing variable, an unsupported command, an ambiguous entity. |
| `unavailable` | Gateway returned nothing, or output was undecodable. Never a half-plan. |

**The service holds no judgement of its own.** Every rule about what may execute lives in
`validatePlan`, which is pure and LLM-free. That is deliberate: the file that talks to the model
is the file most likely to be edited under time pressure, so it is the last place safety rules
should live.

`temperature: 0.1` — planning is extraction, not creativity. The same message producing different
plans on retry is the e2e-bug.152 non-determinism class, which cost a whole investigation.

**Verified end to end (stubbed gateway):** the headline three-command message returns `clarify`
naming `patient.create`; a three-command all-supported message returns `executable` with
`['s1','s2','s3']` and `requiresConfirmation: true` (because `cancel_bulk` is T3); a
customer-only command on the dashboard is refused; a markdown-fenced response still succeeds and
reports the repair; and `mark_paid` with unreadable confidence cannot execute.

**A bug this caught:** I hand-wrote a `CommandSurface → AiUsageSurface` map and got it wrong —
`provider` must be `provider_mobile` and `public` must be `public_booking` for usage accounting.
The repo already had `commandSurfaceToAiUsageSurface`; the service now uses it, and a test pins
the mapping. Hand-rolling a second copy of an existing mapping is the same duplication disease
this whole phase exists to remove.

**Still to wire:** recording the plan on `ai_command_trace` (needs plan-shaped columns), and
calling the planner from the surface gateways behind a flag to shadow-compare against the live
classifier before any switch.

---

## 18. Phase 3 — plan telemetry + shadow comparison (shipped 2026-08-03)

12 tests, migration `20260816120000-ai-command-trace-plan-telemetry.sql` applied and verified
against the live database.

**Columns** (`plan_outcome`, `plan_step_count`, `plan_commands`, `plan_commands_legacy`,
`plan_highest_risk`, `plan_problems`, `plan_repairs`), populated by the pure
`buildPlanTraceFields` and spread into the existing `buildAiCommandTraceRow`. They are NULL on
every legacy row, which is itself the rollout signal: `plan_outcome IS NOT NULL` selects exactly
the planner-handled messages.

Each field earns its place:

- `plan_step_count` finally exposes multi-command shape. `compound_intent` fails 61.8% of the time
  and nothing recorded how many steps were involved.
- `plan_problems` makes clarifies *measurable*. Today a clarify is indistinguishable from a
  failure in the trace; with problem codes, "asked a good question" separates from "could not
  understand at all".
- `plan_repairs` tracks raw model-output quality independently of plan quality — a rising repair
  rate is early warning that a model or prompt change degraded formatting.

**Two views:** `ai_command_plan_summary` (multi vs single vs empty plans, by outcome and risk) and
`ai_command_plan_shadow_disagreement` (planner's command vs the classifier's, with failure rates)
— the review queue that must be worked before the planner takes over a surface.

**A bug caught by actually running it.** The first shadow view compared `plan_commands ->> 0`
against `classified_action` directly, and flagged `appointment.reschedule` vs `reschedule_booking`
as a disagreement — but those are *the same command*, canonical id vs legacy alias. Every ported
command would have shown as a false disagreement and drowned the real signal.

Fix: record `plan_commands_legacy` alongside, resolved through the specs' `aliases` in TypeScript,
and compare like-for-like. The alias mapping stays in one place next to the specs rather than
being duplicated into SQL — which would have reintroduced exactly the drift this programme exists
to remove. Verified with a transaction-and-rollback: an agreeing row is excluded, a genuine
`assign_employee_services → appointment.reschedule` disagreement appears.

*(Also fixed: `CREATE OR REPLACE VIEW` cannot change a view's column list, so both views are now
dropped-then-created.)*

**Pre-existing and untouched:** two `tsc` strictness errors in
`ai-gateway-command-trace.integration.spec.ts` — confirmed identical with these changes stashed.

---

## 19. Phase 3 — shadow running the planner (shipped 2026-08-04)

**Phase 3 is complete.** The planner now runs alongside the live pipeline on real traffic and
records what it *would* have done, without touching a single response.

`AiPlannerShadowService` (`backend/src/modules/ai/ai-planner-shadow.service.ts`) is invoked from
`AiGatewayService.persistCommandTrace`, immediately after the real trace is queued. Four safety
properties, each one deliberate and each one tested:

| Property | How it is guaranteed |
| --- | --- |
| **Off by default** | A shadow run costs a second LLM call per message, so it is opt-in per surface via `AI_PLANNER_SHADOW_SURFACES` (e.g. `dashboard`). Unset, empty, or an unrecognised surface name all mean disabled. |
| **Cannot add latency** | Fire-and-forget, started after the reply is built and after the trace write is queued. |
| **Cannot fail a request** | `run`'s `try/catch` swallows planner and DB errors; `runInBackground` has its own guard; and the gateway call site is additionally wrapped. |
| **Cannot reach the user** | Returns `void`. There is no path from its output to the response. |

Rather than inserting a second row, the shadow run *updates* the trace the gateway already wrote,
via the new `AiCommandTraceService.attachPlanFields(traceId, fields)`. One row per message keeps
`ai_command_plan_summary` and `ai_command_plan_shadow_disagreement` accurate with no de-duplication.

`AiPlannerShadowService` is injected into `AiGatewayService` as an `@Optional()` 13th constructor
parameter. Seven spec files construct the gateway positionally with 12 arguments; making the dep
optional means the shadow rollout does not force a rewrite of unrelated tests, and a gateway built
without it behaves exactly as before.

### A test caught a real hole

The first version guarded only the async body. But `runInBackground`'s *synchronous* prefix reads
config to decide whether it is enabled — so a throwing `ConfigService` would have propagated into a
request that had already succeeded. The gateway integration test asserting "returns the real result
unchanged even if the shadow runner throws" failed, exactly as intended. Both the enablement check
and the gateway call site are now inside guards.

This is the second time on this programme that writing the adversarial test — rather than reasoning
about the code — found the defect.

### Verification

- `ai-planner-shadow.service.spec.ts` — 14 tests: off-by-default, per-surface enablement, env
  fallback, correct `traceId`, legacy-name mapping for the disagreement view, context passthrough,
  planner rejection, DB rejection, clarify outcomes, and `runInBackground`'s synchronous contract.
- `ai-gateway-command-trace.integration.spec.ts` — 3 new tests covering the wiring: absent dep,
  correct payload, and a throwing shadow runner.
- `npm run test:ai-roadmap-gates` — now 7 suites, 219 tests, all green (`test:ai-planner-shadow`
  added).
- All 7 `ai-gateway*` suites pass (73 tests). `tsc --noEmit` clean for every file touched.

**Pre-existing and untouched:** the broad `src/modules/ai/` sweep reports 106 failing suites; these
are DB-dependent integration specs (`Cannot read properties of undefined (reading 'transaction')`)
that fail identically with these changes stashed.

### What the shadow run is for

Nothing switches over until the disagreement queue is worked. The rollout gate is:

```sql
SELECT * FROM ai_command_plan_shadow_disagreement ORDER BY created_at DESC;
```

Every row is either a planner mistake or a case where the legacy pipeline stole a command — and the
whole point of Phase 3 is that we now find out which, on real traffic, before anything changes for
a single user.

---

## 20. Phase 3 — the steal guard (shipped 2026-08-04)

> *"no wrong commands to be stolen from a right command!!!!"*

The first enforceable slice of that requirement is in. `rescue` can no longer take a correct
classification and run a **different mutating command** instead.

### What production said

Of the 216 messages where `rescue` changed the action, only 48 rescued an `unknown` — its actual
job. The other **168 overrode a real classification**, and 57 of those crossed a write:

| classifier decided | rescue ran instead | n | |
| --- | --- | --- | --- |
| `bulk_create_catalog` | `create_service_category` | 16 | **this is e2e-bug.347** |
| `update_bookings` | `mark_paid` | 11 | money |
| `create_service` | `create_employee` | 3 | wrong entity entirely |
| `create_booking` | `create_employee` | 2 | wrong entity entirely |
| `adjust_gift_card_balance` | `validate_gift_card` | 2 | money |
| `create_service_category` | `import_services_from_menu` | 2 | |

The reported bug — *"create a category with these services"* creates the category and silently
drops the services — is the top row. The classifier had `bulk_create_catalog` right; rescue took it
away. That is not a parsing bug, it is a steal, and it was invisible until §11's telemetry landed.

### The rule

Rescue's action change is discarded when **all three** hold:

1. the classifier produced a real action (not `unknown`/`clarify`), **and**
2. rescue wants a different action, **and**
3. either side is a mutating command.

Deliberately *not* covered: read-only → read-only changes (111 traces). They are wrong but cannot
damage anything, and they retire with their detectors in Phase 8. Rescuing an `unknown` is
untouched.

**Blocking the action never blocks the params.** Structural enrichment is the part of rescue that
survives the roadmap, so a blocked rescue still contributes everything it extracted — the intent
keeps the classifier's action and the rescue's fields.

### The measurement that made this shippable

The obvious fear was that rescues exist precisely to correct wrong classifications, and that
blocking them would break the eval corpus. So it was measured rather than argued:

1. `git stash` the change, run the AI unit sweep to completion, save the failure list;
2. restore, run the identical sweep, diff;
3. repeat for the eval sweep specifically.

Both diffs came back **byte-identical** — 54 failing suites / 112 failing tests before and after,
same names. Not one test in the corpus depends on a rescue stealing a mutating command. So
`GRANDFATHERED_MUTATING_RESCUES` ships **empty**, and a ratchet spec keeps it that way.

*(Two earlier sweeps had to be thrown away: one ran while the working tree was stashed underneath
it, another while the wiring landed mid-run. A test result gathered while the tree is changing is
not a measurement.)*

### "No regressions" is not the same as "it works"

Identical failure lists could equally mean the guard is never reached. So
`ai-rescue-steal-guard.pipeline.spec.ts` drives the real
`CommandUnderstandingPipelineService` end to end with a rescue stub that tries to steal, and
asserts the stolen action never reaches the caller — including the exact e2e-bug.347 pair.

### Verification

- `ai-rescue-steal-guard.spec.ts` — 16 tests: every production steal pair blocked, `unknown`
  rescues untouched, both directions covered, purity, and the allowlist ratchet.
- `ai-rescue-steal-guard.pipeline.spec.ts` — 6 tests proving the guard is wired, params survive a
  block, and the trace names both sides.
- `npm run test:ai-roadmap-gates` — now 8 suites, 243 tests, green (`test:ai-steal-guard` added).
- Full AI unit sweep and eval sweep: failure lists identical to the stashed baseline.

**Pre-existing and untouched:** 54 failing AI suites (112 tests) and 4 `tsc` strictness errors in
`command-understanding-pipeline.{service,integration}.spec.ts` — all present with these changes
stashed. Phase 2's "make red mean red" item owns them.

### Next

The remaining 111 read-only steals need the planner, not another rule. §19's shadow run is how
they get judged; Phase 8 deletes the detectors behind them domain by domain.

---

## 21. Phase 3 — golden plan assertions (shipped 2026-08-04)

**Phase 3's engineering is now complete.** Only the data-gathering half of the rollout remains.

`PLAN_FIXTURES` already declared what each multi-command message should become, but the fixtures
were only fed to the validator directly — which proves the *validator* works and says nothing about
the *planner*. `ai-command-plan.golden.spec.ts` closes that: every fixture is driven through the
real `AiCommandPlannerService` — prompt assembly → model response → decode → repair → validate →
trace — and the plan that comes out must equal the golden plan exactly.

### Why the model is stubbed

An LLM call makes a test non-deterministic, slow and billable, and none of the failure modes this
suite exists to catch live in the model:

1. **The shortlist omits a command the plan needs** — the model was never told it existed, so the
   plan was impossible before generation started. The most invisible failure of the three.
2. **Decoding silently drops, reorders or rewrites part of a valid plan.**
3. **Validation approves something it must refuse** — a surface violation, an unknown command, a
   missing required variable.

Model *accuracy* is a different question, and it is answered on real traffic by §19's shadow run,
not by a fixture.

### What is now pinned

For the headline example — *"Move John's appointment to tomorrow at 3 PM, cancel Mary's appointment,
and create a new patient named David for Friday"* — all four properties are asserted:

- all **three** commands are extracted, not collapsed into one (`compound_intent` fails 61.8% of
  the time in production, and 33 traces show exactly that collapse);
- the plan is **refused**, because the platform has no create-customer command;
- the clarification **names `patient.create`** rather than failing generically;
- **nothing executes** — not even the two valid steps.

Plus, across every fixture: exact decode round-trip with zero repairs, the declared
executable/clarify verdict, `$s1.field` references and `dependsOn` ordering surviving intact, the
shortlist actually offering every command an executable plan uses, and trace fields matching the
plan that ran.

And three refusal cases: an invented command (`appointment.move`) is **not** silently rewritten to
the real `appointment.reschedule`; a customer-only command on the dashboard is rejected; an empty
model response reports `unavailable` rather than inventing a plan.

### A trap found and defused

`PlanValidationResult.orderedStepIds` was documented as *"steps in dependency order — safe to run
sequentially."* It is populated whenever the graph is acyclic — **including when the plan is not
executable**. A Phase 5 executor that treated a non-empty list as permission to run would have
executed the two valid steps of a refused plan.

The behaviour is right (a previewable order is useful); the comment was wrong. It now says so
explicitly, and a test pins both halves — `executable: false` *and* `orderedStepIds: ['s1','s2','s3']`
— so the contract cannot drift silently before Phase 5 arrives.

### Verification

- `ai-command-plan.golden.spec.ts` — 35 tests across 6 fixtures.
- `npm run test:ai-roadmap-gates` — 8 suites, **278 tests**, green.
- `tsc --noEmit` clean for every file touched.

---

## 22. Phase 0 — the detector inventory (shipped 2026-08-05)

**Phase 0 is complete.** Every `is*Prompt` detector in the backend is now described by a row in
`backend/src/modules/ai/ai-command-inventory.json`, regenerated by `npm run build:ai-inventory`
and gated by `npm run test:ai-inventory`.

This is the artifact Phase 8 needs. §2.2 replaced "migrate 786 detectors to anchors one at a
time" with "delete a domain's detectors in bulk once the planner passes that domain's eval" —
and bulk deletion is only safe if you know, before you delete, which detectors in the slice were
never paraphrase matchers to begin with.

**Delivered** (32 tests, `npm run test:ai-inventory`, folded into `test:ai-roadmap-gates`):

| File | Role |
|---|---|
| `ai-command-inventory.util.ts` | The triage rules — pure, no filesystem, unit-tested. |
| `ai-command-inventory.boundary.spec.ts` | The AST scan, the generator, and six CI gates. |
| `ai-command-inventory.json` | 785 rows. Generated; never hand-edited. |

`typescript` is a devDependency, so the compiler API cannot be imported from anything that ships.
`tsconfig.build.json` excludes spec files, which makes the boundary spec the one legal home for
the scan — the same reason `ai-detector-freeze.boundary.spec.ts` walks the tree from a spec.

### The measured triage

| Label | Count | Phase 8 disposition |
|---|---:|---|
| `legacy_paraphrase` | **555** | Deleted by slice once the planner owns the domain. |
| `compound_connector` | 123 | Kept until `CommandPlan` owns multi-command extraction. |
| `routing_shape` | 82 | Kept until the detector each one guards retires. |
| `structural_slot` | 20 | **Kept permanently** — regex's surviving role (§3, step 3). |
| `confirm_gate` | 5 | Kept until Phase 6 owns conversation state. |

715 of the 785 are reachable from a `tryRescue*` method, and 522 are both `legacy_paraphrase`
*and* rescue-wired — which is the population §20's steal guard constrains today and Phase 8
removes outright.

Every row also carries `labelReason`, so a label can be argued with rather than trusted. The
default is `legacy_paraphrase`; that is a **work-list, not permission to delete**. Phase 8's gate
is still the domain eval plus a shadow window.

### Attribution had to be narrowed twice before it was worth anything

The first version read `mapsToActions` from the whole enclosing function of each call site. That
gave `isAdjustGiftCardBalancePrompt` **45 commands**, because its caller is a large rescue routine
that names 45 actions. A slice list where every detector claims half the product is not a slice
list. Reading only the branch the detector actually guards collapses 75 of those 89 rows to
exactly one command, and none in the whole inventory to more than six.

The second narrowing was the same mistake one level up: falling back to the defining file's
`*_INTENTS` export attributed 54 commands to one compound detector. That fallback now applies
only when the file owns exactly one command (9 rows). The other 32 dropped to **no attribution** —
`actionSource: "none"`, 148 rows in total. An honest empty list is worth more than a plausible
wrong one, because the whole point is to decide what may be deleted.

### Four findings, all of them things that were not true before

**1. The freeze had a hole the size of a module.** `ai-detector-freeze.boundary.spec.ts` scanned
`modules/ai`. Four detectors do not live there — `isFillGapPrompt`, `isWhosNextPrompt`,
`isTeamWhosNextPrompt` (`provider-mobile`) and `isServiceTierFilterPrompt` (`common/utils`) — so
a new paraphrase detector added in `provider-mobile` passed CI. The scan root is now `src`, and
the baseline moved 786 → 790. **That is four detectors becoming visible, not four being added**;
the amendment is recorded in the spec because "never raise this number" is otherwise the right
rule. The inventory pins the same 790, so the two gates cannot drift apart.

**2. "786" was never 786 detectors.** The ratchet's `export function is[A-Za-z0-9_]*Prompt` is
unanchored, so it also counts `isClinicTestResultExtPromptForIntent`, `isNlPromptFixtureRow` and
three others whose names merely *contain* `Prompt`. Five of the 790 are not detectors at all.
The reconciliation is asserted, so neither number can move without the other.

**3. Three detector names are exported from two files each,** with different regexes:
`isEndOfDaySummaryPrompt`, `isGiftCardCheckoutCompoundPrompt`, `isSetRetailSalesLinesPrompt`.
Which one a call site gets depends on which it imports. This is the ordering-dependence disease
in its purest form — two functions, one name, different answers. The inventory keys rows by
declaration rather than by symbol so all six are described, and flags them `duplicateSymbol`
because their call-site evidence genuinely cannot be split without import resolution. An earlier
draft keyed by symbol name and silently dropped three implementations while reporting itself
complete.

**4. Thirteen detectors are unreachable from production** — nothing but their own tests calls
them (`isEmployeeRoleRankPrompt`, `isE2e192TimedBookPrompt`, `isRebookLastAppointmentPrompt`,
`isMultilingualFirstAvailableBookingPrompt` and nine others). They are exported, tested, counted
in the freeze, and cannot fire. These are free deletions available **now**, ahead of Phase 8 and
independent of the planner.

### A bucket the roadmap expected to be large is nearly empty

Phase 0 named `confirm_gate` as one of five categories. There are **five**. Searching more widely
does not help: in this codebase "confirm" is overwhelmingly a *command* (`confirm_pending_booking`,
`collect_cash_confirm`, `confirm_my_booking_details`), not a yes/no reply gate. Confirmation
handling lives in pending-state machines, not in detectors. So the taxonomy is right but the
volume assumption behind it was wrong, and Phase 6's conversation-state work inherits less from
this layer than the roadmap implied.

### Verification

- `ai-command-inventory.util.spec.ts` — 23 tests on the triage rules, using the real shapes found
  in the tree (compound-named commands, `confirm`-named commands, blocking guards vs broadening
  delegates, the single-intent fallback).
- `ai-command-inventory.boundary.spec.ts` — 9 gates: row count == symbol count, zero untriaged,
  every label carries a reason, every mapped action is a real registry command, surfaces derived
  from the registry rather than invented, freeze reconciliation, duplicate-symbol coverage, and a
  drift check that fails if the JSON is stale. Verified by hand-editing one row and watching it go
  red.
- `npm run test:ai-roadmap-gates` — now 9 suites, **310 tests**, green.
- `tsc --noEmit` and `eslint` clean for every file touched.

---

## 23. Phase 1 — permissions in the spec (shipped 2026-08-05)

§4 lists four guardrails that stop the planner becoming the new steal machine. The first is:

> Shortlist is filtered by **surface + permission before** the planner sees it.

Only the surface half existed. Every actor on a surface was shown every command that surface
allows, and the sole thing between a `staff` member and a manager-only command was a check in the
legacy executor — which the planner path does not run through. This closes that.

**Delivered** (15 tests, `npm run test:ai-permissions`, plus 18 new conformance assertions):

| Change | Where |
|---|---|
| `CommandSpec.tiers` — a **per-surface** tier map | `ai-command-spec.types.ts` |
| `isSpecAllowedForTier` / `specsForActor`, and `buildPlannerShortlist` filtered by actor | `ai-command-spec.derive.ts` |
| The prompt never names a command the actor cannot run | `ai-command-plan.prompt.ts` |
| `permission_violation` — reject, never remap | `ai-command-plan.validate.ts` |
| Actor tier threaded through planner → shadow → gateway | `ai-command-planner.service.ts`, `ai-planner-shadow.service.ts`, `ai-gateway.service.ts` |

### Per-surface, because a flat list cannot state the truth

`update_bookings` (T3, "mark these as no-show") is `manager`+ on the dashboard and `staff`+ on
provider. The registry's flat `tiers: ['manager','owner','staff']` cannot express that, so it
grants dashboard access to `staff` — which the gate that actually runs refuses. A shape that
cannot represent reality guarantees it will disagree with reality, and this one does.

### Three findings

**1. There are two permission models, and they disagree on 1 decision in 8.** Checking all 696
commands × their surfaces × 4 tiers: **425 disagreements out of 3,492**. The registry's model
(`entry.tiers` + `isIntentAllowedForTier` + `AiCommandRegistryService.allowedForTier`) is
**dead** — nothing in any execution path calls it. `AiGatewayService.assertIntentAllowed` is dead
too; only its own test calls it. The live gate is `isIntentAllowed` from the capability matrix,
consulted by all three surface services. So the specs derive from the capability matrix, and the
conformance suite pins the registry's disagreement as a fact rather than letting a future
migration quietly trust the wrong one. See e2e-bug.355.

**2. The live permission model is a deny-list, so it fails open.** Both gates are
`!DENIED_BY_TIER[tier].has(action)` — anything not explicitly denied is allowed. The dashboard has
388 commands; the `staff` deny-list names 154 of them, so **234 are allowed to `staff` by
default, 131 of them mutating**. For `manager` the list names 2; for `owner`, none. This is not a
claim that those 234 are wrong — most are ordinary staff work. The claim is that **no one has
reviewed them**, and cannot, because nothing lists them: every command added since the deny-list
was written became available to every tier without a decision being made. See e2e-bug.356.

That is why `isSpecAllowedForTier` **fails closed**: a spec with no tier data for a surface denies.
The inverse of e2e-bug.342's `undefined?.includes(...) → false`, which made commands unreachable —
the same shape in a permission check would make every un-migrated command available to everyone.

**3. Defence in depth is currently load-bearing, not redundant.** The capability matrix permits
`client` on many dashboard commands, including `mark_paid`; the only thing stopping clients is
`AiGatewayService`'s blanket "no `client` on dashboard". The specs encode the *combined* answer, so
the planner does not depend on a check in another file to be safe — and a test asserts a dashboard
`client` is offered nothing at all.

### Checked twice, on purpose

Permission is enforced in the shortlist **and** in `validatePlan`. The shortlist filter is the one
that matters for accuracy — a command the model is never shown cannot be preferred over the one the
user asked for. The validator is what catches a model that names a command it was never offered, or
a plan replayed against a different actor. A test drives exactly that: the stub returns
`appointment.update_bulk` for a `staff` actor whose prompt never mentioned it, and the outcome is
`clarify` with `permission_violation`, not execution.

The clarify sentence is `"You don't have access to appointment.update_bulk."` — deliberately not
naming which tiers do. A clarify message is not the place to describe the permission model to
someone who just failed it.

### Verification

- `ai-command-permission.spec.ts` — 15 tests across the whole slice: derive, shortlist, prompt,
  validate, clarify wording, and permission-vs-surface separation.
- **Mutation-tested.** Replacing the tier check with `return true` fails **9 of the 15** — the
  suite fails for the reason it exists, not incidentally.
- `ai-command-spec.conformance.spec.ts` — every spec must permit exactly what the running system
  permits, must declare tiers for every surface it claims, and the registry disagreement is pinned.
- `npm run test:ai-roadmap-gates` — now 10 suites, **349 tests**, green. All 5 `modules/ai/ai-gateway*`
  suites green (52 tests).
- `tsc --noEmit` clean for every file touched. Making `tier` a required positional argument rather
  than an optional option meant the compiler listed all 40-odd call sites instead of leaving some
  silently unchecked.

**Pre-existing and untouched:** `openai-gateway.service.spec.ts` fails 6 tests
(`platformRuntimeConfig is not a function`) — verified identical with these changes stashed. Part
of e2e-bug.351.

---

## 24. Phase 1 — per-step compound telemetry (shipped 2026-08-05)

`compound_intent` is the worst number on the platform: 380 calls, **61.8% failed**. The only
recorded fact was that the compound failed — which cannot separate causes needing opposite fixes:

| What actually happened | What the fix is |
|---|---|
| Step 3 of 3 failed **after** steps 1–2 wrote | compensation (Phase 5) |
| The decomposer named a sub-intent it never planned | the planner (Phase 3) |
| Step 2 asked the user a question | nothing — it is not a failure |

All three were recorded identically. Now they are three different rows.

**Delivered** (31 tests, `npm run test:ai-compound-steps`):

| File | Role |
|---|---|
| `ai-compound-step-outcome.util.ts` | Pure attribution: sub-intents + plan step ids + execution timeline → one outcome per step. |
| `entities/ai-command-trace-step.entity.ts` | One row per sub-intent, correlated by `trace_id`. |
| `20260817120000-ai-command-trace-step.sql` | Table + two views, applied and verified against the live database. |
| `AiCommandTraceService.recordCompoundStepsFireAndForget` | Write path, off the hot path. |

### Attribution is by id, never by action name

`executeCompoundIntents` records which merged-plan step ids each sub-intent contributed.
Matching on the action instead would be wrong for the commonest compound shape there is —
*"cancel Mary's and cancel John's"* is two sub-intents with one action, and a failure would be
blamed on both or on the wrong one.

That is only sound because `mergePlans` copies sub-plan steps with their ids intact. A test pins
that: if merging ever regenerated ids, every step would silently record `executed` regardless of
what happened — a false-success bug inside the telemetry built to find false-success bugs.

### `not_planned` is a separate outcome, and it is the dangerous one

A sub-intent the decomposer named but never built a plan for is **not** a failure — the compound
executes its other steps and reports **success**, so the user is told something happened that did
not. That is e2e-bug.347's exact shape ("create a category with these services" creates the
category and drops the services), and the same family as the three false-success bugs already
found on this programme (e2e-bug.136, .348, .256).

`ai_command_compound_silent_drop` is that rule as a query — compounds recorded as `executed` that
contain a never-planned step. Verified against real inserted rows in a rolled-back transaction:
the e2e-bug.347 shape appears, correctly attributed to `create_service`.

### Safety properties

| Property | How |
|---|---|
| Cannot fail a command | Fire-and-forget with its own `catch`; a rejecting insert is logged, not thrown. |
| Cannot reach the user | Attribution rides on `_compoundSteps`; `sanitizeCommandDetailsForClient` strips `_`-prefixed keys, and telemetry runs on the unsanitized result first (the e2e-bug.135 convention). |
| Cannot orphan rows | Skipped entirely when no `traceId` was supplied, rather than keyed on a generated id the caller never sees. |
| Survives an unmigrated deploy | The step repository is `@Optional()`; without it the service writes no step rows and serves commands normally. |
| No foreign key | Deliberate: the parent trace is written fire-and-forget, and a constraint that can reject a diagnostic insert can turn telemetry into a user-visible error. |

### A bug caught by actually running the migration

`ORDER BY failed + never_planned DESC` failed with `column "failed" does not exist` — Postgres
accepts a bare output name in `ORDER BY` but not one inside an expression. The aggregates are now
repeated. Second time on this programme that running the SQL, rather than reading it, found the
defect (§18 was the first).

### `session_id` is blocked on the clients

The other half of this roadmap item is **not** shipped, and the reason is not effort. There is no
conversation identifier anywhere in the request: `AiCommandDto` carries `prompt`, client-held
`history`, and a free-form `context` — nothing that identifies a conversation across turns. All
three apps (dashboard web, customer, provider mobile) would each have to mint one and send it.

Adding the column now would produce precisely the unpopulated column this roadmap item warns
against, and a server-side heuristic (hashing actor + a time bucket) would be worse: Phase 6 needs
it so *"cancel it"* binds to the right prior turn, and a bucket boundary would bind it to the wrong
one. Specified in e2e-bug.357 instead.

### Verification

- `ai-compound-step-outcome.util.spec.ts` — 21 tests over the shapes the 61.8% is made of.
- `ai-compound-step-trace.spec.ts` — 10 tests: write path, all four safety properties, and the
  `mergePlans` id-preservation assumption.
- Migration applied to the live database; both views checked against inserted rows in a
  transaction-and-rollback.
- `npm run test:ai-roadmap-gates` — 11 suites, **380 tests**, green.
- Full `compound` sweep (77 suites, 2,001 tests): failure list **byte-identical** to the stashed
  baseline — 14 failing tests before and after, same names.
- `tsc --noEmit` clean for every file touched.

---

## 25. Phase 2 — the accuracy gate becomes a ratchet (shipped 2026-08-05)

The gate asserted `report.failed === 0` against a corpus that has never had zero failures. It had
therefore never passed once, and that had a consequence nobody had noticed:

```ts
let exitCode = report.failed > 0 ? 1 : 0;          // always 1
if (exitCode === 0 && ...) { /* staleness check */ /* per-intent regression check */ }
```

**Every check inside that block was unreachable code.** The baseline-staleness rule and the
per-intent regression rule — the two things that make an accuracy gate useful — had never executed.
The gate was disabled by its own precondition, and because it is part of `npm test`, CI was red
before any change was made.

### What the numbers actually were

| | committed baseline (2026-06-29) | today |
|---|---:|---:|
| cases | 3,696 | **8,464** |
| failed | 8 | **404** |
| accuracy | 99.78% | **95.23%** |
| intents | 283 | 527 |

*(§1's inventory recorded "594 `prompt:` rows" for the golden corpus. That was a mis-measurement —
it counted one file. AI-TODO's "~8,294" was close to right.)*

### Refreshing is not forgiving

The corpus more than doubled, so the old baseline could not gate the new suite at all — percentages
across different corpora compare different questions. Refreshing was required. But refreshing to
404 would bury anything that genuinely broke, so the two were separated first, comparing only
intents whose **case count did not change**:

- **24 intents lost 49 previously-passing cases** — real regressions. `lookup_customer` (6 of 6)
  and `appointment_reminder_preferences` (1 of 1) now fail 100%.
- The other +347 is new coverage arriving with known gaps: 244 new intents (3,950 cases, 293
  failed) plus 69 grown intents (+809 cases, +55 failures).

The 24 are recorded in **e2e-bug.358** with the full table, so they are tracked debt rather than
absorbed. The ratchet now prevents a 25th.

### The new rule

Failures alone are no longer fatal. The gate fails when, and only when:

| code | meaning |
|---|---|
| `no_baseline` | nothing to ratchet against — a gate with no bar silently passes |
| `stale_baseline` | case count moved, so per-intent percentages are not comparable |
| `more_failures` | total failures rose |
| `intent_regressed` | an individual intent got worse, even if the total held steady |

The last one matters on its own: one intent losing five cases while another gains five is a
regression wearing a disguise, and the overall count would not see it.

`--update-baseline` exits 0 (moving the line is a deliberate act, and a run cannot fail against a
line it just moved) but prints a loud warning when the new baseline is *worse* than the one it
replaces. The freeze ratchet's rule applies here too: never raise a number to make CI pass.

### Verification

- `ai-command-eval.report.spec.ts` — 16 tests, 7 new, covering each violation code, the
  failures-may-fall-not-rise rule, and an intent regressing while the total holds steady.
- **Mutation-tested against the real corpus**: tightening the committed baseline from 404 to 394
  makes the gate fail with `[more_failures] Failures rose from 394 to 404 (+10)`. Restored after.
- One existing test was passing by accident — it asserted "exits non-zero when a case fails" while
  actually reading the repo's committed baseline. It now uses an isolated path and asserts *which*
  rule fired.
- `npm run test:ai-accuracy` green: 4 + 80 + 16 tests.
- `tsc --noEmit` clean for every file touched.

**Pre-existing and untouched:** one strictness error in `ai-command-eval.runner.spec.ts`, confirmed
present with these changes stashed.

---

## 26. Phase 2 — red means red (shipped 2026-08-05)

The AI sweep has been red for months, and a suite that is always red carries no information.
Proving a change was safe meant stash → sweep → restore → sweep → diff the failure lists by hand —
done three times on this programme (§20, §23, §24), and not a process anyone follows under
pressure. That manual diff is now a gate.

### The mechanism

`scripts/ai-known-failures-gate.mjs` (`npm run test:ai-known-failures`) runs the `modules/ai`
sweep and compares the failure set to a committed manifest:

| observation | verdict |
|---|---|
| a failure **not** in the manifest | this change broke it — red means red |
| a manifest entry that now **passes** | fixed; the entry must be removed |

The second rule is what stops the manifest becoming a dumping ground: you cannot quarantine a test
and forget it, because *fixing* it fails the gate until the entry is deleted. A suite that fails to
load at all is recorded as `*` — otherwise the worst breakage, a file that will not compile, would
look like a clean suite. 11 of the 105 are in that state.

### The baseline: 105 suites, 463 tests

Categorised by cause, because "463 failures" is not an actionable number:

| cause | suites | tests | nature |
|---|---:|---:|---|
| `assertion_mismatch` | 86 | 398 | code and test disagree — each needs a product decision (stale test, or real regression?) |
| `mock_shape_undefined` | 12 | 17 | spec's mock is missing a collaborator the code calls |
| `mock_missing_transaction` | 7 | **48** | mock has no `transaction`, so any transactional path throws |

`mock_missing_transaction` is the obvious first win: 48 failing tests across 7 suites, almost
certainly one shared test helper.

### The failure set is deterministic

Verified by running the whole sweep twice, independently: **105 suites / 463 tests both times,
matching the manifest exactly.** This is the property the gate lives or dies on — a flaky failure
set would produce false "you broke this" reports and the gate would be ignored, which is the exact
failure mode being fixed here.

### Three design corrections found while building it

- It used `--runInBand`. CI runs `npm test` at jest's default parallelism, and a manifest built
  under different scheduling would quarantine a different set than CI sees.
- It ran the sweep *before* checking the manifest existed — spending 35 minutes to then report a
  missing prerequisite. It now fails fast.
- A first attempt appeared to hang; it was two of my own sweeps racing each other at 100% CPU for
  the same output file. Worth recording because the symptom (no progress) looked like the
  suite being slow rather than a self-inflicted collision.

### What this does not do

**Quarantined is not fixed.** 463 tests stop being noticed. The trade is that unexplained red
becomes tracked debt, but the burn-down needs an owner (e2e-bug.351), and the 86
`assertion_mismatch` suites are precisely where real regressions hide — e2e-bug.358 found 24 such
intents that had regressed unseen under exactly this cover.

`npm test` is also still red; this is a second signal, not a replacement. Making `npm test` green
needs `testPathIgnorePatterns`, which changes the whole repo's test contract rather than the AI
module's, and is left as a deliberate separate decision.

Generating or verifying the manifest costs ~35 minutes (e2e-bug.359). That runtime is why these
failures accumulated in the first place, and fixing it is the prerequisite for burning them down.

---

## 27. Phase 2 — paraphrase invariance, generated (shipped 2026-08-06)

The existing corpus (`ai-semantic-paraphrase-corpus.util.ts`, acc-3.16) is hand-authored: five
distinct phrasings per intent × three locales, written by a person. §2.2 demotes that approach as
"large, perishable, and mostly redundant" — it scales as 110 × 5 × 3 and rots whenever a command
changes.

These fixtures are **generated** from `CommandSpec.examples`. Adding a command to a spec file
extends the corpus automatically, and coverage cannot drift from the command because it is derived
from it.

### Two bars, because two different claims

| transform class | examples | bar | why |
|---|---|---|---|
| `strict` | casing, whitespace, trailing punctuation | asserted at **0** | no argument is available for failing these |
| `natural` | "please …", "can you …", "just …", "?" | ratcheted | ordinary phrasing an imperative-only regex will miss |

Deliberately *not* generated: semantic paraphrases ("book me in" → "make an appointment"). Those
need a human or a model to be trustworthy, and a generated guess at meaning produces fixtures that
fail for the wrong reason.

### The result inverts the expectation

The roadmap's thesis is that 786 regex detectors are brittle. Measured against the 10 specced
commands that have a primary `is*Prompt`:

- **Mechanical variation breaks nothing: 0 of 116 variants.** Casing, whitespace, punctuation,
  politeness prefixes, filler, question form — every example the detector layer recognises at all,
  it recognises in all of those forms.
- **Genuine phrasing variety breaks 40%: 8 of 20 documented examples never reach their own
  detector.**

| command | example its own detector misses |
|---|---|
| `appointment.mark_paid` | "Sarah paid cash for today's massage" |
| `appointment.reschedule_mine` | "can I push my booking to 4pm instead" |
| `catalog.deactivate_service` | "stop offering hot stone massage" |
| `catalog.create_package` | "bundle haircut and beard trim at 15% off" |
| `catalog.assign_services_category_bulk` | "put all the massages under the Massage category" |
| `catalog.assign_services_category_bulk` | "move haircut and blow dry into Hair Care" |
| `catalog.list_packages` | "what packages do we sell" |
| `catalog.list_subscription_plans` | "what subscriptions do we offer" |

**The detectors are not brittle to surface form. They are brittle to being written from one
phrasing.** Every miss above is a past-tense statement, a question, or a synonym verb — the shapes
a regex author did not happen to think of. That is a sharper statement of the roadmap's case than
"regexes are fragile", and it says something about the fix: normalising input (Phase 4) would not
help, because casing and punctuation were never the problem.

It also matters that these are the *documented* examples. They seed the planner's few-shots and the
eval goldens, so a gap here is a gap everywhere downstream. Filed as e2e-bug.360; the ratchet holds
it at 8.

### Scope

Ten of the sixteen specced commands are measurable. `create_booking`, `reschedule_booking`,
`cancel_bookings`, `update_bookings`, `book_appointment` and `update_service` have **no primary
`is*Prompt`** — they are chosen by the LLM classifier, with detectors only in the rescue layer, so
their paraphrase behaviour is not deterministically measurable. That is what §19's shadow run is
for.

### Verification

- 19 tests (`npm run test:ai-paraphrase`), folded into `test:ai-roadmap-gates`.
- **Both ratchets mutation-tested**: tightening the uncovered baseline 8 → 7 fails; making a
  `strict` transform produce an unrecognisable prompt fails the zero assertion. A first attempt at
  the second mutation appended text and still passed — the detectors matched anyway, so the
  mutation proved nothing and was redone.
- `tsc --noEmit` clean; lint clean.

---

## 28. Phase 2 — the completion rate gets an owner (shipped 2026-08-06)

§7 makes command completion the north star — 64.0% today, ≥92% target, "everything else is
diagnostic". Nothing computed it.

`AiPlatformService.getCommandAnalytics` looked like it did, and does not:

- it reports `successRate`, then declares `targets.completionRate: 0.75` — **a target with no
  metric behind it**, and a target that is neither §7's 92% nor anything derived from it;
- it reads the **event store**, not `ai_command_trace`, so it cannot reproduce the 64%/27% every
  argument in this roadmap rests on;
- it has no surface dimension at all.

### Delivered

| | |
|---|---|
| `ai_command_completion_summary` | the single north-star number |
| `ai_command_completion_by_action` | per command per surface, ranked by absolute failures |
| `ai_command_completion_by_surface` | per surface |
| `ai_command_completion_daily` | the trend the target is tracked against |
| `ai-completion-rate.util.ts` | the same definition, pure and testable |
| `GET businesses/:id/ai/completion-rate` | the API the dashboard consumes |

### Two rates, not one

```
completion_rate = executed / all      failure_rate = failed / all
```

`completion_rate` is §7's definition and deliberately harsh — a clarify counts against it. But
clarify and `security_blocked` are **not failures**: one is the assistant asking a good question,
the other is it correctly refusing. Reading `1 − completion_rate` as "broken" is the mistake both
columns exist to prevent, and a test pins that they are not complements.

`create_booking` on dashboard is the worked example: 4.4% completion but 58.4% failure — the gap is
clarifies and approvals, and treating those as breakage would send someone to fix the wrong thing.

### The finding: it is a customer-surface problem

§1.1 breaks the 27% down by action only. By surface, on the same 5,362 traces:

| surface | calls | completion | failure |
|---|---:|---:|---:|
| **customer** | 3,703 (69%) | **60.6%** | **31.1%** |
| dashboard | 1,161 | 67.1% | 19.7% |
| provider | 498 | **82.5%** | 13.7% |

The customer surface carries 69% of traffic at the worst rate; provider is 22 points better. The
north star is therefore mostly a customer-surface metric, and work aimed at dashboard commands will
barely move it. Filed as e2e-bug.361.

### Verified against the database, both ways

The SQL views and the TypeScript metric are two implementations of one definition, so they were run
against the same 5,362 real rows and compared: **identical** on the overall figures and on all
three surfaces. Two numbers called "completion rate" that disagreed would be worse than none.

### A limitation worth stating

`top_failure_reason` is NULL on every historical row. `failure_reason` derives from
`result.details`, which the trace never persisted, so it **cannot** be backfilled — §11's note that
the steal-attribution migration backfilled history covers `classified_action` and
`action_changed_by`, not this. The dashboard can say which commands fail and on which surface, but
not why, until post-2026-08-03 traffic accumulates.

### Verification

- 15 tests (`npm run test:ai-completion-rate`), folded into `test:ai-roadmap-gates`.
- Migration applied to the live database; every view checked against real data.
- Cross-checked TS ⟷ SQL on all 5,362 rows.
- `tsc --noEmit` clean; lint clean.

---

## 29. Phase 4 — entity resolution with confidence (shipped 2026-08-06)

Partial by design: this is the name/entity half of the resolution layer. Dates, relative ranges and
the call-site migration are still open — see the Phase 4 checklist.

### What the current resolvers actually do

At least four independent paths turn a name into an entity, and they disagree with each other:
`fuzzyMatchByName` (a five-tier cascade), `matchEmployeesInPrompt` (longest-name-first over the
whole prompt), `resolveServicesByCategoryName` / `resolveServicesForEmployeeAssignment`, and
per-handler `.find(...)` calls.

Two structural problems, not tuning problems:

**No confidence.** `fuzzyMatchByName` returns `T | undefined`. A caller cannot distinguish an exact
match from the cascade's last tier — `items.find(i => lower.includes(i.name.toLowerCase()))` —
where a prompt about "John Smith" matches an employee named "Jo". Both come back as a bare object,
so every caller treats a guess as a fact.

**Silent picks on ties.** `.find(...)` returns the first array element. With two customers named
"John", the answer depends on database ordering and the user is never asked. §7 forbids precisely
this: *"Below-threshold entity resolution clarifies; it never guesses."*

### The resolver returns a verdict, not an entity

`resolved` | `ambiguous` | `not_found`, with the tier and score that produced it and the candidates
that tied.

| tier | confidence | example |
|---|---:|---|
| `exact` | 1.00 | "John Smith" → John Smith |
| `full_token` | 0.90 | "John" → John **Smith** |
| `prefix` | 0.72 | "Jo" → **Jo**hanna |
| `contains` | 0.55 | "smith" → John **Smith**son |
| `query_contains` | 0.35 | "book John Smith" → "Jo" |

Default threshold 0.70, so `prefix` acts and `contains` clarifies. `query_contains` sits far below
on purpose: it is the tier that produces confident-looking nonsense.

**Ambiguity is checked before confidence.** Two exact matches score 1.0 and are still unusable, so
confidence alone can never be the whole gate — that ordering is the difference between "I am sure
it is one of these two" and "I am sure it is this one".

`resolveEntities` also reports names it could not resolve rather than dropping them:
`resolveEmployees` currently discards unmatched names, so *"cancel for John and Mary"* with an
unknown Mary quietly becomes *"cancel for John"*.

### Measured against the live matcher, not asserted

`ai-entity-resolution.boundary.spec.ts` drives the real `fuzzyMatchByName` and the new resolver over
the same inputs. **All four silent-pick shapes return a confident entity today and refuse now:**

| shape | what the current matcher does |
|---|---|
| two people with the same name | picks whichever row the database returned first |
| two people sharing a first name | picks the first; the other John is never mentioned |
| query merely containing a short name | assigns John Smith's booking to an employee called "Jo" |
| two services sharing a word | books one of two services at a different price, silently |

Three agreement cases are pinned too, so adoption is not a blanket behaviour change: unambiguous
matches resolve to the same entity, and both find nothing when nothing matches.

### Why nothing calls it yet

Adopting it *is* a behaviour change — it refuses where the old path guessed, and a refusal needs
somewhere to go. Phase 6 owns clarify as a first-class outcome; until then, swapping call sites
would convert silent wrong answers into hard failures rather than into questions. The resolver
lands first so the migration is a wiring change rather than a design one.

### Verification

- 29 tests (`npm run test:ai-entity-resolution`), folded into `test:ai-roadmap-gates` (now 443).
- `tsc --noEmit` clean; lint clean.

---

## 30. Phase 4 — "tomorrow" is wrong every evening (shipped 2026-08-06)

The date half of the resolution layer, and it turned up a live bug rather than only a design smell.

### The bug

Duplicated verbatim in `ai-payments.util.ts` and `ai-compound-booking-context.util.ts`:

```ts
new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
```

That is the **UTC** date 24 hours out, which is not the business's tomorrow whenever UTC has rolled
over and the business has not — the local evening. Measured across all 24 UTC hours:

| timezone | hours wrong | when |
|---|---:|---|
| America/Los_Angeles | **7 / 24** | 17:00–23:59 local |
| America/New_York | 4 / 24 | 20:00–23:59 local |
| Asia/Yerevan | 4 / 24 | 20:00–23:59 local |
| Europe/London | 1 / 24 | 23:00–23:59 local |

Every timezone, always the local evening — prime booking time. A customer saying *"book me
tomorrow"* at 9pm is booked **two days out**.

Three things made it durable:

1. **The call site had the answer and did not use it.** `ai-compound-booking-context.util.ts:104`
   calls `resolveTomorrowDateKey()` with no arguments, while the line below it passes `timeZone`
   to `extractSingleIsoDayFromPrompt`. The correct value was in scope.
2. **It is duplicated**, so fixing one copy would leave the other.
3. **The existing test pins `2026-06-05T12:00:00Z`** — midday UTC, the one time of day where the
   defect cannot show. A test that picked any evening hour would have caught this immediately.

Filed as e2e-bug.363.

### The resolver

Two rules, both a direct response to the above:

- **Calendar arithmetic on the local date, never epoch addition.** `+86,400,000ms` is 23 or 25
  local hours across a DST transition; `addCalendarDays` operates on the date parts, so "one day
  later" is the next calendar day by construction.
- **A verdict, not a string** — same shape as §29, because dates are ambiguous in the same way
  names are. *"Friday"* said on a Friday means today or a week away, and the platform cannot tell.
  It returns `ambiguous` with both candidates rather than picking.

| phrase | confidence | verdict |
|---|---:|---|
| `2026-07-04` | 1.00 | resolved |
| today / tomorrow / yesterday / tonight | 0.95 | resolved |
| "next Friday" | 0.90 | resolved — the qualifier disambiguates |
| "Monday" (said on Friday) | 0.75 | resolved |
| "Friday" (said on Friday) | 0.75 | **ambiguous** — today or +7? |
| "next week" | 0.40 | **ambiguous** — offers the seven days |

The `threshold` option genuinely demotes: at 0.8 a bare weekday clarifies instead of resolving. A
first version accepted the option and never applied it — lint caught the unused variable, and the
fix was to make it bite rather than to delete it.

### Verification

- 29 tests (`npm run test:ai-datetime-resolution`), gates now 472.
- The bug is asserted directly: three timezone cases where the new resolver is right *and* the
  legacy expression is shown to disagree, plus a loop over all 24 UTC hours.
- The midday agreement case is pinned too, documenting why it went unnoticed.
- DST, month, year and leap-day boundaries covered.

---

## 31. Phase 4 — a space decides whether PM means PM (shipped 2026-08-06)

The time half of the resolution layer, and like §30 it turned up a live bug rather than a design
smell. This one is worse: it is a **twelve-hour** error on ordinary phrasing.

### The bug

`extractTimeSlotFromPrompt` (`ai-structural-extractors.ts:104`) tries patterns in this order:

```ts
/\b(?:at|@)\s*(\d{1,2}):(\d{2})\b/   // 1. "at 3:30"
/\b(\d{1,2}):(\d{2})\b/               // 2. bare "3:30"
/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)/  // 3. meridiem  ← too late
```

Rules 1 and 2 match the digits inside "3:30 pm" and return immediately, so rule 3 never runs and
the meridiem is discarded. Whether that happens depends on **a single space**:

| prompt | returns | correct | |
|---|---|---|---|
| `at 3:30pm` | 15:30 | 15:30 | no boundary before "p", so rule 3 runs |
| `at 3:30 pm` | **03:30** | 15:30 | twelve hours early |
| `book for 6:45 p.m.` | **06:45** | 18:45 | twelve hours early |
| `9:30 pm` | **09:30** | 21:30 | twelve hours early |
| `at 12:00 am` | **12:00** | 00:00 | noon instead of midnight |

Four of eight ordinary phrasings are wrong. "Book me at 3:30 pm" — with the space almost everyone
types — schedules 3:30 in the morning. Filed as e2e-bug.364.

### The resolver

Reads the meridiem **first**, and refuses to assume when there is none.

| input | verdict | confidence |
|---|---|---:|
| `3:30 pm`, `3:30pm`, `6:45 p.m.` | resolved 15:30 / 15:30 / 18:45 | 0.95 |
| `14:30`, `00:15`, `19:00` | resolved — 0 and 13–23 can only be 24-hour | 0.95 |
| `at 8` | **ambiguous** — 08:00 or 20:00? | 0.5 |
| `at 10:30` | **ambiguous** — 10:30 or 22:30? | 0.5 |

**Business hours narrow, they do not guess.** Given opening hours, a bare hour with only one
reading inside them resolves at 0.8 — 10:00 wins over 22:00 for a business that shuts at 19:00.
When *neither* reading is open, or both are, it stays ambiguous: a real constraint can break a tie,
but the absence of one is not permission to invent an answer. An explicit meridiem always wins over
business hours, because the user said it.

### A test of mine that was wrong

The business-hours case initially asserted that "at 8" resolves to 08:00 for a 09:00–19:00
business. It does not, and should not: 08:00 is before opening and 20:00 after closing, so neither
reading is possible and the resolver correctly stays ambiguous. The code was right and the
expectation was wrong — corrected, and the case kept as its own test because "no possible reading"
is exactly where a resolver is most tempted to guess.

### Verification

- 55 tests total in the datetime suite (`npm run test:ai-datetime-resolution`); gates now **498**.
- The bug is asserted against the shipped extractor: four phrasings where this resolver is right
  and `extractTimeSlotFromPrompt` is shown to disagree, plus the no-space case where both agree —
  documenting that a space is the entire difference.

---

## 32. Phase 4 — relative ranges, and a resolver left alone (shipped 2026-08-06)

The last parsing piece of the resolution layer. Notable mostly for what it did **not** do.

### `resolveDateRange` did not need replacing

§30 and §31 replaced `resolveTomorrowDateKey` and `extractTimeSlotFromPrompt` because both were
wrong. The obvious next move was a third replacement — and it would have been the wrong call.
`resolveDateRange` resolves "today" through `getTodayDateKey(tz)` and does its arithmetic in
`dayjs.tz`, so it has none of the UTC exposure that made e2e-bug.363 a day-late bug. Probed
directly, it correctly handles this/next/last week, this/last month, named months and "the next N
days".

What it had were **coverage gaps** — these returned `null`, so callers fell back to a default:

| phrase | before | now |
|---|---|---|
| "next 3 weeks" | null | 21 days from today |
| "the next fortnight" | null | 14 days |
| "next 2 months" | null | calendar months, not 60 days |
| "the rest of the month" | null | today → month end |
| "the rest of the week" | null | today → week end |
| "next three days" | null | number words accepted |

These were added **to the existing function**. A second range parser would have been the fifth
independent re-parser — the exact thing Phase 4 exists to remove. Replacing something that works
is not consolidation, it is duplication with better manners.

### One semantic distinction kept deliberately

"Next week" still means the *following calendar week*; "the next 3 weeks" means a rolling span
starting today. Both are correct English and they are not the same range — a test pins both so a
future tidy-up cannot quietly collapse them.

### Two things caught by running rather than reasoning

- **My own test arithmetic was wrong.** The "next 2 months" case asserted an end month computed
  with a bad modular expression; Aug 5 + 2 months − 1 day is Oct 4, not September. The code was
  right. Rewritten to compute the expectation directly instead of with fragile arithmetic.
- **The inventory drift gate fired.** Inserting lines into `ai-orchestration.helpers.ts` shifted
  the line number of a detector defined lower in the file, so §22's checked-in inventory no longer
  matched the tree. That is the gate doing its job on the first change that touched a detector
  file; regenerated with `npm run build:ai-inventory`.

### Verification

- 15 tests (`npm run test:ai-datetime-resolution`, widened to cover ranges); gates now **513**.
- Regression-checked like-for-like: `ai-orchestration.helpers.spec` reports **1 failed, 92 passed**
  both with and without the change.

**Pre-existing and untouched:** that one failure is a time-bomb test — `resolvePublicAvailabilityDateKeys`
hardcodes `2026-06-15`, which is now in the past and is correctly dropped as a past date. Same
family as §31's midday-UTC test: a time-dependent test that does not control time. Also one unused
import (`formatTimeDisplay`) in the same file, confirmed present with the change stashed.

---

## 33. Phase 5 — the DAG executor (shipped 2026-08-06)

The half of Phase 3's contract that had no consumer. §15 fixed `orderedStepIds` and §21 pinned its
semantics; this is the thing that finally runs it.

**Pure orchestration with an injected runner.** The function that performs a command is a
parameter, so every rule is testable without a database — which matters because §26 measured the
AI suite as too slow to iterate on when a database is in the loop. 25 tests run in under a second.

### The four rules, and what each is defending against

**1. A non-executable plan does not run.** §21 found `orderedStepIds` is populated whenever the
graph is acyclic — *including for refused plans*, because a previewable order is useful. An
executor that read a non-empty list as permission would have executed two steps of the headline
three-step plan whose third command does not exist. The gate is `validation.executable`, and a
mutation swapping it for `orderedStepIds.length` fails a test.

**2. Downstream steps are skipped, not failed.** One booking failing is one failure, not three.
`blockedBy` names the upstream step, so the response can say *why* something did not happen.

**3. A step whose dependency returned no such field is skipped, not run.** If `patient.create`
succeeds but returns no `id`, the dependent `appointment.create` would otherwise receive the
literal string `"$s1.id"` and write it to the database. `resolveStepReferences` reports the gap
instead of substituting null.

**4. Partial success is reported as partial.** `summarizeExecution` derives the verdict from step
results and has no access to whether execution was *attempted* — the input that produces false
success. Three bugs on this programme (e2e-bug.136, .348, .256) reported success for work that had
not happened; mutating `partial` to `completed` fails six tests.

Two smaller decisions: dependencies are read from `$sN.field` references **as well as** `dependsOn`,
since a plan can reference a step without listing it; and a handler that throws is one failed step
rather than a failed plan, because the steps that already succeeded really did happen and must
still be reported.

### Still to come in Phase 5

Transactional grouping and saga compensation, `bulkOf` with blast-radius caps, and idempotency keys
— all of which need a real handler behind the runner. The executor's shape is deliberately
agnostic about that: `StepRunner` is where a transaction boundary will wrap.

### Verification

- 25 tests (`npm run test:ai-plan-executor`), gates now **538**.
- **Both critical rules mutation-tested**: gating on `orderedStepIds` instead of `executable` fails
  1 test; reporting partial runs as completed fails 6.
- `tsc --noEmit` clean; lint clean.

---

## 34. Phase 5 — honest partial success (shipped 2026-08-06)

§3.3 calls this "a hard requirement", and it is the one Phase 5 item whose absence has already cost
three bugs: e2e-bug.136 (`clear_schedule`), e2e-bug.348 ("category created" when it wasn't) and
e2e-bug.256 (clinic compounds). All three had the same shape — a response assembled from what the
user **asked for** rather than from what happened.

### The defence is structural, not diligence

```ts
buildPlanResponse(steps: readonly StepResult[], labeller?)
```

There is no `prompt` parameter and no `plan` parameter. The user's wording is not reachable from
this function, so no future edit can accidentally reintroduce "I've cancelled your bookings" for a
run that cancelled nothing — it would have to add an argument first. A test asserts the arity, so
that change cannot pass unnoticed.

### What it says

| outcome | response |
|---|---|
| all executed | `success: true` — "Done: reschedule and cancel_bulk." |
| some failed | `success: false` — what did happen, then what didn't, with the handler's reason |
| some skipped | `success: false` — "Didn't attempt X, because an earlier step didn't succeed." |
| refused | `success: false` — the refusal; there are no outcomes to list |

Three deliberate choices:

- **Skipped is not failed.** One failure blocking two steps is one failure, not three. The details
  bag keeps them in separate lists so telemetry cannot conflate them either.
- **What succeeded is still reported first.** Leading with the failure would be honest but
  unhelpful; omitting the success would understate what the user now has to reason about.
- **No invented reasons.** A handler that fails without a message produces "Couldn't create." — an
  unrecognised command falls back to its raw id rather than confident prose. Slightly technical
  beats confidently wrong.

### Verified end to end, not just in isolation

Testing the builder alone proves the *text* is right. A further test drives the real executor with
a three-step plan whose middle step fails, and asserts the response says the category was created,
the services were not (with the reason), and the booking was never attempted. That proves the
*wiring* is right too.

Both honesty rules are mutation-tested: treating skipped steps as success fails 2 tests; reporting
a refusal as success fails 2.

### Why transactional grouping was skipped rather than attempted

It is the earlier item in the Phase 5 list, and it is not started on purpose. It needs two things
that do not exist:

1. **A compensation model.** `CommandSpec` has `domain`, `risk` and `bulkOf`, but nothing declaring
   which command undoes another. Saga compensation without that is a rollback framework with
   nothing to roll back.
2. **A real transaction boundary.** `StepRunner` is injected precisely so the executor stays pure;
   a transaction wraps the *handler*, which means this needs handler integration rather than more
   pure logic — and it cannot be validated without one.

Building the frame now would produce something that type-checks, tests green, and protects nothing.
It is listed in Phase 5 with what it needs.

### Verification

- 18 tests (`npm run test:ai-plan-executor`, widened to cover the response builder); gates now
  **556**.
- `tsc --noEmit` clean; lint clean.

---

## 35. Phase 5 — blast-radius caps (shipped 2026-08-06)

§9 open decision 6 asked for "blast-radius caps per tier"; Regex.MD `acc-5.7` asked for the same.
Neither existed — and `CommandSpec.bulkOf` turned out to be **declared data that nothing reads**:
grep finds it in the type, in two spec files, and nowhere else.

### The exposure

`appointment.cancel_bulk` is T3 because it is *filter-matched and therefore unbounded*. "Cancel
everything next week" resolves to however many rows happen to match, and nothing between the
planner and the database asked whether that number was plausible. A filter matching more than
intended is not a hypothetical: §29 found entity resolution silently picking wrong matches, and
§30/§31 found date and time resolution off by a day and by twelve hours — each of which widens a
filter.

### The rule

Count before writing; then, per tier:

| tier | confirm above | refuse above | why |
|---|---:|---:|---|
| T0 read | never | 10,000 | reads cannot damage; the ceiling stops absurd queries |
| T1 single | 5 | 100 | more than a handful means the filter is wrong |
| T2 money/PII | **3** | **25** | a wrong count costs refunds and a privacy incident |
| T3 bulk | 10 | 500 | deliberately bulk, still bounded |

Three decisions worth stating:

- **Confirmation satisfies `confirm`, never `refuse`.** A user clicking yes cannot authorise a
  filter that has obviously matched the wrong set. Mutating that rule to let `confirmed` bypass a
  refusal fails a test.
- **The count is in the message.** "Are you sure?" is a prompt people learn to dismiss; "this will
  affect 47 records" is not.
- **An untrustworthy count refuses.** A negative, fractional or `NaN` count is a caller bug, and
  treating it as zero would wave the command through — the exact failure this check exists to
  prevent. Mutating that guard away fails three tests.

The caps are **starting positions, not measurements**, and are exported so they can be argued with
and tuned against real traffic in Phase 9. They are chosen to be survivable rather than precise.

### A test of mine that was wrong about my own design

The first invariant asserted `refuseAbove > confirmAbove` for all four tiers, and T0 broke it: reads
never confirm, so its `confirmAbove` is `Infinity` and it goes straight from allow to refuse. The
caps were right and the invariant was stated too broadly. Restated for the tiers that confirm, plus
a separate test pinning that reads skip the confirm step entirely — which is worth asserting on its
own rather than hiding inside a loop.

### Verification

- 20 tests (`npm run test:ai-plan-executor`, widened to cover blast radius); gates now **576**.
- Both safety rules mutation-tested, as above.
- `tsc --noEmit` clean; lint clean.

**Not yet wired.** Like the resolvers, this is the rule rather than its adoption: it needs the
resolved entity count, which arrives with the handler integration that Phase 5's transaction item
is also waiting on.

---

## 36. Phase 5 — idempotency keys (shipped 2026-08-06)

`grep -rn idempoten` over the tree returned nothing before this.

### Why this phase makes it urgent

§33 and §34 made partial execution a *normal, honestly-reported* outcome. That is the right
behaviour, and it has a consequence: "retry" becomes the obvious next user action, and without a
key the retry re-runs the steps that already succeeded. Double bookings and double charges — the
same T2 operations §35 caps hardest.

### The key

`sha256(requestId, stepId, command, canonicalised resolved variables)`, truncated to 32 hex chars.

Four decisions, each with a failure mode behind it:

- **Canonical JSON.** Object keys are sorted at every depth. The planner does not guarantee key
  order, so `{a,b}` and `{b,a}` — the same variables — would otherwise hash differently and the
  guard would silently do nothing. Arrays keep their order, because order is meaning there.
- **`stepId` is in the key.** Two identical commands in one plan are two intentional writes
  ("book both slots"); dropping the step id would collapse them into one.
- **Resolved variables, not raw ones.** A retry after a date resolved differently is a different
  write and must not be suppressed as a duplicate.
- **Nothing time-varying.** No timestamp, no attempt counter. A key that is unique per attempt is
  the same as no key — and it looks like it is working, which is worse. The guard is that the
  function takes no clock at all, asserted by its arity.

`buildPlanIdempotencyKeys` returns a `Map` keyed by step id rather than a positional array, so a
caller cannot pair a key with the wrong step by index — a mistake that would make every key wrong
while everything still ran.

### Verification

- 20 tests (`npm run test:ai-plan-executor`, widened); gates now **596**.
- Both directions mutation-tested: removing canonical sorting fails 3 tests (retries would
  double-write); removing `stepId` fails 3 (legitimate duplicate steps would collide).
- `tsc --noEmit` clean; lint clean.

Enforcement — a uniqueness constraint or applied-keys table — belongs with the handler. The
derivation is the part that is easy to get subtly wrong and hard to notice, which is why it is
here with tests.

### Phase 5 status

Four of five items are done. **Transactional grouping and saga compensation remain, and are the
only Phase 5 item that cannot be advanced without handler integration** — it needs a
`compensatedBy` field on `CommandSpec` (which does not exist) and a transaction boundary around
`StepRunner` (which is injected precisely to keep the executor pure).

That same integration is what the §29–§31 resolvers, §35's caps and this module are all waiting
for. The pure layer of Phases 4 and 5 is now essentially complete; what is left is wiring, and the
gate on wiring is Phase 6's clarify path — because every one of these components refuses where the
old code guessed, and a refusal needs somewhere to go.

---

## 37. Phase 6 — clarify stops being swallowed (shipped 2026-08-06)

This is the item that unblocks the rest. Every resolver built in §29–§31, and §35's caps, *refuses*
where the old code guessed — and a refusal needs somewhere to go. That somewhere is a clarify
question, and clarify was not in a state to receive it.

### Three things were wrong

**1. It had no options.** The roadmap asks for "a targeted question naming missing variables and
top-2 candidates". `grep` finds no structured candidate list anywhere in the tree — the candidates
half had never existed, so a client could not render choices and the user had to retype.

**2. It was a boolean on a failure.** `success: false` plus `details.needsClarification: true`, in
free text. Three different flags are used for it across the codebase (`clarify`,
`needsClarification`, `pipelineStage`), each re-derived by its caller.

**3. It was being swallowed — the actual AI-TODO Phase 6 bug.** Verified directly against the
shipped function:

```
shouldAppendPostFailureGuideFallback({ action: 'mark_paid',
  summary: 'Which booking should I mark as paid?',
  details: { needsClarification: true } })   →   true
```

A command that knew exactly what to ask appended a **product-guide walkthrough** instead of asking
it. A fixture (`provider-validator-clarify`) asserted that behaviour, so the bug was pinned in
place by a test.

### The fix is scoped, not blanket

The first attempt suppressed the tour for every `needsClarification` result and broke 8 tests.
Reading them showed why that was wrong: `action === 'unknown'` with `needsClarification` is a
different shape — there the platform has **no question worth asking**, so pointing at documentation
is the most useful thing left.

The rule is therefore: suppress the tour when the command is *known* and a question exists. One
fixture changed — the one that encoded the bug — with the reason recorded in the fixture itself.
The `unknown` fixtures still expect a tour, and a test pins that.

### The shape

`ClarifyRequest` carries a reason, one question, the command and variable it concerns, and
renderable `{value,label}` options. Builders convert each resolver's output:

| source | reason | options |
|---|---|---|
| two customers named John (§29) | `ambiguous_entity` | the tied candidates |
| "Friday" said on a Friday (§30) | `ambiguous_date` | today, +7 |
| "at 8" (§31) | `ambiguous_time` | 08:00, 20:00 |
| missing required variable | `missing_variable` | free text |
| no such command (§15) | `unsupported_command` | none — a dead end, not a question |

Two deliberate limits. Options are capped at **3**: forty customers is not a clarification, it is
the same problem restated. And `allowsFreeText` is always true, because the right answer may not be
among the candidates and a clarification the user cannot escape is a dead end.

`clarifyFromPlanProblems` asks **one** question, ordered by how actionable the answer is — a
missing variable before an absent command, because the user can supply the first and nothing they
say will create the second. Reporting every problem at once is what produces the "I didn't
understand" wall the production traces are full of.

### The grammar bug, also fixed

`Here's how to ${taskLabel} on this page` is fed a guide topic *title*, which is a noun as often as
a verb — producing "Here's how to packages on this page". `looksLikeVerbPhrase` picks a frame that
fits the label shape instead, in all three locales.

### Verification

- 21 tests (`npm run test:ai-clarify`) plus the 22 existing guide-fallback tests, all green; gates
  now **639**.
- The swallowing fix is asserted in both directions: a known command asks, an `unknown` still tours.

**Pre-existing and untouched:** two `tsc` strictness errors and one unused import in
`ai-product-guide-failure-fallback`, all confirmed present with these changes stashed.

---

## 38. Phase 6 — multi-turn slot filling (shipped 2026-08-06)

The turn after a clarification. §37 made the assistant ask a good question; this makes the answer
worth something.

### It did not need the blocked session store

Phase 6's first two items are blocked on e2e-bug.357 — there is no conversation id, so there is
nowhere to key a server-side entity store. Slot filling looked blocked for the same reason and is
not: `attachCompoundResumeToClarifyResult` already round-trips resume state through
`details.sessionContext` → the client → the request `context`. The pending plan rides the same
path. A conversation id would make this tidier, not possible.

Worth recording because the blocked item was nearly used as a reason to skip this one.

### What it fixes

Today a clarify answer restarts understanding: the question is asked, the user replies "John
Smith", and the next turn classifies those two words on their own — with the service, the date and
the command that were already understood thrown away.

`applyClarifyAnswer` merges instead. A test asserts exactly that: after answering, `serviceName`
and `date` are still in the step, and only `customerName` is new.

### The dangerous case is the reply that is not an answer

**"Actually cancel it instead"** is a new request. Writing it into `customerName` would put the
user's topic change inside the pending command — the same family as every silent-pick bug on this
programme. So this returns a verdict, not a plan:

| reply | kind |
|---|---|
| matches an offered option | `option` — the id is written, not the label the user saw |
| plain text, no new-request cue | `free_text` |
| "actually…", "never mind", or a verb like "cancel"/"book" | `not_an_answer` — re-plan |
| the question had no slot to fill | `not_an_answer` by definition |

Ordering matters: the **option check runs first**, so an explicit pick is honoured even when its
wording contains a cue word — a service genuinely called "Cancellation cover" is a valid choice,
and refusing it because it contains "cancel" would be its own bug. A test pins that.

The cue list is deliberately conservative. Anything it misses falls through to `free_text`, where
the command's own variable schema still validates the value before it is written — so a miss
degrades to the existing behaviour rather than to a wrong write.

### Reading state back across the client boundary

`readPendingClarification` validates shape rather than trusting it, including that the referenced
step actually exists in the carried plan. Six malformed shapes are tested, and a JSON round-trip
proves the state survives the wire — the pending plan is only useful if it comes back intact.

### Verification

- 33 tests (`npm run test:ai-clarify`, widened); gates now **672**.
- Both core properties mutation-tested: dropping the new-request check fails 4 tests (topic changes
  would be written into the pending command); rebuilding the step instead of merging fails 1 (the
  restart this item exists to prevent).

### Phase 6 status

Two of four done. The remaining two — turn buffer / entity store, and topic-change detection —
are the ones that genuinely need e2e-bug.357's conversation id, and topic-change detection needs
the entity store to have something to invalidate.

---

## 39. Phase 7 — the risk tier finally does something (shipped 2026-08-06)

Risk tiers have been on `CommandSpec` since §13. At runtime they did nothing.

### The gap, verified against the shipped function

```ts
export function requiresConfirmation(spec, opts) {
  if (spec.confirm === 'always') return true;
  if (spec.confirm === 'never')  return false;
  return opts.ambiguous;
}
```

`spec.risk` is not read. Probed directly:

| spec | confirmed? |
|---|---|
| T2 (money/PII) declared `confirm: 'never'` | **no** |
| T3 (bulk) declared `confirm: 'if-ambiguous'`, plan unambiguous | **no** |

§13's hygiene test asserts every T2/T3 spec declares `confirm: 'always'` — but that is a lint at
author time, over the 16 specced commands only. Nothing enforced the tier where it matters. The
tier now decides first and cannot be overridden downward: get the declaration wrong and the gate
still holds. Reverting that single line fails 2 tests.

### Preview was the other half, and did not exist

Confirmation without a preview is the click-through problem §35 named: "are you sure?" trains
people to say yes. `buildPlanGate` produces a numbered preview of what will change, per step, with
the resolved variables that will be written.

Built from the plan, never from the request — the same discipline as §34's response builder, for
the same reason: **a preview that restates the request confirms the request, not the operation.**

Four decisions:

- **Plan-level, not step-level.** §3.3: any T2/T3 step gates the *whole* plan. Confirming step 3
  after steps 1 and 2 have run is a notification, not a gate.
- **The preview covers every step**, not only the risky one — the user is approving a plan.
- **A preview implies a confirmation.** Showing someone what will happen and then doing it anyway
  is not a gate.
- **An unknown command forces confirmation and is excluded from the preview.** It cannot be
  described, and letting it sit silently inside an approved preview is the dangerous reading.
  Mutating that away fails a test.

### Verification

- 18 tests (`npm run test:ai-risk-gate`); gates now **690**.
- The shared `requiresConfirmation` change was checked against the 233 tests that already depend on
  it — all still green, because the change only ever *adds* confirmation.

**Not yet wired**, like the rest of the Phases 4–7 pure layer. The gate is computed from a plan and
specs; connecting it to the response needs the same handler integration everything else is waiting
on.

---

## 40. Phase 7 — self-verify stops being advisory (shipped 2026-08-06)

### The gap, probed against the shipped function

```ts
return !result.passed && !result.correctedAction &&
       confidence < SELF_VERIFY_CLARIFY_CONFIDENCE_THRESHOLD;  // 0.55
```

| self-verify | confidence | blocks? |
|---|---:|---|
| failed | 0.30 | yes |
| failed | 0.54 | yes |
| failed | **0.55** | **no** |
| failed | **0.95** | **no** |

A failed verification at confidence ≥ 0.55 was written to the trace and then ignored. The check
was weakest exactly where it matters: **a confident wrong answer is the case self-verify exists to
catch**, and the more sure the classifier was, the less the safety net did.

### The fix is risk-proportionate, not absolute

Making every failure block would be the obvious change and the wrong one — it would clarify on
confident reads and make the assistant useless at answering questions. So:

- **mutating command + failed verification → block, whatever the confidence;**
- read + failed verification → keep the 0.55 gate. A wrong read is recoverable by asking again; a
  wrong write is not.

Same principle as §39's tier gates rather than a new one. A test asserts the change is **strictly
more protective**: every input that blocked before still blocks, so this can only add
clarifications, never remove one. The `mutating` option defaults to `false`, so any caller not yet
updated keeps the old semantics instead of silently becoming stricter.

### This is the first live-pipeline behaviour change on this programme

Everything in Phases 4–7 so far has been a pure module nothing calls yet. This one edits
`ai-unknown-intent.util.ts`, which the understanding pipeline runs on every message — so it was
checked accordingly:

- `ai-unknown-intent` + `command-understanding` suites: **2 failed / 146 passed**, byte-identical to
  the stashed baseline (both failures pre-existing).
- **The full deterministic eval corpus: 8,060/8,464 passing, 404 failures — exactly the committed
  baseline.** Zero regressions across 8,464 cases, which is the evidence that "blocks more" has not
  become "blocks the wrong things".

That last check is the one worth having: a safety change that quietly broke a hundred eval cases
would have looked identical in the unit tests.

### Verification

- 11 tests (`npm run test:ai-risk-gate`, widened); gates now **701**.
- Mutation-tested: removing the mutating clause restores the gap and fails a test.
- `npm run test:ai-accuracy` green against the §25 ratchet.

---

## 41. Phase 7 — a handler's "success" is a claim, not evidence (shipped 2026-08-06)

The assertion half of Phase 7's third rail. Rollback is not included, and the reason is the same
one that stopped Phase 5's transaction item: there is still no `compensatedBy` on `CommandSpec`, so
a rollback would have nothing to roll back.

### What it checks

Three bugs on this programme were a handler reporting success for work it had not done —
e2e-bug.136, .348 and .256. §34 stops the *response* inventing success; this checks the *result*
the response is built from.

The property is deliberately narrow and generic, because anything command-specific would need 696
hand-written assertions:

> **A mutation that reports success must evidence the entity it touched.**

| situation | verdict | fails the step? |
|---|---|---|
| output mentions `apt-9`, the id we sent | `verified` | no |
| we asked `status: no_show`, output says `confirmed` | `contradicted` | **yes, at every tier** |
| output mentions nothing we sent, T2/T3 | `unverified` | **yes** |
| same, T0/T1 | `unverified` | no |

Three judgements worth stating:

- **`contradicted` fails at every tier**, unlike `unverified`. The platform has positive evidence
  it did the wrong thing; risk tier does not change that.
- **`unverified` fails at T2/T3 only.** Unverified money is not verified money — but requiring
  evidence from every single-entity mutation would fail the many handlers that return a summary
  string and nothing else. That is a real constraint of the current handlers, not a principle.
- **A handler that returns nothing is unverified**, which at T2 means failed. That is deliberate
  pressure: a money handler that reports nothing cannot be trusted to have done anything.

It does *not* try to assert structured drafts (`catalog.create_with_services` takes a nested
category-plus-services object). Checking those generically would produce confident nonsense, so
they come back `unverified` and the tier decides.

`assertPlanEffects` skips steps that already failed or were skipped: a failed step does not need a
second opinion, and asserting against its empty output would report one event as two failures.

### Verification

- 19 tests (`npm run test:ai-risk-gate`, widened); gates now **720**.
- Both rules mutation-tested: making `unverified` always pass fails 5 tests; removing contradiction
  detection fails 2.

### What rollback needs

Unchanged from §36: a `compensatedBy` field on `CommandSpec` declaring which command undoes another,
and a transaction boundary around `StepRunner`. This assertion is the *trigger* a rollback would
use — `failedStepIds` is exactly the list that would need compensating — so the two fit together
when that model exists.

---

## 42. Phase 7 — propose-only until measured (shipped 2026-08-06)

The bar existed as a number and as a rule, in different files. §25's committed baseline carries
per-intent accuracy for 527 intents; the roadmap says new commands ship propose-only until they
clear a bar. **Nothing joined them** — a command with no eval coverage at all executed exactly like
one measured at 100%.

### What the data says once you apply it

At a 90% bar and a 5-case minimum, against the committed baseline:

| | count |
|---|---:|
| cleared — measured and accurate | **343** |
| below the bar | 32 |
| too few cases to tell | **152** |

The third row is the interesting one. **152 intents cannot clear a bar they were never measured
against**, and every one of them executes today.

Among the measured failures, `compound_intent` is at **0% of 48 cases** — it fails every eval case
it has, and §1.1 says it fails 61.8% of real traffic. It is the command this whole roadmap is most
about, and it currently executes autonomously.

The majority still clear, and a test asserts that: this is a gate on the tail, not a shutdown.

### Three distinctions the verdict keeps

- **"Unmeasured" is not "inaccurate".** `appointment_reminder_preferences` is 0 of 1 — that is not
  a 0%-accurate command, it is an unmeasured one. The fixes differ: one needs eval cases, the other
  needs the command fixed, and collapsing them into "not allowed" hides which.
- **`accept_hipaa_baa` is 100% and still held back**, on 4 cases. A percentage over a handful of
  cases is not evidence. My own first test asserted it should clear; the minimum was right and the
  test was wrong.
- **Propose-only is not disabled.** The command is still understood, previewed and offered — it
  just does not write without a human saying yes.

### The override is a list, not a flag

`overrides` is an allowlist passed by the caller rather than a field on `CommandSpec`. Overriding a
safety bar should be a visible, reviewable set of names, not something set while adding a command.

### Verification

- 16 tests (`npm run test:ai-risk-gate`, widened); gates now **736**.
- Asserted against the **real committed baseline**, not only fixtures: `compound_intent` is held
  back, a 30-of-30 command clears, and the portfolio split is printed on every run.

**Phase 7 status:** 3 of 4. The remaining item is post-exec *rollback* (§41 shipped the
assertion half), still waiting on the `compensatedBy` model that Phase 5's transaction item needs.

---

## 43. Phase 9 — mining the traces for misses (shipped 2026-08-06)

The learning loop's input. Each confirmed miss becomes a registry `example` and an eval case —
never a new regex (§8, working agreement 6).

### Measured before written, and it changed the design twice

**579 messages follow a failure within five minutes.** The obvious detector is "failure followed by
another message". Sampling the real pairs showed most are a *different question*:

```
"how much would a 100 dollar gift card cost?"  →  "please cancel gift card order QATEST-…"
"how much do I save with a package…"           →  "what subscription plans are available?"
```

A queue of 579 mostly-noise items does not get worked. So a retry has to *look* like a rephrase,
not merely follow a failure.

**153 follow a clarify.** Those are answers — the system working, and the exact turn §38's slot
filling is built on. Labelling them misses would penalise the behaviour the roadmap wants more of.
They are excluded, and a test pins that.

A third hypothesis was **wrong and worth recording**: the first sampled pair was *"cancel every
appointment I have"* → *"yes"*, suggesting confirm-flow first steps were being mislabelled as
failures and inflating the 27%. Measured across the corpus, only **9 of 579** failures are followed
by an affirmative. A real but small effect, not the systemic mislabelling the sample implied.

### What it finds

564 candidates from 5,362 traces — selective rather than a restatement of the 1,448 failures:

| signal | count |
|---|---:|
| repeated failure (same command, same sitting) | 392 |
| rephrase retry | 135 |
| negative feedback | 37 |

Ranked by action, it independently reproduces the ranking §1.1 and §28 arrived at by other routes:

| action | total | retry | repeat |
|---|---:|---:|---:|
| `compound_intent` | 102 | 30 | 72 |
| `create_booking` | 86 | 30 | 56 |
| `claim_referral_code` | 61 | 3 | 58 |
| `reschedule_booking` | 56 | 19 | 37 |

Three independent measures agreeing is the reason to believe any of them.

### Similarity is deliberately crude

Jaccard overlap of content words, threshold 0.5. The job is separating "asked the same thing again"
from "asked something else", not measuring semantic distance — and a cheap measure that can be
reasoned about beats an embedding whose threshold nobody can explain when the queue is wrong.
Sampling the output at the threshold shows it sitting in the right place:

```
0.88  "mark Karo's appointment as done"       → "mark Karo Mazmanyan's appointment as done"   ✓
0.67  "make Karo's appointment to done"       → "mark Karo's appointment as done"             ✓
0.50  "make provider Karo Mazmanyan's …"      → "make Gevorg Gasparyan's …"        ← different person
```

The 0.5 case is a marginal false positive, which is what a boundary looks like.

### `undo-within-1-min` is not implemented

It is in the roadmap's list. There are **zero** undo-shaped actions in the 5,362-trace corpus, so
there is nothing to detect and no way to test a detector honestly. Recorded rather than faked.

### Verification

- 20 tests (`npm run test:ai-completion-rate`, widened); gates now **756**.
- Both noise-control rules mutation-tested: dropping the similarity check and treating clarifies as
  failures each fail a test.
- Run end to end over all 5,362 production traces.

---

## 44. Phase 9 — a miss becomes data, never a detector (shipped 2026-08-06)

§43 finds candidates; this turns a triaged one into the two artefacts that close the loop. The
parenthesis in the roadmap item is the substance: **never a new regex**. The historical response to
a miss was another `is*Prompt`, which is how the tree reached 790 of them.

The defence is structural — everything here returns data. There is no code-generation path, so the
loop cannot emit a detector.

### The expected action is an input, not a guess

`ConfirmedMiss` requires `expectedAction`. §43 knows which command *ran*, not which one should
have, and inferring it would write the wrong answer into the eval corpus. **A wrong golden is
permanent: everything else is measured against it.** So "confirmed" means a human decided.

### It keeps the phrasing that failed

The rewording that worked already succeeds — an eval case for it passes on day one and proves
nothing. The default is the *original* prompt, and `use: 'evidence'` is opt-in. Mutating that
default fails 6 tests.

### Three rejections, each protecting the corpus

| rejected | why |
|---|---|
| prompt already in the corpus | a duplicate golden inflates an intent's apparent coverage without testing anything — and §42 gates propose-only on case count |
| prompt under two words | `"yes"` and `"ok"` are real trace prompts; as standalone cases they assert that two characters mean a command |
| expected action == the action that ran | not a miss; accepting it would encode the failure as correct |

Skipped items are reported with reasons rather than silently dropped.

The eval case asserts **only** `action`. A miss says "this phrasing reached the wrong command" and
nothing about parameters; inventing param expectations would create a golden nobody verified.

### The freeze ratchet caught this very change

The new spec file passes a literal `export function is…Prompt` string to `findRegexShapedFixes` as
test input. §22's ratchet counts that pattern across the tree by raw text, so on the first run:

```
[AI-ROADMAP burn-down] is*Prompt 791/790 · tryRescue* 163/163
```

The test file had registered itself as a 791st detector. The string is now assembled rather than
written out, with a comment saying why so nobody simplifies it back. Worth recording: the guard
built in Phase 0 caught a Phase 9 change within minutes of it being written, which is the entire
argument for ratchets over review.

### Verification

- 19 tests (`npm run test:ai-completion-rate`, widened); gates now **775**.
- Both corpus rules mutation-tested: defaulting to the successful rewording fails 6 tests; accepting
  a non-miss fails 1.

---

*Merged from `AI-TODO.md` (2026-07-19) and `Regex.MD` (2026-08-01) on 2026-08-03. Inventory and
production figures measured against the tree and `ai_command_trace` at merge time.*

## §45 — Phase 9: ratcheting accuracy + completion floors

The accuracy half already existed: §25 turned the accuracy gate into a ratchet committed at
8,464/404. The completion half did not. §7 makes command completion the north star and §28 built
the views to measure it — but nothing *held* it. The number could slide from 64% to 50% and no gate
would notice, because the only thing watching it was a view somebody had to remember to query.

### Why this is not a CI gate

The two ratchets look alike and are not:

| | accuracy (§25) | completion (§45) |
|---|---|---|
| measured against | a fixed corpus | live traffic |
| varies run to run | no | **yes** |
| runs in | CI | a cron job with DB access |

Putting completion in CI would need either a production database reachable from every branch build,
or a fixture — and a floor checked against a fixture measures nothing. So it ships as
`scripts/ai-completion-floor-gate.mjs`, exit-1 on breach.

### The margin, and why a floor is not pinned at today's number

A floor set exactly at the current rate fails on ordinary week-to-week variance, and a gate that
cries wolf is switched off within a month. Floors therefore sit **2 points** below the measurement.
At 5,362 traces that is roughly a hundred commands — wide enough to absorb a quiet week, tight
enough that a real slide still trips it. Scopes under **200 calls** are *skipped*, not passed:
"no breach" and "not enough data to tell" are different answers, and a gate that conflates them
goes quiet exactly when traffic drops.

### Per-surface floors

§28 found customer 22 points below provider. A single global floor would let the worst surface rot
under cover of the average, so each surface above the volume threshold gets its own. Seeded from
the live table:

| scope | measured | calls | floor |
|---|---|---|---|
| overall | 64.0% | 5,362 | 62.0 |
| customer | 60.6% | 3,703 | 58.6 |
| dashboard | 67.1% | 1,161 | 65.1 |
| provider | 82.5% | 498 | 80.5 |

### The ratchet

`--update` can only *raise*. A surface that improved gets a higher floor so the gain is locked in;
one that dipped keeps the floor it already earned. Lowering is possible only by editing the
committed JSON by hand — deliberately, because a hand edit shows up in review, whereas a script
that lowers floors is a ratchet that does not ratchet.

### Verification

- 31 tests (`npm run test:ai-completion-floor`); the roadmap gate chain is now **806** across 19
  gates, 0 failures.
- Three safety rules mutation-tested, each caught: removing `Math.max` from the ratchet (2 tests),
  zeroing the margin (3), zeroing the volume threshold (3).
- Run end to end against the live trace table. Breach path exits 1 with per-scope messages; the
  ratchet path raised floors 50% → 62.0/58.6 from real data.
- `ai-completion-floor.gate.spec.ts` pins the cron script's restated constants to the util's, so
  the duplication the cron job needs cannot drift unnoticed.

### Not done here

`--update` is not wired to a schedule. Choosing the cadence and the alert destination is an ops
decision, and guessing it would produce a cron entry nobody owns.

## §46 — Phase 4: one `EntityResolutionService`, and a ratchet on the re-parsers

§29–§32 built the resolution *logic* as pure utils. Nothing called them. The roadmap item asked for
one **service**, and the reason it wants a service rather than a shared function is what the
measurement found.

### The roadmap said "≥4 independent re-parsers". It is 15.

| function | copies | files |
|---|---|---|
| `resolveServiceByName` | **7** | 5 byte-identical + 2 variants |
| `resolveDateRange` | 3 | one canonical (§32), two local |
| `resolveTomorrowDateKey` | 2 | both e2e-bug.363 |
| `extractTimeSlotFromPrompt` | 2 | both e2e-bug.364 |
| `resolveServiceIdByName` | 1 | `ai-customer-waitlist` |

### They disagree, and the disagreement is invisible

Probed against a five-service catalogue (`Massage`, `Deep Tissue Massage`, `Hot Stone Massage`,
`Facial`, `Hydrating Facial`):

- **3 of 11 ordinary inputs get different answers** depending only on which file the handler lives
  in. `"  Massage  "` resolves in one variant and returns `undefined` in the other, because only one
  of them trims. `"the facial"` resolves in one and fails in the other.
- **5 of 11 are ambiguous** — more than one service contains the query — and *every* variant
  resolves them by **array order**. "massage" returns whichever row the database happened to return
  first.

That second finding is why deduplication was not the fix. Collapsing seven copies of a silent pick
produces one very consistent silent pick. §29's resolver returns `ambiguous` and a clarify question
instead, which is a behaviour change, not a refactor — and it is the change Phase 6's clarify path
(§37, §38) had to land first to make possible.

### What shipped

`entity-resolution.service.ts` — thin by design, all logic still in the tested utils. Two shapes per
resolution: the rich `ResolutionResult` for callers reasoning about confidence, and
`…OrClarify` returning `{ value, clarify }` so the refusal path is the path of least resistance
rather than something to remember. `ClarifyContext` threads command + variable through, because a
`ClarifyRequest` with a null `variable` is a question §38's slot filling cannot route an answer into.

### The ratchet is the load-bearing half

Building the service does not delete the fourteen re-parsers, and nothing stopped a fifteenth. Each
of the seven `resolveServiceByName` copies was written by someone who needed to match a service name
and wrote four obvious lines rather than hunting for a helper — the copy was easier to write than the
import was to find. `ai-reparser-ratchet.boundary.spec.ts` pins the list at 14 with a named
replacement for each, and it may only shrink: a new copy fails, and so does a manifest entry left
behind after migration, so the count cannot be padded to buy headroom.

### Verification

- 29 tests (24 service + 5 ratchet); chain now **835 across 19 gates**, 0 failures.
- Every measured disagreement is pinned as a test, with the two legacy variants copied verbatim into
  the spec so the assertions compare against what shipped rather than a description of it.
- Ratchet mutation-tested both directions: an eighth `resolveServiceByName` copy fails it, and so
  does a manifest entry whose function no longer exists.
- Two of my own assumptions were wrong and corrected by running the code: `resolveEntities` returns
  `{ resolved, unresolved }`, not an array, and the clarify helpers take a context object rather than
  a label string.

### Not done here

The call-site migration — e2e-bug.367. Fourteen handlers, each a behaviour change needing its clarify
path wired. Doing it in the same change as the service would have mixed "new seam" with "fourteen
handlers now refuse input they used to guess at", which is not reviewable as one diff.

## §47 — Phase 5: transactional grouping, and a saga that admits what it cannot undo

§33 built the DAG executor. It runs steps in order and skips downstream work when one fails — but
it does not undo the steps that already succeeded. A plan that creates an appointment, marks it
paid, then fails leaves both writes standing.

Phase 5 and Phase 7's rollback were both blocked on the same missing piece: `compensatedBy`.

### `compensatedBy` could not be a command id

The obvious model is `compensatedBy: string` — the command that undoes this one. Working through the
registry's 14 mutating commands, that shape cannot express any of the three cases that actually
matter:

- **`appointment.reschedule`** is undone by rescheduling back — to *what*? The original start exists
  only in the row before the write. Compensation needing pre-state has to declare what to capture,
  or it "undoes" the appointment to `undefined`.
- **`appointment.mark_paid`** is T2. A refund is not an undo: it is a second financial event with its
  own record, timing and possibly fees. Declaring `refund` as its inverse would let a failed plan
  silently move money to tidy itself up.
- **`appointment.create`** is "undone" by cancelling, which leaves a cancelled row and usually emails
  the customer. That is a compensation, not a rollback, and the difference is the user's inbox.

So `CommandCompensation` is a tagged union — `inverse` (with `captures`), `none`, `manual`. **`none`
is a first-class answer.** Of 14 mutating commands, **6 declare `none` or `manual`**.

### Two mechanisms, correctly separated

**Transactional grouping** is the cheap one: consecutive same-aggregate steps share a transaction and
a failure inside the group rolls back with no compensation at all — no cancelled row, no email.
Grouping deliberately does *not* reorder steps to widen transactions, because that changes the order
writes become visible in.

**Saga compensation** handles what spans aggregates: completed steps undone in reverse, dependents
first.

### The behaviour worth having

Not "it rolls back" — that it **tells the truth when it cannot**. `partially_rolled_back` names every
surviving write and why. A saga reporting success over a stranded payment is worse than one that
reports what it left behind. An *undeclared* compensation is treated as irreversible, never
reversible, because the optimistic reading is the dangerous one.

### Two of my own declarations were wrong

Caught by reading the specs rather than by a test:

- `catalog.create_category` was declared compensated by `catalog.deactivate_service` — which exists,
  is mutating, and retires an unrelated *service*. There is no delete-category command; it is
  `manual`.
- `catalog.deactivate_service` was declared compensated by `catalog.update_service` — which takes
  only name, price, duration and category, so it cannot reactivate anything. Also `manual`.

Conformance now checks an inverse is itself mutating. It **cannot** check that the inverse
semantically undoes the original; that needs handler integration.

### Verification

- 31 tests (24 saga + 7 conformance); chain now **866 across 19 gates**, 0 failures.
- Three safety rules mutation-tested, each caught: declaring `mark_paid` reversible fails the money
  rule; treating an undeclared compensation as reversible fails the saga; collapsing
  `partially_rolled_back` into `rolled_back` fails the honesty test. The third mutation initially
  did not apply — the pattern did not match — and was redone with an assertion that it had landed.

### Not done here

Handler wiring — e2e-bug.368. Nothing captures pre-state yet, so every `inverse` compensation would
report `missing_capture` in production today. The transaction boundary around `StepRunner` is the
other half.

## §48 — Phase 6: topic-change detection that actually invalidates something

`CommandPlan.topicChanged` already existed. `ai-command-plan.prompt.ts` asks the model to set it,
`ai-command-plan.decode.ts` reads it — and **nothing consumes it**. The detection half shipped and
went unused; the invalidation half, which is the part with teeth, was never built. The field's own
doc comment names the risk: "so a later 'cancel it' cannot silently target the previous topic."

### Lexical similarity was the obvious answer, and it is wrong here

§43 already has a content-token Jaccard measure tuned on this corpus, so reusing it looked free.
Sampling 40 consecutive message pairs from `ai_command_trace`:

| previous → current | similarity | same action? |
|---|---|---|
| "Who approves my time off?" → "Ով է հաստատում իմ արձակուրդը" | **0.00** | yes |
| "What do I sell?" → "What services do we offer?" | **0.00** | yes |
| "How do I use the Today tab?" → "Ինչպե՞ս օգտագործեմ Today tab-ը" | **0.67** | **no** |

The corpus is trilingual — English, Armenian, Russian. A message and its translation share no
tokens, and the one pair scoring high does so only because "today" and "tab" survive
transliteration. Lexical overlap is measuring *language*, not subject. Median similarity across the
40 pairs was 0.14, and at a 0.2 threshold 9 of the 22 flagged pairs kept the same action.

§43 uses the same measure successfully for rephrase detection *within one language*. That is a
different question, and the difference is why it was worth measuring rather than assuming.

### Structural signals instead, OR-ed rather than scored

`model_reported` (the flag that was being dropped), `command_mismatch`, `new_request_cue` (reusing
§38's list rather than adding a second one that can disagree about "never mind"), `expired` at the
§43-measured five-minute window, and `too_many_turns` at one turn. No weights and no threshold —
the measurement showed there is no text-derived quantity here worth thresholding.

### The asymmetry sets the default

A false negative keeps a stale binding and a mutating command hits a row the user never named; §47
established many of those writes cannot be undone, and a wrongly cancelled appointment has already
emailed the customer. A false positive costs one restated sentence.

So bindings expire unless something indicates continuity, and **a mutating pending command is held
to a stricter standard than a read**: dropped on any signal, where a read survives a lone clock
signal. A command that cannot be identified is treated as mutating — the optimistic reading is what
lets a stale binding reach a write.

### Verification

- 19 tests; chain now **885 across 19 gates**, 0 failures.
- Four safety rules mutation-tested, each caught: treating an unknown command as a read, holding
  reads and writes to the same lenient standard, ignoring the planner flag again, and removing the
  turn limit.
- One test name described the rejected detector's behaviour rather than its own assertion, and was
  corrected.

### Not done here

Wiring into the gateway — the same gap as e2e-bug.357. `invalidateStaleBindings` needs the caller to
pass `pendingCreatedAt` and `turnsElapsed`, which means the pending state must carry a timestamp and
a turn counter. §38's round-trip envelope is where those belong.

## §49 — Phase 4: anaphora, and the measurement that moved it off the blocked list

The item reads "anaphora resolution against the **session entity store**", which makes it depend on
§3.4's Postgres-keyed-by-session store, which depends on `conversationId` — blocked (e2e-bug.357).
That dependency turns out to be built on an assumption the corpus does not support.

### What 110 real anaphoric prompts contain

| kind | count | share |
|---|---|---|
| referent earlier in the **same message** | 90 | **82%** |
| expletive / cataphoric ("is it possible", "it says") | 13 | 12% |
| no referent in the message | 7 | 6% |

Reading all 7 of the last group, exactly **one** is genuine cross-turn anaphora ("yes, cancel them
all"); the others are expletives a noun list missed ("keep it within my means", "appreciate it").

So the blocked session store would serve roughly **1 prompt in 110**. The unblocked intra-message
case serves 82% — and it concentrates in the shape the platform is worst at:

> "cancel my Swedish massage booking and rebook **it** for next Friday instead"

which is by a wide margin the most frequent anaphoric prompt in the corpus, and is a compound
command. §42 measured `compound_intent` at **0%** accuracy.

### The 12% matter as much as the 82%

"is it possible to cancel my booking?" contains "it", and binding it to a booking would invent a
reference the user never made and then act on it. Expletives are filtered before resolution rather
than reported for the caller to skip — an anaphor that refers to nothing is not an anaphor, and
making that the caller's problem is how it ends up unhandled.

### Binding emits `$sN.field`, not a value

The referent's id does not exist until its step runs, so resolution rewrites the variable into the
reference form §33's executor already understands and adds the `dependsOn` edge. No second wiring
mechanism.

### Refusing is the safe direction, again

Two candidate referents produce a clarify, never a pick — the §48 asymmetry, and §47's finding that
many of these writes cannot be undone. A read is never a referent: "show my bookings" then "cancel
it" must not bind, because a list does not establish which row "it" is. An unidentifiable command is
not a referent either.

### Verification

- 26 tests, asserting against prompts taken from `ai_command_trace` rather than invented ones; chain
  now **911 across 19 gates**, 0 failures.
- Four safety rules mutation-tested, each caught: picking the first candidate instead of refusing,
  accepting reads as referents, treating expletives as real anaphora, and allowing forward
  references.

### Not done here

Cross-turn anaphora, and wiring into the planner — e2e-bug.370. The resolver is pure; nothing calls
it, so the 82% is available and unused until the planner consults it.

## §50 — the blocked list was mostly wrong

Four items had been parked as blocked: Phase 1's `session_id`, Phase 6's turn buffer and entity
store, Phase 4's anaphora (§49), and few-shot retrieval. Checking each against the code rather than
against the ticket that declared it blocked, **three of the four were not blocked at all**, and I had
been repeating the claim without testing it.

### `session_id` — the ticket reads past its own evidence

e2e-bug.357 says "nothing in the request identifies a conversation", and lists the fields — including
`history`. What it does not say is how the clients populate it:

```
// ConsumerBookingAssistant.tsx
const historyPayload = messages.map((m) => ({ role: m.role, content: m.text }));
```

`messages.map(...)` over the **entire** message list, not a window. `messages` starts as `[]` and is
reset by `setMessages([])`. So the first user message is stable for the life of a conversation, and a
conversation key is derivable server-side:

    conversationId = sha256(userId + SEP + businessId + SEP + first user message)

No client change, no new field, no migration. Turn 1 (`history: []`, the prompt is the anchor) and
turn 5 (`history[0]` is that same prompt) produce the same id — the property the whole thing rests
on, and the first thing the tests assert.

### Anonymous visitors get no id, deliberately

Without a `userId` the only inputs are the business and the message text, so two strangers at the
same salon both opening with "book a haircut" would hash alike and then **share an entity store**.
Returning null costs context and leaks nothing.

That is not hypothetical: `AiEntityMemoryService.getEntityMemory(businessId)` is keyed by business
alone today, and `EntityMemoryEntry` carries `customerName` — filed as e2e-bug.371.

### The turn buffer was already arriving

§3.4 tier 1 is "last N messages verbatim". That is `history`, on every request, unconsumed. The only
work needed was *bounding* it — the clients replay everything, so an unbounded buffer grows without
limit and is billed per token.

### Few-shot retrieval was never blocked on pgvector

§5's own decision is "**in-memory cosine now** -> pgvector when trace-mined few-shot retrieval
ships", and it notes the cosine index is "already implemented (`ai-embedding-index.util.ts`)". I had
been reading the roadmap's deferral of *pgvector* as a deferral of the *item*. pgvector is genuinely
absent from the local Postgres 16.14 — `pg_available_extensions` has no `vector` row — but at 5,362
traces §5 says brute-force cosine is the correct answer and a vector service would be ~100x slower
than the computation it replaces.

### What is still genuinely blocked

The **entity store** proper. It now has a key, but populating it needs per-request derivation over
the replayed history, and e2e-bug.371 has to land first or it would inherit a cross-user store.

### A NUL byte in the source, and what it hid

The hash separator was written as a quoted space and reached the file as a raw NUL (`U+0000`). Source
containing NUL is treated as **binary** by `grep`, which silently returned no matches for
`createHash` — I spent three tool calls chasing a phantom "corrupted file" before dumping the bytes.
It is now an escaped `FIELD_SEPARATOR` constant, and the separator is deliberate: without one,
userId `"ab"` + businessId `"c"` and userId `"a"` + businessId `"bc"` both hash `"abc"`, so two
tenants would share a conversation.

### Verification

- 25 tests; chain now **936 across 19 gates**, 0 failures.
- Four safety rules mutation-tested, each caught: anchoring on the current prompt instead of the
  first user turn, giving anonymous visitors an id, dropping `userId` from the hash, and removing
  the field separator.
- The separator test initially **passed under its own mutation** — `"a b"`+`"c"` and `"a"`+`"b c"`
  are not a collision. Rewritten with `"ab"`+`"c"` vs `"a"`+`"bc"`, which is one, and the mutation
  then failed as it should.

## §51 — Phase 1: `session_id`, wired rather than merely possible

§50 showed the conversation key was derivable. This adds the column and, more importantly, **calls
the derivation** — the recurring failure on this programme has been building a correct util and
never wiring it (e2e-bug.368, .369, .370 are all that shape).

### One call site, not a parameter threaded through five

`buildGatewayCommandTraceInput` already receives `AiGatewayExecuteParams`, which carries `userId`,
`businessId`, `prompt` and `history`. Everything the derivation needs was already in scope at the
one function every gateway surface funnels through, so the wiring is four lines and no signature
changed.

### The column is deliberately nullable, and will stay partly null

- **Anonymous visitors** have no `user_id`. Hashing business + message text alone would collide two
  strangers who open with the same sentence into one conversation, so the derivation returns null
  and the column stores null. That is the correct value, not a gap to backfill.
- **Rows written before today** stay null: the derivation needs the history that accompanied the
  request, and that was never stored. Backfilling from `prompt_raw` would invent conversation
  boundaries that never existed.

`session_turn` is stored alongside because §48's binding expiry needs it and it cannot be recovered
later — the turn index is a property of the request, not of the row.

The index is partial (`WHERE session_id IS NOT NULL`): follow-up resolution reads one conversation in
order, and nothing will ever query for "all rows with no conversation".

### Verified against the real database, not just the types

- Migration applied to the live `ai_command_trace`; columns and index confirmed present via
  `information_schema` / `pg_indexes`.
- Re-run to confirm it is idempotent (`ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).
- A real derived id inserted and read back inside a transaction, then rolled back: `cv_` + 32 hex =
  **35 chars**, inside the `VARCHAR(40)` bound.

### Verification

- 7 new tests, written deliberately end-to-end through `buildGatewayCommandTraceInput` and
  `buildAiCommandTraceRow` rather than against the pure function — an input field that never reaches
  the persisted row is the same as not having the feature. Chain now **943 across 19 gates**, 0
  failures.
- `tsc` caught the new spec omitting `CommandResult.summary`, which jest had accepted; fixed.
- The 8 lint warnings in `ai-command-trace-recorder.util.ts` are pre-existing, on the
  `result.details?.X` block at lines 157–166, not on the lines added here.

## §52 — Phase 3 / Phase 9: few-shot retrieval, and why "labelled" is the whole item

§50 established this was never blocked on pgvector — §5's decision is "in-memory cosine now", and
`EmbeddingIndex` already implements it. The real work is in a word the roadmap states and I nearly
read past: **labelled** traces.

### Executed is not labelled, and the gap is a third of the table

The obvious source is `ai_command_trace`: 3,433 executed rows, each pairing a prompt with an action.
Joining those against the eval baseline's per-intent accuracy says what they would actually teach:

| executed traces, by their intent's eval accuracy | rows | share |
|---|---|---|
| intent scores >=90% | 2,342 | 68.2% |
| intent scores <90% | 238 | 6.9% |
| intent **absent from the eval entirely** | 853 | 24.8% |

Nearly a third are unsafe or unverifiable. The worst single case: **`compound_intent` has 139
executed traces and 0% eval accuracy**. Feeding those back as few-shots would teach the planner to
repeat the platform's worst-performing capability, using its own failures as evidence.

The confusion is in what `outcome` means. `executed` says the handler returned success. It says
nothing about whether the *right* handler was chosen — which is precisely what a routing few-shot
teaches.

### So the pool is verified sources only

- **spec examples** — hand-written in the registry;
- **eval goldens** — correct even for the 12 intents scoring 0%, because there the *system* is wrong
  and the golden is the truth;
- **confirmed misses** — §44's human-triaged `expectedAction`.

There is no code path that accepts a trace. Every entry carries a `source` naming its provenance.

### Two retrieval rules that stop few-shots becoming a steal mechanism

**Surface filtering happens before scoring.** A customer cart example is not a weak match on a
dashboard request — it is ineligible. Scoring first and dropping after would let it consume a slot.
An optional `shortlist` does the same for §4 guardrail 1, so few-shots cannot reintroduce a command
that permission filtering removed.

**A per-action cap** (default 2). Without it, a command with 40 eval cases wins every slot for any
vaguely similar prompt, and the planner sees one plausible answer repeated rather than a set to
choose between. That is §4's steal problem rebuilt inside the prompt.

### Embeddings, not lexical — because of §48

Callers supply embeddings; there is deliberately no lexical fallback. §48 measured that this corpus
is trilingual and that token overlap scores a message against its own translation at **0.00**. A
lexical fallback would silently retrieve nothing useful for Armenian or Russian prompts while
appearing to work.

`EmbeddingIndex` is reused rather than reimplemented — §46 spent a section on what happens when two
similarity paths coexist.

### Verification

- 20 tests; chain now **963 across 19 gates**, 0 failures.
- Four safety rules mutation-tested, each caught: removing the per-action cap, dropping the surface
  filter, ignoring the shortlist, and accepting eval cases that assert no action.

### Not done here

Wiring into the planner prompt — e2e-bug.372. The retriever is pure and nothing calls it, and it
needs an embedding for the incoming prompt, which is a live model call on the hot path.

## §53 — Phase 6: the session entity store, and two shortcuts that do not work

§3.4 specifies three memory tiers. The turn buffer shipped in §50; this is tier 2 — *resolved
references* from earlier turns, so "move it to 4 instead" can find what "it" is. §51 supplied the
key it needed.

Two obvious shortcuts were measured and both fail.

### The trace table cannot back this store

`ai_command_trace` now carries `session_id`, so reading resolved refs back out of `params` looked
free. Measured:

- only **224 of 5,362** rows have non-empty `params` — **4.2%**;
- what they do hold is mostly the *wrong half* of the mapping: `serviceName` 137 vs `serviceId`
  **38**, `employeeName` 108 vs `employeeId` **36**.

`redactCommandTraceParams` strips internal params and redacts PHI, which is correct for a telemetry
table and fatal for this use. A store built on it would be empty 96% of the time and hold names
rather than ids the rest.

### It must not be layered on `AiEntityMemoryService`

That service is keyed by `businessId` alone and its entries carry `customerName`, so every user of a
business shares one map (e2e-bug.371). Layering a *resolved-reference* store on top would promote an
alias-sharing bug into an id-sharing one. It is also a different tier — business-level learned
aliases, not session-scoped resolutions.

So this is its own structure, and the conversation id lives **on the store** rather than being passed
to each lookup: a caller cannot consult the wrong conversation's store by forgetting an argument.

### Recency decides; a same-turn tie is asked about

"it" means the thing just mentioned, so an older reference is not a rival to a newer one — treating
it as one would make almost every lookup ambiguous. But two entities resolved on the *same* turn
genuinely tie: "book a massage and a facial" then "make it 4pm". That asks, per §7 working agreement
5, because a wrongly bound reference sends a mutating command at a row the user never named and §47
established many of those writes cannot be undone.

Staleness reuses §48's window and turn limit rather than declaring new ones — two definitions of
"still the same conversation" that can disagree is the duplication §46 was written about.

### Profile facts are not done, and are a bigger gap than expected

§3.4's third tier is durable per-user preferences. There is no per-user AI preference storage at all:
`ai-settings.types.ts` has no `userId` anywhere. So this is a new store, not a new key on an existing
one — which is also the root of e2e-bug.371.

### Verification

- 20 tests; chain now **983 across 19 gates**, 0 failures.
- Four safety rules mutation-tested, each caught: picking a same-turn tie instead of asking, ignoring
  staleness on lookup, dropping the turn limit, and keeping duplicate refs (which manufactures
  ambiguity that is not real).

## §54 — Phase 6: profile facts, which turned out not to want a table

§3.4's third memory tier is "durable prefs: default provider, locale, comms prefs" in "Postgres,
keyed by user, permanent". Checking each named fact against what the database already holds says a
new table is wrong for two of them and unnecessary for the third.

### locale already exists

`users.locale`. A second copy under an AI-owned table is a second source of truth for a value the
platform already owns, and the two drift the first time someone updates the wrong one.

### default provider is real, and derivable

Measured against `bookings`: of **19 customers with 3+ bookings, 16 (84%) have only ever booked one
provider**, averaging 1.32 distinct providers. So the preference is real — people have "their"
stylist. But it is a fact *about the booking history*, not an independent value. Persisting it
creates a cached aggregate that is stale the moment the next booking lands, and nothing would
recompute it.

So this tier is a **read model**. The only thing that would justify a table is a preference the user
*states* and that cannot be observed, and none of §3.4's three examples is that.

### Two thresholds, because a wrong default looks personalised

- **3 observations minimum.** Two bookings with one provider is as likely to be availability as
  preference. A default inferred from a coincidence is worse than no default: it is wrong in a way
  that looks deliberate.
- **0.8 consistency.** 4 of 7 is not a default. 5 of 6 is — someone whose usual provider was once
  unavailable still has a usual provider.

A booking with no provider is skipped rather than counted as variety: absence of evidence is not
evidence of absence.

### The rule that matters most

**An explicit value always wins, including an explicit "anyone".** "Book me with anyone" *is* a
preference — the absence of a name is the answer, not a gap to fill — and quietly routing that user
to their usual provider overrides a stated choice with an inferred one. `applyProfileDefault`
returns null there rather than the fact.

Rendering states the evidence for the same reason: "usually books with X (5 of 6 visits)" invites a
confirmation, "prefers X" does not.

### Verified against real data, not only fixtures

Running the derivation over the live `bookings` table: **18 of 19** eligible customers produce a
default-provider fact and **1 is correctly rejected as too mixed**. The 18-vs-16 difference is the
0.8 threshold doing its job — 16 customers used exactly one provider, two more were consistent
enough to count.

### Verification

- 16 tests; chain now **999 across 19 gates**, 0 failures.
- Four safety rules mutation-tested, each caught: letting a default override an explicit "anyone",
  removing the evidence threshold, removing the consistency threshold, and counting null providers
  as evidence of variety.

### Not done here

Nothing calls it — e2e-bug.374. It needs the customer's booking history at classify time, which is a
query the gateway does not currently make.

## §55 — Phase 7: the saga actually runs

§47 built compensation and nothing called it. That is the failure pattern this programme keeps
repeating — a correct util with no caller — and it is worth naming: §47, §49, §52, §53 and §54 all
shipped in that state, tracked by e2e-bugs 368/370/372/373/374. This closes the one where the cost
of staying unwired is a write that cannot be undone.

### Two injected seams, in the §33 style

`executePlan` gains `specs`, `captureState` and `runCompensation`. The executor stays pure: reading
"the appointment's current start time" is handler knowledge, exactly like `StepRunner` already is.

`runCompensation` is deliberately separate from `runStep`. A compensating command must not be traced
as user intent and it bypasses confirmation, so routing both through one function would make those
distinctions impossible for the caller to draw.

### Capture happens before the write, which is the whole point

`originalStart` does not exist after a reschedule. A capture taken afterwards produces a rollback
that quietly does nothing — the most plausible way to build a broken one. The ordering is asserted
directly, and the mutation that moves the capture after the run fails the test.

A capture reader that throws does **not** fail the step. It leaves the pre-state unset, §47 reports
`missing_capture`, and the step is stranded and named. Refusing to compensate beats compensating with
`undefined`.

### Compensation runs only on `partial`

`completed` has nothing to undo. `failed` means no step executed, so no write is standing. Only a
partial failure leaves the mixed state a saga exists for.

### Opt-in, so nothing changed for existing callers

Without `specs` and `runCompensation` the executor behaves exactly as before and `saga` is null. The
25 pre-existing executor tests were unaffected, which is the evidence that the seam is additive.

### Verification

- 9 new tests against `executePlan` itself, so a regression that stops calling `compensate` fails
  here rather than hiding behind §47's own green suite. Chain now **1,008 across 19 gates**, 0
  failures.
- Mutation-tested: moving the capture after the run fails; running the saga on `completed` fails;
  letting a capture throw propagate fails.
- One mutation was **behaviourally equivalent and did not fail anything** — setting `captures` to
  `{}` on a throw versus leaving it unset, since `planCompensation` reads `captures.get(id) ?? {}`.
  Recorded rather than counted as a catch, and replaced with the meaningful variant.
- `tsc` caught the new spec's `PlanValidationResult` fixture missing `highestRisk`, which jest had
  accepted; fixed by completing the object rather than widening the cast.

## §56 — Phase 1: the first domain fully ported, and an error it exposed

The port item says "domain by domain". The registry has no `domain` column — slices are `apiModule`,
and there are **30 of them across 696 entries**:

| module | entries | specced before |
|---|---|---|
| `ai-command` | 198 | 4 |
| `public-booking` | 69 | 3 |
| `payments` | 42 | 0 |
| `clinic-test-results` | 41 | 0 |
| `provider-mobile` | 40 | 1 |
| `catalog` | 26 | 8 |

`catalog` was the roadmap's named second slice and the closest to done, so it went first. **All 26
are now specced** — the first domain fully ported. Coverage moved 16 → 34 of 696.

### Tiers were generated, not guessed

All 18 new specs declare `dashboard: [staff, manager, owner]`, derived by running the *live* gate
(`isIntentAllowed` plus the gateway's blanket dashboard-client refusal) rather than copied from the
registry's own `tiers` field. The conformance suite then checks every one against that same gate, and
all 18 passed first time — which is the evidence the derivation was right rather than merely
self-consistent.

### §47 was wrong about `create_category`, and this is how it surfaced

§47 declared `catalog.create_category` compensation `manual`, reasoning:

> "There is no delete-category command in the registry"

There is. `delete_service_category` has been there all along. §47 searched the **16 specced
commands** rather than the **696 registry entries** — the exact gap the port exists to close. It is
now `kind: 'inverse'` targeting the newly-specced `catalog.delete_category`.

That is the concrete argument for the port: specs were being written against an incomplete view of
what the platform can do, and every such gap produces a decision that looks reasoned and is wrong.

### The disagreement list grew by 18, which is the point

`records where the registry disagrees with the gate that actually runs` pins e2e-bug.355. Every one
of the 18 newly specced catalog commands joined it — 29 of 34 specced commands now disagree with the
registry's flat `tiers` list. That list is dead data, and the port is turning a suspicion into a
count.

### Verification

- 175 conformance tests (per-command surfaces, handler, mutating, tiers × 34 commands); chain now
  **1,080 across 19 gates**, 0 failures.
- The one failure during the port was the pinned disagreement list, which is a deliberate ratchet
  rather than a regression — updated with a note that it grows as the port proceeds.
- Every new mutating spec declares a compensation, enforced by §47's conformance rules; the money-tier
  rule caught nothing new because `catalog.assign_subscription_to_customer` is declared T2 with
  `manual` compensation.

### Remaining

662 entries across 29 modules. `ai-command` (198) is the largest and the least homogeneous — it is
the catch-all module and will likely need splitting rather than porting as one slice.

## §57 — Phase 1: the `payment` slice, and the money rule catching me

42 entries under `apiModule: 'payments'` — 23 reads, 19 mutations, **12 of them T2**. This is the
slice that finally exercises the money tier, and §47's rule "money is never declared reversible"
had its first real test.

Coverage: 34 → **76 of 696**. Two domains now fully ported.

### The money rule caught my own spec

I first declared `payment.extend_gift_card_expiry` with an `inverse` compensation, reasoning that an
expiry date is just a field you can put back. The conformance gate rejected it, and the gate is
right: a customer may already be relying on the extension, so silently pulling it back to tidy up a
failed plan shortens the life of an instrument they hold. **T2 means the tier decides, not the field
type.** Now `manual`.

That is the second time in two slices that a gate written earlier in this programme caught a wrong
judgement made later — §56's port caught §47's `create_category` error, and §47's rule caught this
one. Both are the intended behaviour of a ratchet.

Every one of the 12 T2 commands declares `none` or `manual`. That is not caution: a refund is a
second financial event with its own record, timing and possibly fees.

### An anomaly worth its own ticket

`explain_payment_status` is `mutating: true` with `executionMode: 'simple_mutate'`, while every
sibling `explain_*` in the module is a read. A read gated as a write goes through confirmation and
T1 risk handling it does not need. Filed as e2e-bug.376; the spec declares it T1 with a `none`
compensation and a comment pointing at the ticket, rather than quietly declaring it T0 and creating
a spec/registry disagreement the conformance suite would then fail on.

### A hardcoded test assertion went stale, and was generalised rather than extended

`ai-command-permission.spec.ts` asserted that a staff shortlist equals the owner shortlist *minus
exactly `appointment.update_bulk`*. True at 34 specs; the payment slice added 8 more manager/owner
dashboard commands and it broke. The fix derives the exclusion list from the declared tiers, so the
assertion keeps testing the actual rule — "staff sees exactly what staff may run" — as the port
grows, instead of needing an edit per slice.

### The disagreement count is now 60

Every newly specced command whose registry `tiers` disagree with the live gate joins the e2e-bug.355
pin: **60 of 76**. I initially regenerated that list by scraping jest's diff output and got 36,
because the diff was truncated. Recomputed directly from the specs — 60. Scraping a test failure to
produce the fixture that test asserts on is circular; computing it from the source is not.

### Verification

- 343 conformance tests (surfaces, handler, mutating, tiers × 76 commands); chain now **1,248 across
  19 gates**, 0 failures.
- Three failures during the port, all of them gates doing their job: the disagreement pin, the money
  rule, and the stale permission assertion.

## §58 — Phase 1: the `customer` slice, and a conformance rule that was too broad

34 entries under `apiModule: 'customer-crm'` — 19 reads, 15 mutations. Coverage 76 → **110 of 696**;
three domains now fully ported.

Where §57 exercised the **money** half of T2, this slice exercises the **PII** half:
`delete_customer_data`, `privacy_delete`, `privacy_export`, `export_customer_data`,
`merge_customers`.

### The compensations here are blunt, and should be

- an **export** has left the building and cannot be recalled;
- **erasure** is the point of the command — the records are not there to restore;
- a **merge** folds two histories together without recording the seam, so they cannot be separated
  again.

None is reversible in the sense a saga needs. §47's `partially_rolled_back` exists precisely to
report this rather than pretend otherwise.

### The money rule was over-broad, and this slice proved it

The conformance rule read:

```ts
s.risk === 'T2' && s.compensation?.kind === 'inverse'   // → forbidden
```

It fired on `customer.update` and `customer.update_my_profile`. But **T2 is defined as money *or*
PII**, and restoring a phone number to its previous value is a genuine undo — not a second financial
event. The rule used the tier as a proxy for "involves money", which was accurate only because
payment commands were the only T2s in the registry when §47 wrote it.

Narrowed to `domain === 'payment'`, and — so nothing is lost — replaced with a stricter rule that
covers the PII case directly:

> **a reversible T2 command must capture the state it will restore**

A T2 inverse capturing nothing resembling prior state would "restore" whatever the compensating
command defaults to, which on a PII field means overwriting real data with a blank *under the name of
a rollback*. That is a sharper protection than the ban it replaces, and it applies to money and PII
alike.

Weakening a safety rule deserves suspicion, so to be explicit: the money ban still holds in full for
every payment command, and the new rule constrains a case the old one merely forbade outright.

### Verification

- 480 conformance tests (surfaces, handler, mutating, tiers × 110 commands); chain now **1,385
  across 19 gates**, 0 failures.
- The disagreement pin is now **94 of 110**, computed directly from the specs rather than scraped
  from jest output — the mistake §57 recorded.
- Both failures during the slice were gates working: the pin, and the money rule catching a genuine
  over-reach in its own definition.

## §59 — Phase 1: the `staff/schedule` slice, and a booking command that skips confirmation

32 entries across four modules that are one domain in practice: `schedule-resources` (18),
`provider-time-off` (5), `provider-open-shifts` (5), `schedule` (4). 18 reads, 14 mutations.
Coverage 110 → **142 of 696**; four domains fully ported.

First slice where **`handler` varies per command** rather than per file — four services across the
32 — which the spec shape already supported but nothing had exercised.

### `book_walk_in_gap` is a write registered as a read

`handleBookWalkInGap` calls `deps.bookingService.create(...)`. The registry says `mutating: false`.

That is the dangerous direction of e2e-bug.376. A write misfiled as a read gets
`executionMode: 'read_only'`, T0 risk, and **no confirmation gate** — so a provider prompt can create
a real booking with no preview and no confirm step. It is also excluded from the 341 mutating
entries that risk reporting is measured against.

Specced as declared (T0) because conformance requires spec and registry to agree, with the reason
written into the spec and a pointer to e2e-bug.377. Declaring it T1 unilaterally would have failed
the suite and hidden the defect behind a red test rather than a ticket.

### Communicated decisions are not reversible either

The recurring compensation theme here has nothing to do with money. Approving leave, denying it, or
switching on holiday mode are not database states that can be quietly put back: a provider has been
told they have the day off and has made plans; customers have been turned away while the business
showed as closed. Those are `none` or `manual` for the same reason a refund is — the effect left the
system.

`schedule.holiday_mode` is T3 and its reason says so explicitly: turning it off does not restore the
bookings declined while it was on.

### Verification

- 608 conformance tests (surfaces, handler, mutating, tiers × 142 commands); chain now **1,513
  across 19 gates**, 0 failures.
- The only failure during the slice was the disagreement pin, now **114 of 142**, computed from the
  specs rather than scraped.
- The narrowed money rule and the new capture rule from §58 both held across 14 new mutations with no
  further adjustment.

## §60 — Phase 1: the long tail, and three compensations I got wrong

47 entries across eleven small modules ported as one slice — `provider-exp-3`, `onboarding`,
`patient-clinical-profiles`, `provider-client-context`, `agent-ops`, `clinic-questionnaires`,
`provider-push-setup`, `clinic-pre-visit-intake`, `locations`, `business-profile`,
`provider-earnings`. 17 reads, 30 mutations.

Coverage 142 → **189 of 696**, and **15 of 30 modules** are now complete.

### Two suspicions checked; one was wrong

- **`send_client_message` is registered READ**, which looked like another e2e-bug.377. It is not:
  the handler builds an `openLink` for the provider to tap and sends nothing. `mutating: false` is
  correct. Checked before filing, so no false ticket.
- **`undo_latest_agent_task`** is the registry's only undo-shaped command, and querying the trace
  table returns **zero** rows for any undo-shaped action. That confirms §43's note — `undo-within-1-min`
  could not be mined because no undo signal exists in the data — while showing the capability itself
  does exist and has simply never been used.

### §58's capture rule caught a mistake it was not written for

The rule fires on a T2 `inverse` that captures nothing resembling prior state. It caught
`clinical.add_customer_staff_note` — and the actual defect was worse than the rule's premise:
**I had declared the inverse of "add a note" to be "add a note"**. Adding a note does not undo
adding a note.

Checking the registry rather than guessing — the e2e-bug.375 discipline — settled all three:

| command | what I wrote | what is true |
|---|---|---|
| `provider.add_client_note` | inverse of itself | **no delete-note command exists** → `manual` |
| `clinical.add_customer_staff_note` | inverse of itself | same → `manual` |
| `provider.block_my_time` | inverse of itself | **`delete_schedule_block` exists** but is not yet specced → `manual`, target named |

The third is worth separating out. Its correct inverse is real and in the registry; a spec cannot
reference it only because conformance requires an inverse to name a *specced* command and that
module is not ported. Declaring `manual` **with the target named in the reason** means the port
converts it later rather than rediscovering it — the opposite of §47's `create_category`, where a
`manual` with no named target hid a capability that existed all along.

### Clinical commands are `none` for medical reasons, not financial ones

`create_encounter_addendum` — a clinical record is append-only by design; the addendum is part of
the medical record the moment it is written. `release_patient_document` — the document has reached
the patient. Neither involves money, and both are as irreversible as a refund.

### Verification

- 796 conformance tests (surfaces, handler, mutating, tiers × 189 commands); chain now **1,701
  across 19 gates**, 0 failures.
- Two failures during the slice, both gates working: the disagreement pin (now **122 of 189**) and
  the capture rule catching three wrong inverses.

## §61 — Phase 1: `public-booking`, the surface the north-star metric is made of

66 entries — the largest slice so far, and the most read-heavy: **40 reads to 26 mutations**.
Coverage 189 → **255 of 696**; 16 of 30 modules complete.

This is the customer-facing surface, and §28 measured customer as **69% of all traffic at the worst
completion rate**. These are the commands the north-star number is mostly made of, so having them
specced is what makes §42's propose-only rule and §52's few-shot pool applicable where it matters.

### Three commands look like writes and are not

`book_another_service`, `complete_intake_and_book` and `add_booking_to_calendar` are all registered
`mutating: false` despite booking-shaped names. Each was checked against its handler before
speccing:

- `book_another_service` returns a `navigate` target and creates nothing;
- `complete_intake_and_book` likewise — it calls `ensureCustomerDraft`, an idempotent get-or-create
  of a *draft*, and draft creation has its own MUT command (`create_intake_draft`);
- `add_booking_to_calendar` builds a calendar link.

All three are correct as registered. **Naming is not evidence in either direction** — e2e-bug.377
was found by reading a handler, and so was the absence of a defect here. Three checks, three
non-findings, and that is the right outcome to report rather than three speculative tickets.

### Money and notification dominate the compensations

Seven of the 26 mutations are T2 booking-with-payment commands, all `none`. Six more are
cancellations, also `none` — the customer has been told and the slot may already be taken. The
pattern established in §57 (money), §58 (PII) and §59 (communicated decisions) covers almost the
whole slice; only cart edits and reschedules are genuinely reversible.

### Verification

- 1,060 conformance tests (surfaces, handler, mutating, tiers × 255 commands); chain now **1,965
  across 19 gates**, 0 failures.
- The only failure during the slice was the disagreement pin, now **160 of 255**.
- No new conformance rules were needed: §58's narrowed money rule and capture rule held across 26
  new mutations unchanged.

## §62 — Phase 1: `clinic-test-results`, where irreversibility is medical

41 entries across **seven handlers** — lab booking, provider tasks, results, orders, catalogue,
consumer results, specimen collection. 20 reads, 21 mutations. Coverage 255 → **296 of 696**;
17 of 30 modules complete.

### Three kinds of irreversible, none of them financial

Previous slices established money (§57), PII (§58) and communicated decisions (§59). This one adds
reasoning that is specific to clinical practice:

- **append-only records.** `enter_test_result` and `upload_patient_result` write to the medical
  record. A correction is a *new entry*; erasure is not available and would not be lawful.
- **chain of custody.** `mark_specimen_collected` and `transition_specimen` are audit trail.
  Reversing a step would falsify the trail, which is the opposite of its purpose.
- **released to the patient.** `release_test_result` has reached the person it concerns.

None of these is a saga-reversible operation, and §47's model expresses that without special-casing.

### `book_lab_collection` checked, not assumed

Registered READ while its siblings `staff_book_lab_collection` and `book_lab_from_order` are MUT —
the exact shape that turned out to be e2e-bug.377. The handler returns a `bookUrl` and the patient's
pending requests; it writes nothing. Correct as registered.

That is now **six** commands checked across §59–§62 on the strength of their names, of which **one**
was a real defect. The hit rate argues for continuing to check and against filing on suspicion.

### The hygiene gate caught a 20-character description

`ai-command-spec.derive.spec.ts` requires a description longer than 20 characters. "Change a test
panel." is exactly 20 — a description that names the command and says nothing the planner can use to
disambiguate it from `set_test_panel_items`. Lengthened.

Worth noting because that gate has been silent through six slices and 296 commands; it fired the
first time a description was genuinely too thin to route on.

### Verification

- 1,224 conformance tests (surfaces, handler, mutating, tiers × 296 commands); chain now **2,129
  across 19 gates**, 0 failures.
- Two failures during the slice: the disagreement pin (now **171 of 296**) and the hygiene rule.

## §63 — Phase 1: `provider-mobile`, and a permission gap that lets clients past staff

39 entries and the most read-heavy slice yet: **30 reads to 9 mutations**. Coverage 296 → **335 of
696**; 18 of 30 modules complete.

Most of the reads are `explain_*` product-guide commands, which is what a mobile app for busy
practitioners mostly needs — it answers questions about the app itself rather than doing things to
the business.

### Two commands deny `staff` while permitting `client`

`coordinate_waitlist_offer` and `team_whos_next` resolve to `['client', 'manager', 'owner']` on the
provider surface. Not a transcription error: the tier maps are computed from the live gate, and the
conformance suite then re-derives them independently and agrees. A staff member cannot run these
while a client-tier provider-app user can.

That ordering makes no sense for either command — deciding who gets a freed slot and seeing who is
next on the floor are operational, and `staff` is the tier that does operations. Filed as
e2e-bug.378 rather than "corrected" here: the spec must match the running system or conformance
fails, so changing it would hide the defect behind a red test. Same discipline as e2e-bug.376 and
e2e-bug.377.

### Feedback is irreversible on purpose

`give_provider_ai_feedback` is declared `none`, and the reason is not a limitation: retracting
feedback would remove the signal §43's miss-mining depends on. "That was wrong" is an observation
about something that happened, and it stays true afterwards.

### Verification

- 1,380 conformance tests (surfaces, handler, mutating, tiers × 335 commands); chain now **2,285
  across 19 gates**, 0 failures.
- The only failure during the slice was the disagreement pin, now **175 of 335**.
- No name-driven false alarms this slice: the read/write split matched the handlers throughout.

## §64 — Phase 1: `commerce`, and a conformance rule matching on the wrong property

52 entries — `gift-fulfillment` (26) and `retail-finance` (26) ported together, because they are one
domain in practice: selling things that are not appointments, and the money that follows. 16 reads,
36 mutations, the most write-heavy slice so far. Coverage 335 → **387 of 696**; 20 of 30 modules
complete.

### The capture rule was matching on the wrong property

§58's rule — a reversible T2 command must capture the state it will restore — fired on
`commerce.record_expense` and `commerce.create_commission_rule`. Both are correct as written: their
inverses are `delete_expense` and `delete_commission_rule`, which need the created id and nothing
else, **because there was no prior state to put back**.

The rule was checking every T2 `inverse`, but only one *shape* of inverse restores values:

| inverse points at | shape | what it needs |
|---|---|---|
| the **same** command | update-style restore | the previous values |
| a **different** command | create→delete | the id to target |

Split into two rules accordingly, so both shapes are still constrained — the second asserts a
cross-command inverse captures *something* to target, because `delete_expense` still needs to know
which expense.

§60 met this same case and worked around it by declaring `manual`, correctly, because no delete
command existed. Here the delete commands do exist, which is what exposed the rule as matching on
"is it T2 and inverse" rather than on "does it restore values".

### Registered-mutating reads, one verified

`explain_gift_card_order_details` is `mutating: true` and its handler calls `getDashboardOrder`,
formats, and returns — a confirmed second instance of the e2e-bug.376 class. `delivery_queue` and
`gift_card_creation_queue` are queue listings with the same registration and are recorded as
**suspected without separate verification**, which the spec comments say explicitly rather than
implying they were checked.

An earlier probe appeared to check all four at once and was discarded: it matched each command name
to whichever handler function happened to contain the string, so `explain_gift_card_order_details`
was reported against `handleGiftCardCreationQueueLogic`. Wrong tool, unusable output, no conclusions
drawn from it.

### Verification

- 1,562 conformance tests (surfaces, handler, mutating, tiers × 387 commands); chain now **2,494
  across 19 gates**, 0 failures.
- Two failures during the slice: the disagreement pin (now **223 of 387**) and the capture rule.

## §65 — Phase 1: the last six modules, leaving only the catch-all

115 entries across `booking` (13), `consumer-adoption` (17), `integrations` (22),
`marketing-growth` (27), `provider-exp-2` (14) and `push-notifications` (22).

Coverage 387 → **502 of 696 (72%)**, and **29 of 30 modules are complete**. Only `ai-command`
remains — 194 entries in the catch-all, which the roadmap already flagged as needing splitting
rather than porting as one slice.

### A new compensation shape: credentials

Five commands are `none` because **a secret is shown once**:

- `create_api_key`, `rotate_api_key` — reversing creation does not un-reveal the key, and reversing
  a rotation does not restore one the caller has already discarded;
- `configure_openai_integration`, `configure_stripe_connect`, `configure_whatsapp_integration` —
  the credential has been handed to a third party.

`revoke_api_key` is `manual` for the mirror reason: whatever used the key has already broken, and
reissuing produces a *different* key, so the "undo" does not restore the prior state.

`regenerate_tenant_app_install_qr` applies the same logic to something physical — printed copies of
the old code stop working and cannot be recalled.

That makes six distinct grounds for irreversibility now expressed in the model, none of which needed
a special case: money (§57), PII (§58), communicated decisions (§59), clinical records and chain of
custody (§62), data that has left (§58, §64), and credentials (§65).

### The hygiene gate fired again, three times

`create_api_key` ("Create an API key.", 18 chars), `revoke_api_key` and `list_notifications` were all
at or under the 20-character floor. Descriptions that restate the command id tell the planner nothing
it does not already have from the id, which is exactly what the rule is for. It has now caught four
thin descriptions across 502 commands — a low rate, and each one real.

### Verification

- 2,049 conformance tests (surfaces, handler, mutating, tiers × 502 commands); chain now **2,954
  across 19 gates**, 0 failures.
- Two failures during the slice: the disagreement pin (now **285 of 502**) and the hygiene rule.
- The generator refuses to emit unless every registry id in the slice has authored content — the
  `MISSING content for:` guard — so a command cannot be silently dropped from a 115-entry batch.

## §66 — Phase 1 COMPLETE: the catch-all split, 696 of 696

`ai-command` was the last module and the one the roadmap flagged as needing splitting. The probe
showed why: **194 entries across 30 handlers**. It was never a domain — it is the label left on
everything that never got one, and the handlers are the real seams.

Split into eight domains: `operations` (the scheduling and staff core — 50 from `AiCommandService`
plus 13 from `AiOperationsService`), `business` (currency, dates, tax, languages, hours — 47),
`compliance` (22), `guide` (16 across five product-guide services), `tour` (11), `provider` (8),
`recommendation` (8), `guest` (6).

**Coverage: 696 of 696. All 30 modules ported.**

### A loop closed rather than rediscovered

§60 declared `provider.block_my_time` compensation `manual`, with the reason naming
`delete_schedule_block` as the correct inverse that existed in the registry but was not yet specced.
This slice specced it, and that declaration is now a real `inverse` pointing at
`operations.delete_schedule_block`.

That is the difference the §47 post-mortem asked for. §47 wrote `manual` with "no delete-category
command exists" and was wrong; §60 wrote `manual` **with the target named**, which turned a future
correction into a lookup. Naming what you could not reference is worth more than recording that you
could not reference it.

### What the port measured

| finding | number |
|---|---|
| registry entries specced | **696 / 696** |
| `apiModule` slices | 30, all complete |
| specs whose registry `tiers` disagree with the live gate | **400 of 696** (e2e-bug.355) |
| grounds for irreversibility expressed in §47's model | 7 |
| defects found by reading handlers | 3 confirmed (e2e-bug.376 ×2, .377), 1 permission gap (.378) |
| name-driven suspicions checked that were NOT defects | 6 |

The 400 figure is the headline. The registry's flat `tiers` field disagrees with the gate that
actually runs for **57% of all commands** — it is dead data, and the port turned that from a
suspicion in §22 into a count.

The seven grounds for irreversibility, none of which needed a special case in the model: money,
PII, communicated decisions, clinical append-only records, chain of custody, data that has left,
and credentials.

### Verification

- 2,825 conformance tests (surfaces, handler, mutating, tiers × 696 commands); chain now **3,730
  across 19 gates**, 0 failures.
- Two failures during the slice: the disagreement pin and the hygiene rule, which caught ten
  descriptions at or under 20 characters — mostly `List bookings.`-shaped restatements of the id.
- The generator refuses to emit unless every registry id in the slice has authored content, so none
  of the 194 could be silently dropped.

### What this unblocks

Phase 8's detector retirement now has its precondition: every command has a spec, so a domain's
`legacy_paraphrase` detectors can be deleted against a complete declaration of what that domain does
rather than a partial one.

## §67 — Phase 8: measuring the rescue gap, and a lock that is deliberately off

Phase 8's exit has two halves. The first — zero `legacy_paraphrase` detectors — needs the per-slice
eval pass and 7-day shadow compare the phase itself specifies, and 555 detectors remain. The second
— **"rescue cannot alter `action`"** — is a rule, and §66 supplied what was needed to measure it.

### The guard was only half the rule

§22's guard blocks a rescue action change that *touches a mutating command*. Phase 8's wording has
no such qualifier. With all 696 commands specced, every action change in `ai_command_trace` can now
be classified by risk tier rather than by a hand-maintained predicate:

| action changes | count |
|---|---|
| total | 307 |
| touching a mutation — **already blocked** | 75 |
| **read → read — currently allowed** | **105** |
| starting from a non-decision — correctly allowed | 53 |
| involving a pipeline pseudo-action outside the registry | 74 |

The 105 are real: `list_services` → `explain_clinic_services` 20 times,
`list_upcoming_tour_departures` → `list_tour_calendar_week` 34. Both change what the user is shown.

I first reported 120 here. That count included changes starting from `unknown`, which the guard
correctly permits as `classifier_had_no_decision` — excluding them gives 105. Worth stating because
the larger number would have overstated the gap by 14%.

### The lock ships empty, and that is the finding

`RESCUE_ACTION_LOCKED_DOMAINS` blocks any action change in a named domain. It is empty, because
turning it on globally now would be wrong: the planner is still shadow-only (§19), so rescue is
currently *compensating* for classifier mistakes as well as causing them. Removing the compensation
before the replacement is live would trade 105 steals for an unknown number of unrescued
misclassifications.

So the list may only grow, one domain at a time, gated on that domain's eval clearing the §42 bar —
which is Phase 8's own per-slice sequencing rather than a new rule. The exit is reached when every
domain is in it and `GRANDFATHERED_MUTATING_RESCUES` is empty. That second condition already holds.

### A rule whose only data is `[]` cannot be tested

The first version of the lock read the module constant directly, so with an empty list the blocking
path was unreachable and my test asserted `blocked: false` under the name "blocks a read→read change
once the domain is locked" — a test that contradicted its own title, the §48 mistake again.

Made the list injectable. Both paths are now exercised, and both mutations fail: ignoring the lock,
and applying it when no domain was supplied (which would over-block globally).

### Verification

- 33 tests across the guard and the new lock; chain now **3,739 across 19 gates**, 0 failures.
- Both new mutations caught.

## §68 — Phase 8: which 318 detectors could go today

Phase 8's six slices are gated on "planner passes that domain's eval → shadow-compare 7 days →
bulk-delete". The shadow compare is time. The eval pass is measurable — and *which detectors belong
to which slice* was unanswerable until §66, because a detector's domain is its command's domain and
only 16 of 696 commands had one.

### 318 of 555

| | |
|---|---|
| `legacy_paraphrase` detectors | 555 |
| **retirement-ready today** | **318 (57%)** |
| fully slice-ready domains | **4** — `recommendation` (8), `tour` (8), `guide` (7), `appointment` (5) |

A detector is ready when every command it maps to has a spec, has examples, and clears §42's
accuracy bar. All three, for all its commands: deleting it removes the route for each one.

### The blocker is coverage, not accuracy

The dominant reason across every unready domain is **`not_evaluated`** — commands with no eval cases
at all. That reframes the remaining work: Phase 8 is mostly waiting on eval coverage, and §44's
miss→fixture pipeline is the tool that produces it. `below_accuracy_bar` is the top blocker in only
one domain (`business`).

`not_evaluated` **blocks** rather than passes, which is the rule the module exists to get right.
"No eval case has failed" is not "the planner handles this" — it is no evidence either way, and
deleting a detector on that basis removes the only routing a never-tested command has.

### Four domains are ready to start

They are small — 28 detectors between them — and that is what makes them a good first slice. The
per-domain blocker counts turn "retire 555 detectors over two quarters" into an ordered queue rather
than a wall.

### A ratchet, not a snapshot

`ai-detector-retirement.boundary.spec.ts` pins 318 as a floor. Readiness falling means a spec lost
examples, a command dropped below the bar, or a new unevaluated detector appeared — all regressions.
Raising the floor is a visible edit, the same shape as §45's completion floors.

### Verification

- 18 tests (13 rules + 5 measured); chain now **3,757 across 19 gates**, 0 failures.
- Four rules mutation-tested, each caught: treating `not_evaluated` as ready, accepting a
  multi-command detector when only some commands are ready, assessing non-paraphrase detectors, and
  dropping the missing-examples check.

### What is left

The 7-day shadow compare, and eval coverage for the commands currently unevaluated. Neither is a
code change.

## §69 — Phase 8: 80% of documented example phrasings do not reach their command

§68 named `not_evaluated` as the blocker between Phase 8 and its exit and implied §44's
miss→fixture pipeline was the tool for it. **That was only half right**, and measuring properly
produced a worse finding than "untested".

### The number

280 commands have no eval coverage. Their specs carry **559 hand-written example phrasings** — what
the registry documents a user would say. Run against the deterministic harness:

| | |
|---|---|
| examples for uncovered commands | 559 |
| **route to their own command** | **110 (20%)** |
| **do not** | **449 (80%)** |

These are not adversarial paraphrases. They are the examples the command's own spec offers.

### Three corrections on the way to that number

The measurement was wrong twice before it was right, and each error inflated the result:

1. **Wrong corpus.** `AI_COMMAND_EVAL_CASES` is a 31-entry subset; the runner and the §25 baseline
   use `AI_COMMAND_EVAL_DETERMINISTIC_CASES` (8,509). Reading the subset reported 696 of 696
   commands as uncovered.
2. **Wrong field.** Counting only `expect.action` found 57 of 8,509 cases. The corpus asserts
   `rescuedAction` 7,187 times — it tests the *rescue* path. Widening the check moved "uncovered"
   from 683 commands to 280.
3. **Wrong assertion in the generated cases.** They initially asserted `expect.action` and scored
   **0 of 559**. Probed directly: the same prompt scores 0/1 with `action` and 1/1 with
   `rescuedAction`. With the field corrected, 110 pass.

### What a pass means, and the circularity it exposes

A pass means **a detector routes it** — not that the planner can. And it cannot be made to mean
that: the deterministic path *is* the detector path. So §68's blocker cannot be cleared by adding
deterministic eval cases at all. Only §19's shadow comparison can show planner readiness, which is
the 7-day step Phase 8 already specifies.

Phase 8's gate is coherent. The route to it is not "write more eval cases".

### Not registered as a corpus addition, deliberately

Two rejected options: registering all 559 puts 449 known-red cases in and breaks §25's ratchet on
day one; registering only the 110 that pass builds a corpus that cannot fail. So this ships as a
**measurement with a ratcheted floor** — 110 may rise and must not fall — plus a guard against
someone "fixing" the cases back to `expect.action`, which scores zero.

### Verification

- 4 tests; chain now **3,761 across 19 gates**, 0 failures.
- The 559 cases are generated from `COMMAND_SPECS` at module load, so a spec that gains an example
  gains a case and one that loses an example cannot leave a stale golden behind.

## §70 — Phase 8 unblocked: the shadow never ran, and replay says why it matters

Phase 8's remaining gate is "shadow-compare 7 days". Checking whether that clock had started found
it had never been started at all.

### The gate was unreachable, twice over

- **`AI_PLANNER_SHADOW_SURFACES` is not set anywhere** — not in `.env`, not in any config, not in
  any deploy manifest. §19's shadow has been disabled since the day it shipped. Consistent with
  what the data shows: `ai_command_plan_shadow_disagreement` has **0 rows**, and **0 of 5,362**
  traces carry `plan_outcome`.
- **Traffic stopped on 2026-08-03.** This environment holds a fixed historical corpus, not a live
  stream. Waiting seven days produces seven days of nothing.

So "wait for the shadow" was never going to complete. But the comparison does not need live
traffic — it needs *prompts with known outcomes*, and 5,362 of those are already stored.

### Offline replay

`ai-planner-shadow-replay.spec.ts` replays historical prompts through the same pure pieces the
planner uses — `buildPlannerMessages`, `decodePlanResponse`, `validatePlan` — calling OpenAI
directly rather than standing up the service's four injected dependencies. Opt-in behind
`AI_SHADOW_REPLAY=1` because it makes real completions; the full corpus is 5,362 of them, so it is
never the default.

    npm run ai:shadow-replay          # 10 prompts
    AI_SHADOW_REPLAY_LIMIT=200 npm run ai:shadow-replay

### What 25 prompts already say

| outcome | n |
|---|---|
| agreed with the recorded action | 1 |
| disagreed | 2 |
| undecodable response | **0** |
| **not executable** | **22** |

And the breakdown of those 22 is the finding: **18 are empty plans**. The model returns valid JSON
containing no steps. Three are `low_confidence`, one `invalid_variables`.

**The planner's problem is coverage, not accuracy.** It is not misrouting prompts — it is declining
to plan them at all, for roughly three quarters of real traffic. Decoding is not the issue either:
zero responses failed to parse.

That is decisive for Phase 8. Detectors cannot be retired in favour of a planner that produces no
plan for most prompts, and no amount of eval-case writing would have surfaced this, because §69
established the deterministic corpus measures the rescue path rather than the planner.

### Two harness bugs, both caught by running it

- **Alias matching.** The first run reported `list_tour_calendar_week -> tour.list_calendar_week` as
  a disagreement. It is the same command: spec id versus legacy alias. A suffix check called it a
  miss; comparing through `spec.aliases` fixed it.
- **`unplannable` conflated two failures.** Splitting it into `undecodable` and `not_executable`,
  then probing step count, turned "the planner can't handle these" into "the planner returns empty
  plans" — a different problem with a different fix.

### Caveat on the numbers

25 prompts, sampled at random from executed traces. Enough to establish that empty plans dominate;
not enough for per-domain figures. Raising `AI_SHADOW_REPLAY_LIMIT` is now a cost decision rather
than a blocked one.

### Verification

- Chain **3,762 across 19 gates**, 0 failures. The replay is skipped by default and does not run in
  CI.

## §71 — The planner is not broken. It is being asked an impossible question.

§70 found the planner returns empty plans for ~72% of real prompts. The diagnostic cost nothing —
two of three hypotheses needed no model calls — and both confirmed, compounding.

### The shortlist is 26× the size the roadmap specifies

§5, line 358: *"A precise registry with a **10–15 command shortlist** will beat a vector search over
vague command descriptions every time."*

Measured:

| surface / tier | shortlist | prompt |
|---|---|---|
| dashboard / owner | **388** | ~16,700 tokens |
| dashboard / staff | 234 | ~10,500 |
| customer / client | 204 | ~9,000 |
| provider / staff | 139 | ~6,300 |
| public / client | 137 | ~6,200 |

`buildPlannerShortlist` filters by surface and permission — §4 guardrail 1 — and stops there. That
was never meant to be the whole narrowing, but nothing else was ever added, so the model picks one
command from 388 descriptions-with-examples.

### The prompt then does exactly what it should

`ai-command-plan.prompt.ts`:

> "If a request does not match any listed command, do NOT substitute a similar one — add a
> plain-language note to `unresolved` instead."

That is the anti-steal rule, and it is correct. Against 388 candidates it produces empty plans.

**Confirmed rather than inferred**: instrumenting the replay to check whether empty plans carry
`unresolved` notes — **11 of 12 do**. The model is not failing silently. It is saying "I could not
map this", which is precisely what it was told to do when unsure.

### So the fix is the shortlist, not the prompt

Loosening the instruction would trade empty plans for *wrong* plans — the steal problem §4 exists to
remove, reintroduced at the planner. The shortlist has to come down to 10–15.

**That makes e2e-bug.372 the fix for e2e-bug.381.** §52 built the retrieval that ranks candidates by
embedding similarity and caps them; it has been sitting unwired, filed as a nice-to-have. It is not
a nice-to-have — it is the missing narrowing step the whole planner design assumed.

### What this reframes

Every Phase 8 blocker traces back here. Detectors cannot be retired in favour of a planner given an
impossible prompt; §68's readiness, §67's domain lock and §42's propose-only promotion all wait on
the same thing. One fix unblocks the phase.

### Verification

- Free diagnostic: shortlist and prompt sizes measured with no model calls.
- 12-prompt confirmation run for the `unresolved` link.
- Chain **3,762 across 19 gates**, 0 failures.

## §72 — The missing narrowing step

§71 diagnosed e2e-bug.381: the planner returns empty plans because its shortlist is **388** commands
where §5 specifies **10–15**. This is the step that closes that gap.

`narrowShortlist` ranks the *already permitted* commands by embedding similarity to the message and
keeps the top N. It matches on `description + examples` — exactly what the shortlist shows the model,
because ranking by one thing and presenting another makes the top result unexplainable.

### Two invariants, both mutation-tested

**Narrowing can only remove.** The input is whatever `specsForActor` returned, so §4 guardrail 1
stays upstream and a command the actor may not run cannot appear however it is scored or pinned.

**Degrade to everything, never to a guess.** No query embedding, or no command embeddings loaded,
returns the full list with `reason: 'no_embeddings'`. A ranking built from nothing would silently
hide commands; today's behaviour — everything, badly — is the safer failure.

Two further properties worth the tests: `pinned` keeps conversation-relevant commands reachable when
the message alone scores badly ("make it 4pm" resembles nothing), which §53's entity store needs; and
the output preserves *caller* ordering rather than similarity ordering, because reordering per
message makes the planner's input unstable across identical requests — the e2e-bug.152 class.

### A mutation that was equivalent, and what it taught

Removing the permission filter on `pinned` failed nothing. The safety property is enforced by the
final `permitted.filter(...)`, not by that line — so the invariant held via a different mechanism
than I had assumed.

The filter is not redundant, though: it feeds `limit - pinned.size`, so an unpermitted pin would
reserve a slot for a command that never appears and quietly return 9 where 10 were asked for. Test
rewritten to assert the count, which the mutation then fails. Recorded because "the mutation passed"
is information about the test, not a reason to delete the line.

### Not yet wired

`buildPlannerShortlist` still returns all 388. Wiring needs command embeddings — 696 of them,
computed once and cached, plus one per incoming message — which is the cost decision in
e2e-bug.372. The narrowing itself is now pure, tested and ready to call.

### Verification

- 14 tests; chain **3,776 across 19 gates**, 0 failures.
- Four mutations: narrowing over all specs instead of permitted ones, returning empty instead of
  everything when embeddings are missing, dropping the pinned permission filter, and reordering by
  similarity. Three caught immediately; the fourth caught after the test was corrected.

## §73 — Embeddings wired, narrowing measured, and deliberately left off

e2e-bug.372 asked for the narrowing step to be wired. It is: 696 command vectors are committed,
`embedText` takes a `dimensions` option, and `AiCommandPlannerService` embeds each message and calls
`narrowShortlist`. Then it was measured, and the measurement says do not turn it on.

### What shipped

- `ai-command-embeddings.json` — 696 vectors, **256 dimensions**, 1.5MB. At the default 1,536 it
  would be ~10MB checked in. `EMBEDDING_DIMENSIONS` is declared once because a cache and a query at
  different widths produce meaningless cosines that still look like numbers.
- `npm run build:ai-embeddings` — opt-in rebuild, batched 96 at a time, ~70k tokens total.
- `loadCommandIndex` — memoised, and **refuses a cache whose `dimensions` disagree** rather than
  ranking on nonsense.
- The planner call site, gated behind `AI_PLANNER_NARROW_SHORTLIST=1`, **off by default**.

### The measurement, on 60 completions and 143 embeddings

| | before narrowing | after (limit 15) |
|---|---|---|
| empty plans | 72% | **28%** |
| wrong command | ~8% | **38%** |
| correct command present in shortlist | — | **~55%** |

Narrowing does what §71 predicted to the empty plans — and pays for it in wrong ones. By §4's
standard that is a **net regression**: the whole planner design exists to stop wrong commands being
substituted for right ones, and a shortlist that omits the answer forces exactly that substitution.

### Why the limit is not the lever

Recall against shortlist size, measured with embeddings only:

| limit | 15 | 25 | 40 | 60 | 100 |
|---|---|---|---|---|---|
| recall | 54% | 55% | 59% | 61% | 64% |

Nearly 7× the prompt buys ten points. The *ranking* is weak, not the cut-off — so no limit setting
makes this safe.

**Not a language problem either.** §48 established the corpus is trilingual, which was the obvious
suspect. At limit 15: ASCII 56%, non-ASCII 53%. Eliminated.

### §71 was wrong, and this is the correction

§71 concluded the 388-command shortlist caused e2e-bug.381's empty plans. It is a real deviation
from §5's 10–15 and worth fixing — but it is **not the cause**. Narrowing to exactly 15 left 28% of
prompts unplannable, and the reason the number moved at all is that a shorter list is easier to
answer *wrongly*.

Also corrected: two early readings at n=25 gave 72% and 24% empty plans **from the same code**.
Random sampling at that size is noise, and I over-read it twice before running n=60.

### A replay bug that inverted a result

The first narrowed run showed an average shortlist of 7 and no improvement. Cause: the replay passed
the trace's `role` as the access tier. `role` is the *business role profile*; the gateway derives the
tier as `resolveAccessTier(membershipRole ?? role)`, and `membershipRole` is not stored — so a
customer-surface request from a business owner records `owner` while being gated as `client`. Since
`isSpecAllowedForTier` is exact membership rather than hierarchical, `owner` on the customer surface
permitted only the ~7 commands that literally list it.

### What is next, named

Recall is the whole problem. The untested hypothesis is dimensionality — 256 was chosen for file
size, not accuracy, and rebuilding at 1,536 is embeddings-only and cheap to re-measure. Filed as
e2e-bug.382 with that as step one.

### Verification

- Chain **3,776 across 19 gates**, 0 failures. Narrowing is off, so no behaviour changed.

## §74 — Both cheap recall hypotheses refuted

§73 left e2e-bug.382 with two hypotheses for ~55% shortlist recall, dimensionality first because it
was chosen for file size rather than accuracy. Both were cheap to test and both are wrong.

### Like-for-like, 143 prompts, deterministic sample

| limit | 15 | 25 | 40 | 60 | 100 |
|---|---|---|---|---|---|
| **256 dims, description + examples** | **45%** | **45%** | **47%** | **48%** | 49% |
| 1,536 dims, description + examples | 36% | 38% | 40% | 41% | 50% |
| 256 dims, examples only | 36% | 37% | 37% | 40% | 50% |

**Hypothesis 1 — dimensionality — refuted, and inverted.** 1,536 is *worse* than 256 at every limit
below 100. The 256-dim cache is also 1.5MB against 8.6MB, so the file-size choice happened to be the
accuracy choice too.

**Hypothesis 2 — match text — refuted.** Matching user utterances against the commands' own example
utterances, dropping the prose description, loses nine points. The description carries signal the
examples do not.

The original configuration is the best of the three. Reverted to it.

### A comparison I nearly got wrong

The first 1,536 run scored 36% against 256's previously-recorded 54%, which looked decisive. It was
not comparable: the earlier sweep sampled with `ORDER BY random()` and the new one with
`ORDER BY md5(prompt_raw)` — different prompts. Re-running 256 on the identical deterministic sample
gave 45%, not 54%.

Two things follow. The real gap is 9 points, not 18. And **sample variance at n=143 is about ±9
points**, which is the same size as the effects being measured — so every comparison from here needs
the same fixed sample, and the random-sample numbers in §73 should be read as ±9.

### What this means

Recall sits at 45–49% regardless of dimensionality or match text. Two of the three obvious levers do
nothing, which points away from tuning and towards the approach: embedding similarity over 388 short
command descriptions does not separate them well enough to narrow safely.

Narrowing stays off. The remaining hypothesis is hybrid retrieval — embedding rank plus a lexical
signal so an exact word match cannot be ranked out — and §48's finding that lexical alone fails on
this trilingual corpus means it must be a supplement, not a replacement. That is materially more
work than the two tests above, so it is a decision rather than an experiment.

### Verification

- Chain **3,776 across 19 gates**, 0 failures. Cache rebuilt at the best configuration; narrowing
  remains disabled, so no behaviour changed.

## §75 — Four hypotheses down, and the real shape of the problem

§74 refuted dimensionality and match text. This adds domain-first shortlisting and model choice, and
— more usefully — putting every run side by side shows §71 was *directionally right* after all.

### Domain-first shortlisting — refuted

§66 gave every command a domain, so picking a domain and shortlisting within it looked like it
should beat a vector space over 388 items. Measured on the fixed 143-prompt sample, 25 domains:

| domains picked | recall | resulting shortlist |
|---|---|---|
| top 1 | 18% | 9 |
| top 2 | 26% | 21 |
| top 3 | 42% | 39 |

Direct command retrieval gets **47% at 40 commands**. Domain-first is worse at the same size — the
domain texts are averages of 30-79 commands and average away the signal.

### Model choice — refuted as a cause, but informative

| n=40, narrowing on | empty plans | wrong command |
|---|---|---|
| `gpt-4o-mini` | 40% | 13 |
| `gpt-4o` | **48%** | **4** |

The stronger model produces *more* empty plans and a third the wrong commands. That is the correct
trade by §4 — refuse rather than substitute — and it says the model is not the bottleneck. It is
behaving well with bad inputs.

### The picture across every run

| configuration | truth in shortlist | empty plans | wrong command |
|---|---|---|---|
| no narrowing (388 commands) | 100% by definition | **72%** | ~8% |
| narrowed to 15 | ~45% | **40%** | 33% |

This is the part worth stating plainly: **with the full list the correct command is always present,
and the planner still returned empty 72% of the time.** Shrinking the list to 15 nearly halved that
— so list size genuinely was hurting, and §71 was right about the direction even though §73 read the
result as a refutation.

Both factors are real and they pull against each other:

- **size hurts** — 388 candidates produce empty plans even when the answer is among them;
- **recall hurts** — at 15 candidates the answer is only there 45% of the time, and what the model
  does with its absence is either refuse (4o) or guess (mini).

So the prize is well defined: **high recall at a small list size**. Neither number alone is the
target, and optimising one has so far cost the other.

### Where that leaves it

Three embedding variants — 256 vs 1,536 dims, description+examples vs examples-only, command-level
vs domain-level — all land between 36% and 49%. That is a narrow band across quite different
configurations, which suggests the ceiling belongs to the approach rather than the tuning.

Remaining untried: hybrid embedding + lexical (§48 rules out lexical alone on this trilingual
corpus, so it must supplement), and a two-stage planner that asks the model to name a domain rather
than inferring one by cosine — the model was never given that job, only the vector was.

Narrowing stays off. Nothing shipped in this section changed behaviour.

### Verification

- Chain **3,776 across 19 gates**, 0 failures.

## §76 — The two-stage test failed, and found my own taxonomy bug

§75 recommended asking the *model* to name a domain rather than inferring one by cosine, on the
grounds that the model is the component behaving well. Stage-1 accuracy, 60 real prompts, domains
scoped to what the actor may run:

    top-1 = 28%    top-2 = 28%

Top-1 and top-2 being identical is the tell: when the first pick was wrong the second never rescued
it. That is not what a model failing to discriminate looks like. Reading the misses:

    provider    -> provider2 / operations
    appointment -> booking / provider
    booking     -> provider / customer

The model is not wrong. **The taxonomy is.**

### 25 domains, and about ten of them are duplicates

| | |
|---|---|
| `booking` 79 + `appointment` 8 | the same concept |
| `provider` 65 + `provider2` 14 | split by the module name `provider-exp-2` |
| `clinic` 48 + `clinical` 12 | the same concept |
| `payment` 42 / `commerce` 52 | overlapping money |
| `schedule` 32 / `operations` 71 | overlapping scheduling |

§66 wrote: *"`ai-command` was never a domain — it is the label left on everything that did not get
one."* That was correct, and I applied it to the catch-all and nowhere else. Across §56–§65 I let
`apiModule` names become `domain` values, so the taxonomy records how the code was filed rather than
what the commands do.

Asking a model to choose between `provider` and `provider2` is asking it to guess which sprint a
feature shipped in. 28% is close to what that deserves.

### This is not cosmetic — `domain` is load-bearing

`ai-saga.util.ts`:

```ts
/** The aggregate a step touches. `domain` is the aggregate root here. */
return specFor(specs, step.command)?.domain ?? 'unknown';
```

§47 groups steps into transactions by domain. With `appointment` and `booking` separate, a plan
touching both is split into two transaction groups when it should be one — so the cheap same-aggregate
rollback silently degrades into a saga with compensations. That is a correctness bug in the
transaction model, arriving from a naming decision.

It also feeds §67's `RESCUE_ACTION_LOCKED_DOMAINS` and §68's per-domain retirement slices, both of
which currently plan against boundaries that do not mean anything.

### What this changes

Two-stage routing is **not refuted** — it was untestable. It cannot be evaluated until the domains
are concepts. Filed as e2e-bug.383, and it is now upstream of e2e-bug.382: fixing the taxonomy is
required for the routing test, likely improves embedding recall (domain texts currently average
unrelated commands together), and repairs the transaction grouping regardless of whether either
retrieval idea works.

### Verification

- Chain **3,776 across 19 gates**, 0 failures. No production behaviour changed.

## §77 — Taxonomy merged, and domain routing more than doubles

§76 found `CommandSpec.domain` recorded the `apiModule` a command was filed under rather than what it
does, producing 25 domains of which about ten were duplicates. Fixed.

### 25 → 16, no duplicates

| merged | into | why |
|---|---|---|
| `appointment` (8) | `booking` | same aggregate; `appointment` was the Phase 1 pilot name |
| `provider2` (14) | `provider` | split only by the module name `provider-exp-2` |
| `clinical` (12) | `clinic` | `clinic-test-results` vs `patient-clinical-profiles` |
| `locations` (2), `onboarding` (8) | `business` | business configuration and setup |
| `guest` (6), `adoption` (17) | `customer` | customer-facing auth and lifecycle |
| `recommendation` (8) | `commerce` | product recommendations sell products |
| `agent` (5) | `operations` | running the assistant is operational |

**`payment` deliberately survives.** §58's money rule keys on `s.domain === 'payment'`, and "paying
for a booking" is genuinely distinguishable from "selling a product". Merging it into `commerce`
would have silently disarmed a safety rule.

Only the `domain` field changed. Command **ids** keep their original prefixes — `appointment.create`
now has `domain: 'booking'` — because ids are referenced by `compensation.command` across the specs
and renaming them would touch the §47 saga wiring for no benefit. The id is an identifier; the
domain is a classification. They were never required to match.

### Domain routing more than doubled

Asking the model to name the domain, 60 real prompts, same fixed sample:

| | before merge | after |
|---|---|---|
| top-1 | 28% | 23% |
| **top-2** | **28%** | **58%** |

Before, top-1 and top-2 were identical — the second pick never rescued the first, which is what
happens when the two candidates are `provider` and `provider2`. After, the second pick rescues 35
points. That is the taxonomy bug measured directly.

Top-1 dipped slightly, which is expected: merging makes domains larger and their boundaries less
sharp for a single pick, while making the *pair* far more likely to contain the answer.

### Two of §68's "four slice-ready domains" were artefacts

The retirement ratchet failed on this change, correctly. `appointment` (5 detectors) and
`recommendation` (8) were slice-ready only because they were small fragments of `booking` and
`commerce`. They were never separately retirable. `tour` (8) and `guide` (7) are real — distinct
verticals with their own commands — and remain slice-ready.

Detector readiness itself is unchanged at 318/555: readiness is per command, not per domain. Only
the grouping moved.

### Where this leaves the retrieval problem

Neither approach hits the target of high recall at a small list:

| approach | recall | shortlist |
|---|---|---|
| embedding over all commands | 45% | 15 |
| model picks top-2 domains | 58% | 68 |

The obvious next test is composing them — take the top-2 domains, then embedding-narrow within those
68 to 15. That is a better-posed problem than ranking 388, and both halves already exist.

### Verification

- Chain **3,776 across 19 gates**, 0 failures.
- The one failure during this change was the §68 retirement ratchet, which is a gate doing its job:
  it caught that two slice boundaries had disappeared and made me justify why rather than adjust the
  number quietly.

## §78 — Composition refuted, and a recommendation to stop tuning retrieval

§77 left one obvious test: compose the two partial results — let the model pick domains (58% recall
at top-2), then embedding-narrow within them to 15. Measured on the same fixed 60-prompt sample:

| approach | domain recall | final recall @ 15 |
|---|---|---|
| embedding over all permitted (baseline) | — | **40%** |
| top-1 domain -> embed | 23% | 22% |
| top-2 domains -> embed | 50% | 22% |
| top-3 domains -> embed | 63% | **25%** |

**Composition is worse than either part.** Stage 1 hands stage 2 a much easier problem — 68 related
commands instead of 388 — and stage 2 still loses the answer. Narrowing 68 to 15 by embedding drops
the truth at roughly the same rate as narrowing 388 to 15 does.

That is the cleanest statement of the problem yet: **the embedding stage does not get better when
the candidate set gets smaller or more related.** It is not being confused by scale or by unrelated
neighbours. It simply does not rank these commands against these prompts.

### Five hypotheses, five refutations

| # | hypothesis | result |
|---|---|---|
| 1 | shortlist size (§71) | partly right — 388 -> 15 halved empty plans — but not the cause |
| 2 | embedding dimensionality (§74) | refuted, inverted: 256 beats 1,536 |
| 3 | match text (§74) | refuted: examples-only loses 9 points |
| 4 | domain-first by cosine (§75) | refuted: 18% top-1 |
| 5 | model choice (§75) | refuted as cause; stronger model refuses more, guesses less |
| 6 | taxonomy (§76-77) | **real bug, fixed** — routing 28% -> 58% — but recall unchanged |
| 7 | composition (§78) | refuted: worse than either part |

Every recall measurement across every configuration lands between 22% and 49%.

### Recommendation: stop tuning retrieval

Seven attempts have moved recall by no more than a few points in either direction. Continuing to
adjust parameters of the same approach is not a good use of the next session. Two things follow:

**The taxonomy work was worth it anyway.** e2e-bug.383 was a genuine correctness bug — §47 grouped
transactions by a field that recorded which sprint a command shipped in. That is fixed regardless of
whether retrieval ever works.

**The untested idea is structural, not parametric.** With the full 388-command list the correct
command is *always* present and the planner still returned empty 72% of the time — the model was
overwhelmed by a flat list. But the same model picks correctly among 16 coherent domains 58% of the
time at top-2. So the promising direction is **presenting all 388 grouped by domain** rather than
filtering down to 15: keep recall at 100% by construction and reduce the navigation problem instead
of the candidate count. That is a prompt-structure change, not a retrieval change, and nothing tried
so far has tested it.

### Verification

- Chain **3,776 across 19 gates**, 0 failures. Narrowing remains disabled; no behaviour changed.

## §79 — Grouping beats narrowing, and every earlier comparison was unfalsifiable

§78 recommended abandoning retrieval tuning and testing a structural change instead: present all 388
commands **grouped by domain** rather than filtering to 15. Recall stays 100% by construction and the
problem becomes navigation rather than selection. It works — and getting there exposed a flaw in how
everything since §70 was measured.

### The measurement was resampling on every run

`ai-planner-shadow-replay.spec.ts` selected prompts with `ORDER BY random()`. Every run therefore
compared a *different set of prompts*, and the same configuration produced **25% and 40% empty plans**
on two consecutive runs at n=40. That spread is larger than any difference between the
configurations being compared.

So the numbers in §70–§78 are individually real but **not comparable to each other**. Statements of
the form "narrowing changed X to Y" were reading sampling noise. Fixed: the replay now samples with
`ORDER BY md5(prompt_raw)`, so every configuration sees the same prompts and only model
non-determinism remains.

### The first matched comparison

Same 40 prompts, one variable changed:

| | narrowed to 15 (flat) | **grouped, all 388** |
|---|---|---|
| agreed with recorded action | 1 (2.5%) | **8 (20%)** |
| empty plans | 25 (63%) | **16 (40%)** |
| wrong command | 13 (33%) | 15 (38%) |

Grouping gives **8× the agreement** and cuts empty plans by a third, for one extra wrong command. On
these prompts, narrowing to 15 is close to useless — it agreed once in forty.

That is what §78 predicted: the model was not failing because there were too many candidates. It was
failing because a flat list of 388 offers nowhere to stand. Sixteen headings give it somewhere.

### What this does not claim

20% agreement is not good. It is the best configuration measured, and it points in a direction worth
pursuing, but a planner that matches the recorded action one time in five cannot yet replace 555
detectors. Phase 8 stays blocked.

Nor is n=40 enough to separate 38% from 33% on the wrong-command column — that difference is inside
the noise even with a fixed sample. The agreement and empty-plan gaps are large enough to trust; the
wrong-command gap is not.

### State

Both options are flagged and both default off: `AI_PLANNER_NARROW_SHORTLIST` and
`AI_PLANNER_GROUPED_SHORTLIST`. Nothing in production changed. Grouping is the one worth enabling
next, after a larger matched run confirms the gap holds.

### Verification

- Chain **3,776 across 19 gates**, 0 failures.

## §80 — Two live defects fixed in the shipped assistant

After §79's larger matched run showed grouping does not beat narrowing, I stopped the planner
investigation and fixed the two real defects it had turned up in the assistant that actually runs.

### e2e-bug.377 — a booking command with no confirmation gate

`book_walk_in_gap` calls `bookingService.create(...)`. Its registry binding had
`mutateIntents: []`, so the whole `provider-open-shifts` group was read-only and it ran as
`executionMode: 'read_only'` at T0 — no confirmation, no post-exec assertion, and absent from the
mutating-command count risk reporting uses.

Fixed at the binding: only `book_walk_in_gap` moves; the other four open-shift intents genuinely
suggest, list and draft. It is now `simple_mutate`, and its spec is T1 with `confirm: 'always'`.

### e2e-bug.378 — an inverted permission, fixed the other way round

I had diagnosed this as "`staff` was never added". Wrong. `PROVIDER_DENIED_BY_TIER.staff` denies
`coordinate_waitlist_offer`, `team_whos_next` and `team_floor_status` **explicitly** — a deliberate
"team-wide data is manager+" decision. The gap is that `client`, a strictly lower tier, was never
added to the same list.

So the fix is to **deny client**, not to grant staff. Granting would have widened access by
overriding a deliberate decision on my own guess; denying only narrows, and makes the tiers nest:
all three are now `manager, owner`.

Worth recording because the first reading was plausible and would have shipped a permission
widening.

### The gates did their job

Both fixes immediately failed `ai-command-spec.conformance.spec.ts` — the specs still described the
old behaviour. That is the suite working as designed: change the running system and the declaration
must follow. Four specs updated.

### Verification

- Chain **3,776 across 19 gates**, 0 failures.
- `book_walk_in_gap` confirmed as `mutating: true` / `simple_mutate`.
- Tier nesting confirmed: the three team commands resolve to `manager, owner` at every check.

## §81 — Route 1: the metric was broken, and the planner does not steal

The plan was to check whether "disagreement" meant the planner was *wrong* or merely *different from
the detectors*. It is neither. Sampling 50 prompts and printing both sides of every disagreement
found that most "disagreements" were not command choices at all.

### 6 of 7 unique disagreements were empty plans

`validatePlan` returns **`executable: true` for a plan with zero steps** when the model adds no
`unresolved` note:

    steps: [], unresolved: []           -> executable = true
    steps: [], unresolved: ['...']      -> executable = false

So an empty plan took one of two paths depending on whether the model happened to explain itself. The
noted ones were counted as "not executable"; the silent ones fell through to the command comparison,
compared `(none)` against the recorded action, and were counted as **disagreed**.

### Reclassified

| n=50 | as reported | reclassified |
|---|---|---|
| agreed | 6 (12%) | 6 (12%) |
| **wrong command** | **21 (42%)** | **3 (6%)** |
| empty, note given | — | 21 (42%) |
| **empty, silent** | *counted as wrong* | **18 (36%)** |

**The planner picks a wrong command 6% of the time, not 42%.** Of the three, the one I can read is
"Who is available for massage this week?" — detector `check_availability` ("what slots are free"),
planner `check_providers_for_service` ("which providers offer a service"). The prompt asks *who*, so
the planner is arguably the better answer; "this week" points the other way. Genuinely ambiguous
rather than wrong.

### What this retracts

§73 and §79 both claimed narrowing and grouping "trade empty plans for wrong commands". **That was
an artefact.** The wrong-command column was mostly silent empty plans, so the trade I described did
not happen and the conclusions drawn from it do not stand.

The planner's real behaviour is simpler than any of the last eight sections suggested: it declines
about 78% of the time and is rarely wrong when it commits. It does not steal — which is exactly the
property §4 wants and the detectors do not have.

### The validation bug

A zero-step plan is not executable; there is nothing to execute. §33's executor already refuses one
("Plan has no steps"), so validation and execution disagree. Filed as e2e-bug.384.

### What it means for Phase 8

Better than it looked, and blocked differently than described. A planner that refuses rather than
substitutes is safe to run alongside detectors — it cannot steal a command. What it cannot yet do is
carry traffic alone.

That reopens the per-slice route: for `tour` (8 detectors) and `guide` (7), the question is no longer
"is the planner accurate enough" but "does it produce a plan at all for those prompts". That is a
narrower, answerable question, and the replay can answer it per domain.

### Verification

- Two measurement bugs found and fixed in this section: the `-A 2` extraction that dropped the
  PLANNER line, and the silent-empty-plan miscount. The first cost a re-run; the second invalidated
  earlier conclusions.

### §81 addendum — fix confirmed end to end

`validatePlan` now returns `executable: false` for a zero-step plan, with a dedicated `empty_plan`
code. Re-running the same 50 prompts through the replay:

| | before | after |
|---|---|---|
| agreed | 6 (12%) | 6 (12%) |
| **wrong command** | **21 (42%)** | **3 (6%)** |
| not executable | 23 | 41 — `empty_plan` **39** (21 noted, 18 silent) |

The harness now reports what the manual reclassification found, so no future measurement needs the
correction applied by hand.

The planner's honest scorecard on this sample: **agrees 12%, wrong 6%, declines 78%.** It is not
inaccurate — it is silent. That is a different problem from the one §70–§79 spent their effort on,
and a safer one: a planner that declines cannot steal a command from a detector.

## §82 — Option 1 failed: the tour+guide gap cannot be closed by editing specs

§81 left `tour`+`guide` as the one slice worth retiring, and the plan was to close its 16% gap before
deleting the 15 detectors. Three configurations were measured on the same 45 real prompts. **All
three edits made it worse.**

### The slice is genuinely the planner's best ground

Baseline, 45 real prompts for exactly these 15 actions:

| | |
|---|---|
| produced a usable plan | 41 (91%) |
| **correct command** | **38 (84%)** |
| wrong | 3 (7%) |
| no plan | 4 (9%) |

Against a global 12% correct / 78% decline, that is a different planet — a coherent, narrow domain is
where this planner works. §68's "slice-ready" call was sound.

### Every attempted improvement regressed it

| configuration | correct | no plan |
|---|---|---|
| **baseline** | **38** | **4** |
| + multilingual examples | 31 | 10 |
| + multilingual examples + "this is not X" descriptions | 26 | 18 |

Reverting restored 38/4 exactly, and the two-change configuration reproduced 26 across two runs, so
the causation is established rather than inferred.

### The reasoning that failed, and why it was worth trying

Every trace for `list_tour_calendar_week` — 121 of the slice's 168 — is Armenian or Russian, and the
spec offered the planner only English examples. Adding the real phrasings verbatim looked
near-certain to help.

It cost seven points. Adding "this is the calendar view, **not** departure availability" cost five
more, which at least matches the mechanism: negative framing gives a model whose dominant failure is
*declining* one more reason to decline. Precision moved the way that predicts — wrong commands fell
3 → 1 — while recall collapsed.

The examples result has no mechanism I can defend. The honest statement is that adding
representative examples of the actual traffic language made routing worse, and I do not know why.

### Consequence

84% stands, below §42's 90% bar. **The tour and guide detectors are not retired**, and I have no
remaining cheap lever to close the gap: the obvious spec-level improvements are measured and
negative.

Phase 8 remains open. What changed is that the blocker is now specific and small — 4 no-plan and 3
wrong prompts against 2 confusable commands — rather than the diffuse "planner isn't good enough" it
was before.

### Verification

- Chain **3,791 across 19 gates**, 0 failures. Specs reverted to the best measured configuration; no
  behaviour changed.

## §83 — the shortlist was never the problem: 23% of traffic names a command the actor cannot reach

§82 ended with "no cheap lever left", and the next candidate was retrieval: `truth_in_shortlist=65/150`
(43%) suggested the correct command was missing from the shortlist more often than not, and the
cheapest test of that was whether a bigger `k` recovered it.

It does not, because 43% was two different failures added together.

### Recall@k, measured on ranks rather than a single cutoff

Ranking the **full** permitted candidate list by cosine and recording the true command's rank gives
recall at every k from one pass:

| k | recall |
|---|---|
| 5 | 63% |
| 10 | 66% |
| **15 (shipped)** | **81%** |
| 25 | 81% |
| 40 | 84% |
| 100 | 88% |

Median rank **3**, p75 **11**. Raising k from 15 to 40 buys three points and costs 2.7x the prompt.
**Retrieval is not the blocker and §5's 10–15 was a good guess.**

### What the 43% actually was

Of 150 prompts, **70 never reached ranking at all**: the true command is not in the permitted set, so
no k recovers it. The remaining 80 rank at 81%@15 — and 65/80 is the same 65 that appeared as
"65/150". The number had been read as a ranking failure for three sections; it was 47% permission
failure and 19% ranking failure.

### The permission failure is one bug, ten commands

Every one of the 63 tier denials in the sample is the same shape:

```
booking.recommend_specialists | trace surface=customer | spec surfaces=public  tiers[customer]=null
booking.list_services         | trace surface=customer | spec surfaces=dashboard|public
booking.check_availability    | trace surface=customer | spec surfaces=dashboard|provider|public
```

`CommandSurface` is `dashboard | provider | customer | public`. The trace table records
**`customer` 3,703, `dashboard` 1,161, `provider` 498, and `public` zero**. No request has ever
arrived on `public`, yet 137 specs declare it and 17 declare it *instead of* `customer`.

Across all executed traces:

| | traces | share |
|---|---|---|
| reachable today | 2,373 | 69.1% |
| **denied — spec is public-only** | **794** | **23.1%** |
| denied — anything else | 20 | 0.6% |
| no spec at all (`compound_intent`) | 246 | 7.2% |

794 traces across **10 commands** — `booking.help` (232), `list_services` (199),
`recommend_specialists` (178), `check_availability` (74), `list_providers` (34) and five smaller.
These are the customer app's most-used reads, and the planner cannot see any of them.

### Why this matters more than anything in §70–§82

Every planner measurement in this programme ran against a candidate set missing a quarter of real
traffic, on the surface carrying 69% of it. The empty plans were partly the planner correctly
refusing to invent a command that was not in front of it.

The fix is not a tuning exercise: 10 specs need `customer` added to `surfaces`, or
`isSpecAllowedForTier` needs to treat `public` as a subset of `customer`. Both **widen** a permission
boundary, so neither is a change to make silently — filed as `e2e-bug.386` rather than applied here.

The open design question is whether `public` should exist at all. A surface with zero traffic in a
5,362-row corpus is either dead or misnamed, and 137 specs are gated on it.

## §84 — the surface fix: retrieval 43% → 79%, and the real blocker is now visible

§83 found that 794 executed traces (23.1%) named a command the planner could not see, because 17
specs declared `surfaces: ['public']` while the runtime only ever emits `customer`. This applies the
fix and measures it.

### The access gate already allowed these — only the declaration disagreed

The decisive evidence came from the conformance suite. It has two assertions: one comparing spec
surfaces to the registry, one comparing spec tiers to **`isIntentAllowed`, the gate that actually
runs**. Adding `customer: ['client']` to all 17 specs left the *tiers* assertion green and failed
only the *surfaces* one.

That is the whole finding in one line: `isIntentAllowed('customer', 'client', id)` was already true
for every command here — which is how 794 traces executed on `customer` at all. Nothing was being
protected. A stale declaration was hiding commands from the planner that the security gate had always
permitted.

So this is not a widening of access. It is a declaration catching up with the gate.

### Both halves of the declaration

Specs and the legacy registry each carry a surface list, and the conformance gate requires they
agree:

- **17 specs** gained `customer` in `surfaces` and `customer: ['client']` in `tiers` — following the
  file's own convention (`['client']`, not the full public tier list, because the customer surface
  resolves to `client` regardless);
- **one binding** added to `LEGACY_CORE_BINDINGS`, registered **first**. `register` unions surfaces
  but overwrites `bindingByIntent`, so a later binding wins the handler. Going first adds `customer`
  to the surface set while leaving every handler untouched — `list_services` and `check_availability`
  keep the dashboard/provider handlers they resolve to today.

`ai-command-inventory.json` regenerates from the registry and was rebuilt.

### Result

Reachability across all 3,433 executed traces:

| | before | after |
|---|---|---|
| **reachable** | 2,373 (69.1%) | **3,167 (92.3%)** |
| denied | 814 (23.7%) | **20 (0.6%)** |
| no spec (`compound_intent`) | 246 (7.2%) | 246 (7.2%) |

Planner replay, same fixed 150-prompt sample as §78:

| | §78 | now |
|---|---|---|
| **truth in shortlist** | **65 (43%)** | **118 (79%)** |
| agreed | 18 | 33 |
| disagreed | 49 | 20 |

**`truth_in_shortlist` is the clean number** — pure retrieval, directly attributable to this change.
The agreed/disagreed shift is real but not purely attributable: §78 ran before `e2e-bug.384` was
fixed, when empty plans were wrongly counted executable and therefore landed in `disagreed`.

### What is now the blocker, stated plainly

**77 of 150 prompts produce an empty plan** — and **49 of those are silent**, with no `unresolved`
note explaining the refusal. The correct command is in the shortlist 79% of the time and the planner
still declines half the time.

That is a different problem from every one this programme has chased. It is not retrieval (measured,
79%), not shortlist size (§83: recall@40 buys three points), not spec wording (§82: three edits, all
regressions). The planner is being shown the right command and choosing not to use it.

Phase 8 stays open, but for the first time the remaining question is a single well-posed one.

## §85 — the planner was never declining: a field-name collision was eating half the plans

§84 ended by naming the last blocker: 77 of 150 replayed prompts returned an empty plan, 49 of them
silent. Every prior measurement in this programme had been of *decoded* output. This reads the raw
completions.

The planner was not declining. It was returning this:

```json
{ "steps": [ { "id": "booking.list_services", "variables": {},
              "confidence": 1.0, "dependsOn": [] } ],
  "unresolved": [], "topicChanged": false }
```

A correct plan, one step, confidence 1.0. Nineteen of the 57 silent cases were that exact response.

### The cause is two field names

`PLAN_OUTPUT_CONTRACT` asked for a step label called **`id`** and, beside it, a field called
**`command`** documented as `"<one of the command **ids** listed above, exactly>"`. Faced with a field
literally named `id` and a neighbouring description saying "command ids", the model put the command id
into `id` and omitted `command`. `decodePlanStep` reads `record.command`, found nothing, and returned
`null` — dropping the step and leaving `unresolved` empty.

Downstream that is indistinguishable from the model refusing to map the message. It was counted as a
refusal for the whole of §70–§84.

### Both halves fixed

- **the collision** — the label is now `stepId`, `command` is listed first, and one line states which
  is which. The name `id` no longer competes for a value described as an id;
- **the silence** — a plan emptied by *dropped* steps now says so in `unresolved`. "The model proposed
  something unreadable" and "the model declined" are different events and must not arrive identical;
- **recovery** — when `command` is absent and the label contains a dot, the label is read as the
  command. This is syntactic, not semantic: command ids are `domain.verb` and step labels are `s1`, so
  a dotted label cannot be a label. The decoder still owns no command list — a recovered id naming
  nothing real fails `validatePlan` as `unknown_command`, and there is a test pinning exactly that.

### Result

Same fixed 150-prompt sample throughout:

| | §78 | after §84 surface fix | **after this** |
|---|---|---|---|
| truth in shortlist | 65 (43%) | 118 (79%) | 118 (79%) |
| **agreed with the recorded action** | 18 (12%) | 33 (22%) | **69 (46%)** |
| disagreed | 49 | 20 | 29 |
| empty plans | 58 | 77 | **29** |
| **silent empty plans** | — | **49** | **1** |

Agreed went 18 → 69 across §84 and §85. Disagreements rose 20 → 29 because steps that used to be
dropped now decode and can be wrong — that is the honest direction, not a regression.

### What this says about the preceding fifteen sections

The language hypothesis died on the way past: Armenian prompts were silent **0 times in 20**, Latin
55 in 126. §82's Armenian finding and §48's trilingual corpus pointed at a real thing, but not at
this.

More usefully: §70 through §84 measured a planner that was working, through a decoder that was
discarding its output. The empty-plan rate drove the shortlist narrowing of §72, the grouped-rendering
experiment of §78, the spec rewrites of §82 and the retrieval work of §83. §83 and §84 found genuine
defects and the numbers moved. The rest was tuning a component that was not the broken one.

The lesson is narrow and worth stating: **every one of those sections measured decoded output, and
none looked at the bytes the model returned.** One `console.log` of the raw completion, at any point
in that sequence, would have ended it.

## §86 — §82's paradox explained: the embedding cache was never rebuilt

§82 added the real Armenian and Russian phrasings to four tour/guide specs, measured a seven-point
*drop*, reverted, and recorded a result with "no mechanism I can defend". §85 then found the decoder
bug that had been corrupting every planner measurement, which made re-taking the slice number the
next roadmap task.

Re-measured with §84 and §85 in place, the slice came out at **40%**, not §82's 84% — fixing a bug
cannot make results worse, so one of the two runs was measuring something else. Instrumenting for
`truth_in_shortlist` found it: **29 of 45** prompts did not have their command in the shortlist at
all, and every one of those was Armenian.

### The mechanism §82 was missing

`commandMatchText` is `description + examples`. That is what the **embedding cache** is built from,
and the cache is a checked-in file rebuilt by `npm run build:ai-embeddings`.

§82 edited the examples and never ran it.

So the added Armenian text reached the *prompt* — making it longer — and never reached *retrieval*,
which is the only thing it could have helped. §82 measured the cost of a longer prompt with none of
the benefit, and concluded that the users' own language hurt.

### The same change, with the cache rebuilt

| | §82 (stale cache) | now (rebuilt) |
|---|---|---|
| **truth in shortlist** | 29/45 (64%) | **44/45 (98%)** |
| correct and executable | 18 (40%) | **32 (71%)** |
| right command, blocked | 7 | 8 |
| **routed correctly** | 25 (56%) | **40 (89%)** |
| wrong command | 2 | 2 |

Retrieval for this slice is now effectively solved. §83's finding that an Armenian prompt ranked its
true command **378th of 388** was not a limit of the embedding model — it was a cache that had never
been shown a word of Armenian.

### What still blocks the slice, and it is not the planner

**Eight of the remaining eleven failures are the correct command with an empty `problems` list.**
`validatePlan` ends with:

```ts
executable: blocking.length === 0 && plan.unresolved.length === 0
```

Asked for "list upcoming tour departures **with pax and remaining capacity**", the planner picks
`tour.list_upcoming_departures` correctly and notes the part it could not map. The whole plan is then
refused. A correct route plus a side note is treated as a failure to route.

Whether that is right is a policy question Phase 6 owns — `unresolved` is meant to drive clarify, not
silent refusal — so it is filed as `e2e-bug.389` rather than changed here. It is now the single thing
between this slice and §42's bar: **89% routed against a 90% bar, with eight of the misses being
correct routes the validator rejects.**

### Correction to §82

§82 recorded that adding examples in any form reduced planner coverage, and that the result had no
defensible mechanism. Both statements were artefacts of a stale cache. The negative-framing half of
that section still stands — "this is not X" descriptions hurt, and the reason given there still
holds — but the multilingual-examples conclusion was wrong, and Phase 9's rule (a confirmed miss
becomes a registry `example`) was sound all along. **`build:ai-embeddings` must run whenever spec
descriptions or examples change**, and nothing enforced that.

### Verification

- Gates **3,799 across 19**, 0 failures. Cache rebuilt to 696 vectors at 256 dimensions.

## §87 — `unresolved` no longer refuses a read it answered correctly

§86 left the tour/guide slice at 89% routed, with **eight of the eleven failures being the correct
command** rejected by `validatePlan` because the model had noted something it could not map. This
fixes that (`e2e-bug.389`).

### The rule

The old line was unconditional and unnamed:

```ts
executable: blocking.length === 0 && plan.unresolved.length === 0,
```

Non-empty `unresolved` refused everything, and recorded nothing in `problems` — so a rejected plan
carried no reason at all. The new rule follows the risk the plan actually carries:

- **a pure read** (T0 throughout, no confirmation) proceeds. "List upcoming tour departures **with pax
  and remaining capacity**" routes correctly, cannot express "pax", and now answers the part it
  understood. §35 already built this contract for execution results — honest partial success — and
  this is the same contract one layer earlier;
- **anything that mutates or needs confirmation** still blocks, for Phase 6's reason: acting on a
  partial reading of a message that changes something is precisely what clarify exists to prevent.

Either way the note is now named as `unresolved_notes` in `problems`, so a refusal explains itself
and a caveat is visible rather than inferred. `describePlanClarification` already appended unresolved
items to its question, so blocked mutations still ask about the right thing.

### Result

| | §86 | after |
|---|---|---|
| truth in shortlist | 44/45 (98%) | 44/45 (98%) |
| **correct and executable** | 32 (71%) | **40 (89%)** |
| wrong command | 2 | 3 |
| no plan | 11 | **2** |

### The slice is one prompt short

**40 of 45 is 88.9% against `PROPOSE_ONLY_ACCURACY_BAR = 90`.** One more correct answer clears it.

The five remaining failures are named and small:

- 2 no plan — one Russian provider-calendar phrasing, one English "how are tour service colors
  assigned";
- 3 wrong — twice `list_tour_calendar_week -> tour.list_upcoming_departures`, the "this week's
  calendar" versus "upcoming departures" confusion §82 already identified, and once
  `retry_failed_network_action -> guide.resume_booking_draft`.

I am **not** iterating on those here. §82 is what that looks like: four prompts, two confusable
commands, and three consecutive spec edits that each made things worse for reasons that turned out to
be measurement artefacts. The difference now is that the instrumentation is honest — the decoder is
fixed (§85), the cache is rebuilt (§86), retrieval is at 98%, and `truth_in_shortlist` and
`unresolved_notes` are both visible in the trace. A targeted attempt at those five is worth making,
but as a deliberate next step rather than a fourth swing in the same session.

### Verification

- Gates **3,806 across 19**, 0 failures; 7 new tests pin the read/mutation split, the named problem
  code, and that a blocked plan still asks about the unresolved part.

## §88 — the slice clears the bar: 93% held-in, 100% held-out

§87 left the tour/guide slice at 40/45 (88.9%) against a 90% bar, five named failures. `e2e-bug.391`.

### The recorded labels were right and the specs were wrong

The two commands that dominate the confusion share a handler and declare no variables, so the only
thing separating them is prose. Checking the traces rather than assuming:

```
Any tours last week?                      -> list_tour_calendar_week
Show me next week's tour calendar         -> list_tour_calendar_week
List tour departures next week            -> list_tour_calendar_week
Summarize last week's tour departures ... -> list_tour_calendar_week
```

The command covers **any** week and absorbs prompts that say "departures" when they mean the calendar.
`tour.list_upcoming_departures` is the running forward list. So the labels the planner was being
scored against were correct, and two spec descriptions were not.

### The accurate description made it worse

Rewriting `tour.list_calendar_week` to say what it actually does — "this week, next week or a past
week ... on the provider calendar or schedule" — dropped the slice from 89% to **80%**, and retrieval
from 44/45 to **38/45**. The longer, calendar-heavy text diluted the vector into
`tour.explain_calendar_span`, and Armenian calendar prompts began routing there.

Reverted. **Being right about a command's scope and being retrievable are different objectives**, and
where they conflict the embedding wins, because a command that is not retrieved is never routed at
all. This is the third time in this programme that a defensible-sounding spec edit has cost
accuracy — but the first time the measurement was trustworthy enough to attribute it.

The other two edits — `tour.list_upcoming_departures` and `guide.retry_failed_network_action`, both
sharpened positively rather than by contrast — were kept.

### Result

| | §87 | accurate-description attempt | **kept** |
|---|---|---|---|
| truth in shortlist | 44/45 | 38/45 | **45/45** |
| correct | 40 (88.9%) | 36 (80.0%) | **42 (93.3%)** |

**Held out** — the 20 distinct slice prompts not in the tuned sample, never seen while editing:

| | |
|---|---|
| truth in shortlist | **20/20** |
| correct | **20/20 (100%)** |

Combined **62 of 65 = 95.4%**, retrieval **65/65**. The held-out arm matters more than the held-in
one: the specs were edited with the first 45 in view, so only the second sample tests generalisation,
and it is clean.

### The slice is retirement-ready

`PROPOSE_ONLY_ACCURACY_BAR = 90` is cleared on both arms. §68's other preconditions — a spec per
command, examples present — were already met, and §70 replaced Phase 8's un-runnable "shadow-compare
7 days" with offline replay of the stored corpus, which is what these numbers are.

The 15 `legacy_paraphrase` detectors in `tour` and `guide` can now be deleted. That is a bulk code
deletion, so it is proposed rather than done here.

### Three failures remain, all understood

- 2 x `list_tour_calendar_week -> tour.list_upcoming_departures` ("List tour departures next week").
  The prompt says "departures" and means the calendar; the honest fix is the description that made
  everything else worse, so this stays;
- 1 x "How are tour service colors assigned on the provider calendar" -> no plan. Labelled
  `explain_tour_calendar_span`, which is about a tour spanning days, not service colours. This one
  probably *is* a mislabelled trace.

### Verification

- Gates **3,806 across 19**, 0 failures. Cache rebuilt (696 vectors) after every spec edit, per §86.

## §89 — the retirement is blocked on wiring, not accuracy, and §88 said otherwise

§88 concluded "the 15 `legacy_paraphrase` detectors in `tour` and `guide` can now be deleted". Acting
on that, the first step was to enumerate them and check what depends on them. Two things came back
that make the deletion unsafe, and the first is one §88 should have checked before making the claim.

### Nothing would replace them

Phase 8's per-slice recipe is "planner passes that domain's eval -> shadow-compare 7 days ->
bulk-delete the slice's `legacy_paraphrase` detectors". Every word of that assumes the planner is
**serving traffic** by the time the detectors go.

It is not. From `ai-gateway.service.ts`, the planner is invoked after the response is already built:

```ts
// Started AFTER the response is built and the trace is queued, so it can
// add no latency; disabled unless the surface is listed in
// AI_PLANNER_SHADOW_SURFACES; and it can never affect `opts.result`.
this.plannerShadow?.runInBackground({ ... });
```

`AI_PLANNER_SHADOW_SURFACES` is unset (§70), so it does not even observe. There is no execution path
in which the planner routes a live request. All 15 detectors are `wiredInRescue: true` and
`reachableFromProduction: true`, and §69 already established that the deterministic corpus asserts
`rescuedAction` 7,187 times against `action` 57 — for these commands the detector *is* the route.

Deleting them would remove routing for 15 commands and put nothing in its place.

**§88's error was specific and worth naming**: it measured the planner's *accuracy* on the slice, saw
93%, and reported the slice retirement-ready. Accuracy was the precondition §68 defined, and it is
genuinely met — but a component that is 93% accurate and never consulted routes nothing at all. The
gate measured the wrong half of the readiness question, and I did not notice because the number was
the one I had been trying to move for four sections.

### The blast radius is also wider than "delete 15 functions"

The slice detectors are load-bearing for detectors *outside* the slice. `isListTourCalendarWeekPrompt`
alone is imported by `semantic-steal-guard.util.ts` and used as a negative guard inside
`ai-upcoming-tour-departures.util.ts` and `ai-tour-service.util.ts` — eleven non-spec files reference
the four sampled symbols. Removing them changes the behaviour of commands in other domains, so the
"bulk-delete the slice" framing does not describe the actual change.

### What has to happen first

The accuracy work of §84-§88 is not wasted — it is the precondition, and it is now met. What is
missing is the step Phase 8 never wrote down: **give the planner an execution path.**

1. wire `AiCommandPlannerService` into the gateway as a *routing* path, not a post-response
   observer, behind a per-slice flag (`AI_PLANNER_EXECUTE_DOMAINS=tour,guide`), defaulting off;
2. turn it on for `tour`+`guide` and confirm live requests are served by it — the offline replay
   predicts 93%, and this checks the prediction against the running system;
3. only then delete the detectors, and treat the steal-guard and cross-detector references as part of
   the change rather than fallout from it.

Phase 8's exit stays unchecked, and the reason has changed: it is no longer "the planner is not good
enough", it is "the planner is not plugged in".

## §90 — the planner can now route: an execution path behind a per-domain flag

§89 established that no Phase 8 slice could retire its detectors, because the planner had never routed
a live request — it ran after the response was built, behind an unset flag, with a comment saying it
"can never affect `opts.result`". This is the seam that changes.

### Classification, not execution

Phase 8 retires **paraphrase detectors**, which are classifiers. So the planner's job here is to name
the action; §33's executor and the whole handler-dispatch layer are untouched. That keeps the cutover
small, keeps the executor out of a migration it has no part in, and means the change is one flag.

`ai-planner-route.util.ts` holds the decision, purely and with no I/O. A plan may route only when all
five hold:

1. its domain is named in `AI_PLANNER_EXECUTE_DOMAINS` — a comma list, unset meaning **none**, so the
   feature ships off and turns on per slice exactly as Phase 8 is structured;
2. `validatePlan` called it executable — permission, surface, variables and confidence stay owned by
   one place;
3. it has exactly one step — multi-command plans need the executor, and running only the first step
   of a two-step plan would be the dishonest reading;
4. it needs no confirmation — that handshake belongs to the path that already implements it;
5. the command has a legacy alias — the executor dispatches on legacy names.

Every rejection returns a **named reason** into the trace. There is no unexplained skip.

### It competes; it is not privileged

The stage emits an `IntentCandidate` with `source: 'planner'` and then gets out of the way. The
candidate goes through the same rerank, steal-guard, self-verify and structural-enrich stages as
every other source.

The confidence is the plan's own and is deliberately **not** boosted. If the planner cannot outrank a
paraphrase detector on its own number, that is the finding — it says the slice is not ready — and
inflating it here would suppress exactly the signal Phase 8 exists to collect.

### Failure is always today's behaviour

Flag unset, planner not injected, planner throws, planner times out, plan declined, plan rejected by
any of the five conditions — every one of these leaves the candidate list untouched and the detector
path decides. **This can add a route; it can never remove one.** That is what makes turning the flag
on a reversible act rather than a cutover.

`planner` is a new `PipelineStage`, but deliberately **not** in
`PIPELINE_UNDERSTAND_STAGE_ORDER`: that list is the flow every request must follow, and putting an
opt-in stage in it would make the default configuration fail its own contract.

### Verification

- Gates **3,821 across 19**, 0 failures — the new suite was added to `test:ai-command-planner`,
  because 15 passing tests outside the chain protect nothing.
- 15 tests on the decision util: the default-off behaviour, each of the five rejections by name, the
  legacy-alias mapping, that variables are copied rather than aliased, and that every rejection
  carries a reason.
- Two `command-understanding` integration tests fail; both were already in `ai-known-failures.json`
  before this change, and semantic actions come from the anchor bank rather than registry surfaces,
  so §84 could not have caused them either.

### What is still not done

The flag has never been switched on. §88's 93%/100% is an *offline replay* prediction; step 2 is
enabling `AI_PLANNER_EXECUTE_DOMAINS=tour,guide` against the running system and checking the
prediction holds — including whether the planner's own confidence actually wins the rerank, which
this design intentionally does not guarantee. Only after that does deleting the 15 detectors become
the mechanical step Phase 8 describes, and even then the steal-guard and cross-detector references
(§89) are part of that change rather than fallout from it.

## §91 — the seam works, and it must not be switched on yet

§90 built the planner's routing seam and left step 2: turn on
`AI_PLANNER_EXECUTE_DOMAINS=tour,guide` and check the 93% the offline replay predicted. Traffic
stopped 2026-08-03, so "against the running system" means replaying the stored corpus through the
**real** decision path — `decidePlannerRoute` and `mergeAndRerankIntentCandidates` — rather than the
bespoke harness §88 used.

### The mechanism holds

| | |
|---|---|
| planner produced a routable plan | 41/45 (91%) |
| planner won the rerank | 33/41 (80%) |
| won **and** matched the recorded action | 32 |

The rerank sorts on confidence alone, and the planner candidate is pushed before the classifier's, so
ties go to the planner under a stable sort. §90's decision not to boost confidence is vindicated as a
*measurement* choice: the planner wins on its own number four times in five, and the five losses are
all cases where it and the classifier **agree anyway**.

### And it should still not be enabled

The corpus's `action` column is *what today's system produced*. Measuring the planner against it means
the planner can at best tie; every disagreement is a regression by construction. Scored that way,
turning the flag on today gives:

| | |
|---|---|
| gains over today | **0** |
| regressions | **1 in 45** — `list_upcoming_departures`@1.0 beating `list_tour_calendar_week`@0.9 |

That is the §88 confusion again, now with the planner's overconfidence deciding it.

**Enabling the planner in front of working detectors is all downside.** Its value is not better routing
— it is routing that survives the detectors being deleted. The comparison that matters is
planner-versus-no-detectors, and no measurement in this programme has made it, because the corpus
cannot: every label in it was produced by the system being replaced.

### §89 overstated the risk, and the real number matters

§89 said "for these commands the detector *is* the route", citing §69's finding that the eval corpus
asserts `rescuedAction` 7,187 times against `action` 57. That is a fact about the **eval corpus**, and
generalising it to production was wrong. The traces say:

| | traces | share |
|---|---|---|
| classifier routed it directly | 134 | **80%** |
| `action_changed_by = 'rescue'` | 34 | **20%** |

So deleting the 15 detectors puts **34 of 168 slice requests** at risk, not all of them. §89's
conclusion — do not delete yet — stands; its magnitude was wrong by a factor of five, and the
corrected number is what makes the next step tractable.

### The actual next step, restated

Those 34 rescue-dependent traces are the whole question. The experiment worth running is narrow:
replay **only** those 34 with the detectors disabled and the planner routing, and see how many it
recovers. That is planner-versus-no-detectors on precisely the traffic that depends on the answer,
and it is a much smaller and more honest question than the 45-prompt slice accuracy this programme
has been circling since §68.

### One thing the seam gets wrong

Three of the four no-routes were `not_single_step`: for "Summarize last week's tour departures on the
provider calendar" the planner emitted a **two-step** plan, which §90's rule rejects. That rule is
right for now — the executor is out of scope — but it means multi-command messages, the headline
capability of Phase 3, cannot route through this seam at all. Worth naming rather than leaving as an
unexplained 7% of rejections.

## §92 — the first non-circular measurement: the planner recovers 33 of 34

§91 established that every accuracy number in §68-§91 was circular — scored against
`ai_command_trace.action`, which is what the system being replaced produced — and named the one
question the corpus *can* answer: of the traces the detectors actually decided, how many does the
planner recover without them?

`action_changed_by = 'rescue'` isolates exactly those: the classifier produced `classified_action`, a
paraphrase detector overrode it, and `action` is what shipped. Delete the detectors and, absent the
planner, every one of these falls back to the classifier's rejected answer.

### Result

34 traces, 11 distinct prompts. For each: run the planner, apply `decidePlannerRoute`, and rerank it
against the **classifier's own** candidate — the competition it would actually face once the detectors
are gone.

| | prompts | traces |
|---|---|---|
| **recovered** | **10/11 (90.9%)** | **33/34 (97.1%)** |
| lost — no route | 0 | 0 |
| lost — lost the rerank | 0 | 0 |
| lost — wrong command | 1 | 1 |

The planner routed **every** one and won the rerank **every** time. The single loss is "List tour
departures next week" going to `tour.list_upcoming_departures` — the confusion §88 documented and
deliberately left alone, because the accurate description that fixes it regressed everything else. It
accounts for one trace.

### What the retirement now costs

The slice is 168 traces. 134 (80%) were routed by the classifier alone and are untouched by deleting
detectors. 34 depended on rescue.

| | cost |
|---|---|
| delete the 15 detectors, planner **off** | **34 traces (20.2%)** |
| delete the 15 detectors, planner **on** | **1 trace (0.6%)** |

That is the number this programme has been trying to produce since §68, and it is the first one not
scored against the system under replacement.

### It only works as one change

§91 measured enabling the planner *in front of working detectors*: 0 gains, 1 regression in 45. That
result stands and is not in tension with this one. Enabling the planner alone is pure downside;
deleting the detectors alone costs 20%; doing both together costs 0.6%. The two halves are a single
operation and sequencing them apart makes both worse.

### Ready, with the cost stated

Precondition, evidence:

- accuracy — 93% held-in, 100% held-out (§88);
- an execution path — built and gated off (§90);
- the planner wins the rerank on its own confidence — 33/41 generally, 11/11 on the at-risk set (§91, §92);
- replacement measured on the traffic that depends on it — **97.1%** (this section).

Remaining work is the deletion itself, and §89's blast radius is part of it rather than fallout: the
slice detectors are imported by `semantic-steal-guard.util.ts` and used as negative guards inside
`ai-upcoming-tour-departures.util.ts` and `ai-tour-service.util.ts`, so eleven non-spec files change.

Expected cost, stated plainly before the fact: **one trace in 168, the "List tour departures next
week" phrasing.**

## §93 — slice 1 retired: `tour` and `guide` are the planner's

The first Phase 8 slice is done. `tour` and `guide` are routed by the planner, and rescue can no
longer change their action.

### What "delete the detectors" turned out to mean

The plan was to delete 15 `legacy_paraphrase` functions. Enumerating the references first — the same
check that saved §89 — found **128 references across 31 files**, and most are not the slice's own:
`ai-confirm-my-booking-details.util.ts` (8), `ai-list-my-upcoming-appointments.util.ts` (6),
`ai-explain-preparation-notes.util.ts` (6), `ai-add-booking-to-calendar.util.ts`,
`ai-book-another-service.util.ts` and a dozen more use the slice's predicates as **negative guards** —
"if this looks like a tour-calendar prompt, don't fire".

Deleting those predicates deletes the guards, and every one of those non-slice detectors would start
competing for tour/guide prompts. **§92 did not measure that.** Its model was planner versus
classifier, which is exactly the world where the guards still stand. Ripping them out and citing a
0.6% cost measured under different conditions would have been the same error as §88 — a number
carried past the configuration it was taken in.

### So the retirement is the lock, not the delete

§67 already built the mechanism and said why it was empty:

> The list is empty because flipping this on globally would be wrong *now*: the planner is still
> shadow-only (§19), so rescue is currently compensating for classifier mistakes as well as causing
> them.

That premise is now false for these two domains, and only these two. Adding them to
`RESCUE_ACTION_LOCKED_DOMAINS` means rescue may not alter the action in `tour` or `guide` at all —
which is precisely Phase 8's exit condition, applied to one slice. The detectors keep working as
guards for other commands and lose the only power Phase 8 objects to.

§67's own comment cites `list_upcoming_tour_departures -> list_tour_calendar_week` at 34 occurrences
as the read→read steal it wanted to stop. Those are the same 34 traces §92 measured. The lock stops
them; the planner replaces them, 33 of 34.

### Routing is coupled to the lock in code, not in config

`RETIRED_DETECTOR_DOMAINS` is a constant, unioned into `plannerExecuteDomains()` and **not** gated by
`AI_PLANNER_EXECUTE_DOMAINS`. Once a slice's detectors stop routing, making the replacement depend on
an environment variable would mean a missing variable silently costs that slice its traffic. A test
asserts the two lists are equal, so a domain can never be locked without being routable or routed
without being locked.

### State

| | |
|---|---|
| domains locked | **2 of 16** (`tour`, `guide`) |
| grandfathered mutating rescues | 0 — unchanged since §67 |
| slice traffic now planner-routed | 168 traces |
| measured cost | 1 trace ("List tour departures next week") |
| gates | **3,824, 0 failures** |

Phase 8's box stays unchecked, and the remaining work is now two clearly separate things:

1. **fourteen more slices**, each needing its own §92 measurement before it joins the list. The method
   is established and the harness is a day's work per slice;
2. **the physical deletion**, which is blocked by the guard usage above. "Zero `legacy_paraphrase`
   remaining" cannot be reached by deleting these functions while non-slice detectors depend on them
   for disambiguation — those call sites have to migrate first. That is a real, unbudgeted piece of
   work this section is the first to name.

## §94 — slice 1 was the exception, not the template

§93 ended by describing the remaining work as "fourteen more slices, each needing its own §92
measurement... a day's work per slice". That estimate assumed slice 1 was representative. It is not.

The measurement is one query and one pass — 121 distinct rescue-dependent prompts, 216 traces, every
domain permitted — so all fourteen were answered at once rather than sequentially.

### Recovery on rescue-dependent traffic, by domain

| domain | prompts | traces | recovered | no route | wrong |
|---|---|---|---|---|---|
| **tour** | 11 | 34 | **97% (33/34)** | 0 | 1 |
| push | 6 | 18 | 83% (15/18) | 1 | 0 |
| commerce | 7 | 11 | 18% | 6 | 0 |
| catalog | 22 | 22 | 9% | **20** | 0 |
| booking | 22 | 34 | 6% | **16** | 2 |
| operations | 17 | 30 | 3% | 9 | 6 |
| business | 7 | 14 | 0% | 4 | 2 |
| clinic | 6 | 23 | 0% | 6 | 0 |
| customer | 9 | 11 | 0% | 4 | 5 |
| marketing | 6 | 8 | 0% | 5 | 1 |
| payment | 6 | 8 | 0% | 4 | 2 |
| guide | 1 | 2 | 0% | 0 | 1 |
| compliance | 1 | 1 | 0% | 1 | 0 |
| **total** | **121** | **216** | **25.5%** | 76 | 20 |

**One domain clears the bar.** `push` at 83% is within reach; the other twelve are between 0% and 18%.

The dominant failure is `no route` — 76 of 121 — not wrong answers. Catalog is the extreme: 20 of 22
prompts produce no routable plan at all. That is the §85/§86 story again (retrieval and decoding),
now visible per-domain instead of averaged away.

### What this costs the plan

Phase 8 assumed six slices of comparable difficulty. The evidence says slice 1 succeeded because
`tour` is a small, lexically distinctive domain whose confusions were two commands deep — and because
§84-§88 spent four sections fixing *its* retrieval specifically, including Armenian examples and a
cache rebuild that helped `tour` and nothing else.

Repeating that per domain is not a day each. The honest read: **the remaining thirteen domains are
blocked on the same planner-coverage work, and doing it once globally is the only version that
scales.** Sequential per-slice tuning would be twelve more §82s.

### Correction to §93

§93 locked `tour` **and** `guide` on evidence that combined them. Broken out, `guide` has exactly one
rescue-dependent prompt — "Where are the biggest gaps in my schedule this week?", classified
`list_schedule_gaps`, rescued to `guide_user_flow`, 2 traces — and the planner does not reproduce
`guide_user_flow`.

Scored against the corpus that is a 0% recovery. Read directly, it is rescue replacing a specific,
plausible answer with a generic product-guide fallback: precisely the read→read steal §67 built this
lock to stop. **`guide` stays locked**, and the measured cost of §93 is 3 traces rather than 1 —
1 in `tour` and 2 here, of which these 2 are arguably an improvement.

The general lesson is the one §91 already named and §93 still tripped on: a domain-wide lock justified
by a detector-slice measurement covers commands the measurement never saw. Evidence has to be scoped
the same way the change is.

### Next

Not slice 2. The next useful work is planner coverage across all domains — the 76 no-routes — because
that single number gates thirteen of the fourteen remaining slices.

## §95 — the 76 no-routes are three separate problems, and one of them is not Phase 8's

§94 left a single number gating thirteen slices: 76 of 121 rescue-dependent prompts produce no route.
`decidePlannerRoute` already names every rejection, so decomposing it is one pass.

### Cause, per prompt

| cause | prompts | traces |
|---|---|---|
| **rejected: `not_executable`** | **46** | 59 |
| ROUTED correct | 22 | 55 |
| ROUTED wrong command | 22 | 36 |
| declined — truth **missing** from shortlist | 17 | 43 |
| rejected: `needs_confirmation` | 6 | 6 |
| declined — truth **was** in shortlist | 5 | 12 |
| rejected: `not_single_step` | 3 | 5 |

Validation codes behind the 46 `not_executable`:

| code | count |
|---|---|
| `unresolved_notes` | 24 |
| `invalid_variables` | 23 |
| `low_confidence` | 21 |
| `missing_variables` / `unknown_variables` | 6 |
| `unknown_command` | 2 |

### The composition of slice 1 explains everything

| | risk tiers | variables |
|---|---|---|
| **tour slice** (retired, 97%) | **T0 only** | **none** |
| whole rescue-dependent corpus | T0 60, T1 44, T2 14, T3 3 | 35 of 121 take variables |

Slice 1 was the easiest slice that exists: read-only, parameterless, lexically distinctive. Half the
remaining corpus mutates, and the failures say exactly that — the examples are
`Создай категорию каталога с названием QA312RUP-178`, `Add a new catalog category named QA Nails`,
`Delete service QA Test Trim`. The planner names the command and cannot fill its variables legally.

### So this is three problems, not one

1. **Retrieval — 54 of 121 (45%) have the truth missing from the shortlist**, and 39 of the failures
   are in that group. §86 fixed this for `tour` by adding real traffic phrasings and rebuilding the
   embedding cache. The mechanism is proven and mechanical; nobody has run it for the other twelve
   domains. **Highest value, lowest risk, and it is Phase 8 work.**

2. **Variable quality — `invalid_variables` 23, plus 6 more missing/unknown.** The planner picks the
   right command and produces values its own schema rejects. That is the **Phase 4 resolution layer**,
   not detector retirement. Phase 8 cannot retire a mutating command's detector until this is good,
   and no amount of classification work will move it.

3. **`low_confidence` 21** — the planner is under threshold on prompts it otherwise handles. Worth a
   look on its own; possibly a threshold calibrated against a different pipeline.

### What this means for the plan

Phase 8's six-slice structure assumed the difficulty was uniform. It is not: **retiring detectors for
read-only commands is nearly a solved problem, and retiring them for mutating commands is blocked on
Phase 4.** The roadmap has these as sequential phases with Phase 4 marked complete, and this is the
first evidence that its resolution quality is what gates Phase 8's back half.

A more honest slicing is by risk tier rather than by domain: the T0 commands across all thirteen
remaining domains are one tractable slice, and the mutating ones are a Phase 4 dependency.

### Next

Run §86's fix corpus-wide — real traffic phrasings into specs for the twelve unfixed domains, then
`build:ai-embeddings`. It addresses the largest single bucket, the method is established, and
`e2e-bug.390`'s missing cache-staleness gate should land with it so it cannot silently rot again.

## §96 — the cache gate lands; the corpus-wide retrieval fix does not replicate §86

Two pieces of `e2e-bug.396` and `e2e-bug.390`: stop the embedding cache going stale, then run §86's
retrieval fix across the domains it was never applied to.

### The staleness gate

`commandMatchTextHash` fingerprints every description and example, the build writes it into the cache,
and `ai-command-embeddings.staleness.spec.ts` asserts it matches the live specs. Editing a spec
without rebuilding now fails by name with the fix in the message, instead of silently ranking against
text that no longer exists.

It caught its first stale cache immediately — the committed one, which predated the field.

Five tests, including two that guard the guard: the hash must change when any example changes, and
must not depend on declaration order. A fingerprint that ignored examples would pass everything and
protect nothing. Added to `test:ai-command-spec` so the chain covers it.

### The retrieval fix, and why it stopped short

Mining examples from traffic needs a provenance filter, and the first pass proved it. Taking the most
frequent prompts per failing command offered `customer.my_subscriptions` the phrasing **"cancel my
subscription"** and `booking.check_multi_service_availability` a question about checkout fields. Those
labels came from rescue — the layer being replaced — so mining them teaches the specs the detector's
opinion, including its mistakes.

Restricting the source to prompts where `action_changed_by IS NULL`, `outcome = 'executed'` and
`confidence >= 0.9`, and excluding compound prompts, cut 25 candidate commands to 13 clean ones. Two
more were rejected on reading: the "which lab tests require fasting" phrasings offered to
`clinic.explain_services` belong to `booking.explain_lab_prep`.

| | |
|---|---|
| commands with a retrieval gap | 34 → **29** |
| prompts whose truth misses the shortlist | 54/121 → **48/121** |
| truth-in-shortlist | 55% → **60%** |

**That is a sixth of what §86 achieved for `tour`, and the reason is structural.** `tour`'s gain came
from four commands carrying 121 of 168 traces — a concentrated head. The rest of the corpus is a long
tail: 29 commands, each worth one or two prompts, and only 13 had clean example data at all. There is
no corpus-wide version of §86 because there is no corpus-wide concentration to exploit.

The mechanism is confirmed and the ceiling is now known. Retrieval is not going to reach `tour`'s 98%
by mining examples; the remaining 48 need either much more traffic per command or a different
retrieval approach.

### A raised ratchet, stated

`UNCOVERED_EXAMPLE_BASELINE` went 8 → 9. The new entry is `catalog.list_packages: "What packages do I
currently offer?"` — real traffic, classifier-confident, executed, never rescued — and its own
detector does not match it.

The gap is not new; only its documentation is. The phrasing was already reaching `list_packages`
through the classifier while the detector missed it, and a sibling phrasing was already on the list
for the same reason. Not adding the example would have held the number at 8 by leaving a known gap
undocumented, which is the opposite of what the ratchet is for. It comes back down when `catalog`
joins `RESCUE_ACTION_LOCKED_DOMAINS`.

### Verification

- Gates **3,829 across 19**, 0 failures. Cache rebuilt; the gate now enforces that it stays current.

## §97 — a lexical bonus for the long tail

§96 found example-mining exhausted: 29 commands still miss the shortlist, one or two prompts each,
with no concentration left to exploit. What that tail does have is a **name** — "packages", "promo
code", "employee", "currency" — sitting verbatim in the prompt, which is the signal a 256-dimension
embedding averages away.

`lexicalIdentityScore` measures how much of a command's identity (its id and description, not its
examples) the message says out loud, and `narrowShortlist` adds it to the cosine as a bonus.

### Additive, and that is the whole safety argument

A command sharing no words with the message scores 0 and keeps its cosine exactly. That matters
because it describes **every non-Latin prompt in the corpus** — §48's trilingual finding means
Armenian and Russian traffic has zero lexical overlap with an English description, and a
multiplicative or rank-fusion scheme would have punished it for that. A test pins the Armenian case
directly.

Scored against id + description rather than examples, so one well-worded example cannot dominate the
identity of the command it belongs to.

### Choosing the weight against the evidence

| weight | truth in shortlist | gained | lost |
|---|---|---|---|
| 0 (cosine only) | 73/121 | — | — |
| **0.25** | **76** | **+3** | **0** |
| 0.5 | 77 | +5 | **1** |
| 0.75 | 77 | | |
| 1.0 | 76 | | |
| 1.5 | 75 | | |

**0.25, not the higher-scoring 0.5.** 0.5 finds one more command on net and does it by breaking a
prompt that previously worked. This file's own second invariant is that *losing the right command is
worse than keeping a wrong one*, and a strictly monotone improvement beats one point of net gain
bought with a regression — particularly a regression that would be invisible in the aggregate.

Past 1.0 the curve falls, which is the expected shape: a keyword collision starts outranking a
genuine semantic match.

### Where retrieval now stands

| | truth in shortlist |
|---|---|
| before §96 | 67/121 (55%) |
| after example mining (§96) | 73/121 (60%) |
| **after the lexical bonus** | **76/121 (63%)** |

Two sections, +9 prompts, no regressions. Honest framing: this is incremental, and it is not going to
reach `tour`'s 98% — that number came from a concentrated head this corpus does not have elsewhere.
The remaining 45 are the genuinely hard tail.

### Verification

- Gates **3,837 across 19**, 0 failures. 8 unit tests on the scorer, including the non-Latin
  zero-overlap case and a bound asserting the bonus stays smaller than the cosine gap it must not
  dominate.
- Wired into `AiCommandPlannerService`; callers that omit the message rank on cosine alone, exactly
  as before.

## §98 — the planner was never told what shape a variable is

`e2e-bug.397` had 23 `invalid_variables` rejections blocking Phase 8's mutating half, filed as a
Phase 4 resolution-quality problem. It was not. Recording the declared type next to the produced value
made the cause obvious in one pass:

```
catalog.create_with_services.catalogDraft  declared=object required
  got="create a category QA312RUP-1785624173 with two services..."   x18
catalog.assign_services_category_bulk.serviceNames declared=string[] got="beard trim"   x6
catalog.create_package.price declared=number got="80"                                   x1
```

The shortlist rendered variables as **bare names**: `required: catalogDraft`. Nothing said it was an
object, that `serviceNames` was an array, or that `price` was a number. The schema was in the spec the
whole time and was simply never shown. Asked for a value with no type, the model answered with the
only thing it had — a restatement of the request.

### Two rounds, because the first exposed the second

Rendering one level deep eliminated **every** type mismatch immediately, and the failures moved a
layer down: told `catalogDraft` was `{ categoryName: string, services: object[] }`, the model produced
exactly that and left every field inside `services[]` empty. 28 type errors became 72 missing nested
fields — a worse number describing better behaviour.

Recursive rendering, capped at depth 3, closed it:

| | rejections |
|---|---|
| bare names | 28 |
| one level deep | 72 (all nested-missing) |
| **recursive** | **4** |

All four survivors are `missing:` with a resolver — `appointment`, `datetime`, `customer` — on prompts
that genuinely omit the information. The planner declining to invent an appointment id is the correct
behaviour, and Phase 6 clarify is what should ask.

### The end-to-end number moved much less

| | |
|---|---|
| variable rejections | 28 → **4** |
| no-route prompts | 76 → 68 |
| wrong command | 20 → **23** |
| **traces recovered** | 25.5% → **27.8%** |

Two and a half points for a fix that eliminated its target category entirely. Worth stating plainly:
§95 measured three overlapping causes inside the 46 `not_executable` rejections — `unresolved_notes`
24, `invalid_variables` 23, `low_confidence` 21 — and clearing one leaves the other two holding the
same prompts. Wrong-command rose because prompts that used to fail on variables now route far enough
to be wrong, which is the honest direction.

### The correction that matters

**`e2e-bug.397` was filed as a Phase 4 dependency and it was a prompt-rendering bug.** The reasoning
that got it wrong is worth naming: the evidence was "the planner produces values its own schema
rejects", and the inference was that value production is the resolution layer's job. That inference
skipped a step — checking whether the planner had been told what to produce. It had not.

Phase 4 may still gate Phase 8's mutating half; that is now an open question rather than a measured
finding, and §95's claim to have measured it is withdrawn.

### Verification

- Gates **3,846 across 19**, 0 failures. 9 tests on the hint renderer, including the depth cap and a
  guard asserting no `required:` line in the generated prompt is ever a bare name again — the exact
  regression this was.
- One existing assertion updated from `required: appointmentId, newStart` to the typed form; its
  stated intent, "so the model knows what to fill", is what this change serves.

## §99 — a second contract literal, and the deadlock the specs built

§98 left two buckets: `unresolved_notes` 24 and `low_confidence` 21. They turn out to be a trivial
bug and an architectural one.

### `low_confidence` was `"confidence": 0.0-1.0`

Capturing the actual values: **14 of 18 sub-threshold steps were exactly `0`**. That is not a model
expressing doubt.

`PLAN_OUTPUT_CONTRACT` showed `"confidence": 0.0-1.0` — which is not valid JSON and not a value. The
model emitted `0`. `coerceConfidence` also defaults a missing field to 0 "so an unreadable confidence
cannot let a mutating step through", which is right, and meant the two cases were indistinguishable.

Replacing the range notation with a concrete `0.9` and one sentence — *"a number between 0 and 1 —
how sure you are this step is what the user asked for. Always include it."*:

| | |
|---|---|
| steps below the 0.6 gate | 18 → **8** |
| steps at exactly 0 | 14 → **0** |
| defaulted by the decoder | 0 → **0** |

The remaining 8 are genuine self-reported uncertainty, which is the gate working.

**This is the third contract-literal bug in the same string** — §88's `id`/`command` collision, and now
this. The pattern is worth naming: `PLAN_OUTPUT_CONTRACT` is prose pretending to be JSON, and every
place it deviates from a literal example has cost real accuracy. Anything in it that is not a value
the model could copy is a defect waiting to be measured.

### `unresolved_notes` is a deadlock the specs create

The notes are not vague. They say:

```
"No specific appointment ID provided to reschedule."
"The appointment ID for Karo Mazmanyan's appointment on 5 June is not..."
"Specific time for 'tomorrow afternoon' is not defined."
```

`appointment.reschedule` declares `appointmentId` as **required**, with `resolver: 'appointment'` —
the spec already knows a resolver is supposed to supply it. But the planner is shown only
`appointmentId (string)`, and rule 4 tells it *"Do not guess names, dates, prices or ids."*

So the prompt asks for an id, forbids inventing one, and never mentions that something downstream
exists to find it. The planner does the only correct thing available and refuses. **The deadlock is
built into what the specs render, not into the model.**

`resolver` appears **zero times** in the generated prompt.

The fix is a seam, not a tweak: for a variable with a resolver, the planner should supply the human
reference it heard — "Karo Mazmanyan's appointment on 5 June at 9:50" — and Phase 4's resolution layer
should turn that into an id. That is what `EntityResolutionService` exists for, and the planner has
never been told it can hand off to it.

### On §98's withdrawal

§98 withdrew §95's claim that Phase 4 gates Phase 8's mutating half, because that claim came from an
inference — "the planner produces values its schema rejects, so value production is the problem" —
that skipped checking whether the planner had been *told* what to produce.

The claim now returns on direct evidence, and with a different mechanism than either earlier version:
not that resolution is low quality, but that **the planner and the resolver have never been
connected**. Filed as `e2e-bug.399`.

### Verification

- Gates **3,846 across 19**, 0 failures.

## §100 — permissions decide from the spec, not from silence

`e2e-bug.356`: the dashboard and provider gates were pure deny-lists —
`return !DASHBOARD_DENIED_BY_TIER[tier].has(action)` — so **a command absent from the list was
permitted**. Every command added after the list was written became available to every tier by
default, and nothing enumerated them, so the set could not be reviewed.

`CommandSpec.tiers` fails closed by construction (§23). The port is complete (696/696, §66). So the
gate can read it.

### Measured before touching anything

| surface/tier | spec agrees | spec would deny | **no spec** |
|---|---:|---:|---:|
| dashboard/client | 0 | **265** | **0** |
| dashboard/staff | 234 | 0 | **0** |
| dashboard/manager | 386 | 0 | **0** |
| dashboard/owner | 388 | 0 | **0** |
| provider (all tiers) | 557 | 0 | **0** |

**`no spec` is zero across the board**, which is what makes this a switch rather than a migration:
every registry command already carries an explicit decision. The deny-list fallback is retained for
actions no spec covers — pipeline pseudo-actions like `compound_intent` are not registry commands and
must keep working.

### One behavioural delta, and it is a tightening

`dashboard/client` went from **265 commands allowed to 0** (plus the `unknown` passthrough). Those
265 were reachable only because `AiGatewayService` separately refuses `client` on the dashboard
outright — defence in depth that was **load-bearing rather than redundant**, exactly as the ticket
warned. It is now redundant, which is what defence in depth is supposed to be.

Every other tier and surface is unchanged, by measurement rather than by assertion.

### What actually changed for the future

The 234 staff commands are still allowed. This does not review them — §356 was explicit that they
should be reviewed as domains land, not migrated wholesale. What changes is that they are now allowed
**because a spec says so**, in one greppable place, instead of because nobody wrote them down. And a
command added tomorrow with no tier entry is denied rather than granted.

### A ratchet moved the right way

`ai-command-spec.conformance.spec.ts` pins where the registry's dead flat `tiers` list disagrees with
the running gate. That list had only ever grown — §56 added 18, §57 added 42. It fell **400 → 167**,
because the gate now answers from the specs. The comment claiming it grows monotonically was wrong and
has been corrected: it measures how much of the runtime still answers to the dead model, so it moves
whichever way that does.

### Verification

- Gates **3,852 across 19**, 0 failures. 6 regression tests, added to `test:ai-permissions`.
- One asserts an equivalence rather than an example: for every specced dashboard command and every
  tier, the gate's answer **is** the spec's answer. The example-based version of that test was
  unwritable — no dashboard command exists where the spec denies staff and the deny-list allows it,
  because the specs were conformed to the gate during the port. The equivalence says the intended
  thing without depending on such a command existing.

## §101 — profiling the AI sweep: the predicted fix was wrong, and 27% is one corpus run twice

`e2e-bug.359` blames the AI sweep's runtime for Phase 2's "red means red" never being done, and lists
three fix directions. The first — *"enable `ts-jest` `isolatedModules` / swc transform — typically the
single largest win"* — was stated without measurement. It is wrong here.

### The transform is not the bottleneck

Same 111-suite sample, cache controlled:

| | warm | cold |
|---|---|---|
| plain `ts-jest` | 25s | **49s** |
| `isolatedModules: true` | **21s** | 55s |

Faster warm, slower cold, and the first comparison was junk because changing the transform invalidates
the ts-jest cache — the "before" run was warm and the "after" run was cold. Within noise either way.
Reverted; the config is unchanged.

Worth stating why the prediction failed: `isolatedModules` removes cross-file type-checking, and this
repo already carries ~1,100 unresolved `tsc` errors in `modules/ai`, so type-checking during tests was
never doing much work that a clean build would.

### What the cost actually is

Profiling all 1,033 non-integration AI suites:

| | |
|---|---|
| total worker time | **3,078s** (~51 min CPU, ~6 min wall at 9 workers) |
| failed suites | 66 |

| suite | time | share |
|---|---:|---:|
| `ai-command-eval.spec.ts` | **355s** | 11.5% |
| `ai-command-eval.accuracy-gate.spec.ts` | **282s** | 9.2% |
| `ai-command-eval.cases.spec.ts` | 134s | 4.3% |
| `ai-command-eval.spec-coverage.spec.ts` | 58s | 1.9% |
| **those four** | **829s** | **27%** |
| top 20 suites | 1,210s | 39% |

The ticket's *third* direction — "a handful usually dominate" — is the correct one, and it was listed
last.

### The top two run the same corpus twice

- `ai-command-eval.spec.ts` calls `runDeterministicEvalSuite(AI_COMMAND_EVAL_DETERMINISTIC_CASES)`;
- `ai-command-eval.accuracy-gate.spec.ts` calls `runAiAccuracyGate({ cases: ... })`, and
  `buildDeterministicAccuracyReport` calls **`runDeterministicEvalSuite`** on the same 8,509 cases.

Two jest processes, one corpus, evaluated twice: **637s of worker time, 21% of the whole AI sweep**,
to compute the same results and assert different things about them.

This is not a micro-optimisation. It is the single largest identified cost in the suite, and it exists
because the two gates were written independently — §25 built the accuracy baseline, the harness
predates it, and nothing ever compared their cost.

### Not fixed here, deliberately

Merging them means touching the two most load-bearing gates in this programme at the end of a long
session. The saving is real but the risk of subtly changing what the accuracy gate asserts is worse
than the 637s. Filed as `e2e-bug.400` with the measurement attached, which is the part that was
missing.

`e2e-bug.359` stays open with its diagnosis corrected: the cost is concentrated, not diffuse, and the
transform is not where it lives.

## §102 — the sweep's most expensive suite existed only to fail

`e2e-bug.400` framed §101's finding as two suites duplicating a corpus run. Investigating it found
something worse and simpler.

### Correcting §101 first

§101 said "the same 8,509 cases". Wrong twice over, and the correction matters:

- `runDeterministicEvalSuite` **already filters `requiresLlm` internally** (line 2438), so
  `buildDeterministicAccuracyReport`'s own `cases.filter(c => !c.requiresLlm)` is redundant;
- both paths therefore evaluate **8,464** cases, not 8,509. 45 are LLM-only.

The substance held — one corpus, run twice — but the number was wrong and the reason the sets matched
was not the one I gave.

### The contradiction that exposed it

Two assertions over that identical corpus, both passing in their own runs:

```ts
// ai-command-eval.spec.ts
expect(summary.failed).toBe(0);
// ai-command-eval.accuracy-gate.spec.ts
expect(report.failed).toBeGreaterThan(0);   // "recorded, not fatal"
```

Measured directly: **both produce `failed = 404` over 8,464 cases.** So the harness assertion cannot
pass, and does not — `ai-command-eval.spec.ts` has been **permanently red**.

`e2e-bug.358` established the 404 known failures and fixed the *gate* to ratchet the debt instead of
failing on it. This assertion was never updated. It is not in the gate chain, so nothing surfaced it.

### What that suite was costing

**355s — 11.5% of the entire AI test sweep** — re-running a corpus the accuracy gate already runs, in
its own process, to fail on a number the gate deliberately tolerates. It is also two of the 112
failures that make `e2e-bug.351`'s "red means red" unachievable.

Deleted, and the suite drops **355s → 15s**.

### Deleting it loses no coverage

The gate asserts strictly more over the same 8,464 cases: the corpus run, plus a committed baseline
comparison, plus per-intent regression detection via `evaluateAccuracyRatchet`. A pass/fail assertion
that *cannot pass* was never protecting anything — it was noise that made the real gate harder to see.

### Result

| | before | after |
|---|---|---|
| `ai-command-eval.spec.ts` | 355s, permanently red | **15s, 1 pre-existing failure** |
| AI sweep worker time | 3,078s | **~2,723s (-11.5%)** |
| accuracy gate | unchanged, 116s | unchanged, 116s, still reports 404 |

The remaining failure in that file — "maps every compound decomposition scenario to an eval case" — is
unrelated and pre-existing.

### Verification

- Gates **3,852 across 19**, 0 failures. `test:ai-accuracy` green, still reporting the 404 debt and
  its ratchet.

## §103 — "red means red" is 7 tests away, and one of them was mine

`e2e-bug.351` has been open since 2026-08-04 on the strength of "54 suites / 112 tests fail on a clean
tree". With the sweep now profileable (§101) and 355s lighter (§102), that number is worth re-taking
rather than inheriting.

### The quarantine has almost caught up

Across all 1,033 non-integration AI suites:

| | |
|---|---|
| failing suites | 66 |
| failing tests | **318** |
| already in `ai-known-failures.json` | **311** |
| **not quarantined** | **7** |

The ticket's framing — "fix or explicitly quarantine each failing suite" — is 98% done. What remains
is seven tests, not a category.

### One of the seven was a regression I introduced in §100

`access-control.matrix.spec.ts` failed on:

```ts
for (const action of STAFF_DENIED_CRM_REVENUE_FINANCE_INTENTS) {
  expect(isDashboardIntentAllowed('manager', action)).toBe(true);
}
```

`gift_card_balance` is in that list, and resolves to `customer.gift_card_balance` — a spec declaring
`surfaces: ['customer', 'public']` and **no dashboard**. §100's spec-driven gate therefore denies it
on the dashboard for every tier, where the deny-list had allowed manager and owner.

Checked against production before deciding which side was wrong: `gift_card_balance` has **one**
dashboard trace, and it **failed**. The spec and the registry agree it is a customer command. So the
new denial is correct and the assertion was encoding the default-allow bug §356 removed — it conflated
"not blocked by the staff deny-list" with "available on the dashboard".

Fixed by skipping actions whose spec declares no dashboard surface, with the reasoning in the test.

**The process failure is the interesting part.** §100 ran the full gate chain, saw 3,852 green, and
shipped. `access-control.matrix.spec.ts` — the spec file for the very module §100 changed — is not in
that chain. A gate chain that omits the tests for the file being edited is not a gate. It is now in
`test:ai-permissions`.

### The remaining six

Pre-existing, all narrow: three in `ai-e2e279-facial-catalog-synonym`, one each in
`ai-e2e199-haircut-hairstyle-synonym`, `ai-business-tax-multilingual`, and
`ai-reschedule-package-lines.logic`. Two synonym-expansion suites, one Armenian tax rescue, one
package-visit time-of-day preservation. None are infrastructure; each is a small correctness question.

That is what stands between this repo and a blocking AI gate.

### Verification

- Gates **3,867 across 19**, 0 failures — up 15 from adding `access-control.matrix` to the chain.

## §104 — red means red: the gate passes, and §103's count was my own measurement bug

§103 reported 7 unquarantined failures. Six of them were not real.

### The bug in my own measurement

I compared each failing test's name against the manifest with
`fullName in json.dumps(manifest)`. `json.dumps` escapes non-ASCII by default, so the manifest string
contained `\u2192` and `\u2194` where the test names contain **→** and **↔**. Every quarantined test
whose name carries an arrow — which is most of the rescue and synonym suites — was scored as
unquarantined.

Recounted by walking the parsed structure instead of a serialised string: **313 failing tests, 313
quarantined, 0 unquarantined.**

Only one of §103's seven was genuinely unquarantined: `access-control.matrix.spec.ts`, the §100
regression. That finding stands, and so does the process point — the spec file for the module §100
edited was not in the gate chain.

The general lesson is the one this programme keeps re-learning: a measurement is a thing that can be
wrong, and I asserted "7 unquarantined" without checking whether my comparison could match at all.

### The real fixes

Five tests moved from failing to passing:

- four synonym assertions, all of them the same stale line —
  `expect(expandServiceLookupQueries('massage')).toEqual(['massage'])`, written when bare "massage"
  belonged to no synonym group. **e2e-bug.320 deliberately made it one**, for a documented reason
  (without it, "show me massage" collapsed onto whichever catalog service tie-broke first). The
  assertion pinned the behaviour that bug removed. It sits inside an `it.each`, so one stale line
  produced four failures across two suites;
- one deleted in §102.

### The gate was already built, and now passes

`scripts/ai-known-failures-gate.mjs` (§26) implements exactly Phase 2's contract:

- a failure **not** in the manifest → the change broke something;
- a manifest entry that now **passes** → remove it; the list only shrinks.

Run over the full 1,333-suite sweep, including integration: **103 failing suites, 458 failing tests,
manifest 463**. Zero unquarantined. The only complaint was the second rule — the 5 entries I had just
fixed. Pruned via `--update`; the manifest is now **440 entries** and the gate exits 0.

**Phase 2's "make red mean red" is met**: a new failure now fails the gate by name, and a fixed test
cannot be left quarantined.

### One judgement, stated rather than silently taken

The gate takes **529s**. I did **not** add it to `test:ai-roadmap-gates`, which runs in about a
minute and is what makes iteration possible — the problem §359 exists to describe. Bolting nine
minutes onto the fast chain would recreate the loop nobody runs. It belongs in CI as its own step,
alongside the fast chain rather than inside it.

### Verification

- `npm run test:ai-known-failures` exits **0**.
- Fast chain **3,867 across 19**, 0 failures.

## §105 — the dead permission model is deleted, and the new gate caught me deleting it wrong

`e2e-bug.355` documented two independent answers to "may this tier run this command here", disagreeing
on **425 of 3,492** decisions, of which only one was ever consulted. Its fix direction was explicit:
delete the dead one *once every domain is ported, not before*. The port finished at §66, and §100 made
the live gate read `CommandSpec.tiers`, so the precondition is met.

### What was dead, verified before deleting

| symbol | production callers |
|---|---|
| `COMMAND_REGISTRY[].tiers` | one — `isIntentAllowedForTier` |
| `isIntentAllowedForTier` | one — `AiCommandRegistryService.allowedForTier` |
| `AiCommandRegistryService.allowedForTier` | **none** (its own spec only) |
| `AiGatewayService.assertIntentAllowed` | **none** (its own spec only) |

A closed loop ending in nothing. All four deleted, plus the conformance test that existed solely to
document the disagreement — including its 167-entry pinned list, which is now unrepresentable rather
than merely smaller.

The shape problem goes with it. `entry.tiers` was one flat list per command, so it could not express
`update_bookings` being manager+ on dashboard and staff+ on provider. Anything that migrated
permissions by reading it would have inherited 425 wrong answers, and §23 nearly did.

### The gate earned itself immediately

§104 made `test:ai-known-failures` pass and argued it belongs in CI. On the very next change it
reported:

```
✗ 1 failure(s) NOT in the manifest — this change broke them:
    ai-product-guide.integration.spec.ts › registers app guide intents ...
```

`expect(entry?.tiers).toContain('staff')` — a reader I had missed, in an integration suite the fast
chain does not run. Rewritten to assert `isIntentAllowed('dashboard', 'staff', intent)`, which is the
question the deleted field was pretending to answer.

Worth being plain about the sequence: the fast chain was green, and I would have shipped a regression
on that evidence. §104's gate is the only reason it surfaced, one change after being built. That is
the entire argument for red-meaning-red, demonstrated rather than asserted.

### Verification

- `npm run test:ai-known-failures`: **exit 0**, "Failure set matches the manifest exactly" — 103
  suites / 458 tests, manifest 458.
- Fast chain **3,866 across 19**, 0 failures (one lower: the deleted conformance test).

## §106 — three names, six functions: resolved by renaming, and I walked into the trap doing it

`e2e-bug.353` recorded three detector symbols exported from two files each, with different
implementations, so which behaviour a call site got depended purely on which module it imported.

### The ticket's fix direction was wrong

It said: "decide which implementation is correct, delete the other, and re-point its importers."
Checking first, **none of the six is redundant**:

| symbol | file A | file B | status |
|---|---|---|---|
| `isEndOfDaySummaryPrompt` | `ai-push-notifications` (used 3x in-file) | `ai-provider-end-of-day-summary` (imported by provider-mobile) | both live |
| `isSetRetailSalesLinesPrompt` | `ai-retail-finance` (used 2x in-file) | `ai-provider-exp-3` (imported by hints) | both live |
| `isGiftCardCheckoutCompoundPrompt` | `ai-gift-card-payments-hints` | `ai-gift-card-checkout-compound` | **four files import both** |

The last is the striking one: `ai-rebook-and-pay-compound`, `ai-discover-book-and-pay-compound` and
`ai-book-with-gift-card` all import *both* copies, aliasing one to
`isGiftCardCheckApplyBookCompoundPrompt`. The codebase had already chosen a disambiguating name at
every call site; the collision survived only in the export.

So the fix is renaming, and deleting would have removed live behaviour:

- `ai-push-notifications` → `isEndOfDaySummaryPushPrompt` (it matches the end-of-day *push*; the
  other matches a provider wrapping up their day);
- `ai-retail-finance` → `isSetRetailSalesLinesFinancePrompt` (the exp-3 copy additionally requires
  `parseRetailSalesLinesFromPrompt` to yield lines);
- `ai-gift-card-checkout-compound` → `isGiftCardCheckApplyBookCompoundPrompt`, promoting the alias
  already in use everywhere.

### I introduced the exact bug the ticket describes

Renaming with a blanket regex over `ai-book-with-gift-card.util.ts` — a file importing **both** copies,
one plain and one aliased — rewrote a call site that was deliberately using the *other* module's
version:

```diff
-  if (isGiftCardCheckoutCompoundPrompt(text)) return false;   // payments-hints
+  if (isGiftCardCheckApplyBookCompoundPrompt(text)) return false;  // checkout-compound
```

Four `intent-decomposition` tests caught it: a golden compound decomposed to `book_with_gift_card`
instead of `apply_gift_card_code` + `choose_payment_method`. Reverted that one line.

This is worth recording rather than quietly fixing. The ticket's claim is that one name with two
meanings is "invisible at the call site" — and the demonstration is that someone reading the file
specifically to fix that hazard still mis-edited it, because `isGiftCardCheckoutCompoundPrompt(text)`
does not say which module it came from. A blanket rename is exactly the operation the collision makes
unsafe.

### The ratchet is now zero

`EXPECTED_DUPLICATE_DECLARATIONS` in the inventory boundary spec goes **3 → 0**, documented as
may-only-decrease. A new collision now fails the gate rather than being counted.

### Verification

- Fast chain **3,866 across 19**, 0 failures.
- Red-means-red: **exit 0**, "Failure set matches the manifest exactly" — no new failures anywhere in
  the 1,333-suite sweep.
- Inventory regenerated: `duplicateSymbols` 6 → **0**.

## §107 — thirteen detectors deleted, and the first fall in the freeze ratchet

`e2e-bug.354` listed thirteen `is*Prompt` detectors that nothing outside their own tests calls. Its
triage rule: if the action a detector names is reachable another way, the detector is dead — delete it
and lower the freeze baseline in the same commit.

### Triage against production

Five of the thirteen name an action. The trace corpus answers whether that action still arrives:

| action | traces | executed | via rescue |
|---|---|---|---|
| `recommend_specialists` | 198 | 178 | **0** |
| `pay_at_venue_fallback` | 12 | 7 | **0** |
| `rebook_last_appointment` | 1 | 0 | 0 |
| `reschedule_package_lines` | 0 | — | — |
| `configure_package_localized_names` | 0 | — | — |

`via rescue = 0` is the decisive column: the two commands with real traffic are routed **without** the
detector, so the detector adds nothing. The other three have no traffic at all. The remaining eight
map to no action, so they cannot route anything by construction.

All thirteen deleted, along with 22 files' worth of references — 21 spec files plus one dead
re-export chain in `ai-booking-param-hints.util.ts`.

### The ratchet fell for the first time

| | before | after |
|---|---|---|
| detectors in the inventory | 785 | **772** |
| freeze baseline `isPromptDetectors` | 790 | **777** |
| `legacy_paraphrase` total | 555 | **545** |
| retirement-ready | 318 | **315** |

Every one of these ratchets was written to *rise or hold*, and Phase 8's whole direction is that they
should eventually fall. This is the first commit that moves them the intended way.

`READY_FLOOR` dropping is worth guarding rather than just editing: it fell because three deleted
detectors happened to be ready, not because readiness regressed. The comment now says that a fall in
`READY_FLOOR` **unaccompanied by a fall in `TOTAL_PARAPHRASE`** is the regression the floor exists to
catch.

### Two things the red-means-red gate caught

Both were mine, and neither showed in the fast chain:

1. **`acc-3.14.boundary.spec.ts`** asserted that `ai-booking-param-hints.util.ts` imports
   `./recommend-specialists.semantic.util.js` — delegation of a paraphrase detector to a semantic
   util. With the detector gone there is nothing left to delegate. The rule the gate actually enforces
   is the companion loop (a detector must not be *defined* there), which now holds more strongly. The
   stale half was removed with that reasoning recorded.

2. **`ai-command-handler-coverage.spec.ts`** asserted the literal substring
   `buildUnwiredDashboardIntentResult(parsed.action`. That call sits ~60 columns deep in
   `ai-command.service.ts`, and running `prettier --write` across the module re-wrapped it.

### A side effect I caused and should name

That prettier run was `--write "src/modules/ai/*.ts"` — far wider than the files I had edited. Most of
the module is already prettier-formatted and was left untouched (`ai-rag.service.ts`,
`ai-semantic-intent.service.ts` show no diff), but files carrying **unformatted pre-existing
uncommitted changes** were normalised, `ai-command.service.ts` most visibly at 375/286 lines. No
behaviour changed and nothing was lost, but it is churn in someone else's working tree that I did not
intend. Formatting should be scoped to the files actually edited.

The assertion is now a regex tolerant of line breaks, because the invariant is "the default branch
calls the registry-aware helper with `parsed.action`", not how it is wrapped.

### Verification

- Fast chain **3,865 across 19**, 0 failures.
- Red-means-red: **exit 0**, "Failure set matches the manifest exactly" — 103 suites / 458 tests.
- Inventory regenerated; `reachableFromProduction: false` count **13 → 0**.

## §108 — Phase 6 is a closed island, and the identity it needs already exists

`e2e-bug.373` asks for one wire: `EntityResolutionService` should call `recordResolution` whenever it
resolves. Tracing what that would need found the ticket is not independent — it is one of five
symptoms of a single missing piece.

### The import graph

Non-spec importers of the Phase 6 conversation-state modules:

| module | imported in production by |
|---|---|
| `ai-entity-store.util` (§53) | **nothing** |
| `ai-anaphora.util` (§49) | **nothing** |
| `ai-profile-facts.util` (§54) | **nothing** |
| `ai-slot-filling.util` (§38) | `ai-topic-change.util` |
| `ai-topic-change.util` (§48) | `ai-entity-store.util` |

Five modules, and every edge points **inward**. `slot-filling` is imported only by `topic-change`,
which is imported only by `entity-store`, which nothing imports. `PENDING_CLARIFICATION_KEY` appears
nowhere outside the file that defines it. The gateway and the understanding pipeline reference none of
them.

So `e2e-bug.369`, `370`, `373` and `374` are not four wiring tasks. Wiring any one of them in
isolation leaves it dead, because the thing they all need is the same and is absent: **nothing carries
conversation state from one turn to the next.**

`EntityResolutionService` makes this concrete. It is a stateless pass-through over pure functions —
no conversation id, no store, nothing to write into. "Record on resolve" has no destination.

### What is *not* missing, and this is the useful part

`ai-conversation.util.ts` already derives a stable identity server-side:

```ts
conversationId = 'cv_' + sha256(userId | businessId | first-user-turn anchor)
turnIndex      = userTurns.length + 1
```

It is real, it is already used as `session_id` on `ai_command_trace`, and it needs **nothing from the
client** — it is computed from `userId`, `businessId` and `history`, all of which the gateway already
has on every request. `EntityStore.conversationId` and `EntityRef.turnIndex` are exactly the two
fields it produces.

That contradicts the assumption carried earlier in this programme that per-conversation work was
blocked on a client-supplied `conversationId`. It is not. The identity is solved.

### So the prerequisite is narrow

One thing is missing: **somewhere to persist an `EntityStore` keyed by `conversationId` between
requests**, plus a load-before / save-after around resolution in the gateway. Once that exists, all
four tickets become the small wires they were originally written as.

Filed as `e2e-bug.401`, with 369/370/373/374 marked as blocked on it rather than independently open.
That is a scheduling correction: four tickets that each looked like an afternoon are one piece of
infrastructure and four afternoons.

### Not done here

I did not build the persistence layer. It needs a storage decision — a table keyed by
`conversation_id` versus an in-process cache with a TTL — and that choice depends on whether the
platform runs multi-instance, which is an ops fact I do not have. Guessing it would produce a store
that works in development and silently loses state behind a load balancer, which is the same class of
failure as §89's flag that had to be set correctly in every environment.

The finding stands on its own: the identity exists, the island is closed, and one piece unblocks four.

## §109 — the date bomb, and why it mattered more than one red test

`e2e-bug.365`: `ai-orchestration.helpers.spec.ts` asserted
`resolvePublicAvailabilityDateKeys({date:'15_06_2026'}) === ['2026-06-15']`, while a sibling test
asserted past dates are dropped. Both are correct rules. They contradicted each other the moment
2026-06-15 stopped being in the future.

### The seam already existed

`resolvePublicAvailabilityWindows` has always accepted `options.referenceTodayDateKey` — an injectable
"today". `resolvePublicAvailabilityDateKeys` wraps it and spreads `options` straight through, but its
**type** narrowed the options to `{ defaultScanDays?: number }`, so the field was unreachable from
outside.

The fix is the type. One line widens it and the value forwards, because the spread was already there.
No behaviour changed for any caller that does not pass it.

Both tests now pin `FROZEN_TODAY = '2026-06-01'`, and a third was added asserting the same date is
dropped against `referenceTodayDateKey: '2026-07-01'` — that one guards the seam itself, since without
the injection its result would depend on when the suite runs, which is the defect.

### Why this was worth doing now rather than later

The test sat in `ai-known-failures.json`. §104 made that manifest the definition of "expected red", so
every entry in it is a claim that a failure is understood. **A test failing because of the calendar is
indistinguishable, inside that manifest, from one failing because of a defect** — and it would have
stayed there indefinitely, since nobody re-reads a quarantined entry.

The gate closed the loop without being asked: its "entries that now pass must be removed" rule made
the manifest shrink in the same commit. Manifest **439 entries, 457 failing tests across 102 suites**,
down from 458/103.

### Verification

- Fast chain **3,865 across 19**, 0 failures.
- Red-means-red **exit 0**, "Failure set matches the manifest exactly".
- `ai-orchestration.helpers.spec`: **94 passed**, including the new seam guard.

## §110 — a read registered as a write: the second binding was a copy of the first

`e2e-bug.376` recorded `explain_payment_status` — a command that reports whether a booking is paid —
built as `mutating: true`, `executionMode: 'simple_mutate'`. The ticket refused to patch it and asked
for the second registration path to be found first, on the grounds that if two bindings claim one
intent the same may be true of others.

That was the right instruction, and following it changed the fix twice.

### First attempt: correct, and not the cause

The provider payments binding passes its own intent list as its mutate list:

```ts
intents: PROVIDER_PAYMENTS_INTENTS,        // ['explain_payment_status', 'collect_cash_confirm']
mutateIntents: PROVIDER_PAYMENTS_INTENTS,  // ← both, including the read
```

Every sibling binding names a `*_MUTATE_INTENTS` subset instead. Introducing
`PROVIDER_PAYMENTS_MUTATE_INTENTS = ['collect_cash_confirm']` and using it is right — and the built
entry was **still** `mutating: true`.

Checking the entry rather than trusting the edit is what caught that. The conformance suite stayed
green throughout, because spec and registry still agreed; agreement is not correctness.

### The real cause: a duplicated binding

`intents: PROVIDER_PAYMENTS_INTENTS` appears **twice** in `ai-command-registry.build.ts`, ~350 lines
apart, byte-identical in all six fields. `mutateSet` is global and additive, so the copy re-added the
whole list and undid the fix.

Deleted. `explain_payment_status` is now `mutating: false, executionMode: 'read_only'`, and
`collect_cash_confirm` remains mutating.

### The ticket's structural worry, answered

It asked whether other bindings do the same. Two checks:

- **duplicate bindings** — `intents: <CONST>` counted across the file: `PROVIDER_PAYMENTS_INTENTS` is
  the only constant bound twice;
- **whole-list-as-mutate-list** — three bindings do it: `SCHEDULING_INTENTS`, `OPERATIONS_INTENTS`
  and this one. The first two contain no read-shaped names at all, so for them the declaration is
  accurate.

So the structural fear does not materialise: one duplicate, one misdeclaration, both here. Worth the
check — the answer could have been three fixes instead of one, and nothing in the ticket could have
told us which without looking.

### The spec can now say what the command is

§57 had to spec this as T1 with a `kind: 'none'` compensation, because the registry declared it
mutating and conformance correctly fails a spec that disagrees. It is now **T0 with no compensation**,
and the comment explaining the workaround is replaced by one explaining the fix.

### Two gates caught me mid-change

- the **§96 embedding-staleness gate** failed the moment the spec description changed, because the
  cache no longer matched. Rebuilt. That gate is four sections old and has now paid for itself;
- the **red-means-red gate** confirmed no new failures across all 1,333 suites.

### Verification

- Fast chain **3,865 across 19**, 0 failures.
- Red-means-red **exit 0**, 102 suites / 457 tests, manifest exact.
- Registry: `explain_payment_status` read_only; inventory regenerated.

## §111 — the resolver matched letters inside words, in two tiers not one

`e2e-bug.362` reported `fuzzyMatchByName` — the platform's main name→entity resolver, 27 call sites —
silently picking on ties and matching too loosely. Running its table against the live function first
changed both the diagnosis and the fix.

### Half the ticket's evidence did not reproduce

| ticket's claim | actual |
|---|---|
| "John Smith" with `[Jo, John Smith]` → **Jo** | **John Smith** — tier 1 is exact and wins |
| "massage" with `[Deep Tissue, Swedish Massage]` → **Deep Tissue** | **Swedish Massage** — tier 2 needs the item to contain the query |
| two people named "John Smith" → first row | reproduces |
| "John" with John Smith / John Baker → John Smith | reproduces |

The two tie rows are real. The two "wrong entity" rows were written from reading the code rather than
running it, and both are wrong about which tier fires.

### The real defect is worse than the one described

The dangerous tier is `lower.includes(item.name)` — the *query* containing the *name*, as a raw
substring:

| query | employee | result |
|---|---|---|
| `book Alice for a haircut` | `Al` | **Al** — Alice's booking assigned to Al |
| `is the salon open` | `Al` | **Al** — s-**al**-on |

The second is the sharp one: an unrelated question resolves to a person, because their name appears
inside an ordinary word. Any employee or service with a short name is a landmine across every prompt.

### And it is in two tiers

Anchoring tier 3 to word boundaries fixed those, and then a test I wrote for **Armenian** names
failed: an employee `Ան` still resolved from `Աննա գրանցիր` (Anna). Tier 4's
`lower.startsWith(part)` is the same defect one tier down — any query *beginning* with a shorter name
matches it. The ticket named only tier 3.

Both now use the same word-boundary check, computed on Unicode letter classes rather than `\b`, which
is ASCII-only and would have failed exactly the Armenian and Russian names §48 documented.

### Ties are untouched, deliberately

Three shapes remain where the matcher picks silently — duplicate names, shared first names, shared
service words. Word boundaries cannot help: both candidates are genuine matches. Fixing that means
returning "ask, don't pick", which changes the `T | undefined` contract at all 27 call sites, and
`resolveEntity` (§29) already does it correctly. That is `e2e-bug.367`'s migration, not this ticket.

§29's `ai-entity-resolution.boundary.spec.ts` listed four silent-pick shapes; it now lists **three**,
with the removed one moved to the new spec and pinned as fixed rather than deleted.

### Verification

- Fast chain **3,864 across 19**, 0 failures.
- Red-means-red **exit 0**, 102 suites / 457 tests, manifest exact — no behaviour change reached any
  of the 27 call sites' tests.
- 8 new tests, including both non-Latin cases and the four earlier tiers left intact.

## §112 — five copies into one, without pretending it is the migration

`e2e-bug.367` lists 14 local re-parsers shadowing `EntityResolutionService`, and explains why adopting
the service is not a refactor: §29's resolver returns `ambiguous` with a clarify question where the
old code silently picks, so each handler needs its clarify path wired first.

That reasoning holds, and it does not apply to every part of the ticket equally.

### Verified before touching anything

The ticket claims 7 `resolveServiceByName` copies, 5 byte-identical. Hashing each function's
normalised body:

| bodies | files |
|---|---|
| **5 identical** | `ai-checkout-recommendations`, `ai-consumer-checkout-success`, `ai-clinic-booking`, `ai-upcoming-tour-departures`, `ai-clinic-service` |
| 1 variant (16 lines) | `ai-pick-provider-for-service` |
| 1 variant (12 lines) | `ai-compare-services` |

Exactly as recorded. Collapsing the five changes no behaviour — they *are* the same function — so it
needs no clarify path and no per-handler work.

### What this is and is not

`matchServiceByNameLegacy` in `ai-legacy-service-match.util.ts` is **not** the replacement, and its
doc comment says so at the top. It is the same silent-pick behaviour: against a five-service
catalogue, 5 of 11 ordinary inputs are ambiguous and it resolves every one by array order — whichever
row the database returned first.

What changes is the shape of the remaining work. Adopting `EntityResolutionService.resolveService`
for those five handlers was five clarify paths to wire; it is now **one call site**. The migration is
not done, it is concentrated.

The two genuine variants are deliberately untouched. They differ from each other and from the five,
and merging them would be a behaviour change wearing a refactor's clothes — the thing the ticket
warns against.

### The ratchet, and what it is allowed to mean

`ai-reparser-ratchet.boundary.spec.ts` pins the list at 14 and fails both on a new copy **and** on an
entry left behind after its function is deleted. It failed on the second rule immediately, naming all
five. Manifest **14 → 11** entries.

The count falling is not evidence the migration progressed, and the manifest now says so in place:
five entries describing "byte-identical copy → EntityResolutionService.serviceOrClarify" were
discharged by deduplication, not by adoption. Recording that distinction where the number lives seemed
better than letting a future reader infer progress from a smaller count.

### Verification

- Fast chain **3,864 across 19**, 0 failures.
- Red-means-red **exit 0**, 102 suites / 457 tests, manifest exact — no behaviour reached any test,
  which is the claim a pure refactor has to support.

## §113 — half of e2e-bug.349 was closed by §100 without anyone noticing

`e2e-bug.349` named two compounding root causes for a dashboard catalog request being answered by a
customer cart command. Checking each against today's code before touching either found the first one
already gone.

### Root cause 1 — closed by §100, five sections ago

The ticket: "`add_services_to_cart` is a *customer* booking-cart intent with no meaning on the
dashboard, yet it wins step 1 on a dashboard-authenticated request."

Today `isIntentAllowed('dashboard', tier, 'add_services_to_cart')` is **false for staff, manager and
owner**, and true on customer. Not because anyone fixed this ticket: §100 replaced the deny-list gate
with `CommandSpec.tiers`, and `booking.add_services_to_cart` declares `surfaces: ['customer','public']`.
Under the old deny-list, a command absent from the list was permitted — which is precisely how a cart
intent could win a dashboard request.

The ticket predates that and nothing linked them. Pinned now with a test, so the fix cannot be
undone silently by a future permission change.

Also worth recording: `isCompoundPrompt` now returns **false** for the reported prompt and
deterministic decomposition returns null on both surfaces, so the specific failure path in the report
is no longer reachable through the deterministic route either.

### Root cause 2 — real, and still there

`isBulkCreateCatalogPrompt`'s cues matched `category\b`. Every one of them. So
"Create **categories** Y and Z. Under Y add service A (30 min, $50)…" registered **no**
create-category context at all — the prompt was not recognised as a catalog request in the first
place, which is what left it available to be claimed by something else.

Four patterns now read `categor(?:y|ies)`. Verified in both directions: the reported prompt matches,
the three singular forms still match, and `what categories do I have` still does not — the plural cue
widens only the category half, and the service-line requirement is what keeps a bare mention out.

### Not done

The ticket also asks for sentence-level splitting on `.` and an `Under <Category> add <lines>` segment
classifier. Both are left: the ticket itself warns that sentence splitting must be added narrowly to
avoid the over-splitting class e2e-bug.347 had just fixed for semicolons, and that is a separate
change with its own risk, not a rider on a regex widening.

So `e2e-bug.349` stays open on its decomposition half, with the two root causes now recorded as one
fixed and one narrowed.

### Verification

- Fast chain **3,864 across 19**, 0 failures; 7 new tests covering both root causes.
- Red-means-red **exit 0** — and it caught a stale checked-in inventory on the first run, before the
  regenerate.

## §114 — pinning the line the LLM decomposition wins on

`e2e-bug.348`: "Create a category Y with three services…" creates all three services with
`category_id = NULL`, keeping the model's literal names ("service A") rather than the parser's
normalised ones. The ticket traced it to LLM-supplied `compoundSteps` bypassing the deterministic
catalog path, and recorded that **the exact point had not been pinned to a line**.

### The line

`ai-catalog.logic.ts:1197`:

```ts
const steps = (params.compoundSteps as CatalogCompoundStep[] | undefined)
  ?? decomposeCatalogCompoundPrompt(prompt);
```

`??` — the model's plan wins whenever it exists, and the deterministic decomposition is only reached
when the model supplied nothing. Confirmed against the reported prompt: the deterministic path yields
exactly what is missing —

```
bulk_create_catalog { categoryName: 'Y', services: [A(30,$50), B(45,$45), C(60,$70)] }
```

normalised names, category intact. It was simply never consulted.

### Why the obvious fix is the one that already failed

"Prefer the deterministic decomposition when it produces a complete draft" is the blanket exemption
the ticket records as having broken four tests, and the reason is visible in the shapes: for
"category + services **and** add a package" the deterministic path yields **one** step and the model
yields **two**. Preferring the shorter plan silently drops the package — trading a lost category link
for a lost package.

### So the swap is surgical

`chooseCatalogCompoundSteps` replaces **only** `create_service`/`create_services` steps, **only** when
the deterministic path produced a complete category draft, and **only** when the model's own plan
contains nothing that would create the category. Every other step keeps its place and its order.

Seven tests, and the ones that matter are the negatives: a plan that already creates the category is
returned untouched (by identity, not by value), a plan with no service step is untouched, a prompt
with no complete draft is untouched, and "category + services + package" keeps the package — in both
orderings, since the repair inserts at the first service step rather than at the front.

### What is left

The ticket also reports a false-success summary: the response claims "Category Y has been successfully
created… Online payment has been enabled" while `prepayment_mode` is `none` on all three. That is the
e2e-bug.136/156 family — summaries restating the request instead of the results — and it is a
different defect in a different layer. Fixing the routing does not fix a summary that never consulted
the outcome.

### Verification

- Catalog suites **397 passed across 20**.
- Fast chain **3,864 across 19**, 0 failures.
- Red-means-red **exit 0**, 102 suites / 457 tests, manifest exact.

## §115 — narrowing measured again: the default was right, the reason was not

`e2e-bug.381` ("the planner declines to plan at all") and `e2e-bug.382` ("retrieval recall ~55%, so
narrowing triples wrong commands") are the two tickets that shaped the planner's shipped
configuration. Both were written before the defects that corrupted their measurements were known.

### What they were measuring

- `e2e-bug.384` — `validatePlan` marked **empty plans executable**, so an empty plan was compared as
  though it had chosen a command;
- `e2e-bug.388` — `decodePlanStep` discarded well-formed steps whose command id had landed in the
  label field, **57 of 150** on the sample §85 examined.

Between them these account for §70–§79's numbers, which is where both tickets' figures come from.
§381's "the model returns well-formed JSON containing no steps" was true of the decoder's *output*
and false of the model's.

### The A/B nobody had run on fixed code

90 real prompts, both arms sharing one embedding per prompt, everything else identical:

| | right | wrong | no plan |
|---|---|---|---|
| narrowing to 15 | 33 (37%) | 8 (9%) | 49 (54%) |
| **full permitted list** | **43 (48%)** | 9 (10%) | **38 (42%)** |

Narrowing is worse on the axis it exists to improve — it *raises* empty plans by 12 points — and moves
wrong commands by one prompt. §382's headline, "halves empty plans but triples wrong commands", is
inverted on the first half and absent on the second.

**The shipped default (off) is correct.** The reasoning attached to it was not, and both code comments
carrying that reasoning have been rewritten in place — including the one in `plan()` asserting
"narrowing is the fix; the prompt was never the problem".

### A correction to my own measurements

Every recovery number in §92, §94 and §98 was taken with narrowing **on**, because the harnesses call
`narrowShortlist` directly. They were measured on the worse arm. The planner's real capability is
above what those sections report — the per-domain table in §94 in particular is a floor, not a
reading.

I am not restating those numbers here: re-running §94 across every domain is a separate exercise, and
quoting a corrected figure I have not measured would repeat the error this section is about.

### Both tickets closed as superseded

Neither describes current behaviour. §381's cause is `e2e-bug.388`, fixed. §382's recommendation —
"rebuild embeddings at 1,536 dimensions, do this first" — was aimed at a recall problem that §83
showed was 47% permission failure and 19% ranking failure, and §84 fixed the permission half outright
(reachability 69% → 92%).

### Verification

- Fast chain **3,864 across 19**, 0 failures.

## §116 — re-running §94 without narrowing, and correcting §115 instead

§115 measured the full permitted list beating the 15-command shortlist (48% right vs 37%) and drew a
consequence: §92, §94 and §98 all called `narrowShortlist` directly, so their numbers were "a floor,
not a reading". I declined to restate them without measuring. Measuring them says the direction was
wrong.

### §94 re-run on the full list

Same 121 rescue-dependent prompts, same everything, narrowing off:

| domain | traces | §94 (narrowed) | **now (full list)** |
|---|---|---|---|
| tour | 34 | **97%** | 91% |
| operations | 30 | 3% | **20%** |
| business | 14 | 0% | **21%** |
| booking | 34 | 6% | 9% |
| catalog | 22 | 9% | 9% |
| commerce | 11 | 18% | 18% |
| **push** | 18 | **83%** | **0%** |
| clinic / customer / marketing / payment / guide / compliance | 63 | 0% | 0% |
| **total** | **216** | **25.5%** | **21.8%** |

**Narrowing was the better arm here**, by four points. §94's numbers were not a floor; they were the
higher reading, and §115's claim that the planner's real capability is "above what those sections
report" is withdrawn.

### Why both measurements are right

They are different populations. §115 sampled 90 prompts from *all* executed traces; this samples the
121 the **detectors** decided — `action_changed_by = 'rescue'`, the hardest cases by construction,
the ones where the classifier's own answer was overridden.

On ordinary traffic a 388-command list beats a 15-command one. On the traffic that needed rescuing,
narrowing helps. That is not a contradiction, and it is the kind of split a single aggregate number
hides — which is exactly what §382 got wrong in the other direction.

`push` is the sharpest instance: 83% narrowed, **0%** on the full list. Eighteen traces where the
correct command is findable in a shortlist of 15 and lost among 388.

### What it does not change

Phase 8's readiness is unchanged: **`tour` alone clears 90%**, on either arm. §94's conclusion —
"slice 1 was the exception, not the template" — survives its own numbers being re-taken, which is the
useful thing to know about it.

### On the error

§115 was careful not to quote a corrected figure it had not measured, and then asserted the direction
anyway. Stating "these numbers are a floor" is a measurement claim; the caution about not inventing a
value did not extend to the claim that the value was low. The honest form would have been "measured on
one arm, direction unknown".

### Verification

- Fast chain **3,864 across 19**, 0 failures. No code changed — this section is a measurement and two
  corrections.

## §117 — narrowing decided per prompt, and a defect it exposed

`e2e-bug.402`: narrowing wins on rescued traffic and loses on ordinary traffic, so no fixed setting of
a global boolean is right. The obstacle to a per-domain rule is that you do not know the domain until
after routing. The signal you *do* have is the retrieval score.

### The score separates them cleanly

197 real prompts, embeddings only:

| top score | truth still in the top 15 |
|---|---|
| 0.0–0.4 | 48% (n=123) |
| 0.4–0.5 | 88% (n=33) |
| **0.5–0.6** | **100%** (n=23) |
| **0.6+** | **100%** (n=18) |

The margin between top-1 and top-15 was tried too and is far weaker — 50% to 88% across its whole
range. `NARROW_MIN_TOP_SCORE = 0.5`: at that threshold the cut never lost the right command on this
sample. 0.4 would narrow 38% of prompts instead of 21% at 95% retention, and this module's second
invariant — losing the right command is worse than keeping a wrong one — makes the extra coverage a
bad trade.

### It picks the right strategy per prompt

60 prompts from each population, all three strategies:

| population | **gated** | always | never | narrowed by the gate |
|---|---|---|---|---|
| general | **48%** | 38% | 47% | 2/60 |
| rescued | **28%** | 28% | 20% | 41/60 |

The gate narrows 3% of ordinary prompts and 68% of rescued ones, matching or beating both fixed arms
on both populations. So narrowing is now **on by default**, with `AI_PLANNER_NARROW_SHORTLIST=0` as
the override — reversing §382's flag on measurement rather than on the corrupted figures it shipped
with.

Its failure mode is the status quo: below the threshold it returns the full permitted list, which is
exactly the un-narrowed behaviour.

### The defect enabling it exposed

Three planner tests failed, and they were right to. `validatePlan` was being handed the **narrowed**
shortlist, so a command that is entirely legal but simply missed the top 15 came back as
`unknown_command` instead of `surface_violation`.

That conflates two different things. Narrowing decides what the model is *shown*; validation decides
what may *run*. With them merged, a retrieval miss and a permission violation are indistinguishable in
the trace, and `describePlanClarification` tells the user "I don't have a command for that" about a
command the platform has.

Validation now runs against the full catalogue. The safety property is unchanged — `validatePlan`
re-derives permission through `isSpecAllowedForTier`, so widening its input cannot admit anything;
it only restores the correct rejection reason. This was latent the whole time narrowing was
switchable, and only surfaced because turning it on made the tests run that path.

### Verification

- Fast chain **3,870 across 19**, 0 failures; 6 new tests on the gate, including that a pinned command
  still narrows and that the fallback returns the full permitted list rather than a guess.
- Red-means-red **exit 0**, 102 suites / 457 tests, manifest exact.

## §118 — the shipping configuration measured, and a rerank decided by a prompt example

§117 changed two things that bear on `e2e-bug.395`'s "1 of 14 slices ready": narrowing now ships on
behind a confidence gate, and `validatePlan` runs against the full catalogue. That table gates Phase
8, so it was re-taken on the configuration that actually ships.

### Per-domain recovery, as shipped

| domain | traces | §94 (always narrow) | §116 (never) | **shipping** |
|---|---|---|---|---|
| tour | 34 | 97% | 91% | **76%** |
| push | 18 | 83% | 0% | 67% |
| commerce | 11 | 18% | 18% | **64%** |
| business | 14 | 0% | 21% | 21% |
| operations | 30 | 3% | 20% | 20% |
| booking / catalog | 56 | 6–9% | 9% | 9% |
| clinic / customer / marketing / payment / guide / compliance | 63 | 0% | 0% | 0% |
| **total** | **216** | 25.5% | 21.8% | **27.3%** |

The total is the best of the three. **No domain clears 90%** — including `tour`, which is the first
time Phase 8 has had *zero* retirement-ready slices rather than one.

### It is not noise

Three consecutive runs of the tour slice on identical config returned **76%, 76%, 76%** — same
prompts, same failures, same counts. Worth checking before explaining it, given how much of §70–§82
turned out to be resampling artefacts.

### The cause is a number in a prompt

tour's failures are all `rerank=3`: the planner routes the right command and then **loses the
rerank**. `mergeAndRerankIntentCandidates` sorts on confidence, comparing the planner's self-reported
number against the classifier's recorded one.

The classifier's confidences for this slice are **0.90 and 0.95** — they cluster tightly.

§99 replaced the contract's `"confidence": 0.0-1.0` with a concrete `"confidence": 0.9`, because the
range notation is not a value and the model was emitting `0`. That fixed 14 zeros. It also **anchored**
the model on 0.9, which sits exactly at, or just below, the classifier's cluster.

So which router wins these prompts is currently decided by the example value someone typed into a
prompt template. That is not a calibration; it is a coincidence.

### Why I am not "fixing" it by raising the example

Changing `0.9` to `0.95` would win the rerank and mean nothing — it games a comparison rather than
making it valid. The real problem is that an LLM's self-reported confidence and a classifier's score
are different scales with no shared meaning, and §90 deliberately declined to boost the planner's
number for exactly that reason. §99 then pinned it without either of us noticing the interaction.

Filed as `e2e-bug.403`. The candidates are ranking by source precedence within a domain the planner
owns, calibrating one scale onto the other from the trace corpus, or not competing at all once a slice
is retired — but that is a decision with evidence to gather, not a constant to edit.

### Consequence for `e2e-bug.395`

Its headline moves from "1 of 14 ready" to "0 of 14", and its conclusion — slice 1 was the exception —
is unchanged and now stronger. `tour` is retirement-*capable* (retrieval 11/11, routing correct) and
retirement-*blocked* by a tie-break, which is a different and much smaller problem than the one that
number implies.

### Verification

- Fast chain **3,870 across 19**, 0 failures. No code changed in this section.

## §119 — precedence, not a bigger number

`e2e-bug.403`: the rerank decides between planner and classifier by sorting on `confidence`, but the
planner's is an LLM self-report anchored by an example value in a prompt template and the classifier's
is a calibrated score. On the `tour` slice both land on 0.90–0.95, so an arbitrary constant was
deciding the winner.

### The missing half of §93's coupling

§93 locked `tour` and `guide` against rescue **and** gave them to the planner in the same commit,
reasoning that a domain routed but not locked lets rescue overrule the planner. The mirror case went
unnoticed: **locked but outranked** lets the *classifier's* answer stand — and on rescue-dependent
traffic that answer is by definition the one rescue existed to override.

So locking the domain without ranking the planner above the classifier does not retire the slice; it
hands those prompts to the classifier's rejected answer.

### Precedence rather than confidence

`IntentCandidate` gains `precedence?: number`, default 0, and the rerank sorts on it before
confidence. Only a planner route in a `RETIRED_DETECTOR_DOMAINS` domain sets it.

Raising §99's example from `0.9` to `0.95` would also have won these prompts, and would have been
wrong: it wins a comparison instead of admitting the comparison is invalid, and the next classifier
recalibration silently reverses it. Precedence says the real thing — *in a retired domain this is not
a matter of degree* — and leaves §90's rule intact everywhere else, where the planner still has to win
on its own number.

### Result

| domain | traces | §118 (shipping) | **with precedence** |
|---|---|---|---|
| **tour** | 34 | 76% | **97%** |
| commerce | 11 | 64% | 64% |
| push | 18 | 67% | 67% |
| business / operations | 44 | 20–21% | 20–21% |
| booking / catalog | 56 | 9% | 9% |
| clinic / customer / marketing / payment / guide / compliance | 63 | 0% | 0% |
| **total** | **216** | 27.3% | **30.6%** |

`tour` is back to 97% — the §92 figure — and is again the one slice clearing 90%. Every other domain
is unchanged to the trace, which is what a change scoped to two retired domains should look like.

### What it does not claim

The total moving 27.3% → 30.6% is entirely `tour`. Nothing here improves routing; it stops a correct
route being discarded on a tie-break. `e2e-bug.395`'s finding — one slice ready, and slice 1 was the
exception — is exactly where it was.

### Verification

- Fast chain **3,876 across 19**, 0 failures; 6 tests pin that precedence wins only when set, that an
  absent precedence still ranks as zero, and that confidence still orders within a precedence level.
- Red-means-red **exit 0**, 102 suites / 457 tests, manifest exact.

## §120 — naming the resolver worked, and cost two points

§99 diagnosed `e2e-bug.399`: `appointment.reschedule` declares `appointmentId` required with
`resolver: 'appointment'`, the prompt shows only `appointmentId (string)`, rule 4 says "do not guess
ids", and `resolver` appears **zero times** in the generated prompt. The planner is asked for an id,
forbidden from inventing one, and never told anything downstream can find one. It refuses, correctly.

The fix looked obvious: render the resolver, and add a rule saying a natural-language reference is the
expected input rather than a guess.

### It did what it was meant to, and lost anyway

Same 121 rescue-dependent prompts, same harness as §119:

| | §119 | with resolvers named |
|---|---|---|
| `missing_variables` | 4 | **2** |
| **recovery** | **30.6%** | **28.7%** |

The intervention hit its target — the planner stopped omitting resolver-backed variables — and the
headline fell two points. The problem codes say where it went: `reject:needs_confirmation` is **24**.
Plans that previously died at `missing_variables` now carry their variables, become executable, and
are declined by §90's fourth routing condition, which excludes anything requiring confirmation
because that handshake belongs to the detector path.

So the deadlock is real and the fix is right, and it is blocked behind a *different* gate. Naming the
resolver alone trades a diagnosed deadlock for a measured loss.

### Reverted

The prompt rendering and the rule are out. `PlannerVariableHint.resolver` stays — it is the one piece
with an independent claim on existing, since `plannerVariableHints` is the derived view of a spec and
omitting a declared field made the view lie about the spec.

I considered keeping the change on principle. This programme has spent §82, §115 and §116 discovering
that reasoning about these numbers loses to measuring them, and "the metric dropped but I believe the
change is right" is exactly the argument §82 made before being wrong three times. The measurement is
what there is.

### What has to move first

`decidePlannerRoute`'s no-confirmation condition. It is correct as written — routing a T2 through a
seam that skips its confirmation would be worse than any accuracy number — so the work is to give the
seam a confirmation path, not to relax the rule. Until then, resolver-backed mutating commands cannot
be routed by the planner whatever the prompt says, and `e2e-bug.399` stays open behind
`e2e-bug.404`.

### Verification

- Fast chain **3,876 across 19**, 0 failures; embedding cache rebuilt after the spec text reverted.

## §121 — the seam's confirmation rule is load-bearing, for a reason I had wrong

`e2e-bug.404` asked for a confirmation path in the routing seam, so the planner could carry the 24 of
121 prompts it declines under `decidePlannerRoute`'s fourth condition. §90 justified that condition
with "a command that needs confirming has a handshake the detector path owns. Routing it from here
would skip that."

Checking whether it actually would found something else.

### The handshake is not skipped

`ai-command.service.ts:1594` gates on the **action name** at execute time:

```ts
if (requiresDashboardExecutionConfirmation(parsed.action) && !confirmed) { ... }
```

Nothing there knows or cares which candidate source produced `parsed.action`. A planner-routed action
reaches the same gate as a detector-routed one, so §90's stated reason for condition 4 is wrong: the
seam does not bypass the confirm flow.

### But the condition is protecting something real

`requiresDashboardExecutionConfirmation` reads one hand-maintained list,
`DASHBOARD_EXECUTION_CONFIRM_ACTIONS`. Comparing it against the specs:

| | |
|---|---|
| specs whose `confirm`/risk requires confirmation | **210** |
| of those, **absent** from the runtime confirm list | **151** |

The absences include `appointment.mark_paid` (**T2**, money), `payment.buy_gift_card` (T2),
`catalog.assign_services_category_bulk` (**T3**, bulk). 97 are dashboard commands, where that list is
the only gate; there is no customer, provider or public equivalent — one list, dashboard-only.

So condition 4 is the only thing stopping the planner routing a T2 money operation whose confirmation
the runtime would not demand. It should stay, and the comment explaining it has been corrected to say
*why* rather than the reason I assumed.

### What this actually is

Two models of the same question — "must this be confirmed?" — disagreeing on 151 commands, with one
of them never consulted. That is the exact shape of `e2e-bug.355`, where `COMMAND_REGISTRY[].tiers`
and the deny-lists disagreed on 425 tier decisions and only one ran.

I am **not** claiming a live vulnerability, and the distinction matters. §13 lints at author time that
every T2/T3 spec declares `confirm: 'always'`, so the spec side may be policy that the runtime never
adopted rather than a rule the runtime is breaking. Which model is authoritative is exactly what has
not been established, and establishing it is the work — `e2e-bug.405`.

What is certain: the detector path routes these 151 actions **today**, so whatever the answer is, it
is already the answer in production. The planner is not the risk; it is the reason anybody looked.

### Not done

`e2e-bug.404` stays open and its fix direction is replaced. It is not "give the seam a confirmation
path" — the seam already inherits one. It is blocked on reconciling the two confirmation models, and
relaxing condition 4 before that would widen a gap rather than close one.

### Verification

- Fast chain **3,876 across 19**, 0 failures. No code changed; one comment corrected.

## §122 — which confirmation model is running, and how much of the gap is real

`e2e-bug.405` recorded 151 commands where `CommandSpec` requires confirmation and the runtime's
`DASHBOARD_EXECUTION_CONFIRM_ACTIONS` does not, and set the method: find out what the running system
does rather than argue which list looks authoritative.

### The trace corpus answers it outright

`ai_command_trace.outcome` has an `approval` value — the confirmation path leaves a row.

| group | commands with traffic | executed | **approvals** |
|---|---|---|---|
| **in** the runtime list | 18 | 23 | **24** |
| **not** in it | 31 | **211** | **0** |

Where the gate applies it fires — roughly one approval per execution. Where it does not, **211
executions and not one approval**. The runtime model is the one running, and the spec model has never
been enforced.

### Most of the gap is not a defect

The 211 break down T1 80 / T2 116 / T3 15, and the T2 bulk is customer-surface payment:
`pay_online` (25), `apply_gift_card_code` (24), `pay_cash_at_visit` (17), `buy_gift_card` (13).

Those already confirm — by being a checkout. A Stripe payment sheet *is* the user assenting, and
inserting an AI "are you sure?" in front of it would be a second confirmation of the same act. The
runtime gate is named `requiresDashboard…` because it was never meant to cover those surfaces.

So the specs over-declare: `ALWAYS_CONFIRM_TIERS` applies "T2 always confirms" as a blanket tier rule,
and for customer self-service the tier is right about the risk and wrong about who has already
consented.

### What is left is small, and specific

Restricting to commands **executed on the dashboard**, where that list is the only gate:

| | |
|---|---|
| dashboard specs requiring confirmation, absent from the gate | 97 |
| **of those, actually executed on the dashboard** | **13 commands, 36 traces** |

```
13x T3 operations.optimize_schedule      3x T2 commerce.delete_expense
 6x T2 commerce.record_expense           2x T1 marketing.deactivate_promo_code
 4x T1 operations.block_schedule         1x T2 appointment.mark_paid
                                         + 7 more at 1 trace each
```

A T3 schedule rewrite run 13 times unconfirmed, and expense records created and deleted unconfirmed,
are worth a decision. "151 commands unconfirmed" was not the right description of that.

### What I am not doing

Adding these 13 to `DASHBOARD_EXECUTION_CONFIRM_ACTIONS` would be a one-line change and I have not
made it. Confirmation is a product decision about interrupting a user, the specs are demonstrably
over-declaring on the tier rule, and picking 13 commands by traffic in a stopped corpus is not the
same as deciding which operations warrant an "are you sure?". The measurement is the deliverable; the
list is short enough to review.

The narrower fix that is clearly right — reconciling `requiresConfirmation` so the spec model stops
claiming something the runtime never does — is `e2e-bug.405`'s remaining scope.

### Verification

- Fast chain **3,876 across 19**, 0 failures. No code changed in this section.

## §123 — the audit e2e-bug.375 asked for, and five more reads registered as writes

`e2e-bug.375` warned that reasoning of the form "no command exists that does X" was being conducted
against `COMMAND_SPECS` when only 34 of 696 commands were specced, and would keep producing confident
wrong answers. Its premise is now obsolete — the port completed at 696/696 in §66 — but declarations
made during that era are still in the tree. So: audit them.

### The absence claims check out

190 of 341 mutating specs declare `none` or `manual`. Four give a reason that *asserts* something does
not exist, which is the exact failure mode:

| spec | claim | verdict |
|---|---|---|
| `provider.add_client_note` | "No delete-note command exists" | **correct** — 6 note commands in the registry, none deletes |
| `clinical.add_customer_staff_note` | same | **correct** |
| `agent.undo_latest_task` | "there is no undo of an undo" | self-consistent, not a lookup |
| `commerce.explain_gift_card_order_details` | "the registry marks it mutating but there is no write to undo" | **the registry was wrong** |

Checked against all 696 this time, which is what the ticket asks for.

### The fourth one was a lead

Its compensation admits the command is a read that the registry calls a write. Six specs say that in
their own text:

```
commerce.explain_gift_card_order_details   operations.check_schedule_compliance
commerce.delivery_queue                    operations.revenue_forecast
commerce.gift_card_creation_queue          operations.staff_service_matrix
```

All six carry the same cause as `e2e-bug.376`: a binding passing its whole intent list as its own
`mutateIntents`.

### §110's structural check missed them, and I can say exactly why

§110 checked the other whole-list bindings for reads by matching read **verbs** — `explain_`,
`list_`, `get_`, `summarize_`, `check_`, `lookup_`, `analyze_` — and reported "no read-shaped names,
so the declaration is accurate". These are named as **nouns**: `revenue_forecast`,
`staff_service_matrix`, `delivery_queue`. The heuristic had no way to see them.

It also under-counted the bindings: §110 said three used their full list as `mutateIntents`; a
structural match on the source finds **four** (`SCHEDULING_INTENTS`, `OPERATIONS_INTENTS`,
`PROVIDER_GIFT_FULFILLMENT_INTENTS`, `CUSTOMER_PUSH_NOTIFICATIONS_INTENTS`) plus the
`PROVIDER_PAYMENTS_INTENTS` duplicate §110 deleted.

Five are fixed the same way: an explicit read-only list excluded from the binding's `mutateIntents`,
and the specs corrected to **T0 with no compensation**.

### The sixth is deliberately left alone

`operations.staff_service_matrix` describes a read — "Show which staff can perform which services",
`confirm: 'never'`. But it is listed **explicitly** in two inline `mutateIntents` arrays and in
`DASHBOARD_EXECUTION_CONFIRM_ACTIONS`, and production shows it going through the approval path.

Two authors deliberately marked it a mutation; the other five were swept in mechanically. Reclassifying
it on the strength of a description would remove a confirmation gate, which is the wrong direction to
be wrong in. The reasoning is recorded next to the list it is absent from, and it belongs to
`e2e-bug.405`'s review, where the spec/runtime confirmation disagreement is already the subject.

### Verification

- Fast chain **3,876 across 19**, 0 failures.
- Red-means-red **exit 0**, 102 suites / 457 tests, manifest exact.

## §124 — the saga is still unwired, and the evidence to prioritise it does not exist yet

`e2e-bug.368` says the compensation engine has no handler wiring: nothing builds the `CaptureMap`, so
every `kind: 'inverse'` compensation resolves to `missing_capture`, and no transaction wraps a
`TransactionGroup`. Its header records the orchestration half as wired in §55 through injected
`captureState` / `runCompensation` seams.

### The seams exist and nothing supplies them

`executePlan` is genuinely live — five call sites in `ai-booking-core.service.ts`, two in
`provider-ai-command.service.ts`. But `captureState` and `runCompensation` appear **only inside
`ai-plan-executor.util.ts` itself**. No caller passes either, so:

```ts
if (wanted.length > 0 && options.captureState)      // never true
status === 'partial' && options.specs && options.runCompensation   // never true
```

The capture block and the saga are both unreachable in production. §55 built the seams; nothing was
threaded through them. Same shape as §108's Phase 6 island and §89's planner — a capability that
exists and is not connected — and it is now the third instance found by asking "who calls this?"

### The exposure, as far as it can be sized

| compound_intent | traces |
|---|---|
| failed | **235** |
| executed | 139 |
| clarified | 6 |

Multi-step plans fail 63% of the time. What matters for compensation is how many failed *after* a
successful write — a failure at step 1 has nothing to undo.

**That is not answerable from this corpus.** `result_summary`, the column carrying "Stopped at step
N", is empty on all 5,362 rows.

### Why it is empty is not what it looks like

Empty telemetry on every row reads like dead instrumentation, and the recorder's logic is sound —
it stores a summary for every non-executed outcome, which should cover 1,448 failures.

The column was added by migration `20260815120000`, dated **2026-08-15**. The last trace is
**2026-08-03**. It postdates the entire corpus by twelve days. The instrumentation is correct and
there is simply no data through it yet.

Worth stating because the wrong conclusion was one step away, and "this telemetry is dead" would have
sent someone to fix a recorder that works.

### Consequence

`e2e-bug.368` stays open and cannot be prioritised on evidence. The engineering is real — a
pre-write read per step driven by `compensation.captures`, and a transaction per aggregate group —
but whether it matters depends on how many of those 235 failures wrote something first, and that
number does not exist until traffic resumes with the column populated.

Recorded on the ticket so the next person does not re-derive the same dead end.

### Verification

- Fast chain **3,876 across 19**, 0 failures. No code changed in this section.

## §125 — sizing step 1 of the de-duplication, and one field that is not derivable

`e2e-bug.379` records that the spec port added a seventh place a command is declared without removing
any of the six, and lists five steps to fix it. Step 1 — "generate the registry rows FROM the specs
and delete the seed" — is the one everything else depends on, and it has never been sized.

### The registry is fully covered

All **696** registry entries resolve to a spec through `id` or an alias; none is orphaned. Conformance
already pins `surfaces`, `handler` and `mutating` for every one, so those three are reproducible
today.

### What a spec cannot yet produce

| registry field | entries setting it | status |
|---|---|---|
| `apiModule` | 696 | **must be added to `CommandSpec`** |
| `compoundStep` | 609 | **must be added** |
| `sprint` | 596 | must be added (traceability only) |
| `surfaceHandlers` | 16 | must be added (optional) |
| `label` | 696 | derivable — it is `id.replace(/_/g, ' ')` |
| `executionMode` | 696 | **mostly** derivable, see below |

So step 1 is four fields on `CommandSpec`, one of them needed by 16 commands and one purely for
traceability. That is a bounded change, which is worth knowing before anyone opens it.

### `executionMode` is not derivable, and the exception says why

695 of 696 follow `mutating ? <mutate mode> : 'read_only'`. The exception is
`provider.coordinate_waitlist_offer`: **T0, `mutating: false`, `executionMode: 'orchestration'`** — a
read that runs as a multi-step orchestration.

`orchestration` is a third mode carrying information neither `mutating` nor `risk` implies, so
deriving `executionMode` from `mutating` would silently demote that command to a single read. One
counterexample in 696 is exactly the density at which a derivation looks safe in testing and is not.

### Not attempted

Adding four fields to 696 specs is mechanical but it is a large diff, and it changes the file the
conformance suite validates *against* — which is the thing keeping every other deletion safe. It
wants to be its own change with its own review, not a rider on a measurement.

What this section provides is the number that was missing: step 1 is four fields plus one
non-derivable mode, not an open-ended migration.

### Verification

- Fast chain **3,876 across 19**, 0 failures. No code changed in this section.

## §126 — the planner routes all nine phrasings the detectors miss, and the test is contaminated

`e2e-bug.360` records that **9 documented `CommandSpec.examples` never reach their own command's
detector** — the ratchet §96 raised from 8. Meanwhile 0 of 116 mechanical variants
(casing/whitespace/punctuation) break anything, so the gap is genuine phrasing variety, not fragility.

Phase 8's premise is that the planner replaces those detectors. Nobody had asked whether it handles
the phrasings they miss.

### It handles all of them

| | |
|---|---|
| routed to the correct command | **9 / 9** |
| also executable | 8 / 9 |

The exception is `appointment.mark_paid` on *"Sarah paid cash for today's massage"*: routed correctly,
then blocked by `unresolved_notes`, because §87 makes an unresolved note fatal for a mutation. That is
the rule working — a T2 money command with something the planner could not pin down should not
execute — not a routing failure.

### The result is weaker than it looks, and the reason matters

**These nine strings are the specs' own `examples`.** `commandMatchText` is `description + examples`,
so every one of them is *in the embedding cache being searched*. Retrieval is being tested on its
training text.

So 9/9 is close to tautological for the retrieval half. What it does show is the half after it: given
a shortlist containing the answer, the model picked the right command nine times out of nine,
including two phrasings for the same command and one — "put all the massages under the Massage
category" — that names a different command's noun ("massages") than the one it belongs to.

**This is not held-out evidence that the planner beats the detectors**, and it would be easy to
present it as such. §88 needed a held-out arm for exactly this reason. The honest claim is narrower:
on the phrasings the ratchet tracks, the planner does not lose to the detector, and the specific
failure the ratchet counts does not reproduce through the planner path.

### What that means for the ratchet

`UNCOVERED_EXAMPLE_BASELINE` measures the **detector** layer. As domains are locked (§93) the number
stops describing anything users experience in those domains, and it will keep counting for the twelve
that are not. Left in place — it is still the live routing for most of the surface — but it is worth
knowing that it will not fall to zero by being fixed. It falls to zero by Phase 8 completing.

### Verification

- Fast chain **3,876 across 19**, 0 failures. No code changed in this section.

## §127 — the second slice, and where I stopped pushing it

`e2e-bug.395` has stood at "1 of 14 slices ready" since §94. `push` (67%) and `commerce` (64%) are the
only candidates near the bar, so both were diagnosed prompt by prompt rather than treated as a
percentage.

### The two are not the same problem

**`push`** — 6 prompts, all one command, `truthIn=y` on every one. Retrieval is not the issue. Four
routed; two did not, and the split is legible:

```
OK       Alert me whenever a customer reschedules
no-plan  Alert me whenever a customer cancels
```

Both spec examples said "reschedule"/"changes". A cancellation *is* a customer changing a booking, and
nothing in the spec said so.

**`commerce`** — 6 prompts, four distinct causes: one retrieval miss, one
`reject:needs_confirmation` (blocked by `e2e-bug.404`), and two `not_executable` that look correct on
reading — "Delete the nonexistent xyz123 expense" *should* refuse. Not one problem, and not one fix.

### The push fix, and its discipline

Two cancellation phrasings added from real traffic, taken from `action_changed_by IS NULL` rows — the
classifier's own confident labels — and deliberately **not** the prompts being measured on. The
description was left alone: §88 rewrote one to be more accurate and lost nine points to a diluted
vector.

| | before | after |
|---|---|---|
| push | 67% (12/18) | **83% (15/18)** |

Both cancellation prompts now route.

### Why it stops at 83%

One prompt remains: *"Tell me if a customer reschedules their visit"* — a "Tell me if" construction
where every covered phrasing is "Alert me" / "Notify me" / "Email me".

Adding a third example would very likely take the slice to 6/6 and past the 90% bar. I have not,
because on a six-prompt slice that is fitting to the test: the measurement would then say the examples
match the prompts they were drawn to match, which §126 has just finished warning about in a case where
the contamination was accidental. Doing it deliberately is worse.

**`push` stays below the bar, and `e2e-bug.395` stays at one ready slice.** The honest reading is that
83% is real improvement and 90% on n=6 is not a threshold that means much either way — six prompts
cannot distinguish 83% from 100% with any confidence, which is a fact about the slice, not about the
planner.

### Verification

- Fast chain **3,876 across 19**, 0 failures; embedding cache rebuilt, staleness gate green.
- Red-means-red **exit 0**, 102 suites / 457 tests, manifest exact.

## §128 — the 90% bar cannot be met by any slice, and that is about the corpus

> **Weighting caveat (§0.0, `e2e-bug.416`):** the trace corpus is a QA script — 5 businesses, 27 users, 75% repeated prompts. The per-command evidence below stands; anything weighted by traffic volume describes the script, not demand.

§127 noted in passing that "90% on n=6 is not a meaningful threshold". That deserved more than a
passing note, because the same bar has gated every retirement decision from §88 onward.

### Wilson intervals on the readiness table

95% confidence intervals on the §119 per-domain figures, trace-weighted:

| domain | traces | point | 95% CI | clears 90%? |
|---|---|---|---|---|
| **tour** | 33/34 | 97% | **85-99%** | *possible, not established* |
| push | 15/18 | 83% | 61-94% | possible |
| commerce | 7/11 | 64% | 35-85% | no |
| operations | 6/30 | 20% | 10-37% | no |
| business | 3/14 | 21% | 8-48% | no |
| booking / catalog | 5/56 | 9% | 3-28% | no |
| clinic / customer / marketing / payment / guide / compliance | 0/53 | 0% | 0-14% ... 0-79% | no |

**No domain's lower bound reaches 90%, including `tour`.**

And the structural fact behind it: to get a 95% lower bound at or above 90% you need **n >= 35 traces
with no failures at all**. `tour` has 34 traces and one failure. The largest slice in the corpus cannot
clear this bar even scoring perfectly.

### What that does and does not overturn

It does **not** say `tour`'s retirement was wrong. §92's evidence is still the strongest available:
33 of 34 recoveries on precisely the traffic the detectors decided, against a measured 20% loss from
deleting them with nothing behind. That comparison does not depend on a 90% threshold at all.

It does mean **"clears §42's 90% bar" was a stronger claim than n=34 supports**, and I wrote it that
way in §88, §92, §118, §119 and §127. The point estimate was reported as if it settled a threshold
question; it never could.

### The bar is being used outside its design

`PROPOSE_ONLY_ACCURACY_BAR = 90` comes from §42, where it gates a command against the **8,509-case**
deterministic corpus — a sample where 90% is a sharp line. Applying the same number to a per-domain
sample of 34, or 18, or 6 rescue-dependent traces is using a precise instrument on data that cannot
resolve it.

That is not fixable by gathering more data: traffic stopped 2026-08-03, and the rescue-dependent
population is 216 traces in total across all thirteen domains.

### What a defensible criterion looks like

Two options, both honest where the current one is not:

1. **state the interval** — retire when the 95% lower bound clears a lower threshold (say 70%), which
   `tour` does comfortably at 85% and nothing else approaches;
2. **compare against the alternative** rather than a constant — retire when planner recovery beats
   detector-deletion loss by a margin, which is what §92 actually measured and what actually decided
   `tour`.

The second is closer to what the decision needs: retirement is a choice between the planner and
nothing, not between the planner and an abstract bar.

Filed as `e2e-bug.406`.

### Verification

- Fast chain **3,876 across 19**, 0 failures. No code changed in this section.

## §129 — the planner's mutating half, unblocked by building the missing handshake

`e2e-bug.404`. §120 measured `decidePlannerRoute`'s condition 4 — "no confirmation required" —
rejecting **24 of 121** rescue-dependent prompts. That was the binding constraint on every mutating
command the planner could name, and the ticket was explicit that the fix was to give the seam a
confirmation path rather than relax the condition.

### The condition was guarding the right thing for the wrong reason

§121 had already established that the execute gate keys on the *action name*, so a planner-routed
action meets the same handshake as any other. The actual danger was the size of that handshake:

| | commands |
|---|---|
| `CommandSpec` requires confirmation (`requiresConfirmation`, T2/T3 derived from tier) | **210** |
| `DASHBOARD_EXECUTION_CONFIRM_ACTIONS` names | **59** |
| **gap the runtime would execute silently** | **151** |

The 151 include `appointment.mark_paid` (T2, money). So condition 4 was not protecting a handshake —
it was compensating for one that only covers 28% of what the spec model demands.

### I checked whether the specs were simply over-declaring, and they are not

§122 found some over-declaration (customer-surface payment, where the checkout *is* the
confirmation), so I tested whether the 151 were mostly sensitive **reads** miscounted as mutations —
`isMutatingSpec` is just `risk !== 'T0'`, which makes any T2 read look like a write.

They are not. A verb heuristic flagged 6 candidates and 4 were my own false positives: `adjust_`,
`claim_`, `collect_` and *filing* a breach `report` all mutate despite reading like queries. Only
`customer.export_data` and `commerce.export_analytics_report` are genuine reads. The 151 are real
mutations, and the gap is real.

### What was built

`ai-planner-confirmation.util.ts` — `shouldConfirmBeforeExecute`, which re-derives the spec
requirement at the execute gate:

```ts
if (input.alreadyConfirmed) return false;
if (requiresDashboardExecutionConfirmation(input.action)) return true;
if (input.candidateSource !== 'planner') return false;
return actionRequiresSpecConfirmation(input.action, input.specs);
```

Three deliberate properties:

1. **it re-derives rather than being told.** The obvious design returns `requiresConfirmation: true`
   from the route and carries it to the gate — across the route, the `IntentCandidate` and the
   understand result. A field dropped on any hop fails *open*, executing a T2 with no confirmation and
   no error. The registry lookup cannot be lost in transport. The route still carries the flag, but
   only for the trace, and it says so;
2. **it fails closed.** An action with no spec returns `true`;
3. **it is scoped to `candidateSource === 'planner'`.** Detector traffic is byte-identical. Applying
   the spec model everywhere is `e2e-bug.405` — a product decision about 13 dashboard commands — and
   settling it as a side effect of unblocking the planner would start interrupting users on flows
   that never asked.

The gate is a pure function and not a boolean inside `executeSingleIntent` because **nothing
constructs `AiCommandService` in a test**. Inline, this ticket's entire safety property would have
been asserted by comment. Extracted, 8 tests hold it, including "leaves every non-planner source
exactly as it was" and "covers every command the runtime confirm list misses".

Condition 4 is struck through in the header rather than renumbered, so the reasoning that removed it
stays attached to the slot it occupied. `needs_confirmation` is gone from the rejection union.

### What this does not claim

**24 unblocked rejections are not 24 more completed commands.** Every one of them required
confirmation, so what the user now gets is a correctly-routed command that *asks* — which is the
right behaviour, and is not the same as an answer. Any recovery figure quoted after this should say
which it counts.

The end-to-end delta is **unmeasured**: it needs a 121-prompt replay, and §128 has just finished
explaining what per-domain samples of that size can and cannot support. What is certain is
structural — the rejection reason no longer exists, and the 151-command gap is closed for the traffic
this seam creates.

### Verification

- Fast chain **3,889 across 19** (+13), 0 failures — `ai-planner-confirmation` added to
  `test:ai-command-planner`, since §100's lesson was that editing a module whose spec is not gated is
  how regressions get in.
- Red-means-red **exit 0**, 102 suites / 457 tests, manifest exact.
- Lint clean on all four authored files. `ai-command.service.ts` deliberately not run through
  `--fix` — §107.

## §130 — the resolver seam is not blocked on the confirmation gate, and never was

> **Weighting caveat (§0.0, `e2e-bug.416`):** the trace corpus is a QA script — 5 businesses, 27 users, 75% repeated prompts. The per-command evidence below stands; anything weighted by traffic volume describes the script, not demand.

§129 removed `decidePlannerRoute`'s confirmation condition, which `e2e-bug.399` named as its blocker.
That prediction was testable, so I tested it rather than closing the ticket on it.

### The harness, rebuilt and validated

The rescue-dependent corpus is 121 distinct prompts / 216 traces (`action_changed_by='rescue'`, all
dashboard, 119 owner + 2 receptionist). Replayed through the real path — embed, `narrowShortlist`,
`buildPlannerMessages`, `gpt-4o-mini` at temperature 0.1, `decodePlanResponse`, `validatePlan`,
`decidePlannerRoute`.

The baseline came back at **30.6%**, reproducing §119 exactly. That is what makes the rest of these
numbers worth reading.

### The measurement

| run | recovery | prompts OK |
|---|---|---|
| baseline | 30.6% | 27 |
| baseline, repeat | **32.4%** | 28 |
| resolvers rendered | **30.1%** | 27 |

And, because a difference is only meaningful against the noise:

| comparison | prompts changing verdict | OK flips |
|---|---|---|
| baseline vs baseline | **3** | 1 |
| baseline vs resolvers | **14** | 4 |
| baseline-repeat vs resolvers | 13 | 3 |

### What it says

**The change is real and it is not an improvement.** 13-14 prompts move against a 3-prompt noise
floor, so rendering the resolver genuinely changes what the model does — it just does not change it
for the better. `unresolved_notes` falls 31 -> 27 exactly as intended, and five prompts move from
`not_executable` to `not_single_step`: the added rule makes the model split work into steps it then
cannot route. Failures get reshuffled, not fixed.

**§129 did recover what §120 lost.** Resolvers-on was 28.7% in §120 and is 30.1% now, and the
difference is the `needs_confirmation` rejections that no longer happen. The mechanism §120 diagnosed
was correct. The conclusion drawn from it was not: removing the gate did not make the change pay,
because the change never beat doing nothing in the first place.

**So "blocked on `e2e-bug.404`" is withdrawn.** The deadlock the ticket describes is real — the
planner is asked for an id, forbidden from inventing one, and never told a resolver exists — but two
attempts at telling it about the resolver have now measured neutral-to-negative. The fix is not in the
prompt.

### A methodological note that applies backwards

Trace-weighting amplifies noise here: one prompt can carry 4 traces, so a single flip moves recovery
by two points. The two baselines differ by 4 traces and by **one** prompt. Prompt-weighted, all three
runs are 27, 28, 27 — visibly the same number.

Every per-domain figure in §119, §120 and the §128 readiness table is trace-weighted. §128 showed
those samples cannot support a 90% threshold; this shows they are noisier than they look at the
individual-comparison level too, and that a two-point difference in a trace-weighted recovery figure
is not evidence of anything without a repeat run. I have quoted such differences as though they were.

### Also, and separately

`e2e-bug.404`'s value on this corpus is **zero recovery**. Baseline was 30.6% before the fix and 30.6%
after — the confirm-required plans never reached the gate, because without the resolver rendering they
die earlier at `unresolved_notes`. The fix is worth keeping for what §129 actually argued: it closes
the 151-command gap between the spec model and the runtime confirm list for planner-routed actions.
That is a safety property, not an accuracy one, and it should not be quoted as the latter.

### Verification

- Fast chain **3,889 across 19**, 0 failures; `ai-command-plan` suite 141/141 after the revert.
- The flagged experiment is fully reverted; no dead flag left behind. The comment at the
  non-rendering site now records both measurements, so a third attempt starts from the evidence.

### Filed in passing

`e2e-bug.407` — this harness has now been rebuilt from scratch five times (§115, §116, §119, §120,
§130) and deleted five times. §130's numbers are only known to be comparable to §119's because the
baseline happened to land on 30.6% again; that is luck, not method. It belongs in
`backend/scripts/` with the corpus query, the verdict buckets and a repeat-run mode, so the noise
floor comes free instead of costing an extra run to discover.

## §131 — the replay harness, checked in; and a file grep could not read

`e2e-bug.407`, filed at the end of §130 because the harness had been rebuilt and deleted five times.

### What building it properly turned up

The first thing was that **a version of it already existed**. `ai-planner-shadow-replay.spec.ts` — 253
lines, opt-in behind `AI_SHADOW_REPLAY=1`, same mechanism — has been in the tree since §70. It answers
a different question (shadow agreement across the whole executed corpus, not routing recovery on the
rescue-dependent slice), which is why nobody reached for it, but the machinery is the same machinery.

Reading it before writing anything found two things my throwaway had wrong:

1. **the access tier comes from the surface, not the role.** The trace's `role` is the business role
   profile; the gateway derives the tier as `resolveAccessTier(membershipRole ?? role)` and
   `membershipRole` is not stored, so a customer-surface request from an owner records `owner` while
   being gated as `client`. `isSpecAllowedForTier` is exact membership, so planning that row as
   `owner` permits about seven commands. It had already invalidated one narrowing measurement;
2. **deterministic sampling.** Its query orders by `md5(prompt_raw)` and says why: at n=40 the same
   configuration produced 25% and 40% empty plans across two random samples, which made every
   comparison in §70-§78 unfalsifiable.

Neither would have changed §130 — that corpus is entirely dashboard, so the tier rule reduces to
`role ?? 'owner'`, and the query never sampled. I checked rather than assumed.

### What shipped

`ai-planner-replay.util.ts` holds only what must not drift between measurements: the corpus query,
the tier rule, the per-prompt replay through the real pure stages, and the summary and churn
arithmetic. Reporting stays in the caller — what a run is *asking* differs, and forcing that into a
shared shape would be a worse abstraction than the duplication.

`ai-planner-replay.manual.spec.ts` is the rescue-corpus runner, `describe.skip` unless `AI_REPLAY=1`
so it shows in a listing as deliberately skipped rather than as a suite that passed without doing
anything. `REPLAY_LIMIT=3` gives a smoke path that does not cost 121 completions — and says in its own
output that a limited run is not a measurement.

The arithmetic is **unit-tested** (12 tests, in `test:ai-command-planner`): tier derivation, bucketing,
problem-code tallies, and churn — including that a short second run compares only the overlap, since
counting missing prompts as churn would understate the very noise floor this exists to protect.

Smoke-run end to end at `REPLAY_LIMIT=3 REPLAY_RUNS=2`: 0 of 3 prompts changed verdict between
identical runs. The harness works, rather than merely compiling.

I did **not** migrate the shadow spec onto the shared util. It is opt-in, no gate covers it, and
rewriting working code that nothing would catch breaking is not a side effect worth having. Filed as
`e2e-bug.409`.

### The file grep could not read

Chasing `EMBEDDING_MODEL` through `ai-command-shortlist.util.ts` returned nothing — repeatedly, for a
constant that is plainly declared on line 47. `file` reports the reason: **`ai-command-shortlist.util.ts`
was binary.**

Not corrupt. §96's `commandMatchTextHash` uses `\x00` and `\x01` as field delimiters, and they were
written into the source as **literal control bytes** rather than as escape sequences. One NUL byte is
enough for `grep` to classify the file as binary and silently skip it — no error, no warning, just no
matches.

That is a bad failure mode in a codebase where grep is the primary way anything gets found, and it had
already misled me twice in one session. Replaced with `\u0000` and `\u0001`; the string values are
unchanged, which the embedding staleness gate confirms by still matching its stored hash. Filed as
`e2e-bug.408`.

### Verification

- Fast chain **3,902 across 19** (+13), 0 failures.
- Red-means-red **exit 0**, 102 suites / 457 tests, manifest exact with the two new suites present.
- Harness smoke-run against the live corpus; lint clean; `tsc` clean on the new files.

## §132 — "80% of documented examples fail" is two unrelated problems

`e2e-bug.380`. 449 of 559 spec examples do not reach their own command, and the ticket's own next step
was to decide, per example, whether the *example* is unrealistic or the *routing* is missing. That is
answerable deterministically, with no LLM and no cost, so it should have been answered before anything
else was built on the headline number.

### The split

| | examples |
|---|---|
| **nothing routes it** (`got none`) | **343 (76%)** |
| **a different command claims it** | **106 (24%)** |

Two different defects. An unclaimed example needs routing built; a stolen one needs a detector
narrowed. Reporting them as one 80% figure hides which of those the work is.

The stealing is diffuse rather than the fault of one greedy detector — `create_booking` takes 10,
`reschedule_booking` 7, `show_appointments` 5, and a long tail below that.

### By domain, and the one that is different

| domain | unclaimed | stolen |
|---|---|---|
| operations | 59 | 16 |
| clinic | **55** | 5 |
| commerce | 51 | 10 |
| provider | 29 | 15 |
| booking | 21 | 12 |
| **customer** | 16 | **18** |
| compliance | 6 | 0 |

`customer` is the only domain where more examples are stolen than unclaimed — it is *contested*,
not absent. `clinic` at 55/5 is almost purely absent. Those need opposite work, and the aggregate
would have sent both to the same place.

### The other hypothesis, tested and dropped

I sampled the unclaimed examples to check they were not simply unrealistic phrasings written by
whoever authored the spec:

> "delete the Wellness category" · "activate the Bridal package" · "turn the monthly plan back on"
> · "put Gevorg on the Gold membership" · "why is my total this much"

These are ordinary. For this sample the routing is missing, not the example bad — which is what the
ticket warned against "fixing" by deleting examples.

### Two things this changes

**Risk tier does not predict failure.** T0 20%, T1 18%, T2 21%, T3 21% — flat. If these commands
failed because they were hard, the hard ones would fail more. They do not, which is consistent with
343 of them having no detector at all rather than a weak one.

**It reframes retirement risk.** Deleting detectors cannot cost anything for the 343 examples nothing
routes today — the planner starts from `none` and can only match or improve. The exposure is
concentrated in the 106 contested examples and the 110 that currently pass, which is a far smaller
and more inspectable surface than "449 failures". 185 of the 280 uncovered commands have **zero**
routing examples; those commands are unreachable from natural language regardless of Phase 8.

`tour` and `guide` do not appear in the table at all — the two retired domains have no
eval-uncovered commands. Retirement started with the best-covered slice, which is worth knowing when
reading §128's readiness numbers.

### Made permanent rather than reported once

The split is now a test in `ai-command-eval.spec-coverage.spec.ts`, with a **ceiling of 106 on the
stolen half** that may only fall. Only that half can regress from someone else's change: a widened
detector answering to another command's documented phrasing is exactly the failure mode §44's
miss→fixture pipeline is most likely to introduce, and nothing was watching for it.

### Verification

- Fast chain **3,903 across 19** (+1), 0 failures. `ai-command-eval.spec-coverage` 5/5.
- No production code changed; the 110 routable floor is untouched.

## §133 — the customer surface is not weak, it has ten broken commands; one had never worked

> **Weighting caveat (§0.0, `e2e-bug.416`):** the trace corpus is a QA script — 5 businesses, 27 users, 75% repeated prompts. The per-command evidence below stands; anything weighted by traffic volume describes the script, not demand.

`e2e-bug.361` established that the platform's 27% failure rate is mostly a customer-surface problem —
69% of traffic at 60.6% completion / 31.1% failure — and that any route to §7's >=92% north star runs
through it. It stopped there, at the surface level. That is not actionable, so the next question is
which commands.

### It is not the surface, it is ten commands

Customer traces, actions with >=25 traces, by failure rate:

| action | traces | failed | fail % |
|---|---|---|---|
| **claim_referral_code** | 96 | **96** | **100.0** |
| reschedule_my_booking | 31 | 29 | 93.5 |
| find_soonest_appointment | 31 | 27 | 87.1 |
| confirm_my_booking_details | 134 | 102 | 76.1 |
| compound_intent | 338 | 222 | 65.7 |
| explain_provider_specialty | 44 | 27 | 61.4 |
| pay_online | 63 | 38 | 60.3 |
| apply_gift_card_code | 57 | 33 | 57.9 |
| my_appointments | 35 | 19 | 54.3 |
| book_appointment | 44 | 23 | 52.3 |

Against healthy neighbours on the same surface: `check_availability` 3.9%, `give_ai_feedback` 5.4%,
`recommend_specialists` 10.1%, `list_services` 12.3%.

**Ten commands carry 53.5% of all customer failures.** Bringing just those to 90% would move the
customer surface from 60.6% to **83.9%** completion. The surface is not uniformly weak; it has a small
number of things that are broken.

### A note on why `failure_reason` could not help

The column is null for all 1,448 failures, on every surface. That is not missing telemetry: the
migration adding it is dated **2026-08-15** and traffic stopped **2026-08-03**. Same shape as the
`result_summary` near-miss in §124 — a column that postdates its corpus looks exactly like a column
nothing writes.

### `claim_referral_code`: 96 attempts, 0 successes, and the cause is one argument

Every stored attempt looks like this:

    prompt: "I want to claim referral code FRIEND25"
    params: {}
    action_changed_by: (none)

The classifier named the action correctly **every time**. The handler is correct too — it reads
`params.referralCode` and, finding nothing, replies *"What referral code would you like to claim?"* to
a user who has just typed the code.

The extractor also already existed, and was already tested:
`enrichClaimReferralCodeParamsFromPrompt`. It was called from exactly one place — the **rescue** path —
and `rescueClaimReferralCodeIntent` returns null when the action is already `claim_referral_code`. So
the enrichment ran only when the classifier had been **wrong** about the action, and it never was.

Getting the action right is what broke it. Every piece worked; they were wired to each other in the
one arrangement where the code is dropped.

`handleClaimReferralCodeLogic` now takes the `prompt` — as eleven sibling handlers in the same file
already do — and enriches params from it. Run against all 96 stored prompts, the extractor yields a
code for **96 of 96**.

Stated precisely: those 96 now reach `claimCustomerReferralCode` with the code the user typed instead
of being turned away. Whether each individual claim then succeeds depends on whether the code is
valid, which is the service's business to answer and not something this corpus can tell me.

The spec also declared `variables: {}`, so the planner had no way to know the command takes an
argument either. Now declared — optional, because "use my invite code" is one of its own documented
examples and names no code.

### Filed

`e2e-bug.410` for the fix; the remaining nine commands stay under `e2e-bug.361`, now with numbers
attached.

### Verification

- Fast chain **3,903 across 19**, 0 failures; red-means-red **exit 0**, manifest exact.
- `ai-rewards-and-referral-claim` 24/24, including the four real production prompts as cases, plus
  "must not invent a code" and "an explicit param wins over the prompt".

## §134 — the failure rate counts questions as failures

Continuing `e2e-bug.361` into the second of its ten broken commands,
`find_soonest_appointment` (27 of 31 failed). Its handler turned out to be in good shape — it already
takes the prompt, enriches params, resolves the service against the catalogue. Its two unhappy paths
are:

- *"Specify which service to find the soonest opening for."* — a question, `details.clarify: true`;
- *"no slot available"* — a truthful negative.

Both are recorded as `outcome = 'failed'`, which sent me to the classifier rather than the handler.

### One question, four definitions

`resolveCommandTraceOutcome` decided clarification like this:

```ts
if (result.details?.needsClarification === true || action === 'clarify' || action === 'unknown')
  return 'clarified';
```

Handlers overwhelmingly do not set that key:

| key | occurrences | files |
|---|---|---|
| `details.clarify: true` | **646** | 178 |
| `details.needsClarification: true` | **19** | — |

So a handler that asked the user a question was recorded as having **failed**, roughly 34 times out of
35 by call site.

And the canonical predicate already existed — `isClarifyResult` in `ai-clarify.util.ts`, handling all
three shapes (`clarify`, `needsClarification`, `clarifyRequest`). Its doc comment names the caller it
was written for:

> "Exported so the guide fallback and **the trace writer** can both branch on one definition instead
> of each re-deriving it from a different flag."

The trace writer was the one re-deriving it. This is the same shape as `e2e-bug.410` one section ago:
the right thing existed, tested, and one call site did not use it.

### What this does and does not fix

`resolveCommandTraceOutcome` now calls `isClarifyResult`. The failure boundary is held by a test —
`{ reason: 'card_declined' }` must stay `failed`, because reclassifying real failures would hide
defects behind a friendlier label, which is the opposite of the point.

**It cannot correct the historical numbers.** The trace table stores `params`, not `details`, so there
is no way to recompute the outcome of a stored row. `e2e-bug.361`'s 31.1% customer failure rate, the
27% platform figure, and the per-action rates in §133 all count an unknown share of questions as
defects. The direction is certain and the magnitude is not, and every one of those numbers should be
read with that caveat until traffic resumes.

**§133's ten broken commands survive as a ranking**, because the healthy comparators were measured the
same way — `check_availability` at 3.9% and `claim_referral_code` at 100% are not both explained by
clarify-misclassification. But the absolute rates are upper bounds, not estimates.

### The gate that did not run

The fast chain reported 3,903 both before and after I added three fixtures, which is how I found that
`ai-command-trace.util.spec.ts` was in no gate at all — while `ai-command-trace-attribution` and
`ai-command-trace-session` were. Exactly §100's lesson, in the same file family. Added to
`test:ai-trace-attribution`; the chain now reports 3,918.

### Verification

- Fast chain **3,918 across 19** (+15), 0 failures; red-means-red **exit 0**, manifest exact.
- Filed as `e2e-bug.411`.

## §135 — the compound diagnostic was not attached to the surface that needed it

`e2e-bug.361`, third command: `compound_intent`, 222 failures of 338 and the largest single bucket on
the customer surface.

### The decomposer is not the problem

Both gates on that path are deterministic, so they can be run against the real prompts for free.
Across all 338 stored compound prompts:

| | prompts |
|---|---|
| `isCompoundPrompt` says no | 6 |
| decomposes to fewer than 2 steps | **0** |
| decomposes to 2+ steps | **332** |

Decomposition works. The failures are in *executing* the steps, and the constituent step that
dominates them is `book_nearest_slot` — present in 148 of the 222 failed compounds, and itself failing
45.1% standalone.

That is an association, not an attribution: appearing in a failed compound is not the same as being
the step that failed, and the parent trace records only that the whole thing failed. Which is the
actual finding.

### The table built for this question is not fed by this surface

`ai_command_trace_step` exists — table, two views, extraction, a fire-and-forget recorder — added
precisely because, in the migration's own words, *"the only recorded fact was that the whole compound
failed, which cannot distinguish causes that need opposite fixes"*. It is empty, which is explained by
the migration postdating the corpus.

It would still be empty. `extractCompoundStepRows` reads `details._compoundSteps`, written by
`attachCompoundStepAttribution` — and that is called from **`ai-command.service.ts` only**.
`executeCustomerCompoundFromSteps` never called it, so the customer surface would have produced zero
step rows when traffic resumed. The diagnostic was not attached to the surface with the worst number
on the platform.

### Why it could not simply be attached

`buildCompoundStepOutcomes` infers each step's outcome from plan step ids and the execution timeline,
and treats *no plan ids* as `not_planned` — "the decomposer named this sub-intent but no plan was
built for it". The customer path has no planner: it dispatches handlers in a loop. Attaching with
empty ids would have marked every step never-planned and filled
`ai_command_compound_silent_drop` — the honest-partial-success view — with compounds that dropped
nothing.

So the attribution gained `directOutcomes`, for paths that executed the steps themselves and therefore
know rather than infer. The customer loop now reports per step on both the failure and the success
path — success rows included, because without them
`ai_command_compound_step_failure` has no denominator and would show every sub-intent at 100%.

### A bug I wrote and caught

I first validated `directOutcomes` with `.filter()`. These are **positional**, so a dropped bad entry
slides every later outcome onto an earlier sub-intent — silently attributing a failure to the wrong
step, which is the single thing this table exists to get right. The test I had written passed anyway,
because the invalid entry happened to be last.

Mapped to `undefined` instead, so an untrusted entry is a hole that falls back to inference, and the
guard test now puts the bad entry **first**.

### Checked and not claimed

The loop caps at `steps.slice(0, 4)`. No stored prompt decomposes past four (distribution: 254 at two
steps, 74 at three, 4 at four), so the cap drops nothing on observed traffic and I am not reporting it
as a defect.

### Verification

- Fast chain **3,923 across 19** (+5), 0 failures; red-means-red **exit 0**, manifest exact.
- The five failures in the touched suites are all pre-existing manifest entries, checked by name
  before and confirmed by the sweep.
- Filed as `e2e-bug.412`.

## §136 — two thirds of a command's failures belong to other commands, and the attribution is blind

`e2e-bug.361`, fourth command: `confirm_my_booking_details`, 102 failures of 134.

### Most of them are not this command

Reading the failing prompts is enough:

> "I want to leave a review for my last visit, 5 stars" · "I want to pay online for my facemassage
> booking" · "Sign me up for a membership plan and book my first visit" · "Explain why Stripe is
> required for this booking"

Several other commands' classifier rules already say *"NOT confirm_my_booking_details"* in as many
words, so the platform knows this action over-claims. It is `e2e-bug.380`'s **stolen** category
(§132), seen from the other side.

Running the deterministic rescue layer over all 102 failing prompts with the action the classifier
actually produced:

| | prompts |
|---|---|
| rescue proposes a **different** action | **40** |
| rescue leaves it alone | 62 |

The 40 land on `guide_user_flow` (8), `explain_subscription_vs_one_time` (6),
`check_providers_for_service` (6), `leave_visit_review` (3), `pay_online` (1) and a tail. The 62 are
genuinely this command — "confirm my booking details", "What did I just book?", "Ինչ ժամի է իմ
ամրագրումը?" — and fail for a different reason.

So this is two defects again, in roughly 40/60 proportion: a routing steal, and whatever breaks the
command when it *is* the right one.

### A claim I nearly made, and why it was wrong

In production not one of those 102 traces has `action_changed_by = 'rescue'`. Across the whole corpus:

| surface | traces | rescued |
|---|---|---|
| dashboard | 1,161 | 216 |
| **customer** | 3,703 | **0** |
| **provider** | 498 | **0** |

"Rescue has never fired outside the dashboard" is what that looks like, and it would have been a
striking finding. §134 had just taught me that a null column can be a recording artefact, so I checked
the writer instead of the data — and it is:

| surface | traces | with `pipeline_trace` |
|---|---|---|
| dashboard | 1,161 | 1,006 (87%) |
| customer | 3,703 | **262 (7%)** |
| provider | 498 | **3 (0.6%)** |

`attributeActionChange` walks the pipeline trace and needs a `classify` entry to compare against. No
trace, no attribution — `action_changed_by` is null by construction for **93% of customer traffic and
99% of provider traffic**, whatever rescue did.

That is its own finding, and a worse one than the question I was asking: every stage-attribution
analysis on this platform — which stage decided an action, which detector stole it, how often rescue
helps — is blind on the surface carrying 69% of the traffic. §132's steal analysis and §133's ranking
both rest on it.

### What survives the correction

Restricted to traces that *do* carry a pipeline trace, the difference is still real: **0 of 262** on
customer against **216 of 1,006 (21.5%)** on dashboard. At n=262 with zero events the 95% upper bound
is about 1.4%, so this is not a sampling accident.

And it sits against the measurement above, where the same rescue service, called directly with
`surface: 'customer'`, proposes a better action for 40 of these 102 prompts. The customer surface goes
through the same `CommandUnderstandingPipelineService` and the same `stageRescue`. So the capability
is there, it is reachable, and in production it does not act.

**I could not close that gap in this session and am not going to guess at it.** The direct call passes
empty params and no session context, which the pipeline does not; a later stage may overrule the
rescue; the steal-guard may block it. Those are three different explanations and I have evidence for
none. Filed as `e2e-bug.414` with the measurement attached.

### Filed

- `e2e-bug.413` — 93% of customer and 99% of provider traces carry no `pipeline_trace`, so stage
  attribution is blind on most of the platform's traffic;
- `e2e-bug.414` — rescue proposes a correction for 40 of 102 `confirm_my_booking_details` failures
  when called directly, and changes nothing in production on the customer surface (0 of 262 traced).

No code changed. Fast chain and sweep unchanged from §135 (**3,923 / 0**, sweep exit 0).

## §137 — the customer surface now records what decided its actions

`e2e-bug.413`. §136 measured `pipeline_trace` present on 87% of dashboard traces and **7% of customer,
0.6% of provider** — which makes `action_changed_by` null by construction on almost all of the
platform's traffic, because `attributeActionChange` needs a `classify` entry to compare against.

### One branch out of forty

`buildGatewayCommandTraceInput` reads the trace from `result.details.pipelineTrace`. The dashboard
service has put it there since §1.1, through `finalizeCommandTraceResult` wrapped as a local
`traceStamp` helper applied at each return.

`CustomerAiCommandService.executeCommand` mentioned `pipelineTrace` exactly **once**, in the `blocked`
branch — one of about forty exits. Everything else returned untraced. That is the 7%.

### Wrapped, not stamped forty times

Copying the dashboard's per-return pattern would work today and rot immediately: the next `return`
added to a 40-exit method goes untraced, silently, and nothing fails. So `executeCommand` became a
thin wrapper around the former body, and the trace comes back through a **per-call sink**:

```ts
const sink: CustomerTraceSink = {};
const result = await this.runCommand(businessId, prompt, history, context, sink);
if (!sink.pipelineTrace) return result;
return stampCommandTraceDetails(result, { pipelineTrace: sink.pipelineTrace, ... });
```

Per-call rather than an instance field, so concurrent requests cannot read each other's trace — the
obvious shortcut here is a `private lastTrace`, and on a service handling parallel requests that is a
cross-request data leak into telemetry.

The sink is filled **immediately after `understand` returns**, before the `blocked` and `clarify`
exits rather than after them. Those are the paths most worth attributing, and they return long before
the dispatch below.

### What I could not do

There is no end-to-end test. Nothing in the repo constructs `CustomerAiCommandService` — the same wall
§129 hit with `AiCommandService`, where the answer was to extract the logic into a pure function. That
does not apply here: the property is *"every exit is stamped"*, which is a property of the method's
shape, not of a function that could be extracted. The wrapper is what makes it true — there is exactly
one exit now, and it stamps.

Being unable to test either of the platform's two main command services is now a recurring obstacle
rather than an observation, so it is filed as `e2e-bug.415`.

### What this does not retroactively fix

Nothing already recorded. The 3,441 customer traces with no pipeline trace stay unattributable, so
§132's steal analysis and §133's ranking keep the caveat `e2e-bug.413` puts on them. This changes what
the next traffic records, which is the only thing it could change.

### Verification

- Fast chain **3,923 across 19**, 0 failures; red-means-red **exit 0**, manifest exact.
- The two failures in the touched suites are pre-existing manifest entries, checked by name.

## §138 — withdrawing §136's rescue finding: the sample could not have shown it

`e2e-bug.414` claimed rescue proposes corrections on the customer surface that never happen. Two
sections later, with `e2e-bug.413` fixed, the claim does not survive its own evidence.

### The correction

§136 reported that even restricted to traces carrying a pipeline trace, rescue changed the action **0
of 262** times on customer against 21.5% on dashboard, and argued that this was too large a gap to be
sampling. It was not sampling — it was worse. Those 262 rows are:

| action | outcome | count |
|---|---|---|
| `unknown` | clarified | 233 |
| `error` | failed | 29 |

That is the entire traced customer population, and it is exactly what §137 predicted: the only
customer results carrying a trace came from the `blocked` branch, the one exit of ~40 that stamped it.

**A row whose action is `unknown` cannot exhibit an action change.** `attributeActionChange` compares
the classified action to the final one; there is no rescue to attribute in a request that never
resolved an intent. The 262 were not a small sample of customer traffic, they were a sample of exactly
the requests where rescue has nothing to do. The comparison to dashboard's 21.5% was meaningless, and
I drew a confidence bound on it.

### What the pipeline actually does

Rather than read the column again, I ran the pipeline. For all 40 prompts where the rescue service
proposes a change when asked directly, driving the real `CommandUnderstandingPipelineService` with the
classifier output production recorded (`confirm_my_booking_details`, confidence 0.9):

**40 of 40 rescues were applied by the pipeline.**

So the capability is not merely reachable — on this evidence it works. `e2e-bug.414`'s premise is
withdrawn.

### What is still unexplained

102 production traces nonetheless recorded `confirm_my_booking_details` as their final action, and 40
of those prompts are ones the pipeline rescues in replay. Something about the production inputs
differs from the replay — session context, prompt normalisation, and the fact that every one of these
traces has a **null confidence** are the candidates, and I have tested none of them. That is the
remaining question, and it is now a much narrower one than "rescue does not fire".

### Kept as a test, not a paragraph

Four of the verbatim production prompts are now
`ai-customer-rescue-applies.integration.spec.ts`, in `test:ai-steal-guard`. They assert the pipeline
routes them to `leave_visit_review`, `explain_why_stripe_required` and `pay_online` rather than
`confirm_my_booking_details`. A finding that only exists in a roadmap section is one nobody will
notice breaking.

### The pattern worth naming

Three sections in a row have now turned on a null column meaning "not recorded" rather than "did not
happen" — §134 (`failure_reason`, and clarifications recorded as failures), §136 (`pipeline_trace`),
and this one, which is §136's own conclusion failing the same way one step further down. Checking the
writer before trusting the column is not a precaution here, it is the main technique.

### Verification

- Fast chain **3,927 across 19** (+4), 0 failures; red-means-red **exit 0**, manifest exact.

## §139 — the trace corpus is a QA script, and much of this programme has been weighting it as demand

Chasing §138's remaining question — why 102 production traces kept `confirm_my_booking_details` when
the pipeline rescues those prompts 40 of 40 in replay — I varied every candidate difference:

| variant | rescues applied |
|---|---|
| baseline (confidence 0.9, empty session) | 40/40 |
| null confidence | 40/40 |
| low confidence 0.3 | 40/40 |
| session with `bookingId` | 40/40 |
| session with manage token | 37/40 |
| null confidence + session | 40/40 |

None of them explains it, and `kept` is **zero** in every variant — the pipeline never leaves the
action alone. So I looked at what else those rows had in common, and found something that matters far
more than the question I was asking.

### What the corpus actually is

| | |
|---|---|
| traces | 5,362 |
| distinct businesses | **5** |
| distinct users | **27** |
| traces from the largest business | **5,110 (95%)** |
| distinct prompts | 2,217 |
| traces that are a repeat of an earlier prompt | **4,040 (75%)** |

And the repetition is not a long tail:

| prompt | traces | distinct users | days |
|---|---|---|---|
| "Help me with this page" | **125** | **0** | 2 |
| "How do I book an appointment?" | 124 | 1 | 4 |
| "How do I use the Home tab?" | 33 | 1 | 3 |
| "confirm my booking details" | 24 | 1 | 3 |

A prompt fired 125 times in two days by no identified user is a test script. So are customer-surface
requests recorded with `role = owner` and a null `user_id`, which is what all 102 of the traces I was
chasing look like.

### What this invalidates, and what it does not

**It does not invalidate per-command failure evidence.** `claim_referral_code` failing 96 of 96 with
empty params was a real defect with a real cause, found and fixed (§133), and it would be a defect at
any volume. The same holds for the routing and telemetry findings in §134-§138: those are statements
about code paths, established by reading and running the code, and the traces only pointed at them.

**It does invalidate every traffic-weighted claim.** "The customer surface carries 69% of traffic",
the per-action volumes ranking §133's ten commands, the trace-weighting throughout §92, §119, §128 and
§130 — all of those weight by how often the QA script ran a prompt, not by how often anyone wanted it.
`e2e-bug.361`'s framing, *"any plan to reach the >=92% north star has to be mostly a customer-surface
plan"*, rests on that 69% and cannot be supported by this data.

§128 already showed the per-domain samples were too small to carry a 90% threshold. This is the same
problem one level up: they are also not a sample of demand.

### Why it went unnoticed

Nothing about a trace row says "synthetic". The corpus is real output from the real system on real
prompts — which is exactly why it has been so productive for finding defects. It only misleads when
counted, and counting is what a completion-rate metric does. The five-business, 27-user shape is one
`count(distinct)` away and nobody, including me across a dozen sections, ran it.

### Filed

`e2e-bug.416`. The honest resolution is not to discard the corpus but to label it: it is a **defect
finder**, not a **priority signal**, and any figure quoted as the second needs traffic that does not
exist yet.

### Verification

No code changed. Fast chain and sweep unchanged from §138 (**3,927 / 0**, sweep exit 0).

## §140 — the planner reaches 301 commands the detectors cannot, and I have to discount the number

§132 split `e2e-bug.380`'s 449 failing spec examples into **343 unclaimed** and 106 stolen, and said
the unclaimed half "needs routing built". Read literally that means authoring 343 new
`legacy_paraphrase` detectors — which is exactly what Phase 8 exists to delete. It would be paying
down one debt by taking out more of another.

The question Phase 8 actually needs is whether the **planner** already reaches them.

### The measurement

343 examples, derived from the same report the ratchet guards rather than a copied list — it
independently reproduced §132's 343. Replayed through the shared `e2e-bug.407` mechanics so the
numbers stay comparable to §130's.

**301 of 343 = 87.8%**, against detectors reaching 0 of them by construction.

| verdict | examples |
|---|---|
| OK | **301** |
| `reject:not_executable` | 36 (35 of them `unresolved_notes`) |
| wrong command | **4** |
| `reject:not_single_step` | 2 |

Per domain: marketing 17/17, integration 16/16, push 11/11, compliance 6/6, booking 20/21, catalog
16/17, customer 15/16, provider 26/29, operations 53/59, commerce 42/51, clinic 41/55.

### The discount, which is large

**The planner was shown the answer.** `renderShortlist` emits each command's own examples verbatim as
`e.g. "…"`, and `commandMatchText` — the text the embedding index is built from — is
`description + examples`. So for these particular prompts both the retriever and the model had the
exact string in front of them. 87.8% on an input that is present in the index and in the prompt is
much closer to a lookup than to comprehension.

So this is an **upper bound on planner reach, not an estimate of it**, and it should never be quoted
beside §130's 30.6% as though the two measured the same thing. They are near-opposite conditions: the
rescue corpus is prompts the detectors already failed on, and this is each command's canonical
phrasing.

### What survives the discount

Two things, and they are worth having.

**The plumbing works end to end for 301 commands that have no detector at all.** Retrieval surfaces
them from 696, permission filtering keeps them, `validatePlan` passes them, `decidePlannerRoute`
routes them. Whatever else is true, these commands are not unreachable — they are unreachable *by the
layer being retired*.

**The 42 failures failed while being shown the answer**, which makes them a much stronger signal than
the successes. 35 are `unresolved_notes` — the planner declining for missing information on a
phrasing its own spec offers as complete. That is the §99/§120/§130 resolver deadlock again, now
visible without any traffic weighting, and it is the same 12% wherever I look.

### Why this measurement is worth more than its predecessors

It is immune to `e2e-bug.416`. There is no traffic weighting: one example, one case, truth is the
command whose spec documents it. §139 established that every trace-weighted figure in this programme
describes a QA script's distribution. This one describes the registry.

### Filed

`e2e-bug.417` — the uncontaminated version: hold the examples out of the index and the prompt, or
measure against paraphrases the specs do not contain. Until then 87.8% is a ceiling.

### Verification

- New harness `ai-planner-spec-examples.manual.spec.ts`, `describe.skip` unless `AI_REPLAY=1`, with
  `REPLAY_LIMIT` for a smoke run. Reuses `ai-planner-replay.util.ts` rather than rebuilding.
- Fast chain **3,927 across 19**, 0 failures; red-means-red **exit 0**, manifest exact.

## §141 — the planner reaches 62% of what the detectors cannot, and the contamination was worth 26 points

`e2e-bug.417`. §140 measured 87.8% and said it was a ceiling because both the retriever and the model
had been shown the exact string. This measures how much of it was the contamination.

### Three arms

Same 343 examples, same pipeline, one variable at a time:

| arm | reaches | `empty_plan` | `unresolved_notes` |
|---|---|---|---|
| **as shipped** — example rendered, retrieval on | 301 / 343 = **87.8%** | 3 | 35 |
| **example held out**, retrieval on | 212 / 343 = **61.8%** | 24 | 102 |
| **example held out, retrieval off** | 186 / 343 = **54.2%** | 91 | 129 |

- Showing the model the command's own phrasing is worth **26 points**.
- Removing retrieval on top costs a further **7.6**, and `empty_plan` triples to 91 — the signature of
  a 388-command prompt, not of a missing example.

The first holdout run changed both at once and I could not attribute it, which is why there are three
arms rather than two. Reporting 54.2% as "the uncontaminated number" would have blamed the example
holdout for a cost that mostly belongs to prompt size.

### The number to use is 61.8%

That is the shipped configuration — retrieval on — minus the contamination that mattered. It is still
mildly optimistic: `commandMatchText` is `description + examples`, so the **embedding index** still
contains the held-out string and retrieval is still being helped. Removing that needs 343 re-embeddings
and is the remaining residual, not a correction I can wave at the number.

Against it: **the detector layer reaches 0% of these by construction.** They are the examples §132
found route to nothing at all. So the planner reaches roughly six in ten commands that today have no
natural-language route whatsoever.

### The blocker is the same one, for the fourth time

`unresolved_notes` is **102 of 343** — 30% of every case, and by far the largest failure mode. The
planner is not picking wrong commands (27 wrong of 343); it is refusing for missing information on
phrasings the specs offer as complete.

That is `e2e-bug.399` — the resolver seam — showing up now for the fourth time and in the one
population that `e2e-bug.416` cannot touch: no traffic weighting, no QA script, truth defined by the
registry. §130 measured the prompt-side fix as neutral-to-negative and withdrew "blocked on 404". This
says the deadlock is worth roughly **30 points of planner reach**, which is a far stronger case for
solving it at execute time than the rescue corpus ever made.

### What this means for Phase 8

Retirement has been argued per-slice from `tour`'s 97% and the corpus-wide 30.6%, both of which §128
and §139 have since qualified into near-uselessness. This is a different and better-founded claim:
*for commands the detectors never routed at all*, the planner is a strict improvement — six in ten
against zero — and the single change that would move it most is the resolver seam, not another slice
of detector authoring.

### Verification

- `REPLAY_HOLDOUT=prompt` and `REPLAY_HOLDOUT=1` are separable modes on the checked-in harness, with
  the reason they are separable written where the flag is defined.
- Fast chain **3,927 across 19**, 0 failures; red-means-red **exit 0**, manifest exact.

## §142 — withdrawing §141's attribution, and a gap it turned up instead

§141 closed by saying its 102 `unresolved_notes` refusals were `e2e-bug.399`'s resolver deadlock
"showing up for the fourth time", and sized it at ~30 points of planner reach. That attribution was
asserted, not measured. Measuring it takes one deterministic pass over the specs, and it does not
hold.

### The resolver hypothesis fails

Of the 102 examples the planner refused:

| | refused (102) | reached (212) |
|---|---|---|
| spec has a **resolver-backed required** variable | **3** | 7 |
| spec has any required variable | 3 | 18 |
| spec declares **no variables at all** | **99** | 193 |

Three. The resolver seam is not what these refusals are about, and §141's ~30-point figure for
`e2e-bug.399` is withdrawn — it was measuring something else and naming it after the last thing that
looked similar.

### And so does the obvious replacement

99 of 102 refusals land on specs with `variables: {}`, which looks like the answer until you check the
base rate:

| | share with no declared variables |
|---|---|
| refused | 97.1% (99/102) |
| reached | 91.0% (193/212) |
| **whole registry** | **94.1% (655/696)** |

Both groups sit on the base rate. Empty variables do not discriminate between a refusal and a success,
so they do not explain the refusals either. **What causes those 102 is still unknown**, and I am
recording that rather than reaching for a third candidate.

### What the base rate itself says

The check that killed the hypothesis is the finding:

| | specs |
|---|---|
| declare at least one variable | **41** |
| declare none | **655** |

**Six percent of the registry declares its inputs.** Of the 655, **297 are mutating** — T1 163, T2 109,
T3 25 — and they include `payment.adjust_gift_card_balance`, a T2 money command whose spec says it
takes nothing at all. `appointment.reschedule` is one of the 41 and is fully declared, which is why
`e2e-bug.399` was written about it: the one command anybody looked at closely is unrepresentative.

This is what `e2e-bug.379` counted as done. The port is 696/696 by spec count and 41/696 by declared
inputs, and `CommandSpec` is described throughout this roadmap as the single source of truth for what
a command takes.

It is also the general case of a bug already fixed: §133's `claim_referral_code` declared
`variables: {}` while its handler read `params.referralCode`, and 96 users were asked for a code they
had already typed. That was not an isolated defect. It is the norm, and 654 other commands have the
same shape.

### Filed

`e2e-bug.418`. Not a quick fix — 655 specs need their handlers read — but the T2/T3 subset is 134
commands and is where money and bulk operations are.

### Verification

No code changed. Fast chain and sweep unchanged from §141 (**3,927 / 0**, sweep exit 0).

## §143 — the customer surface never recorded its params either, which costs §133 half its evidence

Working `e2e-bug.418`, the plan was to find more commands like `claim_referral_code` — a handler
asking for something the user had already said. §133 found that one by its signature: 96 failures,
**every trace with empty params**. Generalised across the corpus, that query returns twenty commands.

It returns twenty because on the customer surface it always matches.

| surface | traces | params empty |
|---|---|---|
| dashboard | 1,161 | 83.5% |
| provider | 498 | 98.2% |
| **customer** | 3,703 | **99.4%** |

`extractCommandTraceMetadata` reads the trace's params from
`details.partialParams ?? enrichedParams ?? previewParams ?? params`. The dashboard's handlers write
those; the customer service writes none of them. So the column is not a measurement of what commands
received — on that surface it is a constant.

This is the third instance of the same shape (§134 `failure_reason`, §136/§137 `pipeline_trace`, now
`params`), and all three are the same root cause: the customer path was never wired into the telemetry
the dashboard path has had since §1.1.

### What it costs §133

`e2e-bug.410` was argued from three facts. Two of them were columns that cannot carry the claim:

- *"params arrived empty"* — meaningless on this surface, as above;
- *"`action_changed_by = (none)` on all 96, so the classifier got it right and rescue never fired"* —
  §136 showed that column is null by construction for 93% of customer traffic.

**The fix itself stands, on the third fact and on code reading.**
`enrichClaimReferralCodeParamsFromPrompt` is called from exactly one place, the rescue path, and
`rescueClaimReferralCodeIntent` returns null when the action is already `claim_referral_code` — so
whenever the classifier named it directly, nothing extracted the code. That is a property of the code,
not of the corpus. And 96 traces of 96 ending in the handler's clarify branch (`clarify: true`,
recorded as `failed` per §134) is consistent with exactly that.

What I should not have written is that the empty params *showed* the extraction never ran. They show
nothing. The fix is right; one of the three legs it stood on was not load-bearing.

### The fix

`stampCommandTraceDetails` now writes `params`, and the customer wrapper from §137 supplies the
resolved ones through the same per-call sink. `?? result.details?.params` keeps every existing caller
byte-identical: the dashboard passes no params in its metadata and falls through to whatever its
handlers already wrote.

Two tests hold it, including that an existing `details.params` is not overwritten when none is
supplied — the dashboard's case.

### What it does not do

It does not make the audit possible on the existing corpus. §418's worklist still needs handler
reading, which my first attempt at static tracing did badly: it located only 37 of the 134 T2/T3
handlers and found 2 undeclared reads, a result too weak to act on. That approach is abandoned rather
than reported as a finding.

### Filed

`e2e-bug.419` for the gap itself, now fixed.

### Verification

- Fast chain **3,941 across 19** (+14), 0 failures; red-means-red **exit 0**, manifest exact.
- `ai-command-trace-recorder` added to `test:ai-trace-attribution` — it was not in any gate, the third
  file in this family that was not.

## §144 — the provider surface had the same three telemetry gaps, and the sweep does not watch it

`e2e-bug.420`. Having fixed `pipeline_trace` (§137) and `params` (§143) on the customer surface, the
obvious question was whether the provider surface shares them. It does, in the same shape:
`pipelineTrace` appeared **once** in `provider-ai-command.service.ts`, inside the `blocked` branch, out
of 233 returns.

The corpus agrees: **3 of 498** provider traces carry a pipeline trace (0.6%), and **98.2%** store
empty params. Nothing about which stage decided a provider action, or what that action received, has
ever been recorded.

Same fix as §137 — `executeCommand` wraps the former body, a per-call sink carries the trace,
confidence and resolved params back out, and the sink is filled before the `blocked` and `clarify`
exits.

### Two things this turned up

**The detector inventory records the enclosing function name.** Renaming the body to `runCommand`
moved three detectors from `executeCommand` to `runCommand`, and `ai-command-inventory.boundary`
failed — correctly. Regenerated with `npm run build:ai-inventory`, the documented path, which the
failure message names. The same rename on the customer surface in §137 did not trip it, because that
method has no detectors inside it; this one does. A gate that catches a rename it should catch, in a
file I did not think of as inventory-bearing.

**"Red means red" does not cover this directory.** The provider suites reported 11 failures, none of
them in the known-failures manifest — because `scripts/ai-known-failures-gate.mjs` runs
`--testPathPatterns=modules/ai/` and `provider-mobile` is a different directory. So the sweep that has
caught five of my regressions this programme would not have caught one here.

I verified the 11 by hand instead: copied the file, reversed my three edits programmatically, and
re-ran. **9 failures before, 9 after** in the affected suites — identical, so none are mine. That is
the check the manifest would have done automatically for `modules/ai`, done manually because it does
not.

Filed as `e2e-bug.421`. Extending the pattern is not free: the manifest would grow by whatever
`provider-mobile` currently fails, and those entries need the same "red means red" discipline rather
than being swept in as accepted.

### Verification

- Fast chain **3,941 across 19**, 0 failures; red-means-red **exit 0**, manifest exact.
- Inventory regenerated and checked in.
- The unused-import lint error in the provider service is pre-existing — confirmed against the diff,
  not assumed.

## §145 — provider-mobile joins "red means red", and ten of its eleven failures were the calendar

`e2e-bug.421`. §144 found `provider-mobile` outside the known-failures sweep, with 11 failing tests no
gate reported. The discipline the manifest exists to enforce is that every entry is *understood*, so
widening the pattern meant triaging all 11 first rather than importing them as accepted.

**Ten of the eleven were tests rotting against the calendar**, in two variants:

- `provider-time-off.util` and `provider-self-block.util` — fixtures naming `2026-06-20`, which was
  comfortably in the future when written. Both utils reject anything more than a day before
  `Date.now()`, so every scenario began returning "Cannot request time off in the past". The
  assertions read `undefined` rather than a date complaint because
  `buildBlockScheduleDtoFromTimeOffRequest` returns `null` on a validation error;
- `provider-booking-customer-context` — `isWinBackCustomer` measures days since the last visit against
  a reference date defaulting to `new Date()`, with a 90-day threshold. The fixture's customer last
  visited `2026-05-01`, so a `win_back` badge appeared that the expected snapshot does not list.

All four suites now freeze the clock rather than move to relative dates. The literal dates are what
make the expected ISO strings readable, and a fixture computed from `Date.now()` cannot express "a
range spanning a month boundary" without becoming a second implementation of the code under test.

### The eleventh was a stub that outlived its refactor

`provider-ai-sprint22` asserts the classifier prompt carries the intelligence blocks
(`_entityMemoryBlock`, `_conversationSummary`, `_ragContextBlock`). It could not pass: the harness's
`understand` mock passed the literal string `'Harness provider classifier context'` to `deps.classify`.

Production is fine — `buildProviderClassifierContext` assembles those blocks through
`buildProviderClassifierAppendix`. Context building moved into
`ProviderCommandUnderstandingAdapter` when the provider surface was delegated to the understand
pipeline, and the stub did not follow, so the test had been asserting on the stub. The harness now
builds the real context, and the assertion checks production behaviour again.

Worth noting what this failure was worth: it looked like a missing feature, and the feature exists.
Had it been swept into the manifest as an accepted failure, it would have read as "provider does not
thread intelligence blocks" for as long as anybody trusted the list.

### The sweep

`AI_FAILURES_PATTERN` now defaults to `modules/(ai|provider-mobile)/`. The sweep goes from **1,339 to
1,432 suites** and **33,655 to 34,456 tests**, with failures unchanged at **102 suites / 457 tests** and
the manifest still exact — a whole directory brought under the gate without importing a single
accepted failure.

### Verification

- Provider-mobile **774/774**, 0 failures.
- Fast chain **3,941 across 19**, 0 failures; widened red-means-red **exit 0**, manifest exact.

## §146 — a detector for tests that read the calendar, and one that already fails on Mondays

`e2e-bug.422`. §145 fixed four suites that broke because time passed, and the obvious follow-up was a
lint. That does not work: **340** files under `modules/ai` and `modules/provider-mobile` contain an ISO
date literal and only **8** freeze the clock, because almost all of those dates are inert — expected
output, identifiers, values never compared to `now`. A "must freeze time" rule would report 332
non-problems.

So detect instead of guess. `test/time-travel.setup.cjs` shifts what the process believes *now* is and
the suite runs again; anything that changes verdict was reading the calendar.

    TIME_TRAVEL_DAYS=400 npm run test:ai-known-failures

It shifts `Date` rather than using `jest.useFakeTimers()`, which would also replace `setTimeout` and
produce failures about timers rather than about dates. Only the zero-argument `new Date()` and
`Date.now()` move: an explicit `new Date('2026-06-20')` is untouched, because a fixture's literal must
keep meaning what it says. Verified directly — at +400 days `now` reads 2027-09-13 while the literal
still reads 2026-06-20. Unset or `0` is a no-op, so every normal run is unaffected.

### It found ten, and one of them is not future rot

Run against the full sweep, ten tests fail that the manifest does not list. Nine are rot. The tenth is
live:

**`ai-date-range-resolution` fails every Monday.**

    expect(rest.split('..')[0]).not.toBe(thisWeek.split('..')[0]);

"The rest of the week" and "this week" have the same start on the first day of the week — and that is
correct behaviour, because on Monday the rest of the week *is* the whole week. The test encoded an
assumption that today is not a Monday, so it fails one day in seven, with nothing having changed. It
was written on some other weekday and has been quietly waiting.

Rewritten to assert the actual invariant — starts today, keeps the week's end — which holds on every
day. Verified across all seven by running the suite at `TIME_TRAVEL_DAYS=0..6`, and the Monday case is
now pinned as its own test rather than left to whichever day the suite happens to run on.

### When the other nine fire

Because the detector takes an arbitrary offset, "will this break" becomes "when":

| offset | newly failing |
|---|---|
| +7 days | **4** |
| +30 days | **9** |
| +90, +180, +400 | 9 |

Four of them break within a week. `ai-self-service-booking.logic` accounts for five, and the provider
time-off and self-block integration suites are the same rot §145 fixed in their unit-level siblings.

Filed as `e2e-bug.423` with the timeline attached, because "breaks in seven days" is a different
priority from "breaks eventually" and the list is now sorted by it.

### Verification

- `ai-date-range-resolution` **16/16 on every weekday**, offsets 0 through 6.
- Fast chain **3,942 across 19** (+1), 0 failures; sweep **exit 0**, manifest exact — the setup file is
  inert without the flag.

## §147 — the sweep now passes from a year in the future

`e2e-bug.423`. §146's detector listed nine tests that fail on a date and sorted them by when: four
within a week, nine within a month. All nine are fixed.

### The fixes, and the one that needed a second attempt

Every one was the same shape — a fixture naming a real date, read against a `now` that had moved past
it:

| suite | why | frozen to |
|---|---|---|
| `ai-list-my-upcoming-appointments.logic` | visits on 2026-08-15 and 08-22, asserted as two upcoming | 2026-08-01 |
| `ai-self-service-booking.logic` | June 2026 bookings; once past, the flows take their past-booking branches and five assertions change meaning at once | 2026-06-01 |
| `ai-e2e289-tour-calendar-week-locale` | tour week starting 2026-08-03 | **2026-08-04** |
| `ai-booking-depth.util` | a bare "June 5" resolves against the current year and rolls forward once past — correct behaviour, asserted as `2026-06-05` | 2026-06-01 |
| `provider-mobile-time-off` | requests from 2026-06-01; the service refuses past dates | 2026-05-20 |
| `provider-mobile-self-block` | blocks on 2026-08-09 and 08-20 | 2026-08-08 |

`ai-e2e289` is the one worth recording. Frozen to 2026-08-01 it started failing *immediately* — the
fixture's week begins 2026-08-03, so from the 1st it is **next** week and the summary says something
else. Freezing a clock is not only about being early enough; it has to land inside the window the
fixture describes. Corrected to 2026-08-04, inside that week.

I caught it because three of the four failures in that batch were known manifest entries and the
fourth was not, which is the check the manifest exists to make possible.

These freeze only `Date` — `setTimeout` and friends stay real, so the change is to what the code
thinks today is and not to how it runs.

### The result

    TIME_TRAVEL_DAYS=400 npm run test:ai-known-failures
    [AI-ROADMAP red-means-red] 102 failing suites · 457 failing tests · manifest 457
    ✓ Failure set matches the manifest exactly.

**Identical to a normal run.** The suite is now indifferent to what day it is, across 1,432 suites and
34,457 tests, and that property is checkable in one command rather than discovered months later as a
mystery failure.

### What it does not claim

Only that no test currently reads the calendar in a way that changes its verdict at +400 days. A
fixture written tomorrow with a literal near-future date will rot exactly as these did — the detector
finds it, nothing prevents it. Running the time-travel sweep on a schedule is the remaining half, and
is out of scope here because this repository has no scheduled job to attach it to.

### Verification

- Time-travel sweep at +400: **exit 0**, manifest exact.
- Normal sweep **exit 0**; fast chain **3,942 across 19**, 0 failures; lint clean on all six suites.

## §148 — `lookup_customer` worked, was answered by the wrong detector, and lost its params on the way

`e2e-bug.358` tracked 24 intents that regressed unnoticed while the accuracy gate was permanently red.
`lookup_customer` was the worst of them — **0 of 6**, a command that had stopped working entirely.

It turned out to be two independent faults, both of the shape this programme keeps finding: the right
code existed and something upstream got there first.

### Fault 1 — the richer branch was unreachable

`ai-booking-core.service.ts` narrows to the appointment a prompt names only when
`params.bookingContext === true` arrives with a provider, time or date. A rescue branch built exactly
that — and it sat *after* `tryRescueDashboardCustomerRead`, whose `isLookupCustomerPrompt` arm returns
`lookup_customer` carrying nothing but `customerName`.

So for precisely the prompts it was written for, the richer branch never ran. Four of the six cases had
the **right action** and failed only on the missing params.

Extracted as `lookupCustomerWithBookingContext` and called from both sites, rather than copied into the
earlier one: two copies of "what does this prompt say about the booking" is how they drift.

### Fault 2 — an availability rescue answering "who is this customer"

"Summarize customer Maria Lopez who has a booking with Gevorg today at 10:00" names a provider and a
time, which is all `rescueExplainProviderAvailabilityIntent` needs. It claimed two of the six.

**Two fixes were tried and measured before the third was kept**, which is the part worth recording:

| attempt | `lookup_customer` | collateral |
|---|---|---|
| reorder the unknown chain, pre-empt on booking-context | 6/6 | **−1 case each** to `admin_delete_customer_data` and `explain_any_provider_option` |
| narrow the pre-emption with `isLookupCustomerPrompt` | 4/6 | −1 case to `admin_delete_customer_data` |
| **guard inside the availability util itself** | **6/6** | **none** |

Reordering a rescue chain pre-empts every branch below the insertion point, and two of them
legitimately owned their prompts. Declining inside `rescueExplainProviderAvailabilityIntent` lets the
prompt fall through to the customer read with every other branch's position unchanged — and it covers
all **five** call sites, where guarding one branch fixed only the two cases reachable from that chain.

The 8,464-case corpus is what made this decidable: each attempt was scored against it rather than
against the six cases I was looking at.

### Result

    Cases:   8066/8464 passed (95.3%)   ·   baseline 95.23%
    Improved intents: lookup_customer 0% → 100%
    Regressed intents: none

Six eval cases and twelve manifest entries fixed; the manifest shrinks **457 → 445**, 102 → **101
suites**.

### A gate caught something I would not have thought to check

`isCustomerBookingContextPrompt` is now used to block another detector, so the inventory reclassified
it from `legacy_paraphrase` to `routing_shape`, and Phase 8's freeze failed on 545 → 544.

That is a **third** legitimate way that number falls, alongside deletion — a matcher becoming a guard —
and it is the direction Phase 8 wants, since a guard is not a paraphrase detector to retire. Recorded
in the freeze with its reason. `READY_FLOOR` is untouched and still passes, which is the assertion that
distinguishes this from a spec quietly losing examples.

### Verification

- Accuracy **8,066/8,464 (95.3%)**, no regressed intents; baseline ratcheted forward.
- Fast chain **3,942 across 19**, 0 failures; sweep **exit 0** with the shrunk manifest.
- Inventory and retirement freeze regenerated and checked in.

## §149 — nine commands that worked, and a surface gate that threw the answer away

Continuing `e2e-bug.358`, the largest remaining failure cluster was not the regressed intents at all.
Nine `explain_*` provider commands sat at **exactly 0%** across **241 eval cases** — 61% of every
remaining deterministic failure.

Nine intents failing *completely* is not nine bugs. It is one.

### The trace

Each step was checked rather than inferred:

| | |
|---|---|
| `isExplainTodayTimelinePrompt("Walk me through my day")` | **true** |
| detector wired into the rescue chain | **yes**, two call sites |
| `runRescueUnknownPhase(...)` called directly | returns **`explain_today_timeline`** |
| `rescue(...)` through the full pipeline | **`none`** |

The difference between the last two lines is `acceptRescueForSurface`, which asks
`isIntentAllowedOnSurface` — and that reads `COMMAND_REGISTRY`, where none of the nine had an entry.
So the pipeline produced the right answer and discarded it, on every request, silently.

`CommandSpec` had nothing for them either: all nine report **NO SPEC**. This is `e2e-bug.379`'s
parallel lists in their most expensive form — a command can have a detector, a handler and eval
coverage while being invisible to the list that decides whether its surface may use it.

### The fix, and its size

Nine ids added to `PROVIDER_EXCLUSIVE_INTENTS`:

    Cases:   8317/8464 passed (98.26%)   ·   was 95.30%
    Improved: all nine intents 0% → 100%
    Regressed: none

**398 → 147 deterministic failures.** The known-failures manifest falls **445 → 286**, its largest
single drop, and the sweep is green against it.

### Two gates pushed back, and both were right to

**Phase 8's freeze**, 544 → 548: four of their detectors are now labelled `legacy_paraphrase` because
they match a *registered* intent — before registration the inventory could not attribute them to any
command. No detector code was written; that is what registering an existing detector looks like.

**Reachability**, 282 → 291 undispatchable rows — the one deliberate raise of a ratchet whose comment
says "lower, never raise". Its own assertion accepts switch-statement handling, and I verified all
nine per command (`ai-provider-client-context.logic.ts` for eight, `provider-ai-command.service.ts`
for `explain_today_timeline`) rather than assuming. Routing a command that cannot execute would be
worse than leaving it unroutable.

### One process note

I regenerated the manifest while the reachability gate was still red, so a now-passing test went into
it and the next sweep failed on a stale entry. Harmless because the gate refuses to grow the list —
"the list only shrinks" caught my own ordering mistake — but the order is: fix the gates, *then*
update the manifest.

### Verification

- Accuracy **8,317/8,464 (98.26%)**, no regressed intents; baseline ratcheted.
- Fast chain **3,942 across 19**, 0 failures; sweep **exit 0**, 101 suites / 286 tests.
- Filed as `e2e-bug.424`.

## §150 — `compound_intent` was never a command, and the surface gate did not know

`e2e-bug.425`. After §149 the largest remaining cluster was `compound_intent`: **48 of 48 failing**, the
same complete-failure signature, and the same cause one level along.

`acceptRescueForSurface` asks `isIntentAllowedOnSurface('compound_intent', …)`. The answer is `false`
on **every** surface, because `compound_intent` is not in the registry and never should be — it is a
routing outcome meaning "this message contains several requests". The commands are its *steps*, and
each is surface-checked when dispatched.

So the decomposer worked, produced the right verdict, and the gate discarded it, everywhere.

The fix is one line beside `unknown`, `error` and `security_blocked` — the pseudo-actions already
exempted for exactly this reason. Registering it as a command instead would have put it into command
lists, dispatch reachability and the spec inventory, none of which it belongs in.

**147 → 99 deterministic failures**, 98.26% → **98.83%**, no regressed intents. Manifest **286 → 273**.

### Then two guards objected, and both were worth listening to

**§132's stolen ceiling, 106 → 107.** With `compound_intent` routing, one spec example moved from
unclaimed to stolen: `create_booking_subscription_credit`'s "book them using their membership" now
decomposes as a compound. The over-claim is **not new** — the decomposer always read it that way, and
the surface gate was discarding the result before anything could see it. Raised, because the fix is
worth 48 cases and this is one, but filed as `e2e-bug.426` rather than absorbed. This is the guard I
added in §132 catching a real thing on its first real test.

**`ai-propose-only` — and this one would have been a mistake to wave through.** A test asserted
`compound_intent` is held back "because it fails every eval case it has". At 100% the accuracy rule
promoted it from `propose_only` to **`autonomous`**.

Nothing about executing a compound changed. The corpus asserts `rescuedAction` — *which command a
prompt reaches* — and for a compound that says only that the message was recognised as multi-step. It
says nothing about whether the steps ran, and §135 is the counter-evidence: compound failures on real
traffic are dominated by one constituent step (`book_nearest_slot`, in 148 of 222), which no
`rescuedAction` assertion can see.

So a routing fix would have silently promoted a multi-step command to autonomous execution. Added
`EXECUTION_UNPROVEN_BY_EVAL` with a new verdict reason `execution_unproven`, holding it in
`propose_only` while reporting its real accuracy — rather than pretending the number is lower than it
is. The number is right; it is measuring a different thing. Filed as `e2e-bug.427`.

### Where the corpus stands

Across §148–§150: **404 → 99** deterministic failures, **95.23% → 98.83%**, manifest **457 → 273**
failing tests and 102 → **98** suites. None of it was model work; all three were lists and gates
disagreeing about what a command is.

### Verification

- Accuracy **8,365/8,464 (98.83%)**, no regressed intents; baseline ratcheted.
- Fast chain **3,943 across 19**, 0 failures; sweep **exit 0**, 98 suites / 273 tests.
- Gates fixed before the manifest was regenerated this time — §149's ordering lesson applied.

## §151 — two extractors that skipped their own guards

`e2e-bug.428`. With the routing clusters gone, the remaining 99 failures are diffuse — largest is 9 —
so this is the first section since §148 where the work is ordinary rather than structural. The biggest
mechanical group was seven `compoundStepParams[0].params.serviceCategory` mismatches, in two shapes:

    expected "styling",  got "affordable"
    expected "facial",   got "facials"

Both are the same line, twice.

`extractBudgetDiscoverServiceCategory` tries the list-services extractor first and returns its answer
directly:

```ts
const fromList = enrichListServicesParamsFromPrompt(prompt, {});
if (fromList.serviceCategory) return fromList.serviceCategory;   // ← guards skipped
```

Every *other* path in that function runs two guards the early return does not:
`SERVICE_CATEGORY_BLOCKLIST`, which already contains `"affordable"` — a price adjective that appears
before the real category in "affordable styling options" — and `normalizeBudgetServiceCategory`, which
singularises, so `"facials"` never became `"facial"`.

`extractRankDiscoverServiceCategory` has the identical early return, and the same blocklist sitting
unused beneath it. Two files, one shape; there are no others, which I checked rather than assumed.

The guards were not missing and the values were not unrecognised. The one path most likely to produce
a category was the one path that skipped the checks written for it.

### Result

**99 → 93** deterministic failures, **98.83% → 98.90%**, no regressed intents. The
`list_services+check_providers_for_service+create_booking` recipe goes **89.74% → 97.44%**. Manifest
**273 → 271**.

### Why these outlived the routing work

They surfaced as `compoundStepParams[...].params.serviceCategory` rather than as a wrong action, so
every cluster view that ranked by intent buried them: the recipe was already at 89.74% and reads as
healthy. They only became the largest group once the 0% intents were gone — which is an argument for
re-clustering after each fix rather than working down a list written once.

### Verification

- Accuracy **8,371/8,464 (98.90%)**; baseline ratcheted; inventory regenerated.
- Fast chain **3,943 across 19**, 0 failures; sweep **exit 0**, 98 suites / 271 tests.

## §152 — "checkout" counted as a tour topic

`e2e-bug.429`. `fix_checkout_validation_error` was the largest remaining cluster at 9 of 29, and eight
of those nine were taken by `diagnose_tour_capacity` — on prompts with no tour in them:

> "Checkout won't accept my email even though it's there" · "Privacy checkbox validation error blocks
> checkout confirm" · "Cannot complete checkout — validation error on contact fields"

`isDiagnoseTourCapacityPrompt` requires two things: a checkout-rejection cue, and a *tour capacity
topic*. The topic test read:

```ts
/\b(pax|people|guests?|group\s+size|spots?\s+remaining|capacity|seats?)\b/i.test(prompt) ||
/\b(checkout|booking\s+page)\b/i.test(prompt) ||   // ← every checkout complaint
```

Since the rejection cue is already required separately, that clause contributed nothing about tours
and everything about checkout: the two halves collapsed into one condition.

### Four attempts, each scored against the corpus

| attempt | failures | effect |
|---|---|---|
| remove `checkout` from the topic test | 90 | fixes 8, **costs 5 tour cases** |
| add `tour` / `fully booked` / `date full` vocabulary | 89 | costs 2 tour, **2 `explain_tour_day_slots`** |
| the word `tour` alone | 87 | costs 2 tour |
| **exclude checkout *form-field* complaints** | **86** | **fixes 8, costs nothing** |

The first three treat it as "which words prove a tour". The last asks what actually separates the two
populations, which the prompts answer plainly: every prompt this detector was stealing names the field
the form rejected — email, phone, privacy checkbox, contact fields — and every prompt it should keep
names what is *full*.

Positive vocabulary could not have got there. "Ինչու checkout-ը չի ընդունում 15/08/2026-ը Mountain
Trek-ի համար" names a tour only by its name, so no list of tour words reaches it — but a negative test
on form fields leaves it alone.

### Result

**93 → 86** deterministic failures, **98.90% → 98.98%**, `fix_checkout_validation_error` 68.97% →
**93.1%**, `diagnose_tour_capacity` back to **100%**, no regressed intents.

### Verification

- Accuracy **8,378/8,464 (98.98%)**; baseline ratcheted; inventory regenerated.
- Fast chain **3,943 across 19**, 0 failures; sweep **exit 0**, 98 suites / 271 tests.

## §153 — a rescue reason that only described corrections, and a greedy capture

`e2e-bug.430`. `deactivate_service` was the largest remaining cluster at 8 of 16, and it was two
unrelated faults sharing an intent.

### Seven: the reason described the correction, not the request

Seven prompts are category-wide deactivations — "Hide all hair services from public catalog", "Remove
all services in Skin category from public booking" — and the corpus asserts
`rescueReason: deactivate_service_category_scope`. They got the generic `deactivate_service`.

`isDeactivateServiceCategoryScopePrompt` returns **true** for all seven, which I checked before
touching anything. The scoped rescue never runs because it opens with:

```ts
if (action === 'deactivate_service') return null;
```

Reasonable on its face — there is no action to change. But `rescueReason` is not only a record of a
*correction*; it names the shape of the request, and downstream that shape is the difference between
deactivating one service and deactivating a category. The classifier arriving at the right action
unaided should not erase the distinction.

Fixed where the label is written rather than by relaxing that guard: the branch already builds its
params with `enrichDeactivateServiceCategoryScopeParamsFromPrompt`, so the params were right all along
and only the label was wrong. **7 of 8 fixed.**

### One: a greedy capture that ate "from the"

"Disable Deluxe Facial from the service catalog" yielded `serviceName: "Deluxe Facial from the"`. The
pattern anchors on `\s+service\b` and the prompt contains that word twice, so the capture runs to the
second one. A later pattern in the same list reads it correctly, but the greedy one matches first.

Stripped the dangling tail in the same idiom as the existing `\s+service$` strip. **The last case.**

`deactivate_service` **50% → 100%**.

### A false start worth recording

My first attempt fixed the reason in `ai-catalog.util.ts` and moved nothing: **86 failures before, 86
after**. A second producer in `ai-intent-rescue.service.ts` fires first, and that is the one the corpus
reaches. Both now label correctly — but only one of those changes is measured, and the
`ai-catalog.util.ts` pair (reason and extractor) are the same corrections applied to a sibling path
this corpus does not exercise. I have kept them because the defect is identical and the path is live in
production, and I am recording that they are unverified rather than counting them as fixes.

### Result

**86 → 78** deterministic failures, **98.98% → 99.08%**, no regressed intents. Manifest unchanged at
271 — these cases sit inside suites already counted.

Across §148–§153 the deterministic corpus goes **404 → 78** failures and **95.23% → 99.08%**.

### Verification

- Accuracy **8,386/8,464 (99.08%)**; baseline ratcheted; inventory regenerated.
- Fast chain **3,943 across 19**, 0 failures; sweep **exit 0**, 98 suites / 271 tests; lint clean.

## §154 — a missing entry in an exclusion list the file already keeps

`e2e-bug.431`. `summarize_customer_tax_paid` was the largest remaining cluster at 5 of 8, and all five
went to `explain_business_tax`:

> "How much tax has Jane paid across her appointments?" · "What tax did Maria pay on her booking
> history?" · "Across Jane's paid visits, how much VAT did she pay in total?"

Every one names a customer and asks what *they* paid. None is about the business's tax settings.

`isSummarizeCustomerTaxPaidPrompt` returns **true** for all five — checked before changing anything, as
in §152 and §153 — so the detector was right and something upstream answered first.

`isExplainBusinessTaxPrompt` already declines three sibling intents:

```ts
if (isSetServiceTaxRatePrompt(prompt)) return false;
if (isExplainStackedTaxPrompt(prompt)) return false;
if (isConfigureBusinessTaxPrompt(prompt)) return false;
```

`summarize_customer_tax_paid` was simply absent from a list it plainly belongs in. One line, in the
file's own convention.

### A near-miss guard, noted while I was there

The same function has a guard that *looks* like it should have caught these — it declines
appointment-scoped prompts unless they mention the salon or business:

```ts
/\b(appointment|provider\s+app|payment\s+breakdown|mark(?:ed)?\s+paid|collected)\b/i
```

It tests `\bappointment\b`, which does not match **"appointments"** — the word four of these five
prompts actually use. The exclusion I added makes them moot, so I have recorded the near-miss in the
comment rather than widening a second pattern in the same change and losing the ability to attribute
either.

### Result

**78 → 73** deterministic failures, **99.08% → 99.14%**, `summarize_customer_tax_paid` 37.5% →
**100%**, no regressed intents. Manifest **271 → 265** failing tests, 98 → **97** suites.

Across §148–§154: **404 → 73** deterministic failures, **95.23% → 99.14%**, manifest **457 → 265**.

### Verification

- Accuracy **8,391/8,464 (99.14%)**; baseline ratcheted; inventory regenerated.
- Fast chain **3,943 across 19**, 0 failures; sweep **exit 0**, 97 suites / 265 tests.

## §155 — "retention" is two different words

`e2e-bug.432`. `configure_privacy_retention` was the largest remaining cluster at 4 of 16, and all four
went to `summarize_customers`:

> "Set customer PII retention to 730 days" · "Set audit log retention to 7 years"

Both are configuration. Both were answered with a customer report — not merely unhelpful: the user
asked to *change a setting* and got analytics.

**Customer** retention is an analytics question — how many customers come back. **Data** retention is a
setting. `isCustomerRetentionRatePrompt` matched on the bare word:

```ts
/\bretention\b/i.test(prompt) || …
```

Guarded by the sibling detector rather than by listing PII and audit-log vocabulary, so the two stay in
step: whatever `configure_privacy_retention` learns to recognise, this now declines.

### I patched the wrong predicate first

`isCustomerRetentionPrompt` in `ai-dashboard-ops.util.ts` has the *same* homonym —
`/\bretention\b/ && /\b(customer|clients?|rate|how)\b/` — and "Set **customer** PII **retention**"
satisfies it. I added the exclusion there and measured **no change at all**: 73 before, 73 after.

Asking the rescue service directly gave the reason it actually returned — `customer_retention_rate`,
not `customer_retention` — which named a different producer in a different file. Two predicates, one
letter apart in their reason strings, and only the second was on the path.

That check took one probe and would have saved the wrong fix entirely had I run it first. I have kept
the `ai-dashboard-ops.util.ts` guard because the homonym there is real, and recorded it as
**unverified** — same disposition as §153's sibling fixes.

### Result

**73 → 69** deterministic failures, **99.14% → 99.18%**, `configure_privacy_retention` 75% → **100%**,
no regressed intents. Manifest **265 → 262** failing tests.

Across §148–§155: **404 → 69** deterministic failures, **95.23% → 99.18%**, manifest **457 → 262**.

### Verification

- Accuracy **8,395/8,464 (99.18%)**; baseline ratcheted; inventory regenerated.
- Fast chain **3,943 across 19**, 0 failures; sweep **exit 0**, 97 suites / 262 tests; lint clean.

## §156 — a shared alias map that could act on the wrong person

`e2e-bug.371`, the first item of the sequenced debt plan and the only one with a privacy consequence
rather than a correctness one.

`AiEntityMemoryService` keys one alias map per **business**:

```ts
async getEntityMemory(businessId: string): Promise<EntityMemory>
async buildMemoryContextBlock(businessId: string): Promise<string>
```

Every user of that business contributes to it and is served from it, and the stored shape carries
`customerName`. `employeeName`, `serviceName` and `templateName` are business-level facts and sharing
them is the point of the feature. A customer's name is not.

### There were two paths out, and the second is worse

1. `formatEntityMemoryContextBlock` printed `customer=<name>` into the classifier context of whoever
   asked next — **disclosure**;
2. `applyEntityMemoryToParams` wrote `customerName` **and** `waitlistCustomerName` into command
   params — so one person's customer could be **acted on** in another person's request. Not a leak
   into a prompt: a parameter, on a live command.

The ticket only described the first. The second was found by reading the util rather than the service,
and it is the one that matters: `offer slot to john` filling `waitlistCustomerName: 'John Smith'` from
a stranger's conversation is a waitlist offer to the wrong person.

### The exposure was live

| | |
|---|---|
| businesses with a stored alias map | 4 |
| stored aliases | **211** |
| aliases carrying a `customerName` | **16** |

### Closed on both sides

`stripSharedEntityMemoryPii` is applied on **write** (`mergeEntityMemory`) and the reads no longer
emit or apply `customerName` at all.

Both, deliberately. Stopping the writes alone would leave all 16 stored names reachable through the
same two paths; filtering the reads neutralises them **without a migration**. Purging is still proper
hygiene and is left as a decision rather than done silently — deleting rows from a live settings table
is not something to slip into a bug fix.

Per-user memory would keep the capability and is the right shape if anyone wants "my regular" back. It
needs a user dimension in storage, which is `e2e-bug.401` and does not exist. Until it does, **the safe
entry is no entry**.

### Two tests were pinning the vulnerability

`ai-entity-memory.util.spec.ts` asserted `customer=John` appears in a rendered line, and — precisely —
that `applyEntityMemoryToParams` fills `waitlistCustomerName` from a `customerName` alias. Both now
assert the opposite, and the second names what it is guarding against. A test that pins a leak is
worse than no test, because it makes removing the leak look like a regression.

### Verification

- `ai-entity-memory` and `ai-settings` **34/34**.
- Fast chain **3,943 across 19**, 0 failures; sweep **exit 0**, 97 suites / 262 tests; lint clean.
- The business-level capability is kept, and pinned by a test that fills `employeeName` and
  `serviceName` from the map as before.

## §157 — "dates displayed" was being read as a provider's name

Wave 1 of the sequenced plan, resuming the accuracy loop at 69 failures. Clustering by *error kind*
rather than by intent — §151's lesson — put one detector at the top by a wide margin:
**`explain_provider_availability` was stealing 17 of the 69**, a quarter of everything left, spread
across eight victim intents.

The prompts it took have nothing to do with availability:

| prompt | "provider name" extracted |
|---|---|
| How are dates displayed in the dashboard? | **dates displayed** |
| Why are amounts shown in dram (֏)? | **amounts shown** |
| Is VAT included in the amount we collected? | **VAT included** |
| Why did Stripe charge $113 with GST and PST lines? | **GST** |
| Show what Spa Day package is titled in Armenian | **titled** |
| Who is the expert in men's fades? | **the expert** |

### Why one bad capture defeats every guard

`isExplainProviderAvailabilityPrompt` is careful — it blocks booking verbs, soonest-slot asks,
provider ranking, specialty reads. All of that sits *below* this line:

```ts
const namedSchedule = extractProviderNameForAvailabilityPrompt(prompt) !== null;
…
if (!namedSchedule && !teamOpenings) return false;
```

A name means "this is a named-schedule question", so a false name bypasses the lot. And
`PROVIDER_NAME_BLOCKLIST` is an exact-match set of **single words** — nothing longer than one word,
and no acronym, was ever tested against it.

### Three rules, and one exception that is not a hedge

`looksLikeProviderName` requires: no blocklisted token **anywhere** (so "the expert" fails on "the");
at most three tokens; and one token reading as a proper noun — initial capital, **not** all-caps,
which admits "Maria" and "Anna Smith" while rejecting "GST" and "VAT included".

The exception: in a prompt typed entirely in lower case, capitalisation carries no signal, so a single
token is allowed through. "when is maria free?" is a real thing to type, and without a catalogue to
check against, one token is as much as can be inferred. Stated as a rule rather than left implicit,
because it is the part most likely to be mistaken for sloppiness later.

### Result

**69 → 51** deterministic failures, **99.18% → 99.40%**, **ten intents improved**, none regressed:

`explain_notification_currency`, `explain_tenant_currency`, `explain_checkout_currency` to 100%;
`explain_business_date_format`, `explain_package_display_name`, `explain_public_booking_checkout`,
`search_retail_sku` to 100%; `explain_stripe_tax_charge`, `explain_appointment_tax`,
`explain_provider_specialty` up.

Manifest **262 → 246** failing tests, 97 → **92** suites.

Across §148–§157: **404 → 51** deterministic failures, **95.23% → 99.40%**, manifest **457 → 246**.

### Still open from this cluster

Two of the 17 were not name-extraction at all: "Same time with Maria instead" extracts **Maria**
correctly and still belongs to `switch_provider_same_time`. That is a sibling-exclusion job of the
§154 kind, not a parsing one, and is left for the next pass rather than bundled in — mixing the two
would make neither attributable.

### Verification

- Accuracy **8,413/8,464 (99.40%)**; baseline ratcheted; inventory regenerated.
- Fast chain **3,943 across 19**, 0 failures; sweep **exit 0**, 92 suites / 246 tests; lint clean.
