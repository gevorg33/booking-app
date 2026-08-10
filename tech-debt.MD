# Tech debt — open work, in detail

**Generated 2026-08-10** from `TODO.BUGS.MD` and `TODO.md` at AI-ROADMAP §155.

This file is the working view of what is *not* done. It exists because the two tracking files answer
different questions and neither answers this one: `TODO.BUGS.MD` is a flat index of 252 tickets
(mostly closed), and `TODO.md` holds the full history of each including its fixes. Here every open
item is written out with its evidence, its dependencies, and the subtasks it actually decomposes into.

**Ground rules used throughout**

- Numbers are quoted only where they were measured, with the measurement named.
- Anything unverified is labelled unverified. Several items below exist *because* a number turned out
  not to mean what it looked like.
- Subtasks are the real next actions, not restatements of the problem.

## State at a glance

| | |
|---|---|
| open tickets | **19** |
| partially done | **12** |
| **total outstanding** | **31** |
| deterministic eval corpus | 8,395 / 8,464 — **99.18%**, 69 failures |
| known-failures manifest | 97 suites / **262** failing tests |
| fast gate chain | 3,943 tests across 19 gates, 0 failures |
| unchecked roadmap items | 1 (Phase 8 exit) |

### Everything outstanding, in execution order

Sorted by when to do it, not by ticket number. `Wave` is the sequence; items inside a wave can run in
parallel unless a blocker says otherwise.

| Wave | # | ticket | one line | state | gate on starting |
|---|---|---|---|---|---|
| ~~0~~ | G1 | 371 | entity memory shared across all users of a business | **mitigated §156** — purge outstanding | — |
| ~~0~~ | E1 | 416 | corpus is a QA script, weighted as demand | **labelled §0.0** — write-time marker needs an owner | — |
| **0** | B8 | 401 | nothing carries conversation state between turns | open | **ops answer** |
| **0** | B1 | 366 | completion-floor gate is not scheduled | open | **ops owner** |
| **0** | E2 | 405 | spec and runtime disagree on what needs confirming | partial | **product decision** |
| **1** | D1 | 358 | 23 intents below their old accuracy (69 failures left) | partial | — |
| **1** | D4 | 426 | decomposer over-claims a single-command phrasing | open | — |
| **1** | D3 | 349 | plural categories / cart intent on dashboard | partial | — |
| **1** | D2 | 348 | catalog compound prefers the model's plan | partial | — |
| **1** | D5 | 362 | entity resolution picks first match on ties | partial | — |
| **2** | C1 | 379 | the parallel lists the spec port was to replace | open | — |
| **2** | C2 | 418 | only 41 of 696 specs declare their inputs | open | — |
| **3** | F1 | 359 | the AI sweep takes tens of minutes | open | — |
| **3** | F3 | 415 | neither command service can be built in a test | open | — |
| **3** | F2 | 409 | shadow replay duplicates the shared harness | open | — |
| **4** | B4 | 370 | anaphora resolver not wired into the planner | open | — |
| **4** | B7 | 367 | 14 re-parsers shadow the resolver service | partial | — |
| **4** | B3 | 369 | stale clarifications never expire | open | B8 |
| **4** | B5 | 373 | session entity store never written to | open | B8 |
| **4** | B6 | 374 | profile-facts read model never called | open | E1 |
| **4** | B2 | 368 | saga engine has no handler wiring | open | unsizable — see note |
| **5** | A5 | 396 | retrieval unfixed for twelve domains | partial | — |
| **5** | A6 | 399 | planner and entity resolver never connected | partial | — |
| **5** | A1 | 392 | planner has no execution path | open | A5 |
| **5** | A7 | 380 | 449 of 559 spec examples miss their command | partial | A5 |
| **5** | C3 | 360 | 8 of 20 spec examples miss their own detector | open | A1 |
| **5** | A4 | 406 | the 90% readiness bar is unmeetable | open | — |
| **5** | A3 | 395 | 13 of 14 slices not ready | open | A5, A6, A4 |
| **5** | A2 | 394 | detectors cannot be deleted, only disarmed | open | A3 |
| **6** | E4 | 361 | customer surface carries the failure rate | partial | new traffic |
| **6** | E3 | 414 | rescue proposals vs production, unexplained | partial | new traffic |

## Execution sequence, and why this order

### Wave 0 — before anything else

Three kinds of thing belong here: the one item with a **user-facing risk**, the one that makes every
later prioritisation honest, and the three that need **somebody else to answer a question**.

1. **G1 (371) — privacy.** A customer's name resolved in one person's conversation can reach another
   person's prompt context at the same business. Everything else in this file is correctness or
   process; this one discloses data. It goes first on severity, not on effort.
2. **E1 (416) — label the corpus.** Mostly a documentation change, and it is a *precondition for
   deciding anything else*: "customer is 69% of traffic" describes a QA script's shape. Doing this
   before Wave 1 stops the next six decisions inheriting the same error.
3. **B8 (401), B1 (366), E2 (405) — raise the questions now.** None can be coded until someone
   answers: single- vs multi-instance deployment (401), cadence and alert destination (366), and
   which of 13 dashboard commands warrant interrupting a user (405). Asking them in Wave 0 means the
   answers exist by the time Wave 4 needs them. Waiting until Wave 4 to ask makes the wait serial.

### Wave 1 — keep the accuracy loop running

The loop of §148–§155 has worked six times and is the cheapest verified progress available:
re-cluster, take the largest bucket, **check the predicate before changing anything**, score every
attempt against the full 8,464-case corpus. It took the corpus 95.23% → 99.18%.

Order within the wave is by size and independence. **D4 (426)** is small and lets the stolen ceiling
drop back to 106. **D5 (362)** is last because it is not a detector tweak — returning all matches and
clarifying on ties needs a clarify path in the callers.

Do this wave before the structural work because it is proven, reversible, and each fix is
independently measurable.

### Wave 2 — stop the registry bleeding

**C1 (379)** and **C2 (418)** are here, ahead of the infrastructure and Phase 8 work, because the
registry's parallel lists have already produced the single largest defect of the programme: §149 lost
**241 eval cases** to nine commands that had detectors, handlers and eval coverage but **no registry
row**. That failure mode exists purely because the lists are independent, and it will recur.

C1 before C2: generating `COMMAND_REGISTRY` from the specs is what makes a missing row impossible,
and C2 (declaring inputs on 134 T2/T3 specs) is a large read-every-handler task that benefits from the
generated registry being in place first.

### Wave 3 — make the rest cheaper and safer

**F1 (359)** first: sweep runtime is the constraint on how fast every later wave can iterate, and it
is the documented root cause of Phase 2 stalling. **F3 (415)** next, because it unblocks backfilling
tests for two load-bearing behaviours currently held by construction alone (§129's confirmation gate,
§137's trace stamping). **F2 (409)** last — it is tidying, and it has no gate watching it, so it wants
a careful before/after smoke run.

### Wave 4 — connect what is already built

Eight capabilities exist and are not called. Order by *value per unit of risk*:

- **B4 (370) anaphora** first: no prerequisites, no session store, no client change, and the
  measurement behind §49 found 82% of anaphoric prompts carry their referent in the same message.
- **B7 (367) re-parsers** next, starting with the two copies that carry known bugs
  (`resolveTomorrowDateKey`, `extractTimeSlotFromPrompt`) — those are wrong, not merely duplicated.
- **B3 (369)** and **B5 (373)** once B8's answer exists.
- **B6 (374)** after E1, because its "query only where it pays" argument rests on the 69% figure.
- **B2 (368) saga wiring last**, and deliberately: compensation only matters for failures *after* a
  successful write, and the column that would say how many of the 235 failures wrote first
  (`result_summary`) postdates the corpus. Doing it now means building against an unknown payoff.

### Wave 5 — Phase 8

This is the largest wave and the only one with a real internal ordering:

```
A5 (retrieval)  ─┐
A6 (resolver)   ─┼─→  A1 (rollout)  ─→  A3 (re-measure slices)  ─→  A2 (delete/restate exit)
A4 (criterion)  ─┘                          ↑
                        A7 (narrow the 106) ─┘
```

- **A5 (396)** is first and is mechanical: the §86 recipe took `tour` truth-in-shortlist 64% → 98%
  and was never run for the other twelve domains. 45% of rescue-dependent prompts fail because the
  right command is not in the shortlist at all — no amount of planner work fixes that.
- **A6 (399)** in parallel, but only as an **execute-time** resolver. Two prompt-side attempts have
  been measured and both were negative; a third would be the same mistake.
- **A4 (406)** can be settled at any point in the wave and should be settled *before* A3, because A3's
  output is judged against it. Replacing the bar with a comparative criterion is a paragraph of
  reasoning, not a code change.
- **A3 (395)** only after A5, A6 and A4 — re-measuring thirteen slices before fixing the shared
  retrieval problem measures the same thing thirteen times.
- **A2 (394)** last: it is the exit criterion itself, and the honest form of it ("no detector may
  decide an action") is what the §93 lock already achieves.

### Wave 6 — re-measure

**E4 (361)** and **E3 (414)** both need data that does not exist. Traffic stopped 2026-08-03. They are
listed so they are not mistaken for actionable now; when traffic resumes they are the first things to
re-run, along with A3's and A4's numbers.

### The critical path

```
E1 → C1 → A5 → A1 → A3 → A2   (Phase 8 exit)
       ops answer to B8 → B3, B5
```

Everything else can move in parallel. The long pole is Phase 8, and its first real dependency is
retrieval (A5), not the planner.

### What is deliberately not sequenced

- **B2 (368)** has no defensible position until its payoff can be sized.
- **E3/E4** cannot start.
- **B1/E2** are waiting on people, not on engineering. If the answers do not come, say so in the
  roadmap rather than inventing a cadence or a policy — an unowned alert that fires into nowhere is
  worse than no alert, because it reads as coverage.

---

# A. Phase 8 — retiring the detector layer

Phase 8's exit is *"zero `legacy_paraphrase` remaining; rescue cannot alter `action`"*. It is the one
unchecked roadmap item. These seven are what stands between here and there, and they are not
independent: A1 is the enabler, A2 says the stated exit is unreachable as written, and A3–A7 are the
evidence problem underneath both.

## A1 · e2e-bug.392 — the planner has no execution path

**What is wrong.** `ai-gateway.service.ts` runs the planner in its trace-recording tail, with the
comment *"it can never affect `opts.result`"*, behind `AI_PLANNER_SHADOW_SURFACES`, which is unset.
The planner is an observer that does not even observe.

**Why it matters.** Every Phase 8 slice ends in "delete this slice's detectors". Deleting them today
removes routing and replaces it with nothing.

**Progress.** `decidePlannerRoute` (§90) is the seam, and `e2e-bug.404` gave it a confirmation path
(§129), so confirm-required commands can now route. The `tour` and `guide` domains route through it.

- [ ] decide the rollout mechanism beyond `AI_PLANNER_EXECUTE_DOMAINS` — retired domains are
      hardcoded on purpose (a missing env var must not silently cost a slice its traffic)
- [ ] extend beyond single-step plans, or record that multi-step stays with §33's executor
- [ ] measure recovery per slice *before* enabling it, not after

**Related:** §89, §90, §129. **Blocks:** A2, A3.

## A2 · e2e-bug.394 — the slice detectors cannot be deleted, only disarmed

**What is wrong.** The 15 `tour`/`guide` detectors have **128 references across 31 files**, and most
are *other* detectors using them as negative guards — `if (isListTourCalendarWeekPrompt(p)) return
null;` — so non-tour commands do not fire on tour prompts. Affected non-slice files include
`ai-confirm-my-booking-details.util.ts` (8 refs), `ai-list-my-upcoming-appointments.util.ts` (6),
`ai-explain-preparation-notes.util.ts` (6), `semantic-steal-guard.util.ts` (4).

**Why it matters.** Deleting the predicates deletes the guards, and every one of those commands
starts firing on tour prompts. §93 therefore *locked* the domains (`RESCUE_ACTION_LOCKED_DOMAINS`)
rather than deleting anything — retirement in effect, not in the roadmap's letter.

- [ ] separate each detector's *matcher* from its use as a *guard*, so the matcher can go and the
      guard can stay
- [ ] or rewrite Phase 8's exit criterion to "no detector may decide an action", which is what the
      lock already achieves and is measurable
- [ ] count how many of the 128 references are guards versus real routing, per file

**Note.** §148 showed a third way this can move: `isCustomerBookingContextPrompt` became a guard for
another detector and the inventory reclassified it `legacy_paraphrase` → `routing_shape`, dropping
the paraphrase count without deleting anything.

**Related:** §93, §148.

## A3 · e2e-bug.395 — thirteen of fourteen slices are not ready

**What is wrong.** Measured across all 121 rescue-dependent prompts (216 traces): `tour` 97%,
`push` 83%, everything else 0–18%, **25.5% overall** (30.6% after §119). The dominant failure is
**no route at all — 76 of 121**, not wrong answers.

**Why it matters.** Per-slice tuning does not scale; §84–§88 spent four sections on `tour`'s
retrieval alone. Thirteen domains share one problem.

- [ ] fix retrieval globally (A5) before attempting another slice
- [ ] re-measure per domain afterwards, prompt-weighted (see A4 and E1 for why the old numbers
      cannot carry the decision)

**Related:** §94, §119. **Blocked by:** A5, A6.

## A4 · e2e-bug.406 — the 90% readiness bar cannot be met by any slice

**What is wrong.** 95% Wilson intervals on the per-domain table: `tour` 33/34 is **85–99%**, `push`
15/18 is 61–94%. **No lower bound reaches 90%.** Structurally, a 95% lower bound at 90% needs
**n ≥ 35 traces with zero failures**; the largest slice has 34 traces and one failure.

**Why it matters.** `PROPOSE_ONLY_ACCURACY_BAR = 90` comes from §42, where it gates against the
8,509-case corpus and is a sharp line. Applied to 6–34 rescue-dependent traces it is a precise
instrument on data that cannot resolve it — and more data is not obtainable (traffic stopped
2026-08-03; the whole rescue-dependent population is 216 traces).

- [ ] replace the per-slice criterion with either an interval-based threshold (95% lower bound ≥ 70%,
      which `tour` clears at 85% and nothing else approaches) **or** a comparative one
- [ ] prefer the comparative form: retire when planner recovery beats detector-deletion loss by a
      margin. That is what §92 actually measured and what actually decided `tour`
- [ ] restate §88, §92, §118, §119 and §127, which all quote point estimates as if they settled a
      threshold question

**Related:** §128. **Does not** argue for un-retiring `tour`: §92's evidence (33/34 recovery against a
measured 20% deletion loss) never needed a threshold.

## A5 · e2e-bug.396 — retrieval is unfixed for twelve domains

**What is wrong.** **54 of 121** rescue-dependent prompts (45%) have the true command missing from
the 15-command shortlist, and **39 of the failures** are in that group — the largest single bucket.

**Why it matters.** §86 fixed exactly this for `tour`: put real traffic phrasings (Armenian and
Russian) into the spec examples, then run `npm run build:ai-embeddings`, because the cache is built
from `commandMatchText` = description + examples. Truth-in-shortlist went **64% → 98%**. The
mechanism is proven, mechanical and low-risk. It was never run for the other twelve domains.

- [ ] per domain, pull the most frequent real prompts from `ai_command_trace`
- [ ] add representative phrasings to the specs — **not** verbatim test-set copies (§88's held-out arm
      exists precisely to catch that)
- [ ] `npm run build:ai-embeddings` after each domain; the §96 staleness gate now fails loudly if this
      is skipped, which is how §82's seven-point "regression" happened
- [ ] re-measure truth-in-shortlist per domain

**Related:** §86, §95, §96.

## A6 · e2e-bug.399 — the planner and the entity resolver have never been connected

**What is wrong.** `appointment.reschedule` declares `appointmentId` required with
`resolver: 'appointment'`, but the prompt renders only `appointmentId (string)` and rule 4 says
*"Do not guess … ids"*. `resolver` appears **zero times** in the generated prompt. The planner is
asked for an id, forbidden from inventing one, and never told anything downstream can find it.

**Two attempts, both measured, both negative.**

| attempt | result |
|---|---|
| §120: render the resolver in the shortlist | 28.7% vs 30.6% baseline — reverted |
| §130: same change with the confirm gate removed | 30.1% vs baselines 30.6% and 32.4% — reverted |

§130 also measured the noise floor: two identical baseline runs churn **3** prompts; the change churns
**13–14**. It is a real effect that reshuffles failures rather than fixing them (five prompts move
`not_executable` → `not_single_step`).

**Sizing, without traffic weighting.** §141's held-out spec-example run put `unresolved_notes` at
**102 of 343**. §142 then withdrew the attribution: only **3** of those 102 involve a resolver-backed
required variable, so that figure sizes something else.

- [ ] stop attempting prompt-side fixes — two measured negatives is enough
- [ ] resolve at **execute** time: let the planner emit the human reference, and have Phase 4's
      `EntityResolutionService` turn it into an id after routing
- [ ] size it honestly first: how many failures actually involve a resolver-backed required variable
      (the answer is *not* 102)

**Related:** §99, §120, §130, §141, §142.

## A7 · e2e-bug.380 — 449 of 559 spec examples do not reach their own command

**What is wrong.** 280 commands have no eval coverage; their specs carry 559 hand-written examples and
only **110 route**. §132 split the 449 into **343 unclaimed** (nothing routes them) and **106 stolen**
(a different command claims them) — two defects with opposite fixes.

**What the planner does with them.** §140/§141 measured three arms over the 343:

| arm | reach |
|---|---|
| as shipped (example rendered, retrieval on) | 87.8% |
| **example held out, retrieval on** | **61.8%** |
| example held out, retrieval off | 54.2% |

Use **61.8%**. The first is contaminated — `renderShortlist` prints each command's examples verbatim
and the embedding index is built from them. Detectors reach **0%** of this set by construction.

- [ ] do **not** author 343 detectors — that is the layer Phase 8 deletes
- [ ] narrow the detectors behind the 106 stolen examples; guarded by a ceiling of 107 in
      `ai-command-eval.spec-coverage.spec.ts` that may only fall
- [ ] for the 343, the answer is the planner (A1) plus retrieval (A5)
- [ ] residual on the 61.8%: the embedding index still contains the held-out string; removing that
      needs 343 re-embeddings

**Related:** §132, §140, §141.

---

# B. Capabilities built but never connected

Eight items, one shape. Something was designed, built, tested in isolation, and never called. This is
the most common defect class in the programme — §89 (the planner), §108 (Phase 6), §124 (the saga
seams), §149 (nine commands missing a registry row) were all found by asking *who calls this*.

## B1 · e2e-bug.366 — the completion-floor gate is not scheduled

**What is wrong.** `scripts/ai-completion-floor-gate.mjs` works: against the live trace table it
reports 64.0% of 5,362 calls against a 62.0% floor, and a raised floor makes it exit 1. Nothing
invokes it.

**Why it was left out of §45.** Cadence and alert destination are ops decisions with an owner. A cron
entry nobody owns produces an alert firing into nowhere, which is worse than no alert because it looks
like coverage.

- [ ] a runner with database access (the gate reads `backend/.env` for `DB_*`)
- [ ] a check cadence — daily is the obvious default; floors are 2 points wide and a real slide takes
      more than a day to show through 5,362 traces
- [ ] a **separate, less frequent** cadence for `--update` (weekly or monthly) — ratcheting on every
      check locks in one good day as the standard
- [ ] a destination for a breach

**Needs an owner.** **Related:** §45, §28.

## B2 · e2e-bug.368 — the saga engine has no handler wiring

**What is wrong.** §47 built the compensation model and declared `compensation` on all 14 mutating
specs. Neither half is connected:

1. **Nothing captures pre-write state.** `planCompensation` takes a `CaptureMap`; the executor never
   builds one, so every `kind: 'inverse'` compensation resolves to `missing_capture`.
2. **No transaction boundary.** `groupByAggregate` computes which steps could share a transaction and
   nothing opens one.

§124 confirmed the seams are supplied by nobody: `executePlan` has 7 live call sites, but
`captureState` and `runCompensation` appear only inside `ai-plan-executor.util.ts`, so both guarded
blocks are unreachable.

**Consequence today.** A multi-step plan that fails midway leaves earlier writes standing, exactly as
before §47. What changed is the system can now *describe* what it left behind.

- [ ] a pre-execution read per step driven by `compensation.captures`, feeding the `CaptureMap` —
      `appointment.reschedule` needs `originalStart` read *before* the write
- [ ] a transaction per `TransactionGroup`, so same-aggregate failures never reach the saga
- [ ] call `compensate()` on a failed `executePlan`

**Cannot be prioritised yet.** Compensation matters only for failures *after* a successful write, and
the column that would say so (`result_summary`) is empty on all 5,362 rows — its migration
(`20260815120000`) postdates the last trace (2026-08-03) by twelve days. It is **not** dead telemetry;
that conclusion was one step away and would have sent someone to fix a working recorder.

**Related:** §47, §55, §124.

## B3 · e2e-bug.369 — stale clarifications never expire

**What is wrong.** §48 built `detectTopicChange` and `invalidateStaleBindings`. Neither is called, and
two inputs they need do not exist: `pendingCreatedAt` and `turnsElapsed`. §38's `PendingClarification`
round-trips through the client carrying neither.

**Why it matters.** A pending clarification has no expiry at all. Asked "which appointment?", ignored,
and returned to later with an unrelated message, the binding is still live — `applyClarifyAnswer` will
merge whatever comes next into the old plan if it looks like a value. For `appointment.cancel_mine`
that cancels a row the user never named, and cancellation is declared irreversible: the customer has
already been emailed.

**Also dropped:** `CommandPlan.topicChanged` is set by the planner prompt and read by the decoder, and
nothing consumes it. The model has been answering that question on every request since the field
existed.

- [ ] add `createdAt` and `turnIndex` to the `PendingClarification` envelope (a field addition — §38
      already round-trips it)
- [ ] call `invalidateStaleBindings` before `applyClarifyAnswer`; drop pending state on `invalidated`
- [ ] consume `topicChanged`

**Related:** §38, §48. **Blocked by:** B8 for the turn counter.

## B4 · e2e-bug.370 — the anaphora resolver is not wired into the planner

**What is wrong.** §49 built `resolveAnaphora` and `bindAnaphorToReference`. Nothing calls them.

**Why this one first among the unwired utils.** The commonest anaphoric prompt in the corpus, by a
wide margin, is *"cancel my Swedish massage booking and rebook **it** for next Friday instead"* — a
compound, and compounds were the worst capability on the platform. **82% of 110 sampled anaphoric
prompts carry their referent in the same message**, which is exactly what this resolver handles. It
needs no session store and no client change.

- [ ] after the planner produces steps, run `resolveAnaphora(message, steps, i, specs)` for each step
      with incomplete variables
- [ ] on `resolved`, apply `bindAnaphorToReference` — it emits the `$sN.field` form §33's executor
      already understands and adds the `dependsOn` edge
- [ ] on `ambiguous`, clarify rather than execute (candidates are already in the result)
- [ ] on `no_referent`, leave the plan alone
- [ ] do **not** treat `not_applicable` as failure — 12% of anaphor-shaped matches are expletives
      ("is **it** possible to cancel?"), and binding those invents a reference the user never made

**Cross-turn anaphora is deliberately out of scope** (needs B8).

**Related:** §49.

## B5 · e2e-bug.373 — the session entity store is never written to

**What is wrong.** §53 built `createEntityStore`, `recordResolution`, `lookupEntity`,
`pruneEntityStore`, `clearEntityStore`. Nothing calls `recordResolution`, so the store is always empty
and "move it to 4 instead" has nothing to resolve against.

**Both after-the-fact sources were measured and fail.** `ai_command_trace.params` has `session_id`, so
reading refs back out looked free — but only **224 of 5,362** rows have non-empty params (4.2%), and
they hold the wrong half of the mapping (`serviceName` 137 vs `serviceId` 38). `redactCommandTraceParams`
strips internal params and redacts PHI: correct for telemetry, fatal here. **Note:** `e2e-bug.419`
has since fixed customer-surface param recording, so this ratio will change for future traffic.

- [ ] call `recordResolution` at resolution time, in `EntityResolutionService`
- [ ] decide the store's lifetime and pruning policy
- [ ] re-measure the params ratio once new traffic exists

**Related:** §53, §419. **Blocked by:** B8.

## B6 · e2e-bug.374 — the profile-facts read model is never called

**What is wrong.** §54 built `deriveProfileFacts`, `applyProfileDefault`, `renderProfileFacts`.
Nothing calls them.

**Why it is not purely mechanical.** Derivation needs the customer's booking history at classify time,
and the gateway makes no such query. Three options were considered: query per request (an extra round
trip on every message); query only where it pays; or cache per (businessId, customerId) with a short
TTL. The middle looks right — the facts are customer-preference shaped.

- [ ] pick the query strategy (surface-scoped looks right)
- [ ] wire `deriveProfileFacts` into classify-time context
- [ ] re-examine the "customer is 69% of traffic" premise first — **E1** shows that weighting
      describes a QA script, not demand

**Related:** §54. **See:** E1.

## B7 · e2e-bug.367 — 14 local re-parsers shadow the resolver service

**What is wrong.** §46 built the single `EntityResolutionService`. The re-parsers it replaces are still
in the tree and still what the handlers call:

| function | copies | note |
|---|---|---|
| `resolveServiceByName` | 7 | 5 byte-identical, 2 with a reverse-substring rule |
| `resolveTomorrowDateKey` | 2 | both are e2e-bug.363 (UTC date, a day late every local evening) |
| `extractTimeSlotFromPrompt` | 2 | both are e2e-bug.364 (`"3:30 pm"` → `03:30`) |
| `resolveDateRange` | 2 local | plus the canonical one |
| `resolveServiceIdByName` | 1 | `ai-customer-waitlist.logic.ts` |

- [ ] migrate handlers to `EntityResolutionService` copy by copy, deleting each as it lands
- [ ] start with the two carrying known bugs (`resolveTomorrowDateKey`, `extractTimeSlotFromPrompt`) —
      those are wrong, not merely duplicated
- [ ] add a re-parser ratchet so new copies cannot appear

**Related:** §46, e2e-bug.363, e2e-bug.364.

## B8 · e2e-bug.401 — nothing carries conversation state between turns

**What is wrong.** The single prerequisite behind B3, B5 and cross-turn anaphora. There is no
per-conversation state that survives a turn.

- [ ] decide single- vs multi-instance deployment — this changes whether in-memory state is viable at
      all, and it is an **ops question**, not a code one
- [ ] then choose the store (in-process with affinity, Redis, or the database)
- [ ] then wire B3 and B5 onto it

**Needs an ops answer before any code.** **Blocks:** B3, B5, part of B4.

---

# C. The command registry's parallel lists

## C1 · e2e-bug.379 — the parallel lists the spec port was meant to replace

**What is wrong.** The roadmap item read *"port the remaining ~688 registry entries domain by domain,
**deleting each hand-maintained parallel list as its domain lands**"*. The porting half is done —
**696 of 696 specced**. The deleting half has not started, so a command is now declared in **seven**
places rather than six.

**Step 1 is sized (§125).** All 696 registry entries resolve to a spec; none is orphaned. What
`CommandSpec` cannot yet produce:

| registry field | entries | status |
|---|---|---|
| `apiModule` | 696 | must be added |
| `compoundStep` | 609 | must be added |
| `sprint` | 596 | must be added (traceability) |
| `surfaceHandlers` | 16 | must be added (optional) |
| `label` | 696 | derivable |
| `executionMode` | 696 | **not** derivable |

`executionMode` has a counterexample: 695 of 696 follow `mutating ? <mutate> : 'read_only'`, but
`provider.coordinate_waitlist_offer` is T0, non-mutating, `orchestration`.

- [ ] add the four fields to `CommandSpec`
- [ ] generate `COMMAND_REGISTRY` from the specs, keeping `executionMode` explicit
- [ ] delete the seed list, then the dispatch map, then the classifier schema, then the coverage and
      promotion lists — one at a time, each behind the conformance gate

**Why this is now urgent.** §149 cost 241 eval cases to a *missing registry row* for nine commands
that had detectors, handlers and eval coverage. That failure mode exists because the lists are
independent.

**Related:** §66, §125, §149.

## C2 · e2e-bug.418 — only 41 of 696 specs declare their inputs

**What is wrong.** **41** specs declare any variables; **655 declare none**, and **297 of those are
mutating** (T1 163, T2 109, T3 25) — including `payment.adjust_gift_card_balance`, a T2 money command
whose spec says it takes nothing.

**Why it matters.** This is the general case of `e2e-bug.410`: `claim_referral_code` declared
`variables: {}` while its handler read `params.referralCode`, and 96 users were asked for a code they
had just typed. 654 commands share that shape. It is also what C1 counted as done — 696/696 by spec,
**41/696** by declared inputs, while `CommandSpec` is described throughout as the single source of
truth for what a command takes.

**Note:** `appointment.reschedule` is one of the 41 and fully declared, which is why `e2e-bug.399`
was written about it — the one command anyone examined closely is unrepresentative.

- [ ] start with the **134 T2/T3** specs: money and bulk, and the set `validatePlan` and the
      confirmation model already treat as highest risk
- [ ] for each, read the handler and declare what it reads
- [ ] a static audit was attempted and abandoned — it located only 37 of 134 handlers and found 2
      undeclared reads, too weak to act on. Do this by reading, not by regex
- [ ] add a conformance rule that a mutating spec must declare at least one variable, once the
      backlog is cleared

**Related:** §142, §410, §419.

## C3 · e2e-bug.360 — 8 of 20 spec examples miss their own detector

**What is wrong.** For the 10 specced commands with a primary `is*Prompt` detector, **8 of 20**
documented examples are not matched by it. The misses are systematic, not random: past-tense
statements ("Sarah paid cash for today's massage"), question forms ("can I push my booking to 4pm"),
synonym verbs ("stop offering", "bundle").

Meanwhile **0 of 116** surface-form variants (casing, whitespace, punctuation, politeness) break. The
detector layer is brittle to *phrasing*, not to *surface form* — so input normalisation will not help.

**The planner handles them (§126), but the test is contaminated.** 9 of 9 routed correctly, 8 of 9
executable — on strings that are in the embedding cache being searched. Quotable only as evidence
about the stage *after* retrieval.

- [ ] treat these as Phase 8 planner-handover acceptance cases
- [ ] re-run held-out, as §141 did for the larger set

**Related:** §27, §126, §141.

---

# D. Accuracy backlog

The deterministic corpus stands at **99.18%** (8,395/8,464) after §148–§155 took it from 95.23%.
These are what remains.

## D1 · e2e-bug.358 — 23 intents still below their old accuracy

**What is wrong.** While the accuracy gate was permanently red (it asserted `failed === 0` against a
corpus with 404 known failures, so its per-intent regression check never ran), **24 intents lost 49
previously-passing cases**.

**Progress.** `lookup_customer` fixed 0/6 → 6/6 (§148). The larger clusters found since were different
bugs entirely — §149 (nine unregistered commands, 241 cases), §150 (`compound_intent`, 48),
§151/§152/§153/§154/§155.

**Remaining: 69 deterministic failures**, now diffuse — the largest cluster is 4.

- [ ] continue the loop that has worked six times: re-cluster, take the largest, check the predicate
      *before* changing anything, score every attempt against the full corpus
- [ ] `explain_guest_checkout_fields` (4/26), `explain_provider_specialty` (4/36),
      `summarize_my_appointments` (4/24), `configure_stripe_connect` (3/12),
      `explain_appointment_tax` (3/14)
- [ ] the compound recipes (`compound:none`, and the budget/rank i18n variants) look like one shared
      cause and are worth clustering together

**Related:** §25, §148–§155.

## D2 · e2e-bug.348 — catalog compound prefers the model's plan

**What is wrong.** `ai-catalog.logic.ts` had
`params.compoundSteps ?? decomposeCatalogCompoundPrompt(prompt)` — the model's plan wins whenever it
exists, and against the reported prompt the deterministic path yields exactly what was missing.

**Partially fixed (§114)** by `chooseCatalogCompoundSteps()`, which swaps only `create_service(s)`
steps, only when the deterministic draft is complete and the LLM plan creates no category. The blanket
"prefer deterministic" rule was tried and broke four tests: for "category + services **and** add a
package" the deterministic path yields one step and the model two, so preferring the shorter plan
drops the package.

- [ ] extend the choice to other step kinds, one at a time, each measured
- [ ] or replace the heuristic with a merge that takes the category from one and the package from the
      other

**Related:** §114.

## D3 · e2e-bug.349 — plural categories / cart intent on dashboard

**Partially fixed.** Root cause 1 was fixed by §100 (the deny-list gate became `CommandSpec.tiers`, so
`add_services_to_cart` is now false for staff/manager/owner on dashboard) and is pinned by a test.
Root cause 2 (`isBulkCreateCatalogPrompt` matching `category\b` in all four cues) is fixed.

- [ ] confirm what remains — the reported path is no longer reachable deterministically on either
      surface, so this may be closable after a re-read

**Related:** §100, §113.

## D4 · e2e-bug.426 — the decomposer over-claims a single-command phrasing

**What is wrong.** `create_booking_subscription_credit`'s own documented example, *"book them using
their membership"*, decomposes as a compound. It names one command.

**Not a new defect.** The decomposer always read it that way; `e2e-bug.425`'s surface gate was
discarding compound results before anything could observe it. It appeared the moment compounds started
routing, and was caught by §132's stolen ceiling (106 → 107) on that ceiling's first real test.

- [ ] narrow the decomposer so "using their X" is not a second step
- [ ] then lower the stolen ceiling back to 106

**Related:** §132, §150.

## D5 · e2e-bug.362 — entity resolution picks the first match on ties

**What is wrong.** `fuzzyMatchByName` is a five-tier cascade of `.find(...)` calls returning
`T | undefined`. Two customers named "John Smith" resolve to whichever the database returned first —
the user never disambiguated, and nothing records that a choice was made.

**Partially fixed (§111):** tiers 3 and 4 now use a Unicode word-boundary check (`queryMentionsName`)
instead of a raw substring, which removed the worst class (a short name matching inside a longer one).

- [ ] return *all* matches and clarify on ties, rather than picking one
- [ ] the callers need a clarify path, which is the real work

**Related:** §29, §111.

---

# E. Measurement you cannot trust yet

Four items about the evidence base rather than the code. They are grouped because a decision made on
any of these numbers today would be made on sand — and three of the four were found by checking a
column's *writer* rather than reading the column.

## E1 · e2e-bug.416 — the trace corpus is a QA script, weighted as demand

**What is wrong.** 5,362 traces from **5 businesses and 27 users**, 95% from one business. **75% of
traces repeat an earlier prompt.** "Help me with this page" appears **125 times in 2 days with zero
distinct users**; "How do I book an appointment?" 124 times. Customer-surface rows are recorded with
`role = owner` and a null `user_id`.

**What it does not invalidate.** Per-command defect evidence. `claim_referral_code` failing 96/96 with
empty params was a real bug at any volume, as are the routing and telemetry findings in §134–§138,
which were established by reading and running code.

**What it does invalidate.** Every traffic-weighted claim: "customer carries 69% of traffic", the
per-action volume ranking in §133, and the trace-weighting throughout §92, §119, §128 and §130.

- [ ] label the corpus in the roadmap as a **defect finder, not a priority signal**
- [ ] re-derive any prioritisation from something else until real traffic exists
- [ ] when traffic resumes, segregate synthetic sources at write time so this is answerable by query

**Related:** §139. **Affects:** A3, A4, B6, E4.

## E2 · e2e-bug.405 — spec and runtime disagree on what must be confirmed

**What is wrong.** `CommandSpec` requires confirmation for **210** commands; the runtime's only gate,
`DASHBOARD_EXECUTION_CONFIRM_ACTIONS`, names **59**. The 151 absentees include
`appointment.mark_paid` (T2, money) and `catalog.assign_services_category_bulk` (T3).

**Measured (§122).** Commands *in* the list show 24 approvals for 23 executions; commands *absent* show
**211 executions and 0 approvals**. Most of the gap is not a defect — the bulk is customer-surface
payment where the checkout *is* the confirmation and the specs over-declare via the blanket
`ALWAYS_CONFIRM_TIERS` rule. The real residue is **13 commands / 36 traces executed on the dashboard**,
led by `operations.optimize_schedule` (T3, 13×) and `commerce.record_expense` (T2, 6×).

**Closed for the planner (§129).** `shouldConfirmBeforeExecute` re-derives the spec requirement for
planner-routed actions, so the gap cannot widen through the new seam. Detector traffic is unchanged.

- [ ] review the 13 dashboard commands — **a product decision**: which operations warrant interrupting
      a user
- [ ] then reconcile the two models, or document why two exist

**Needs a product owner.** **Related:** §121, §122, §129.

## E3 · e2e-bug.414 — rescue proposals vs production, unexplained

**Status: premise withdrawn, one question left.** The ticket claimed rescue proposes customer-surface
corrections that never happen, on 0-of-262 evidence. §138 found the sample could not have shown it:
all 262 traced customer rows are `unknown`/clarified or `error`/failed — the `blocked` branch, the one
exit of ~40 that stamped a trace before `e2e-bug.413`. A row with action `unknown` cannot exhibit an
action change.

Re-tested by running the pipeline: **40 of 40** proposed rescues are applied. Kept as a regression test
(`ai-customer-rescue-applies.integration.spec.ts`).

- [ ] explain why 102 production traces nonetheless recorded `confirm_my_booking_details`. Candidates:
      session context, prompt normalisation, the null confidence on every one of them — **none tested**
- [ ] re-check once `e2e-bug.413`'s tracing produces new data

**Related:** §136, §137, §138.

## E4 · e2e-bug.361 — the customer surface carries the failure rate

**What is wrong.** Customer is 69% of traffic at 60.6% completion / 31.1% failure; provider runs
82.5% / 13.7%.

**Triaged (§133).** It is not a uniformly weak surface — **ten commands carry 53.5% of its failures**.
Bringing just those to 90% moves the surface **60.6% → 83.9%**. One is fixed
(`claim_referral_code`, `e2e-bug.410`); `compound_intent` was found to be dominated by one constituent
step (`book_nearest_slot`, in 148 of 222 failed compounds).

**Two caveats now attached.** Rates are **upper bounds** — `e2e-bug.411` found clarifications recorded
as failures and history cannot be recomputed. And the volume weighting is a QA script's (E1), so "69%
of traffic" does not support the prioritisation the ticket draws from it.

- [ ] work the remaining nine commands by defect, not by volume
- [ ] re-measure the surface split when real traffic exists

**Related:** §133, §134, §139. **Blocked by:** E1 for prioritisation.

---

# F. Test and tooling infrastructure

## F1 · e2e-bug.359 — the AI sweep takes tens of minutes

**What is wrong.** `modules/ai` holds 1,268 spec files; a full sweep did not complete inside a working
session on a 10-core machine with 9 saturated jest workers.

**Why it is the root cause of Phase 2's stalling.** Observing the failure set costs tens of minutes, so
nobody iterates, nobody notices new failures, and proving a change safe needs stash-run-restore-run-diff
at ~2× the cost — done by hand three times on this programme.

**Current state.** The sweep now runs in ~5–10 minutes over **1,432 suites / 34,456 tests** (widened to
`provider-mobile` by `e2e-bug.421`), and "red means red" holds: **exit 0**, 97 suites / 262 failing
tests, manifest exact. So the gate exists — the runtime is still the constraint on iteration.

- [ ] profile the heaviest suites (the eval integration specs dominate)
- [ ] consider `ts-jest` transform caching or `swc`
- [ ] shard the sweep

**Related:** §26, §421.

## F2 · e2e-bug.409 — shadow replay duplicates the shared harness

**What is wrong.** `ai-planner-shadow-replay.spec.ts` embeds, narrows, builds, decodes and validates
with its own copy of the logic now shared in `ai-planner-replay.util.ts`, so the two can drift on
exactly the things that change a number without changing its name.

**Deliberately not migrated with `e2e-bug.407`:** it is opt-in, **no gate covers it**, and rewriting
working code that nothing would catch breaking is not a safe side effect.

- [ ] migrate it onto `ai-planner-replay.util.ts`
- [ ] smoke-run before and after and compare, since no gate will

**Related:** §131.

## F3 · e2e-bug.415 — neither command service can be built in a test

**What is wrong.** `AiCommandService` and `CustomerAiCommandService` have no test construction path, so
behaviour in their method bodies can only be asserted by comment. This has blocked verification twice:
§129 worked around it by extracting `shouldConfirmBeforeExecute` into a pure function; §137 could not,
because the property was *"every one of ~40 exits is stamped"* — a property of the method's shape,
which now holds by construction rather than by test.

Both are load-bearing: the execute-time confirmation gate, and trace attribution for the majority of
traffic.

- [ ] a test-module factory with the dependency graph mocked once, as
      `customer-ai-command.integration.harness.ts` already does for the understanding adapter
- [ ] then backfill tests for §129's gate and §137's stamping

**Related:** §129, §137.

---

# G. Privacy

## G1 · e2e-bug.371 — entity memory is shared across all users of a business

**What is wrong.** `AiEntityMemoryService` keys one alias map per business:

```ts
async getEntityMemory(businessId: string): Promise<EntityMemory>
async buildMemoryContextBlock(businessId: string): Promise<string>
```

and the stored shape carries personal names — `customerName`, `employeeName`, `serviceName`,
`templateName`. There is no user dimension, and `buildMemoryContextBlock` injects the map into prompt
context. **A `customerName` resolved in one person's conversation can surface in another person's AI
context at the same business.**

`employeeName` and `serviceName` are business-level facts and sharing them is defensible.
`customerName` is not.

- [ ] add a user dimension to the key, at minimum for `customerName`
- [ ] decide whether the business-level entries stay shared (they are useful and not personal)
- [ ] audit what is already stored before changing the key — existing rows carry the same exposure

**This is the only item in this file with a privacy consequence rather than a correctness one, and it
should be read first.**

---

## How to use this file

1. **Do not** prioritise by the trace corpus (E1). Prioritise by defect evidence.
2. Check the predicate, the writer, or the caller **before** changing anything. Six of the last eight
   fixes were found that way, and three wrong fixes were avoided by it.
3. Score every attempt against the full 8,464-case corpus, not against the cases in front of you.
   §148, §152 and §155 each had a first attempt that looked right and cost cases elsewhere.
4. Fix the gates, *then* regenerate the manifest — §149 got that order wrong and the sweep caught it.
5. When a number moves, say which measurement produced it. When it does not move, say that too.
