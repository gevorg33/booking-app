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
| open tickets | **18** (14 + D5-a…d, split out of D5) |
| partially done | **10** (9 partial + C2, closed for T2/T3 only) |
| **total outstanding** | **28** of 35 rows (7 struck) |
| _recounted_ | 2026-08-13 — the 2026-08-10 figures (19/12/31) predated C2's T2/T3 closure and D5's split. **The count went up because D5's remainder was four different jobs wearing one ticket number**, not because work was added. |
| deterministic eval corpus | **8,437 / 8,464 — 99.68%, 27 failures** (2026-08-13, after the `explain_guest_checkout_fields` pass; the 8,395 / 99.18% / 69 figure was stale, and 8,435 / 99.66% / 29 was the re-measurement before that pass) |
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
| ~~0~~ | B8 | 401 | nothing carries conversation state between turns | **store shipped §B8** — B3/B5 wiring outstanding | — |
| ~~0~~ | B1 | 366 | completion-floor gate is not scheduled | **scheduled §B1** | — |
| ~~0~~ | E2 | 405 | spec and runtime disagree on what needs confirming | **reviewed + ratcheted §E2** | — |
| **1** | D1 | 358 | deterministic corpus failures — **27 left**, largest cluster 2 | partial — body current; **re-measured 2026-08-13** | — |
| ~~1~~ | D4 | 426 | decomposer over-claims a single-command phrasing | **fixed §D4** | — |
| **1** | D3 | 349 | plural categories / cart intent on dashboard | partial — **both root causes fixed; residual re-scoped §D3** (routes correctly, produces no draft) | — |
| **1** | D2 | 348 | catalog compound prefers the model's plan | partial — **reported case verified repaired 2026-08-13**; residual is e2e-bug.448 (shared with D3) | — |
| ~~1~~ | D5 | 362 | entity resolution picks first match on ties | **adoption done §D5** — 17/27, every consequential path; remainder split into D5-a…d | — |
| **4** | D5-a | 362 | 5 resolvers cannot carry a clarification (return `boolean`/`Booking[]`/`null`) | open | one shared signature change |
| **4** | D5-b | 362+448 | compound services call back into other domains via injected callbacks — **8 in `ai-command.service.ts` already**; the callees' signatures need changing as one contract. **e2e-bug.448(b) is blocked on this same decision** | open | D5-a pattern |
| **5** | D5-c | 362 | list-of-names resolution needs its own clarification shape | open | design |
| **5** | D5-d | 446+447 | 3 unfixed copies of `fuzzyMatchByName`, but the fixed one drops inflected hy/ru names | open | needs hy/ru corpus, not hand cases |
| **2** | C1 | 379 | the parallel lists the spec port was to replace | open | — |
| **2** | C2 | 418 | only 41 of 696 specs declare their inputs | **closed for T2/T3** (T0/T1 remain) | — |
| **3** | F1 | 359 | the AI sweep takes tens of minutes | partial — **profiled + measured 2026-08-13**; `test:ai:fast` ships 304 s → 212 s; sharding is now the only lever and is **blocked on e2e-bug.449** (no CI job to shard) + a persisted jest transform cache | e2e-bug.449 |
| ~~3~~ | F3 | 415 | neither command service can be built in a test | **done §F3** — both harnesses + §129 and §137 backfills | — |
| ~~3~~ | F2 | 409 | shadow replay duplicates the shared harness | **done §F2** — migrated, smoke-compared n=20, all metrics identical | — |
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
A5 (retrieval)  ─┐   ← closed 2026-08-11, premise disproved (§158)
A6 (resolver)   ─┼─→  A1 (rollout)  ─→  A3 (re-measure slices)  ─→  A2 (delete/restate exit)
A4 (criterion)  ─┘                          ↑
                        A7 (narrow the 106) ─┘
```

- ~~**A5 (396)** is first and is mechanical~~ — **done 2026-08-11, and it was neither.** The 45%
  figure was an artefact of scoring retrieval against rescue's own output; retrieval finds the
  classifier's answer 86% of the time. Nothing to mine. See §158. **A5 no longer gates A1**, and the
  wave's real first move is A6 or A4.
- ~~**A6 (399)** in parallel, but only as an **execute-time** resolver~~ — **done 2026-08-11, and it
  needed no resolver at all.** Both prompt-side attempts failed because the variable they described
  is read by no handler. Fixing the six specs to match their handlers took id-requiring commands
  2 → 0. See §159. **A6 no longer gates A1** — it is now a prerequisite *of* it, and satisfied.
- ~~**A4 (406)** can be settled at any point in the wave~~ — **done 2026-08-11.** It was a code
  change after all: the criterion is now `ai-retirement-criterion.util.ts` and the interval form the
  ticket preferred was measured and rejected (`push` fails it). See §160. **A3 now has a criterion to
  be judged against, and `push` joins `tour` as retirable.**
- ~~**A3 (395)** only after A5, A6 and A4~~ — **done 2026-08-11.** Recovery is unchanged from §130's
  baseline, but 43 of the 56 "wrong" prompts are the planner agreeing with the classifier, so the
  table was scoring it against rescue's mistakes. Raw 31% / corrected 55%; 3 → 7 domains clear. §162.
- ~~**A2 (394)** last~~ — **done 2026-08-11.** The honest form was not just achievable, it was
  already true: 0 of 134 references route. Now gated by
  `ai-retired-detector-decides-nothing.spec.ts`. See §164.

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

## A1 · e2e-bug.392 — the execution path already existed — **Closed 2026-08-11**

**What this said.** *"`ai-gateway.service.ts` runs the planner in its trace-recording tail... behind
`AI_PLANNER_SHADOW_SURFACES`, which is unset. The planner is an observer that does not even
observe."*

**Stale since §90/§129.** Written up in §161; `npm run test:ai-planner-rollout`.

`CommandUnderstandingPipelineService.stagePlannerRoute` runs on **every request**, calls
`decidePlannerRoute` and pushes a competing candidate. `AiCommandPlannerService` is registered in
`ai.module.ts`. `plannerExecuteDomains()` seeds from `RETIRED_DETECTOR_DOMAINS`, so **`tour` and
`guide` route with no environment variable set**. The shadow runner still exists and is still unset;
it is simply not the only path, and the ticket described the wrong one. Ten tests now pin this in
both directions, including that a non-retired, non-flagged domain is still declined.

- [x] **rollout mechanism** — already decided and implemented: retired domains hardcoded,
      `AI_PLANNER_EXECUTE_DOMAINS` additive on top. Its doc comment justified the hardcoding with
      *"the detectors have been deleted"*, which is **false** — all 15 `tour` detectors are still
      present and `reachableFromProduction`. The conclusion survives on the true premise (rescue is
      *locked*, so the same 34 traces / 20.2% still depend on the planner); the comment is corrected
      and a test now asserts `RETIRED_DETECTOR_DOMAINS` equals `RESCUE_ACTION_LOCKED_DOMAINS`.
- [x] **multi-step** — stays with §33's executor. `reject:not_single_step` is **3 of 121** prompts
      (§120) and **2 of 343** held-out examples (§141). A second execution path that could
      half-execute a plan, for five traces, is not a trade worth making.
- [x] **measure before enabling** — turned into a test rather than a habit. Applying A4's criterion
      to the domains already enabled shows it was not followed: **`guide` is 0/2 recovered and does
      not clear.** Recorded as an explicit, pinned exception rather than reverted — 2 traces of 245,
      rescue locked either way, and reverting on n=2 repeats A4's error in the other direction.

**Related:** §89, §90, §129, §161, `e2e-bug.394`, `e2e-bug.406`. **No longer blocks** A2 or A3.

## A2 · e2e-bug.394 — the exit criterion is already met, and now asserted — **Closed 2026-08-11**

**What this said.** The 15 `tour`/`guide` detectors have **128 references across 31 files**, and most
are *other* detectors using them as negative guards — `if (isListTourCalendarWeekPrompt(p)) return
null;`. Deleting the predicates deletes the guards, and every one of those commands starts firing on
tour prompts.

**The count settled it** (§164). Reproduced at 134 references / the same 31 files:

| kind | count |
|---|---|
| imports / re-exports | 47 |
| definitions | 15 |
| **declines** | **71** |
| completion checks | 2 |
| dead code | 1 |
| **routing — a call whose true result produces an action** | **0** |

Zero, including in `ai-intent-rescue.service.ts` — all ten of its references are an import or a
`return null`.

- [x] ~~separate each detector's matcher from its guard use~~ — **not needed.** There is nothing to
      split: no matcher is doing routing work. 31 files not touched.
- [x] **rewrite the exit criterion to "no detector may decide an action"** — it was already true and
      simply unasserted. `ai-retired-detector-decides-nothing.spec.ts` now enforces it, deriving the
      slice from the inventory so it extends to any domain added to `RETIRED_DETECTOR_DOMAINS`.
- [x] count how many of the 128 references are guards versus real routing, per file — above.

**The detector files stay, and will**, because 71 declines depend on them. Phase 8's letter said
delete; what retirement means here is what the lock enforces, which is now checkable.

Found in passing: `explain_tour_services`' completion validator is `isX(p) ? [] : []` — both branches
empty. Filed as `e2e-bug.439` rather than absorbed.

**Related:** §93, §148, §164, `e2e-bug.439`.

## A3 · e2e-bug.395 — re-measured; the table was scoring the wrong thing — **Closed 2026-08-11**

**What this said.** Across 121 rescue-dependent prompts (216 traces): `tour` 97%, `push` 83%,
everything else 0-18%, **25.5% overall** (30.6% after §119). Thirteen of fourteen slices not ready.

**Re-measured** after A5/A6, full corpus, two runs. Written up in §162.

**Nothing moved.** 27 and 28 prompts, 31.0%/32.4% traces — §130's baseline landed on 27 and 28
prompts and 30.6%/32.4%. Noise floor **4 prompts**. A6's spec fix corrected a real defect and changed
planner recovery by nothing measurable; `missing_variables` is 1 of 121.

**But the metric is scoring the wrong thing.** The largest bucket is `wrong` at 56 prompts — and
**43 of those 56 produce exactly the `classified_action`**, the answer rescue overrode. A5 showed
that override is usually the mistake. One of them is `e2e-bug.260`'s own ticket: the planner reaches
`list_refunds` for *"how many refunds have I issued this month?"* and the corpus scores it a failure.

| | raw | label-corrected (upper bound) |
|---|---|---|
| trace recovery | **31%** | **55%** |
| domains clearing A4's criterion | 3 | **7** |

§94's per-domain numbers are also **stale on the raw metric**: `commerce` 18% → **73%**,
`operations` 3% → 20%, `business` 0% → 21%.

- [x] fix retrieval globally (A5) — done, and its finding is what reframes this section
- [x] re-measure per domain, prompt-weighted — done; prompt-weighted first, per §130

**Nothing is being enabled on this.** The corrected column assumes every planner-agrees-with-classifier
case is a planner win, which is an upper bound, not an adjudication. Acting on it would repeat A4's
and A5's error in a more expensive direction.

**What it hands to A7:** adjudicating those 43 prompts is bounded, one-time, on a fixed corpus, and is
now the highest-value work left in Phase 8.

**Related:** §94, §119, §130, §162, A5, A4, `e2e-bug.260`.

## A4 · e2e-bug.406 — the 90% bar replaced with a comparative criterion — **Closed 2026-08-11**

**What this said.** 95% Wilson intervals on the per-domain table: `tour` 33/34 is 85.1–99.5%, `push`
15/18 is 60.8–94.2%. No lower bound reaches 90%, and a 95% lower bound at 90% needs **n ≥ 35 with
zero failures** — the largest slice has 34 traces and one failure. Replace the criterion.

**Done.** Written up in §160; `npm run test:ai-retirement-criterion`.

The interval arithmetic checks out exactly, and the problem is worse than stated: **lowering the bar
does not fix it and neither does re-denominating.** A 70% lower bound is reachable in principle
(n ≥ 9 all-correct) and `tour` clears it — but `push` sits at 60.8% and fails. Measured against
*slice* traffic rather than the rescue subset, `tour`'s regression is 1/166 whose 95% upper bound is
still 3.3%, so even a 2% tolerance is undecidable. **No absolute threshold worth stating survives
these sample sizes.**

What works is the comparative form, for a reason the ticket did not state: it is **paired**. Every
rescue-dependent trace is lost under planner-off by construction, so both arms are evaluated on
identical traces and the variance that swamps an absolute rate cancels. On the same 34 traces whose
absolute rate cannot be pinned tighter than 14 points, the paired result is p ≈ 1e-10.

`ai-retirement-criterion.util.ts` encodes it: (1) exact one-sided sign test on discordant pairs,
p < 0.05; (2) the 95% upper bound on slice regression with the planner on must sit below the point
estimate of the loss deleting without it would cause. The two conditions agree on all thirteen
domains, and a test pins that.

**It is not the old bar renamed.** `push` recovers 83.3% — below 90 — and is **ready**. §127's
"stays below the bar" verdict is reversed; one more slice becomes retirable on evidence that was
always there.

- [x] replace the per-slice criterion — comparative, not interval-threshold; the interval form was
      measured and rejected because `push` fails it
- [x] restate §88, §92, §118, §119 and §127 — all five carry restatement notes
- [x] scope-guard `PROPOSE_ONLY_ACCURACY_BAR` to its per-command, 8,509-case design range

**Does not** re-open `tour`: §92's evidence was comparative all along.

**Related:** §92, §128, §160.

## A5 · e2e-bug.396 — the retrieval gap was mostly a mislabelled corpus — **Closed 2026-08-11**

**What this said.** **54 of 121** rescue-dependent prompts (45%) have the true command missing from
the shortlist; run §86's example-mining recipe — proven on `tour`, 64% → 98% — across the twelve
domains it was never run for.

**What the measurement found.** The premise does not survive contact with the data. Written up in
§158; `npm run measure:ai-retrieval-gap` reproduces it.

- baseline is **83/121 (69%)**, not 55%. §96 and §97 had already moved it and this ticket's headline
  was never restated — the first thing worth fixing was the number in the ticket.
- the corpus is every prompt where `action_changed_by = 'rescue'`, and its `truth` is the
  **post-rescue** action. §96 knew that made these prompts unsafe to *mine*. It is the same defect one
  level up to **score** against them.
- splitting on `classified_action`: **95 of 121 (79%)** are rescue *replacing* a classification, not
  supplying one. On those, the recorded action is in the shortlist 66% of the time and the
  **classifier's** action is there **86%** of the time.
- only the 26 `supplied` rows carry usable truth. They miss 6 times: 4 name commands a dashboard owner
  cannot reach at all (§83 again — `loyalty_points_balance`, `my_gift_cards`, `my_subscriptions` are
  `customer`/`public` only), 2 are labels that are simply wrong.

**Zero of 121 prompts are a retrieval miss that adding spec examples would fix.** Checkbox 1 would
have taught `create_employee` that *"Create a new service called QA Staff Test"* is one of its own
examples, and the eval corpus would have ratified it. §96 called example-mining exhausted; it was
right for a stronger reason than it gave.

**What came out of it instead:** `e2e-bug.436` — a customer-surface command (`my_gift_cards`)
**executed** for a dashboard owner. The surface contract is not enforced at the execute gate.

**Related:** §86, §95, §96, §97, §158, `e2e-bug.435`, `e2e-bug.436`.

## A6 · e2e-bug.399 — the spec described a different program — **Closed 2026-08-11**

**What this said.** `appointment.reschedule` declares `appointmentId` required with
`resolver: 'appointment'`; the prompt never renders `resolver`; rule 4 forbids inventing ids; the
planner refuses. Two prompt-side attempts (§120, §130) measured negative and were reverted.

**What the sizing found.** Written up in §159.

**No handler reads the variable.** `handleRescheduleBooking` reads `bookingId`; `handleMarkPaidLogic`
reads `bookingId`/`bookingIds`; the customer-side `resolveOwnedBooking` reads `bookingId` and reports
`missing: ['bookingId']`. `appointmentId` appears in none of them — nor do `newStart` or `startsAt`,
which do not occur anywhere in `src/` as AI params. **Eight declarations across six specs, three of
them `required: true`, all fictional.**

`handleRescheduleBooking` states the real contract in its own failure message: *"Specify bookingId,
customer name, or provider + date/time."* The id is optional; the human reference is the normal path.
So §120 and §130 were teaching the planner about a resolver for a variable that did not exist, which
is why telling it more never helped.

**The proof needs no data.** *"move John's appointment to tomorrow at 3pm"*, *"mark the 2pm haircut as
paid"*, *"cancel my appointment"* — no documented example of any of these commands contains an id.
Every example failed its own spec's required-variable check.

| | |
|---|---|
| specs with a **required** resolver-backed variable | 21 |
| …of those, asking for an **id** | **2 → 0** |
| refusals §142 attributed to a resolver-backed required variable | 3 of 102 |

Nineteen of the 21 already ask for the human reference with a resolver attached. That *is* this
ticket's proposed fix — it was the convention already, and two commands in the pilot domain did not
follow it. No execute-time resolver seam was needed.

**Prerequisite for A1, not a tidy-up.** `runStep` has no production caller, so `step.variables` is
what reaches a handler when A1 lands. Wiring A1 against the old specs would have routed correct plans
into *"Could not find the booking to update"*.

**Still open:** `compensation.captures` names `appointmentId` on four specs. Those are saga capture
keys, not input variables, and the executor is unwired — correcting them now would be guessing.

**Related:** §99, §120, §130, §141, §142, §159, `e2e-bug.392`.

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
- [x] **narrow the detectors behind the 106 stolen examples** — **106 → 101**, `ROUTABLE_FLOOR`
      110 → 113 (2026-08-11, §163). Two narrowings, measured one at a time:
      `explain_provider_availability` was answering *"sign in with Apple"* (106 → 104, `passed`
      unchanged — the victims are classifier-routed, so they became *unclaimed* rather than routed);
      and `isMarkPaidPrompt` ended with `mark` + `done` and **no payment word**, so status changes
      routed to a **T2 money command** (104 → 101, `passed` 111 → 113).
- [ ] for the 343, the answer is the planner (A1) plus retrieval (A5)
- [ ] residual on the 61.8%: the embedding index still contains the held-out string; removing that
      needs 343 re-embeddings

**The remaining 101 have no cluster left.** The largest thief holds 10 across 10 different victims;
then 7, 5, 4, 4, and twos and ones. The two taken were the only pairs where one discriminator covered
several victims *and* the over-claim was unambiguous. Continuing means adjudicating ~100 one-off
pairs — the same shape of work A3 handed over for its 43 prompts, and those are worth more per unit
because they are real traffic rather than hand-written examples.

**Related:** §132, §140, §141, §163.

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

- [x] a runner with database access — **the repo already had one.** `@nestjs/schedule` is a
      dependency and five schedulers already run in-process, two in this module
      (`ai-platform.scheduler.ts`, `ai-autopilot.scheduler.ts`). `AiCompletionFloorScheduler` uses
      the app's own TypeORM connection: no second set of DB credentials, no `.env` parsing from a
      cron shell, no host-level scheduling, and it works wherever the backend is deployed. A
      GitHub Actions schedule was rejected — the runner has no route to the production database,
      and the script's own header says a floor checked against a fixture measures nothing.
- [x] a check cadence — **daily**, `EVERY_DAY_AT_6AM`, for the reason the ticket gives.
- [x] a cadence for `--update` — **none; it is deliberately never scheduled.** `--update` rewrites
      the committed `ai-completion-floors.json`, and the script's own rule is that giving ground
      must be "a decision somebody signs, not a side effect of a scheduled run". A container
      writing to its ephemeral copy of the repo either changes nothing or changes something nobody
      reviews. Ratcheting stays manual (`node scripts/ai-completion-floor-gate.mjs --update`, then
      commit the diff), and a test asserts the scheduler exposes no update path.
- [x] a destination for a breach — **structured error log**, decided 2026-08-04. Every deployment
      already collects stderr, so unlike an unconfigured webhook it cannot fire into nowhere. It is
      isolated in a single `report()` method, so pointing it at a webhook or an ops table later is
      a change in one place.

### What shipped (2026-08-04)

`ai-completion-floor.scheduler.ts` — reads the same two §28 views the CLI reads
(`ai_command_completion_summary`, `ai_command_completion_by_surface`) through the app's connection,
checks them with the already-tested `checkCompletionFloors`, and logs. Verified against the live
database that the scheduler and the CLI see identical numbers (5,362 calls / 64.0%; customer 60.6,
dashboard 67.1, provider 82.5) — the ticket's sibling §7 warns that two numbers called "completion
rate" that disagree would be worse than one.

The assertions are built around the ticket's own warning that a job which *looks* like coverage is
worse than none: it logs the healthy state too (so a quiet day is still evidence it ran), it names
low-volume skips (so "not measured" cannot pass as "measured and fine"), and a failure to run at all
is logged at **error**, not warn.

**A bug caught before it shipped:** the first version loaded the floors with
`import … with { type: 'json' }`. `resolveJsonModule` is off, no other file in `src/` imports JSON,
and `nest-cli.json` only copied `modules/ai/guide/*.json` — so it would have worked in dev and
failed in the built image. It now reads the file the way the guide corpus does (dist, then src), the
asset is registered in `nest-cli.json`, and a test asserts that registration.

**Verified:** 42 tests (`npm run test:ai-completion-floor-schedule`, added to
`test:ai-roadmap-gates`); `tsc` clean.

**Follow-up:** **e2e-bug.434** — with more than one instance every scheduler fires per instance, so
a breach would alert N times. Pre-existing across all six schedulers, not specific to this one.

**Related:** §45, §28.

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

- [x] decide single- vs multi-instance deployment — **answered from the repo, 2026-08-04.**
      Production is **single-instance**: `deploy/docker-compose.prod.yml` declares one `backend:`
      service with no `replicas:`/`deploy:` block, and `deploy/nginx.conf.example` gives each
      upstream exactly one server (`booking_api → 127.0.0.1:3001`). Nothing load-balances across
      instances today. In-memory state would therefore *work* right now — the question is whether
      to depend on that.
- [x] then choose the store — **Redis, decided 2026-08-04.** Scaling to more than one backend
      instance is expected, which rules out process-local state; Redis was already deployed and
      idle; and TTL makes B3's expiry a storage primitive rather than a sweeper.
- [x] **build the store** — `ai-conversation-state.store.ts`, shipped 2026-08-04. See below.
- [ ] then wire B3 and B5 onto it — **unblocked**; the store is in place and default-off

### What the ticket's premise got wrong

B8 says "nothing carries conversation state between turns". Two of its three prerequisites already
exist:

| piece | status |
|---|---|
| conversation **identity** | **exists** — `ai-conversation.util.ts` derives a stable `conversationId` by hashing `userId + businessId + first user message`. No client change, no new field, no migration. It also documents why e2e-bug.357's "nothing in the request identifies a conversation" was wrong. |
| **turn buffer** (§3.4 tier 1) | **already arriving** — clients send the *whole* transcript in `history` on every request; nothing consumed it. |
| entity-store **shape** | **exists** — `ai-entity-store.util.ts` (`createEntityStore`, refs). |
| **persistence between turns** | **missing** — this is all that B8 actually still is. |

So the remaining decision is narrower than "how do we do conversation state": it is *where do the
few server-derived facts live that the replayed transcript cannot reconstruct* — resolved entity
refs (B5) and pending clarifications (B3).

### Store options, with what the repo already provides

| option | what exists today | cost |
|---|---|---|
| **Redis** | provisioned in **both** `docker-compose.yml` and `deploy/docker-compose.prod.yml` (with a `redisdata` volume); `ioredis` is already a dependency; `app.config.ts` already reads `REDIS_HOST`/`REDIS_PORT` — and **not one line of `src/` uses any of it**. Redis is deployed, running and idle. | a client module + connection lifecycle |
| **Postgres** | strong precedent: AI state already persists as JSONB on the `business` row (`aiSettings.entityMemory`), and `ai_command_trace` is an established AI-owned table | a table + migration; a write per turn |
| **in-process `Map`** | works today given single-instance | dies on every deploy and restart; B3's expiry needs a manual sweeper; silently wrong the day a second instance appears |

**Note on B3:** its whole complaint is *"stale clarifications never expire"*. Redis makes expiry the
storage primitive (`SETEX`) rather than something to implement and schedule.

### What shipped (2026-08-04)

`AiConversationStateStore` — load / save / clear, keyed `ai:conv:v1:{conversationId}`, registered in
`ai.module.ts`. Four safety properties, each tested, because this puts a dependency that has never
been on a request path onto one:

| property | how |
|---|---|
| **off by default** | `AI_CONVERSATION_STATE_ENABLED` unset ⇒ every method is a no-op and Redis is never contacted. Nothing reads the store yet, so shipping it changes no runtime behaviour; B3/B5 turn it on. |
| **never throws** | every failure swallowed and logged. Losing context degrades an answer; an exception would fail a request that would otherwise have succeeded. |
| **cannot hang a request** | `enableOfflineQueue: false` + 1s connect timeout, so a down Redis fails *immediately* rather than queueing commands until they time out. A dead cache must not become latency. |
| **null id is not a key** | anonymous visitors get `conversationId: null` by design (e2e-bug.371); writing under a null key would reintroduce exactly the cross-person sharing that avoids. |

Two details worth keeping: `EntityRef.recordedAt` is a `Date`, and `JSON.parse` returns a string —
which still type-checks and only misbehaves later when staleness is compared, so the codec revives it
explicitly. And a record whose version does not match is discarded rather than coerced: a
conversation that forgets is recoverable, one that binds "it" to a corrupted ref is a wrong action.

**Verified:** 21 tests — 16 unit against a fake client, 5 against a **real Redis** (TTL is actually
applied and refreshed on rewrite, which no fake can prove), plus a Nest-container check that the
provider resolves. The real-Redis suite skips when none is reachable and *prints which*, so a green
run on a machine without Redis cannot be mistaken for verified behaviour. Gate:
`npm run test:ai-conversation-state`, added to `test:ai-roadmap-gates` (20 gates green).

**Blocks:** B3, B5, part of B4 — all now unblocked.

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
| `apiModule` | **705** | must be added |
| `compoundStep` | 609 | must be added |
| `sprint` | 596 | must be added (traceability) |
| `surfaceHandlers` | 16 | must be added (optional) |
| `label` | **705** | derivable |
| `executionMode` | **705** | **not** derivable |

**Re-measured 2026-08-13 and now gated.** The registry holds **705** entries, not 696 — §125's figure
predates §165 adding the nine §149 commands. `compoundStep` (609), `sprint` (596) and
`surfaceHandlers` (16) all still measure exactly as recorded, and the `executionMode` counterexample
is confirmed as exactly one: `coordinate_waitlist_offer: orchestration`, non-mutating.

`ai-command-registry.derivable.spec.ts` now re-derives all of this on every run. **That is the point
of the slice**: C1's plan is to delete hand-maintained lists, and its safety rested on a measurement
taken once and never repeated. A command added between the measurement and the deletion could bring
a field the specs cannot produce, and nothing would have said so.

The gate asserts the *gap*, not zero: fields already derivable (`surfaces`, `handler`) must stay
derivable, and the four missing ones are pinned at their current shortfall so the number maintains
itself. It deliberately does **not** assert "0 missing" — that would be a ratchet on work nobody has
started, going red the moment someone adds a command, which punishes the wrong action.

`executionMode` has a counterexample: 695 of 696 follow `mutating ? <mutate> : 'read_only'`, but
`provider.coordinate_waitlist_offer` is T0, non-mutating, `orchestration`.

- [ ] add the four fields to `CommandSpec`
- [ ] generate `COMMAND_REGISTRY` from the specs, keeping `executionMode` explicit
- [ ] delete the seed list, then the dispatch map, then the classifier schema, then the coverage and
      promotion lists — one at a time, each behind the conformance gate

**~~Why this is now urgent~~ — the urgency argument is stale (2026-08-11, §165).** §149's failure
mode is **already gated**: `ai-command-inventory.boundary.spec.ts` asserts *"every mapped action is a
real registry command"*, so a detector routing an action with no registry row fails by name.
Negative-controlled.

**What checking it found instead.** Nothing ran the *reverse* — registry → spec — and §125's "none is
orphaned" was a measurement, not a gate. At **705 entries / 696 specs there were nine orphans, and
they were §149's nine**: that fix added the registry rows and never wrote the specs. All nine were
therefore **unroutable by the planner**, absent from the embedding index, and invisible to every
spec-derived gate.

- [x] **the nine now have specs**, and `ai-command-spec.conformance.spec.ts` gates registry → spec
      with no exception list (§165). Embedding cache rebuilt, so they are retrievable rather than
      merely declared.

**So C1 is now deduplication, not safety.** Both directions are covered by cheap gates; generating
the registry from the specs is still worth doing, but it no longer carries "the programme's largest
defect can recur".

**Related:** §66, §125, §149, §165.

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

- [x] start with the **134 T2/T3** specs: money and bulk, and the set `validatePlan` and the
      confirmation model already treat as highest risk — **134 → 0** across twenty slices
      (2026-08-11, §166). Every T2 and T3 spec now declares its inputs or is a named exemption.
      **The 134 was itself wrong**: it counted commands that read no user-supplied param, for which
      `variables: {}` is the right answer.
- [x] for each, read the handler and declare what it reads — 122 commands declared
- [x] a static audit was attempted and abandoned … Do this by reading, not by regex — **confirmed
      necessary on the first slice**: a grep offered `cardType`/`deliveryMethod` for `buy_gift_card`,
      and reading the handler shows both are hardcoded. Declaring them would have minted
      `e2e-bug.399` fresh.
- [x] **add a conformance rule that a mutating spec must declare at least one variable, once the
      backlog is cleared** — shipped. `ai-declared-inputs.rule.spec.ts` asserts that every T2/T3
      spec declares at least one variable unless it appears in one of two named exemption lists:
      `VERIFIED_NO_INPUT` (9 commands that read no user-supplied param — no `params` argument, or
      only pipeline-injected keys) and `ORCHESTRATION_NO_CONTRACT` (2 that pass no structured field
      to `runOrchestrationIntent`). Both lists are pinned by value, so a third entry has to be
      argued for.

      For twenty slices this was a **ratchet** instead, because the rule shipped against 134
      undeclared commands would have failed on day one and been switched off. The rule is strictly
      stronger than the ceiling it replaces: a ceiling can be satisfied by declaring something else,
      a per-command rule cannot.

**Status: closed for T2/T3.** The other **511 T0/T1** specs are still undeclared — the same work
again, deliberately not attempted here, because a rule that fails on 163 T1 commands would be
switched off exactly as the T2/T3 one would have been.

**Related:** §142, §166, §410, §419.

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

**Remaining: 27 deterministic failures** (2026-08-13; the "69" above was stale — the corpus stood at
51 before this pass, and 29 before the `explain_guest_checkout_fields` pass below).
Corpus **99.68%** (8,437/8,464). `got none` is down 7 → **4**; the rest are
genuine steals, a different defect class. Known-failures manifest **246 → 230** tests, **92 → 84**
suites.

**Every remaining cluster is ≤ 4 and most are multi-cause.** The systematic wins in this corpus are
spent; from here it is one prompt at a time, which is worth weighing against A5 (retrieval), where
45% of prompts never see their command at all.

- [x] **`summarize_my_appointments` 4 → 1**, then → **0** on the second pass (2026-08-04).
      See below — and note the detector was innocent.
- [ ] continue the loop that has worked six times: re-cluster, take the largest, check the predicate
      *before* changing anything, score every attempt against the full corpus
- [x] **`configure_stripe_connect` 3 → 1**, then → **0** on the second pass (2026-08-04).
      Same root cause — see below.
- [x] **`explain_guest_checkout_fields` 4 → 2 (2026-08-13)** — the real cluster of 2, exactly as
      predicted here. **Corpus 8,435 → 8,437 / 8,464, 99.66% → 99.68%, failures 29 → 27.**

      **The detector was innocent for the third time.** `isExplainGuestCheckoutFieldsPrompt` returns
      `true`, the right aspect, and the right rescue action for **all four** failing prompts — and
      for the two sibling prompts that already passed. Identical output either way, so no change to
      that detector could have fixed anything. The steal happens upstream.

      **Root cause: the weak fallback in `hasRebookLastAppointmentCoreCue`**
      (`ai-rebook-last-appointment.util.ts`), which fired on `/\b(book|schedule)\b/` +
      `/\b(last|same|again|repeat)\b/`. It means "book the same *appointment* as before", but
      `same` also attaches to contact fields — *"book as a guest with the **same phone** as my
      profile"* — and those are checkout-field questions.

      **Why only two of the four were stolen, which is the part worth keeping.** The two that passed
      say "book**ing**" (a noun); `\bbook\b` does not match it. The corpus was being carried by an
      accident of wording, not by a distinction the code drew. Fixing either detector would have left
      that accident in place.

      **Fix: `hasPriorVisitCue`, built as a whitelist — and the first attempt got this wrong.**
      Version 1 blacklisted contact nouns (`phone|mobile|e-mail|number|address|contact|details`).
      It scored the same on the corpus, and was **corpus-shaped**: of nine paraphrases carrying the
      identical meaning, **eight were still stolen** — "same cell", "same telephone", "same login",
      "same credentials", "same account", "same WhatsApp", "same identity", "same name". The ways to
      name a contact field are open-ended, so a blacklist can only chase them.

      Version 2 inverts it. `last|again|repeat` still stand alone; `same` only counts when it
      modifies something you actually rebook — `appointment|booking|visit|service|treatment|session|
      slot|time` — or is the bare "same as (before/last time)". Members were taken from the rebook
      fixtures, where `same` modifies exactly `as`, `service`, `again`, `time`, `appointment`.
      **Unknown nouns now fall through to "not a rebook"**, which is the safe direction: every
      confident path (`matchRebookScenario`, `REBOOK_LAST_CUE`, `EXPLICIT_REBOOK_CUE`, the hy/ru
      cues) has already returned `true` above, so this is a last resort where a false positive
      routes a *question* into a booking action. All nine paraphrases now pass.

      Same score both ways — **8,437/8,464, `rebook_last_appointment` 24/24**, every rebook compound
      100% — so the corpus alone could not have told these two versions apart. Regression sweep:
      **82 failing suites, list identical to baseline.**

      Provider nouns are deliberately excluded from the whitelist: `STYLIST_ONLY_PICK_BLOCK` already
      routes "book the same stylist" to provider-pick, so listing them would be dead code.
- [ ] the remaining 2 are separate causes and need separate passes: `reminder-toggles-customer`
      (stolen by `explain_my_notifications`) and `why-email-hy-public` (`hy`, rescue returns none)
- [ ] `explain_provider_specialty` is now 2, not 4

**Re-measured 2026-08-13 — this section's numbers still hold; the summary table's did not.** Ran the
gate directly (`jest --testPathPatterns='ai-command-eval.accuracy-gate'`, ~94 s):
**8,435 / 8,464 = 99.66%, 29 failures**, delta **+0.26%** against a 99.4% stored baseline. That
matches this section exactly, so no re-analysis is needed here — but the at-a-glance table and the
D1 wave row still carried the superseded *8,395 / 99.18% / 69 failures*, and both are now corrected.

Full current cluster census, for whoever takes the next pass:

| n | intent |
|---|---|
| 2 | `explain_guest_checkout_fields` (was 4 — the two `rebook_last_appointment` steals are fixed) |
| 2 | `fix_checkout_validation_error`, `explain_provider_specialty`, `explain_package_currency`, `compound:list_services+check_providers_for_service+create_booking` |
| 1 | `update_location`, `summarize_reviews`, `summarize_customers`, `list_customers`, `explain_why_sign_in`, `explain_tour_day_slots`, `explain_tenant_app_install`, `explain_professional_profile`, `configure_stripe_connect`, `configure_business_tax`, `compound:none`, `compound:…+book_nearest_slot+pay_online` |

This confirms the section's own judgement: **every cluster is ≤ 4 and most are multi-cause**, so the
systematic wins really are spent. Note `configure_stripe_connect` shows 1 despite being marked
"3 → 1 → 0" above — worth a look before assuming it regressed, since the checkbox claims 0.

**How to run the gate** (it is not obvious, and cost a wrong reading once): `npm run test:ai-accuracy`
runs **three** jest passes — the gate, the steal guard, then the reporter's own unit tests. Tailing
its output shows only the third, whose fixtures print things like *"Overall accuracy delta: -50%"*
and *"⚠ This baseline is WORSE"*. Those are **test fixtures, not measurements**. For the real number,
run the `ai-command-eval.accuracy-gate` pattern on its own.

### `summarize_my_appointments`: the detector was never the problem

Checking the predicate first is what this loop is for, and here it paid immediately:
`isSummarizeMyAppointmentsPrompt` returns **true** for all four prompts, and
`rescueProviderEarningsIntent` returns the right action for all four. Tweaking the detector — the
obvious move — would have changed nothing.

Instrumenting the pipeline phase by phase showed the actual sequence:

1. `runRescueClassifiedPhase` returns `summarize_bookings` (`summarize_bookings_metric`) at line 974
   — a **dashboard** rescue claiming a **provider** prompt, long before the provider-earnings rescue
   at line 1594 can run;
2. `acceptRescueForSurface` rejects it, because `summarize_bookings` is dashboard-only;
3. `classifiedRaw` is non-null, so the pipeline does not stop — it falls through to the unknown
   phase, which returns **the same wrong answer**;
4. rejected again ⇒ final result `null` ⇒ `got none`.

So the correct rescue existed, worked, and was unreachable — the same shape as `e2e-bug.425`, where
a surface gate silently discarded a correct result.

**Fix:** consult the dashboard summarize rescue only where `summarize_bookings` is actually legal,
at both call sites (classified and unknown). An absent surface means no gate, matching
`acceptRescueForSurface`'s own rule, so callers that omit it are unaffected.

**The general defect is filed as `e2e-bug.435`** — first-match-wins across the rescue chain with no
surface awareness, so *any* wrong-surface rescue can shadow a correct one and yield `none`. This was
one instance; the chain has ~163 rescues and nothing prevents the next.

### `configure_stripe_connect`: the same root cause, third instance

Predicted by the ticket above, and it took under ten minutes to confirm because the signature was
now familiar. `isConfigureStripeConnectPrompt` → **true** for all three prompts;
`rescueMarketingGrowthIntent` → **`configure_stripe_connect`** for all three; the full chain →
**`null`**.

The shadow this time was **`pay_online`**, on the **dashboard** surface. Its guard already existed —
but it was hand-written as `input.surface === 'provider' ? null : …`, naming one surface by hand
when `pay_online` is illegal on *two*. So on dashboard it fired, won, was rejected by the surface
gate, and the marketing-growth rescue that would have answered never ran.

**Fix:** a shared `rescueAllowedOnSurface()` helper that asks the registry instead of maintaining
surface lists by hand, applied to both `pay_online` call sites and reused for the
`summarize_bookings` guard above — so the rule is expressed once.

**Note, not changed:** `list_my_upcoming_appointments` and `confirm_my_booking_details` sit
immediately beside `pay_online` with the identical hand-rolled `=== 'provider'` exclusion. They are
the same latent shape, but no failing case demonstrates it, so they are recorded rather than churned.

### Five instances, and the accounting correction

Re-clustering by **cause** rather than by intent (a `got none` / stolen split) showed the first two
passes had each left a straggler: `summarize_my_appointments` went 4 → **1**, not 4 → 0, and
`configure_stripe_connect` 3 → **1**, not 3 → 0. The corpus totals (51 → 47 → 44) were right and
verified; the per-intent claims were not. Each straggler had a *different* shadow:

| shadowed command | surface | shadowed by | legal on |
|---|---|---|---|
| `summarize_my_appointments` | provider | `summarize_bookings` | dashboard only |
| `configure_stripe_connect` | dashboard | `pay_online` | customer/public |
| `summarize_my_appointments` (2nd) | provider | `summarize_customers` | dashboard only |
| `configure_stripe_connect` (2nd) | dashboard | `explain_provider_availability` | customer/public |
| *(pre-existing, §150)* | all | `compound_intent` | pseudo-action |

**Five instances of one defect in a single session**, each costing 1–4 eval cases, each fixed by the
same three-line guard. Corpus **51 → 41**, 99.40% → **99.52%**; `got none` failures **7 → 4**.

That is the argument for fixing the chain rather than the pairs, and it is now the whole content of
`e2e-bug.435`. The honest note against doing it here: a general fix means restructuring how ~163
rescues return, on the hottest path in the module, while 103 quarantined suites make verification
expensive. It should be scheduled, not slipped into an accuracy pass.

**Still latent, recorded not changed:** `list_my_upcoming_appointments` and
`confirm_my_booking_details` carry the same hand-rolled `=== 'provider'` exclusion beside
`pay_online`.

### `explain_business_tax` steals four narrower tax questions — a different defect

Clustering the *steals* by thief (rather than by victim intent) put `explain_business_tax` at the
top with 4. Unlike the previous three passes, checking the predicate showed the detector **is** the
culprit this time — `isExplainBusinessTaxPrompt` returns true for all four, and the rescue reason is
genuinely `explain_business_tax`.

It is the same omission as `e2e-bug.431` (§154), four more times. Each sibling owns a *narrower* tax
question, each has a detector that fires only on its own prompts, and each was missing from the
decline list — so a question about one booking's VAT was answered with the business's tax settings:

| prompt | should reach |
|---|---|
| "Explain the VAT on our Stripe payment for booking bk-tax-001" | `explain_stripe_tax_charge` |
| "Get frozen VAT breakdown after Stripe payment for booking bk-tax-001" | `lookup_booking_tax_metadata` |
| "Why VAT on this breakdown?" | `explain_appointment_tax` |
| "What tax applies to consultation service before I book it?" | `quote_staff_booking_tax` |

Four declines, ordered most-specific-first because a Stripe-charge question is *also* an
appointment-tax question and the narrower reading is the right one. Controls kept: "Explain our
business tax settings" and "What tax do we charge?" still reach `explain_business_tax`.

**Corpus 41 → 37**, 99.52% → **99.56%**, and independently **4 jest integration tests
(`ai-cmd-tax-9/10/11/12`) went from failing to passing** — corroboration outside the eval corpus.

**A probe artefact worth recording:** forcing `surface: 'dashboard'` made "Why VAT on this
breakdown?" return `null`, which looked like a regression. The eval case carries no surface, and
with the faithful input it routes correctly. `explain_appointment_tax` not being dashboard-legal is
real, but it is `e2e-bug.435`'s territory, not this fix's.

**Manifest maintenance:** 7 entries removed (the 4 tax suites + 3 eval-case entries). The regenerate
also *added* one — the detector-inventory sync spec, stale because these edits shifted line numbers
again. That is the manifest silently absorbing a benign failure, which its own rule forbids, so the
inventory was rebuilt (`npm run build:ai-inventory`, 9/9 green) and the entry removed rather than
accepted.

### `update_my_locale` steals two admin locale operations

Same omission a third time, and the starkest version: `isUpdateMyLocalePrompt` had **no sibling
declines at all** — a language word plus a change verb was the whole test. Both admin locale
operations necessarily contain both, so they were answered by changing the *asking user's own
account language*:

| prompt | should reach | got |
|---|---|---|
| "Switch default locale to Russian" | `configure_business_languages` | `update_my_locale` |
| "Update English display name for \"Spa Day\" package…" | `configure_package_localized_names` | `update_my_locale` |

Both siblings fire only on their own prompts, so declining them costs this detector nothing.
Controls kept: "Switch my language to Armenian" and "Change my account language to Russian" still
reach `update_my_locale`.

**Corpus 37 → 34**, 99.56% → **99.60%**, plus **2 more integration tests** (`ai-cmd-lang-1`,
`ai-cmd-lang-6`) from failing to passing. Manifest 239 → **236**; inventory rebuilt again for the
same line-shift reason.

### "retention" is two words, the third time — and the usual guard would have broken it

`e2e-bug.432` (§155) fixed this homonym for *configure* prompts by declining whenever
`isConfigurePrivacyRetentionPrompt` fired, and recorded the principle: guard by the sibling detector,
not by listing vocabulary, so the two stay in step. "Explain our data retention periods" is the
*explain* half, still landing on `summarize_customers`.

**The obvious fix was wrong, and checking caught it.** `isExplainComplianceStatusPrompt` also returns
**true** for "What's our customer retention rate?" — delegating to it would have declined the
analytics question this detector exists to answer. Verified before writing the guard, not after.

So this one needs vocabulary after all, kept as narrow as the distinction: it is "**data** retention"
and "retention **period**" that belong to compliance. Neither appears in customer-retention analytics
phrasing ("customer retention", "returning customers", "coming back") — all three verified still
routing to `summarize_customers`.

**Corpus 34 → 32**, 99.60% → **99.62%**, plus 2 integration tests. Manifest 236 → **232**.

### `explain_provider_availability` answers for two more siblings

Three failures, one producer — I had guessed two causes from the victim list and was wrong; checking
the `rescueReason` showed a single over-claiming detector. Both siblings fire only on their own
prompts:

| prompt | should reach |
|---|---|
| "Same time with Maria instead" (customer + public) | `switch_provider_same_time` |
| "Online payment checkout keeps failing — currency problem with Stripe Connect?" | `diagnose_stripe_checkout_failure` |

**A methodology note.** My hand-written controls ("Explain Maria availability next Tuesday", "Any
openings with the team this week?") both returned **false** from the detector — name extraction needs
context a bare unit call does not supply. Rather than treat bad controls as evidence, the corpus was
used as the control: it contains the genuine `explain_provider_availability` cases, so breaking them
would have shown up as a rise. It did not.

**Corpus 32 → 29**, 99.62% → **99.66%**, plus 2 integration tests. Manifest 232 → **230**.

### The pattern across this whole pass

Three separate detectors (`explain_business_tax`, `update_my_locale`, and §154's earlier case) all
failed the same way: **a narrow command with no decline list answers its broader siblings' questions.**
That is the mirror image of `e2e-bug.435` — there a *wrong-surface* rescue wins the race; here a
*wrong-specificity* one does. Both are consequences of first-match-wins over independent matchers
with no shared notion of "which of us is most specific". Worth stating plainly when Phase 8 is
argued: the planner picks from a ranked shortlist rather than racing predicates, and neither failure
mode exists in that shape.

**Verified:** corpus 51 → 47, no new clusters; failure lists across
`rescue|summarize|provider-earnings|dashboard-ops` byte-identical to a stashed baseline; `tsc` clean;
22 gates green.
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

- [x] the merge is **already** "category from one, package from the other" — verified 2026-08-13,
      see below. The second bullet was describing work that had shipped.
- [ ] extend the choice to other step kinds — **speculative: no failing case is known behind this**,
      and the reported one is repaired

**Re-read 2026-08-13 — the reported case is repaired; the residual is somewhere else entirely.**

Driving `chooseCatalogCompoundSteps` with the reported prompt and the LLM plan shape from the report
(`create_services` + an online-payment step) returns
`['bulk_create_catalog', 'enable_online_payment']`, with the first step carrying
`{categoryName: 'Y', services: [A/30/$50, B/45/$45, C/60/$70]}` — **normalised names, not the LLM's
literal "service A"**, which was the report's own proof that the deterministic path had been bypassed.
So all three symptoms are addressed: category created, link kept, names normalised.

The overclaiming summary is fixed too, and not by this function: `handleCatalogCompoundLogic` builds
its success line from `results` (`Completed N catalog step(s): …`), so it can no longer restate the
request as if it had happened.

**But the compound still fails on this prompt, for a reason neither ticket records.** The step switch
supports 14 kinds:

`assign_subscription_to_customer, bulk_assign_services_category, bulk_create_catalog,
configure_gift_card_products, configure_multi_service_settings, configure_package_online_payment,
configure_service_featured, create_package, create_service_category, create_subscription_plan,
deactivate_service, set_service_compatibility, update_service, update_service_duration_buffer`

Anything else hits `default` → `failure('Unsupported catalog compound step: X')`, and because the
loop returns on the first failure the **whole compound reports failure** — even though step 1 already
created the category and its services. Partial success, reported as total failure.

`enable_online_payment` is not in that list, and `ai-catalog.util.ts` never emits it, so it can only
arrive from the LLM plan. **This is the shared residual of e2e-bug.348 and .349: both reported
prompts end with "Turn on online payment for …".** Filed as **e2e-bug.448**.

Better than the original defect, which overclaimed success while creating nothing correctly — the
system is now honest. But it is still the wrong answer for the user, and it explains why both
tickets have lingered as "partial" after their named root causes were fixed.

**Half of e2e-bug.448 fixed 2026-08-13 — the reporting half.** The failure branch now names the work
that already landed: `Stopped at step 2 (enable_online_payment): … Completed before stopping: bulk
create catalog.`, with `details.completedSteps` carrying it structurally, separate from `details.steps`
(which includes the failed action, so a caller could not previously tell them apart).

The run still stops at the failing step — a later step may depend on it, and rolling back writes that
already committed is a different and much larger change. What is fixed is that a user whose category
and services *were* created is no longer told the request failed outright.

Negative control 3 fail / 1 pass — the survivor is the "still stops at the failing step" guard, which
is unchanged by design and would be worrying if it flipped. Corpus **8,435 / 8,464, 29 failures,
unchanged**; gates 28 / exit 0; sweep 85 vs 85.

**Still open (the other half), and it is the same problem as D5-b — sized 2026-08-13, deliberately
not done.**

`enable_online_payment` is not a real action name anywhere in `src`; the canonical one is
**`configure_service_online_payment`**, which has a working handler
(`handleConfigureServiceOnlinePaymentLogic`). So the fix is wiring, not new domain logic. The problem
is *how* to wire it:

- that handler takes **`PaymentsLogicDeps` — 14 dependencies** (gift cards, accounting, commissions,
  booking payments). `CatalogLogicDeps` has 5. Threading the former into the catalog path couples
  catalog to a dependency graph it has no reason to know.
- `AiCatalogService`'s constructor has **only the 5 catalog deps**, so it cannot call payments at all.
  The injection would have to come from `ai-command.service.ts:820`, the one caller.
- which means the natural implementation is **another injected callback**, exactly like the
  `resolveCustomer` parameter `handleCatalogCompoundLogic` already takes.

**That file already carries 8 such `(list, name) => …` injections, and they are `D5-b`** — the ticket
recording that compound services calling back into other domains need the *callees'* signatures
changed, as one contract rather than a growing pile of callbacks.

**Recommendation: do not add a ninth.** e2e-bug.448(b) and D5-b are the same architectural question,
and solving them together produces one contract; solving them separately produces two more callbacks
and the same ticket a third time. The reporting half was worth doing alone because it needed no such
decision — this half does.

Until then both tickets' prompts do the catalog work and stop short of the payment instruction,
which the reporting fix now states plainly to the user instead of calling the whole thing a failure.

**Related:** §114, §D3, e2e-bug.448.

## D3 · e2e-bug.349 — plural categories / cart intent on dashboard

**Partially fixed.** Root cause 1 was fixed by §100 (the deny-list gate became `CommandSpec.tiers`, so
`add_services_to_cart` is now false for staff/manager/owner on dashboard) and is pinned by a test.
Root cause 2 (`isBulkCreateCatalogPrompt` matching `category\b` in all four cues) is fixed.

- [x] confirm what remains — **done 2026-08-13. Not closable.** Both original root causes are
      genuinely fixed, but the reported prompt still creates nothing, for a third reason.

**Re-read 2026-08-13 — measured, not inferred.** Against the reported prompt
`"Create categories Y and Z. Under Y add service A (30 min, $50) and service B (45 min, $45). Under Z add service C (60 min, $70). Turn on online payment for everything."`:

| check | result |
|---|---|
| root cause 1 — cross-surface steal | **fixed.** `booking.add_services_to_cart` is `surfaces: ['customer','public']` with no dashboard tier, so it cannot win step 1 on a dashboard request |
| root cause 2 — plural `categories` cue | **fixed.** `categor(?:y\|ies)` in `ai-catalog.util.ts:127`, carrying an explicit e2e-bug.349 comment |
| `isBulkCreateCatalogPrompt(prompt)` | **true** — it now routes to the catalog path |
| `parseBulkCatalogFromPrompt(prompt)` | **null** — no draft is produced |

So the failure moved rather than closed: the prompt is no longer *stolen*, it is now correctly routed
and then yields nothing. `parseBulkCatalogFromPrompt` requires a `with services:` / `:` structure —
its `servicesText` is `prompt.split(/:\s*/)` or everything after `with services` — and the reported
form (`"Under Y add …"` across sentences) matches neither. A control prompt in the designed shape
(`"Create category Hair with services: Cut (30 min, $50), Colour (60 min, $90)"`) parses correctly,
so the parser is fine for its intended input and simply does not cover this one.

That is the **third and fourth items of the original fix direction, neither of which shipped**: the
narrow sentence split, and the `Under <Category> add <service lines>` segment classifier.

**A false alarm, recorded so it is not re-raised.** Calling `parseServiceLinesFromText` on the *raw*
prompt returns mangled drafts — `serviceName: "Create categories Y and Z. Under Y add service A"` —
which looks like garbage services being created. It is not reached: the draft path calls it on
`servicesText` after the split, and the only raw-prompt caller is `isBulkCreateCatalogPrompt`, which
uses `.length > 0` as a boolean gate. Nothing is created from those names.

**The two remaining items are coupled — and doing the first alone measures as zero.** The original
fix direction lists them separately, which invites implementing the sentence split first. Measured
against the reported prompt, that is a no-op:

`COMPOUND_SPLIT` (`ai-catalog.util.ts:110`) splits on `;` or ` and ` **only when a catalog verb
follows** — the constraint e2e-bug.347 established to stop service enumerations being shredded.
Extending it with `\.\s+(?=verb)` changes nothing here, because the reported prompt's sentences begin
**Create, Under, Under, Turn** and `under` is not in the verb list
(`add|create|enable|configure|deactivate|duplicate|update|assign|set|hide`). Verified by running both
the current and the extended regex over the prompt: **one segment either way.**

So the sentence split cannot fire until something recognises `Under <Category> add …` as a step
start — which is exactly what the second item provides. Implemented in the listed order, the first
change ships, measures flat, and invites the conclusion that the prompt is unfixable.

- [x] **shipped 2026-08-13 as one change.** `parseScopedCategoryLinesFromSegment` reads
      `Under <Category> add <service lines>` into a `bulk_create_catalog` draft, and `under` joined
      the catalog verbs in a new `\.\s+(?=…)` branch of `COMPOUND_SPLIT`. The reported prompt now
      decomposes into **two** `bulk_create_catalog` steps — category Y with services A and B,
      category Z with service C — carrying the right durations and prices.

**The design got simpler once the handler was read.** The plan assumed a third piece: expanding
"Create categories Y and Z" into two `create_service_category` steps. Not needed —
`bulk_create_catalog` already creates the category when it is missing (`ai-catalog.logic.ts`, `if
(!category) … categoryService.create`), so each scoped segment creates its own. The leading sentence
is redundant, not dropped work, and a test asserts the step count stays 2 so nobody "fixes" it by
adding a duplicate create.

**Checked before writing any code, because it would have made things worse:** all four split
segments classify as *nothing* today, so the split alone could not have produced a garbage category
named "Y and Z" — it would simply have stayed inert. That was the risk worth ruling out first, since
creating a wrongly-named category is worse than the current fail-closed.

**Measured, both directions.** Deterministic corpus **8,435 / 8,464 = 99.66%, 29 failures — identical
before and after**, same +0.26% delta. The change is corpus-neutral: no regression, and no corpus
gain either, because the reported prompt is not a corpus case. 10 new tests, negative-controlled
(reverting the util fails 6 of them). Two of the ten specifically guard the e2e-bug.347
over-splitting class — a prose sentence after a service enumeration, and decimal prices — since the
`.` branch is exactly where that bug could return.

**One mechanical follow-up the gate caught:** `ai-command-inventory.json` records detector **line
numbers**, and adding ~47 lines shifted them, failing the Phase 0 inventory gate. Regenerated with
`npm run build:ai-inventory` as the failure message instructs; gates then 28 / exit 0.

- [ ] `"Turn on online payment for everything"` is still unclassified and drops out of the compound
      — pre-existing, unrelated to this change, and the reason the reported prompt is *improved* but
      not fully served

**Related:** §100, §113.

## D4 · e2e-bug.426 — the decomposer over-claims a single-command phrasing

**What is wrong.** `create_booking_subscription_credit`'s own documented example, *"book them using
their membership"*, decomposes as a compound. It names one command.

**Not a new defect.** The decomposer always read it that way; `e2e-bug.425`'s surface gate was
discarding compound results before anything could observe it. It appeared the moment compounds started
routing, and was caught by §132's stolen ceiling (106 → 107) on that ceiling's first real test.

- [x] narrow the decomposer so "using their X" is not a second step — **shipped 2026-08-04**
- [x] lower the stolen ceiling back to 106 — **done**, `STOLEN_CEILING = 106`

### It took two fixes, because the compound was masking a second defect

**Fix 1 — the decomposer, as filed.** `extractServiceNameFromPrompt('book them using their
membership')` returns `"them using their membership"`: a pronoun with the payment clause glued on.
`isNamedServiceExtract` only rejected extracts *starting with* membership/booking words, so that
passed as a service name, `hasSubscriptionFirstVisitBookCue` fired, and the prompt decomposed.

Narrowed in `ai-subscription-first-visit-cue.util.ts`: strip a trailing payment clause, and reject
what remains only if it is a pronoun. Deliberately minimal — `"her first massage"` also begins with
a pronoun and is a perfectly good service phrase, so the pronoun test cannot stand alone; and
`"haircut using their membership"` still decomposes, because a real service survives the strip and
narrowing that too would be a second, unmeasured change.

**Fix 1 alone moved the ceiling not at all.** It only changed the thief: the example went from
`got compound_intent` to `got create_booking`. Measured, not assumed — before/after against a
stashed tree.

**Fix 2 — the routing gap the compound was hiding.** `isSubscriptionCreditBookingPrompt` matched
`using their **subscription**` but not `using their **membership**`, while the command's own
documented example says "membership". So the canonical phrasing never reached
`create_booking_subscription_credit` and fell through to a plain `create_booking`. One alternation
in `ai-booking-depth.util.ts`.

**Result:** stolen **107 → 106**, spec-coverage failures 449 → 448, unclaimed unchanged at 342.

**The lesson is the one §153/§155 already recorded** — measure after *each* fix, not after both.
Fix 1 looked complete, matched the ticket's wording exactly, and changed nothing that was being
counted.

**Verified:** no regressions across `subscription|booking-depth|intent-decomposition|ai-command-eval`
— failure lists byte-identical to a stashed baseline. `tsc` clean. `ai-command-inventory.json`
regenerated (`npm run build:ai-inventory`): line numbers only, no detector added or removed — the
inventory gate caught the drift, which is what it is for. All 22 roadmap gates green.

**Related:** §132, §150.

## D5 · e2e-bug.362 — entity resolution picks the first match on ties

**What is wrong.** `fuzzyMatchByName` is a five-tier cascade of `.find(...)` calls returning
`T | undefined`. Two customers named "John Smith" resolve to whichever the database returned first —
the user never disambiguated, and nothing records that a choice was made.

**Partially fixed (§111):** tiers 3 and 4 now use a Unicode word-boundary check (`queryMentionsName`)
instead of a raw substring, which removed the worst class (a short name matching inside a longer one).

- [x] return *all* matches and clarify on ties, rather than picking one — the primitive
      (`resolveEntity`) already did this; see below
- [x] the callers need a clarify path — **17 of 27 migrated, and every consequential path is
      covered**: creating a booking, bulk cancel/update/hide, rescheduling, customer lookup, and the
      unauthenticated guest booking and catalog. `ai-booking-core.service.ts` is complete for every
      site that can carry a clarification.

### State of D5 after ten slices (2026-08-13) — read this before picking it up again

**What changed.** `resolveEntity` went from a tested primitive with **zero** callers to the path
every consequential name resolution takes. Ten slices, each with a negative control and a
regression sweep against a fixed baseline; the per-slice narrative is below.

**The remaining 10 call sites are not more of the same work.** The original "27 call sites across 9
files" framing is misleading and cost time twice in this session before it was measured. What is
actually left decomposes into four separate tickets, none of which is a migration:

| # | what | sites | why it is not a migration |
|---|---|---|---|
| **D5-a** | **return-shape change** | 5 | `applyEmployeeScopeToWhere` → `boolean`, `findUnpaidBookingsForSweep` + `findBookingsForCalendarVisibility` ×2 → `Booking[]`, `buildCreateBookingPlanOnly` → `null`. None can carry a clarification, so migrating today converts an ambiguous name into a **silent empty result** — worse than the guess. One shared signature change unblocks all five. |
| **D5-b** | **callback-contract change** | 7 | `ai-command.service.ts` passes `(list, name) => this.resolveCustomer(list, name)` into the CRM-compound and catalog-compound services, whose parameter type is `(list, name) => T \| undefined`. The **callees'** signatures must change first. |
| **D5-c** | **list-of-names design** | 2 | `.map((name) => resolve(...))` over a user-supplied list. "Which of these did you mean" is a different question from the single-name case and wants its own shape. (The third such site turned out to be an oversight, not a design gap — fixed in slice 10.) |
| **D5-d** | **e2e-bug.446 + .447, jointly** | — | Three private copies of `fuzzyMatchByName` never got §111's word-boundary fix; but importing the fixed one **loses 4/4 inflected Armenian and Russian name forms**. The two bugs pull against each other and cannot be closed separately. Needs a matcher redesign scored against a real hy/ru corpus, not hand-written cases. |

**Two things a reviewer should not have to rediscover.** The dashboard resolves `employeeId` before
`employeeName`; the public surface resolves **name first** — preserved deliberately, and asserted, so
the inconsistency is visible rather than accidental. And the public surface is localized: its refusal
must go through `t(locale, …)`, never `resolveEntity.clarification`, or it reintroduces e2e-bug.108.

**Investigated 2026-08-11 — the primitive already exists; the gap is adoption.**

`ai-entity-resolution.util.ts` already returns a verdict rather than an entity: `resolveEntity`
gives `resolved | ambiguous | not_found` with a tier, a confidence, the tied candidates and a
ready-made `clarification` string. `ai-entity-resolution.boundary.spec.ts` already drives it against
the live `fuzzyMatchByName` over three tie shapes and proves the old matcher picks silently where the
new one refuses. 46 assertions across three spec files.

**Nothing calls it.** `EntityResolutionService` wraps it and is registered *and* exported in
`ai.module.ts` — and there are **zero constructor injections anywhere in `src`**. Meanwhile
`fuzzyMatchByName` has **27 call sites across 9 files**. So the remaining work is not designing a
clarify path; it is migrating callers onto one that is already built and tested.

That makes this item's second checkbox the whole of it, and ties it to **B7** (e2e-bug.367, "14
re-parsers shadow the resolver service") and **A6** (e2e-bug.399, "planner and entity resolver never
connected") — the same adoption, named three times.

**A false lead, recorded so it is not retried.** `command-completion.pipeline.service.ts:224` reads
`service: services.length === 1 ? services[0] : services[0]` — both branches identical, so it looks
exactly like a defeated ambiguity guard (the `employee` line above it is the correct form). It is
dead code and is filed as **e2e-bug.445**, but it is *not* this item's defect and must not be
"fixed" as one: `resolveServices` calls `fuzzyMatchServiceByName` once per name token and dedupes by
id, so one `serviceName` can only ever yield one service. `services.length > 1` means the user named
several *different* services, and making the singular field `undefined` there would turn "book a
massage and a haircut" into a clarification. Verified by driving `resolve()` directly.

**First caller migrated, 2026-08-11.** `command-completion.pipeline.service.ts` now resolves the
customer through `resolveEntity` instead of `fuzzyMatchByName`. Two customers named "John Smith" no
longer resolve to whichever row the database returned first: `entities.customer` is left undefined,
the tied candidates go into `entities.customers` (an optional field that existed with **zero**
consumers), and `command-completion.validator` reads it to ask *"which did you mean — John Smith or
John Smith?"* instead of *"Could not find customer John Smith"*, which would have been wrong about the
CRM.

Two deliberate constraints keep the slice's delta to ties alone:

- **`threshold: 0`.** `resolveEntity` defaults to 0.7, which would reject the `contains` (0.55) and
  `query_contains` (0.35) tiers the old matcher accepted — a re-tiering of *who* matches, on top of
  the tie fix. Ambiguity is checked before the threshold, so zero keeps acceptance identical and
  still refuses ties.
- **`not_found` falls back to `fuzzyMatchByName`.** The two matchers normalise differently, so
  acceptance can only stay the same or widen in this slice, never narrow.

Tested through `resolve()` rather than on a hand-built `entities` object, and negative-controlled:
reverting the pipeline to the legacy matcher fails 3 of the 6 new assertions and passes the other 3,
which are the guards (unambiguous still resolves, a genuine miss still says "could not find").

**Second caller migrated, 2026-08-13 — the first *mutating* one.** `AiBookingCoreService.handleCreateBooking`
now resolves the customer through a new private `resolveCustomerVerdict`, and returns a clarification
with the tied candidates in `details.candidates` instead of booking. The stakes differ from slice 1:
there a silent pick produced a wrong preview, here it writes an appointment onto the wrong person's
record, which nobody notices until they do not show up.

Same two constraints as slice 1 (`threshold: 0`, `not_found` falls back to the legacy matcher), plus
two orderings that keep the blast radius to ties:

- **An explicit `customerId` still wins outright** and the name is never consulted, so a caller that
  already knows the id cannot be made to clarify.
- **The ambiguity check sits after the `!service` guard**, so when both the customer and the service
  are unresolved the existing "specify which service to book" message still wins.

Negative-controlled: reverting only the service file fails exactly the 2 ambiguity assertions and
passes the other 4 — the invariance guards (explicit id, unambiguous name, genuine miss, and the
service-message precedence), which must pass either way or they are not guards.

`buildCreateBookingPlanOnly` (the plan-only twin, same resolution at line ~2613) was **deliberately
left alone**: it returns `null` on failure with no field to carry a clarification, so migrating it
would turn an ambiguous customer into a silently missing plan — worse than the guess. It needs a
return-shape change first.

**Third caller migrated, 2026-08-13 — provider resolution in the same handler.** Rather than copy
`resolveCustomerVerdict`, it was generalised to `resolveNamedVerdict<T extends {id, name}>(items,
name, 'customer' | 'provider')`, and the duplicated early-return became `ambiguityRefusal`. Both
entity kinds now run the same code path, so the next caller is a two-line change rather than another
copy.

Ordering added here: **the customer question is asked before the provider question** when both tie,
so the user is never handed two questions at once. That is asserted, not incidental — it is one of
the four assertions that fail under the negative control.

Testing this one needed a `slotResolver` stub. The "not refused" provider cases are the only ones
that resolve a provider and therefore reach `checkSlotAvailability`, which is null on a bare
instance; they crashed rather than returned. A crash does prove the ambiguity check was passed, but
asserting on it would break the moment anything else in the handler moved, so the stub reports the
slot unavailable and the assertion stays "the reply is not the ambiguity refusal".

**Fourth slice, 2026-08-13 — the five bulk handlers.** `bulk_smart_cancel`, `update_bookings`,
`cancel_bookings`, `hide_appointments_from_calendar` and `unhide_appointments_from_calendar` each
carried the *same* nine-line block: resolve `employeeName`, bail with `No provider found matching
"X".` if it missed. **A tie sailed straight through it**, because `resolveEmployee` returns an entity
either way — so the bulk operation ran against whichever namesake sorted first and cancelled, hid or
rewrote a whole day of the wrong person's appointments. Higher stakes than a single create, and the
guard that looked like it covered this never did.

All five now call one `providerNameGuard(action, params, employees)` returning `CommandResult | null`:
tie refused first, miss message byte-identical to before. Five copies of the block became five
two-line calls, so this is a net deletion.

Both halves are asserted (15 tests = 5 handlers × tie / miss / unambiguous): a change that only added
the refusal, or only preserved the miss, fails. Negative control over both booking-core specs: 9 fail
/ 17 pass.

**Excluded, same reason as `buildCreateBookingPlanOnly`:** the sixth guard of this shape, in
`findUnpaidBookingsForSweep`, returns `Booking[]` — there is no field to carry a clarification, so
migrating it would silently return "no bookings" for an ambiguous name. Needs a return-shape change
first. That leaves **8** `resolveEmployee` call sites in the file.

**The remaining count overstates the work available (read 2026-08-13).** Of the 12 remaining
`resolveEmployee`/`resolveCustomer` sites in this file, only **4** can carry a clarification today:
`handleRescheduleBooking` (provider + customer — mutating, the highest stakes left here),
`handleLookupServiceAssignment` and `handleLookupCustomer`. Five more are **blocked by return
shape** — `applyEmployeeScopeToWhere` returns `boolean`, `findUnpaidBookingsForSweep` and
`findBookingsForCalendarVisibility` (×2) return `Booking[]`, `buildCreateBookingPlanOnly` returns
`null` — and migrating any of them today would convert an ambiguous name into a silent empty result,
which is worse than the guess it replaces. **Those five are one shared return-shape ticket, not five
migrations.** The last two are the `.map((name) => resolveEmployee(...))` sites, where the user named
a *list* of providers; "which of these did you mean" is a different clarification and wants its own
design.

So "27 call sites" was never 27 units of the same work, and the honest remaining figure for this
file is 4 migrations plus one shape change.

**Fifth slice, 2026-08-13 — `handleRescheduleBooking`, provider and customer.** The worst failure
mode in the D5 set so far, because this caller does not merely mis-answer, it **acts**: on a tie it
selected a namesake, loaded *their* bookings, rescheduled one, and reported success. The wrong
appointment moved and nobody was told.

Worth being precise about what the old code did *not* do: it did not fall through to "Could not find
the booking to update". `resolveEmployee` returned an entity, so the lookup succeeded — against the
wrong person. That distinction is asserted directly, because a refusal that merely produced the
generic miss message would give the user the wrong advice (supply a `bookingId`) for a name that is
perfectly valid and just not unique.

The spec leaves `bookingRepo` **null on purpose**: any test that slips past the refusal and reaches
the booking lookup throws rather than quietly passing, and the one case that *should* get through
asserts the throw instead of swallowing it. Negative control across the three booking-core specs:
**12 fail / 20 pass**.

That leaves 2 migratable sites in this file (`handleLookupServiceAssignment`, `handleLookupCustomer`
— both read-only), the 5 return-shape-blocked ones, and the 2 list-of-names sites.

**Sixth slice, 2026-08-13 — the two read-only lookups. `ai-booking-core.service.ts` is now done.**
`handleLookupCustomer` and `handleLookupServiceAssignment`. Read-only is not low-stakes for the
first of the two: `lookup_customer` answers with the customer's **full detail record** — contact
details and visit history — so a tie handed back one person's record in response to a question about
a different person who happened to share their name. The second is milder (the wrong namesake's
service list) but is the same defect and the same fix.

`customerService` is left null in the spec on purpose, so a test that slips past the refusal and
reaches the detail fetch throws rather than passing quietly. Negative control across the four
booking-core specs: **14 fail / 25 pass**.

Every site in this file that can carry a clarification now does. What remains here is the 5
return-shape-blocked sites and the 2 list-of-names sites — neither is a migration.

**Tenth slice, 2026-08-13 — the plural `employeeNames` path, which slice 3 missed.**
Looking at the list-of-names sites turned up a gap in my own earlier work rather than a new design
problem. `handleCreateBooking`'s provider guard (slice 3) reads **`params.employeeName`**, singular.
But the `providerPriority` list further down is built from **`params.employeeNames`** *first*, and
each entry there went through the silent-pick matcher. So *"book with Anna or Maria"* bypassed the
guard entirely and still guessed which Anna — on the same handler I had recorded as done.

Each requested name is now checked, and the first ambiguous one is named back to the user, so the
question is about the name they typed rather than about the list. Negative control on the extended
spec: **6 fail / 8 pass**, the 2 new plural assertions among the failures.

The sibling site in `buildCreateBookingPlanOnly` stays blocked by its `null` return shape, and the
public `.map(...)` site is a genuine list-of-names design question — so this slice closes the part
that was an oversight, not the part that needs design.

**Ninth slice, 2026-08-13 — `ai-command.service.ts`, the third service with its own copy.**
`executeReadOnlySubIntent` dispatches the provider-scoped reads (`list_bookings`,
`show_appointments`, …) and passes `resolvedEmployee?.name` down as the heading, so a tie listed one
namesake's bookings **under a heading bearing that name** — wrong data wearing a label that makes it
look right. It now refuses, echoing the action so the caller keeps its context. Negative control:
**2 fail / 3 pass**.

**But the scoping matters more than the slice.** This file has 8 call sites of its `resolveEmployee`
/`resolveCustomer` wrappers, and **7 of them are callback injections** —
`(list, name) => this.resolveCustomer(list, name)` handed to the CRM-compound and catalog-compound
services, which take a `(list, name) => T | undefined` parameter. Those cannot return a verdict
without changing the *callees'* signatures, which ripples across several services. **They are a
contract change, not seven migrations** — the same shape of blocker as the return-shape group,
and they should be tracked with it rather than counted as D5 call sites.

**The six public-surface sites, read 2026-08-13 — and they do not follow the dashboard's precedence.**
`public-booking-assistant.service.ts` has its own private `fuzzyMatchByName` and five call sites plus
the definition:

| line | enclosing method | what a tie does today |
|---|---|---|
| 4981, 5155 | `handleBookAppointment` | **guest books with the wrong provider** — mutating, customer-facing, the highest-stakes pair left in D5 |
| 2085 | `applyPostFailureGuideFallback` | filters the service catalog by the wrong provider, so the guest is shown someone else's services |
| 5115 | `.map((name) => …)` | list-of-names shape, same different-question as the two in booking-core |
| 5669 | `attachSession` | wrong provider attached to session context |

**The blocker to copying the dashboard pattern verbatim:** these sites resolve **`employeeName`
first and fall back to `employeeId`** — the *opposite* precedence to `handleCreateBooking`, where the
explicit id wins and the name is never consulted. Preserving behaviour here therefore means keeping
name-first, even though id-first is the defensible order and is what slices 2–3 established on the
dashboard. Flipping it would be a second, independent behaviour change riding along inside a D5
slice, which is exactly what the `threshold: 0` and fallback constraints exist to prevent.

So the public-surface migration needs an explicit decision recorded before it starts: **preserve
name-first (behaviour-neutral, inconsistent), or unify on id-first (consistent, but a separate change
that needs its own tests and its own negative control).** Filed as part of this item rather than
resolved silently in passing. **Decision taken 2026-08-13: preserve name-first**, because "change
only the tie" is the constraint every slice so far has held to, and flipping precedence is a second
change that would ride along inside the same negative control.

**Second blocker, and the more concrete one: this surface is localized.** Summaries here are built
with `t(locale, 'assistant.…', {…})` across **en / hy / ru** — `assistant.availabilityProviderNotFound`
is already keyed in all three (`messages.ts:280 / 765 / 1257`). `resolveEntity.clarification` is an
**English-only string**, so returning it verbatim would put raw English in front of Armenian- and
Russian-speaking guests.

That is not hypothetical: **e2e-bug.108 in this same backlog is literally "raw English error
overrides Armenian translation"**, already found and fixed once on this surface. Copying the
dashboard refusal across would reintroduce a bug class the project has already paid for.

**Prerequisite, therefore:** add an `assistant.providerAmbiguous` key (`{name}`, `{options}`) to all
three locale blocks and have the public refusal call `t(locale, …)` rather than pass
`verdict.clarification` through. The dashboard slices were free of this only because that surface
is English-only; the constraint is real here and cheap to satisfy, but it must be satisfied *first*.

**Done 2026-08-13 (prerequisite only — no call site yet).** `assistant.providerAmbiguous` added to
en / hy / ru in `src/common/i18n/messages.ts` (lines 284 / 771 / 1265), with
`src/common/i18n/provider-ambiguous.spec.ts` covering it.

The test design matters more than usual here. **`t()` falls back to the English catalog when a key is
missing from `hy`/`ru`** (`messages.ts:1506`), so a missing translation still *renders* — just in the
wrong language. An assertion of the obvious form ("it returns a non-empty string with the
placeholders filled") therefore passes on a catalog containing **no Armenian entry at all**, which is
precisely how e2e-bug.108 got shipped. The spec instead asserts the three rendered strings are
**mutually distinct** and match `\p{Script=Armenian}` / `\p{Script=Cyrillic}` — properties the
fallback cannot fake.

Negative-controlled by deleting only the `hy` and `ru` entries and keeping English: the three
"renders correctly" assertions **still pass**, and only the two written to catch the fallback fail
(2 failed / 3 passed). That is the demonstration that the naive test would have been worthless.

The hy/ru strings follow the existing `availabilityProviderNotFound` phrasing in each catalog, but
they were written by an author who is not a native speaker of either — **they want a native review
before release**, which is a copy check, not a code change.

**Seventh slice, 2026-08-13 — the guest booking path. First caller outside `src/modules/ai`.**
`handleBookAppointment` in `public-booking-assistant.service.ts` now refuses a tied provider name
instead of booking the guest with a namesake and reporting success. A private
`resolveProviderVerdict` mirrors the dashboard helper (same `threshold: 0`, same `not_found`
fallback), and the refusal renders through `t(locale, 'assistant.providerAmbiguous', …)`.

Both surface-specific constraints held: **name-first precedence preserved** (asserted directly — a
tied name refuses even when `employeeId` is present, which is the opposite of what the dashboard
would do), and **the refusal is localized** (asserted in Armenian, since an English-only assertion
passes whether or not localization works).

One assumption corrected against the code: two invariance tests were written as
`rejects.toThrow()`, on the guess that getting past the guard would hit an unstubbed dependency. It
does not — the handler falls through to its normal *"To finish booking I still need: specialist,
service, date, time"* reply. The behaviour was better than assumed, so the tests now assert the
absence of the refusal (`details.candidates` undefined) rather than a crash.

**Eighth slice, 2026-08-13 — `handleListServices` and `attachSession`. The public surface's
single-name sites are now done.**

`handleListServices` refuses a tie: previously it filtered the catalog by the wrong namesake *and*
named them back to the guest (*"No services listed for {name}"*), so the reply was wrong twice over.
Refusal is localized the same way.

`attachSession` is the interesting one, because **it cannot ask a question** — it decorates a result
that is already built. It does not need to: the line it feeds is
`employee?.name ?? params.employeeName ?? null`, so declining to resolve a tie makes the session
record **the words the guest actually typed** instead of a guessed namesake that would then steer
later turns. The fix is to resolve less, not to say more.

A correction to the earlier scoping in this section: **2085 is `handleListServices`, not
`applyPostFailureGuideFallback`** — that attribution came from an awk nearest-preceding-match
heuristic and was wrong. There is no `applyPostFailureGuideFallback` call site.

Also noted, not changed: the second resolution inside `handleBookAppointment` (5178) is now
**unreachable as a distinct path** — slice 7's guard returns early on a tie, and
`resolveProviderVerdict` already falls back to `fuzzyMatchByName`, so its fuzzy branch can only
return what `verdict.match` already returned. Its `employeeId` branch is still live. Left alone
rather than churned inside a D5 slice.

Negative control across the public spec: **7 fail / 4 pass** — the 4 survivors are the invariance
guards. `public-booking` failing suites **12, unchanged from the pre-existing baseline**; gates 28,
exit 0; `tsc` clean.

Negative control (slice 7): **4 fail / 2 pass**. `public-booking` needed its own baseline, since the 85-suite
figure covers `modules/ai` only — **13 failing suites before, 12 after, the only delta being this
slice's own new spec**; the 12 are pre-existing. The two `tsc` errors in
`public-booking-assistant.budget.integration.spec.ts` were confirmed pre-existing by stashing.

**Related:** §29, §111. **Blocks/blocked by:** B7, A6.

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

- [x] review the 13 dashboard commands — **reviewed and all 13 gated, 2026-08-04.** The measurement
      reproduced exactly (13 commands / 36 dashboard executions):

      | group | commands | execs |
      |---|---|---|
      | bulk schedule rewrites | `optimize_schedule` (T3), `apply_schedule`, `reassign_cancelled`, `resolve_conflicts`, `block_schedule` | 20 |
      | money & financial records | `record_expense`, `delete_expense`, `mark_paid`, `create_commission_rule` | 11 |
      | remainder | `delete_inventory_product`, `create_employee`, `deactivate_promo_code`, `export_analytics_report` | 5 |

      All 36 sit inside 1,161 dashboard commands, so this adds a confirmation to ~3% of dashboard
      traffic.

      **A correction to this ticket's premise.** It says the specs "over-declare via the blanket
      `ALWAYS_CONFIRM_TIERS` rule". That is true of the customer-surface payment bulk, but not of
      these 13: `confirm` is a hand-authored per-command field (`never` 393, `always` 210,
      `if-ambiguous` 93), and each of the 13 carries a literal `confirm: 'always'`.
      `operations.optimize_schedule` — the most-executed of them — additionally records that undoing
      it needs per-row pre-state, i.e. it cannot be rolled back automatically. So for this set the
      **runtime list was the incomplete side**, not the specs being noisy.

      *(The runtime list had also grown from the 59 this ticket measured to 67 before these were
      added; it is now 80.)*
- [x] reconcile the two models, or document why two exist — **documented, with a ratchet.**
      `ai-execution-confirm.conformance.spec.ts` pins the relationship rather than deriving one from
      the other. Wholesale derivation would newly gate every dashboard command declaring
      `confirm: 'always'` — 239 more, almost none of which have ever run — which is an unreviewed
      behaviour change. Instead: the runtime may never contradict a spec, and the ungated remainder
      (239) is a baseline that may only shrink. The divergence is now measured and can only close.

### Found while reconciling: a gate pointing the wrong way

`staff_service_matrix` — *"Show which staff can perform which services"* — is gated at runtime while
its spec declares `confirm: 'never'`. The runtime interrupts a user to confirm a **report**.

**Deliberately not removed.** The registry marks it `mutating: true`, which §376 records as a
*suspected* mis-registration but has not settled, and removing a confirmation is a loosening of
safety — the wrong direction to guess in on unresolved evidence. It is pinned as the single known
contradiction so it cannot multiply, and resolves when §376 decides whether the command mutates.

**Verified:** 63 tests across the two confirm suites; `tsc` clean; the five failures in the
surrounding behaviour sweep (`ai-command.service`, `ai-product-guide`, `ai-operations`, …) are
**pre-existing** — confirmed byte-identical against a `git stash`ed baseline, so the 13 new gates
break nothing.

**Related:** §121, §122, §129, §376.

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

- [x] **profiled 2026-08-13** — the ticket's guess was right, and the shape is more extreme than
      "dominate" suggests. See below.

**Profile (`jest --json`, `src/modules/ai/`, 1,368 suites): wall 304 s, summed suite-time 2,568 s**
(≈8.4× parallelism on 9 workers).

| | |
|---|---|
| longest suite | **275.8 s** — `eval/ai-command-eval.accuracy-gate.spec.ts`, **4 tests** |
| next three | 227.2 s `eval/…integration`, 92.9 s `eval/…cases`, 30.8 s `eval/…spec-coverage` |
| `eval/` total | 7 suites, **650 s = 25.3%** of all suite-time |
| longest **non**-eval | 22.0 s |
| distribution | median **0.29 s**, mean 1.88 s; 1,104 of 1,368 suites under 1 s |

**The decisive number: the single longest suite is 91% of wall-clock.** Wall was 304 s and one file
accounts for 275.8 s of it.

**Predicted from this profile: excluding `eval/` would leave a sweep "bounded by tens of seconds".
Measured: 212 s. That prediction was wrong, and being wrong is what identified the actual bound.**

- [x] **`test:ai:fast` added** — `jest --testPathPatterns='src/modules/ai/'
      --testPathIgnorePatterns='src/modules/ai/eval/'`. A pure addition: `npm test` and CI are
      untouched (see the CI note below, which is why it *had* to be an addition).
      Measured **304 s → 212 s**, 1,368 → 1,361 suites (exactly the 7 `eval/` suites removed).
      Failures 85 → 82 — the 3 `eval/` entries in the regression baseline and nothing else, so the
      script is behaviour-identical to the baseline minus `eval/`.

**Why 212 s and not 22 s: the sweep is throughput-bound, not critical-path bound.** The 275.8 s
figure was contention-inflated, as the caveat above suspected but understated. Remove `eval/` and
the remaining 1,917 s of suite-time over ~9 workers is 213 s — the measured 212 s, and the run
reports 1,744 s user / 212 s real = 8.2× parallelism. The workers are saturated. The bound is the
**total**, spread across 1,361 suites with a 0.29 s median; there is no second hot file to delete.

**This reverses the ordering I gave above.** Critical-path reasoning said sharding was blocked and
should come last. That was true only while `accuracy-gate` was in the sweep. Now that the run is
throughput-bound, sharding is precisely the right tool — N machines cut saturated-worker time by
about N — and it is the *only* remaining lever, because no single file's removal moves 1,917 s.

- [x] **per-suite fixed cost measured — it is not the problem, so the work is real.** Probe: 30
      generated single-assertion suites, run as one jest invocation, then the same 30 each importing
      `COMMAND_SPECS` from `ai-command-spec.registry.js`.

      | probe | 30 suites | per suite |
      |---|---|---|
      | bare, no imports, warm cache | 0.70 s | **23 ms** |
      | + registry import, warm cache | 0.77 s | 26 ms |
      | + registry import, **cold** cache | 1.44 s | 48 ms |

      At 23 ms, harness overhead is ~31 s across all 1,361 suites — **1.6% of the 1,917 s**. The
      median suite's 0.29 s is ~270 ms of actual test work, not startup. There is nothing to reclaim
      by making jest cheaper; the sweep is slow because it does that much work. This is the
      confirmation sharding needed: you cannot eliminate this time, only distribute it.

- [ ] **shard `test:ai:fast` across CI machines — but persist the jest transform cache first, or
      the shards hit a floor.** Measured on the full fast sweep: **cold cache 268 s vs warm 212 s**,
      a **56 s** penalty. That penalty is *per jest invocation*, so every shard pays it in full — it
      does not divide. The arithmetic that follows:

      | shards | test work | + cold-cache | total |
      |---|---|---|---|
      | 1 | 212 s | 56 s | 268 s |
      | 4 | 53 s | 56 s | **109 s** |
      | 8 | 27 s | 56 s | **83 s** |

      Four machines buy 2.5×, eight buy 3.2×. The cache, not the sharding, becomes the bound almost
      immediately. **`.github/workflows/ci.yml` has `cache: npm` on all four jobs, which is
      `setup-node`'s dependency cache — nothing persists jest's transform cache**, and no
      `cacheDirectory` is configured, so CI runs cold every time today. Caching that directory is the
      cheaper win and a prerequisite for sharding paying off.

- [ ] splitting `accuracy-gate.spec.ts` (4 tests, 8,464 cases) still matters for `test:ai-accuracy`
      itself, which remains a ~94 s serial gate — just not for the routine sweep any more.

**Both runs reported 206 failed / 7 skipped / 33,497 passed of 33,710, identically.** Worth stating:
the sweep is deterministic across a cold/warm cache boundary, so these timings compare like with
like, and the 82 failing suites are stable rather than flaky.

**CI note (checked, and it constrains the fix): no workflow runs the eval gate separately.**
`grep` over `.github/workflows/` finds no `test:ai-accuracy`, no `accuracy-gate`, no
`test:ai-roadmap-gates`. The 8,464-case deterministic corpus reaches CI *only* via `npm test`.
So `testPathIgnorePatterns` must not be added to the jest config or to `npm test` — that would
silently delete the accuracy gate from CI, the same failure mode as the `swc`/`isolatedModules`
proposal in F1's first item, which would have deleted the only type check. Hence a separate opt-in
script. **Before any sharding work, CI needs a job that actually runs `npm run test:ai-accuracy`;
today nothing does.**

**Caveat on the 275.8 s.** Standalone, that suite takes ~94 s (measured earlier today). It reaches
275.8 s in the sweep because it competes with eight other workers, so the number is a
contention-inflated wall time, not its intrinsic cost. That does not weaken the conclusion — it is
still the critical path — but a shard-based fix would recover less than the ratio suggests, while
moving it out of the sweep recovers all of it.
- [ ] consider `ts-jest` transform caching or `swc` — **read the finding below first**
- [ ] shard the sweep

**`swc`/`isolatedModules` would delete the backend's only CI type check — checked 2026-08-13.**

The obvious win is real: `jest.transform` is `{"^.+\\.(t|j)s$": "ts-jest"}` with **no options at
all** — no `isolatedModules`, no `diagnostics: false` — so every worker type-checks every file it
touches, on every run. Turning that off is the standard fix and would be the largest single lever.

But the backend job in `.github/workflows/ci.yml` runs **`npm test` and nothing else**. There is no
`tsc --noEmit`, no `nest build`, no typecheck script (`npm run build` appears only in
`mobile-performance-gate.yml`, and `package.json` has no `typecheck`). **ts-jest's per-file checking
*is* the backend's CI type check.** Switching to `swc` or `isolatedModules` on its own does not
duplicate anything — it removes type safety from CI, and the sweep would get faster while silently
accepting code that does not compile.

So the second checkbox is really three, in this order — and the first is bigger than it sounds:

- [ ] **make the repo typecheck.** `npx tsc --noEmit -p tsconfig.json` reported **~1,430 errors**
      when measured earlier on 2026-08-13 (re-count before acting; it was a by-product of other work,
      not a careful census). A CI typecheck step cannot simply be added on top of that — it would
      fail on the first run.
- [ ] add an explicit `typecheck` script and a CI step that runs it
- [ ] *then* switch the transform, measuring before and after

**And that number is itself the finding.** ts-jest is the backend's only CI type check, yet the
project does not typecheck under `tsc`. The two disagree because they see different things: ts-jest
checks only the files a test actually loads, per worker, with the spec's own imports as the entry
point — so anything untested, or only reachable through a path no spec exercises, is never checked by
anything. Every `tsc` error this session happened to surface in a **spec file** —
`customer-ai-command.service.spec.ts` had 20, `ai-catalog.util.spec.ts` 2,
`ai-catalog.logic.spec.ts` 1, `public-booking-assistant.budget.integration.spec.ts` 2 — which are
precisely the files ts-jest compiles but whose type errors do not fail a passing test run. **That is
roughly 25 observed out of ~1,430 and was not a survey**: they were noticed while grepping for files
being edited, so the distribution of the other ~1,405 is unknown. Anyone acting on this should
categorise them first — spec-only would be a much smaller job than production code.

That reframes F1 again: the sweep is slow partly because ts-jest is doing a job nothing else does,
and it is not doing that job completely. Speeding it up and restoring type safety are the same piece
of work, not competing ones.

**Related:** §26, §421.

## F2 · e2e-bug.409 — shadow replay duplicates the shared harness

**What is wrong.** `ai-planner-shadow-replay.spec.ts` embeds, narrows, builds, decodes and validates
with its own copy of the logic now shared in `ai-planner-replay.util.ts`, so the two can drift on
exactly the things that change a number without changing its name.

**Deliberately not migrated with `e2e-bug.407`:** it is opt-in, **no gate covers it**, and rewriting
working code that nothing would catch breaking is not a safe side effect.

- [x] **migrated onto `ai-planner-replay.util.ts`** — 2026-08-13
- [x] **smoke-run before and after, compared** — authorised small paid run, n=20

**Read both files 2026-08-13. The migration is feasible; three real differences must be handled, and
one hypothesis I had was wrong.**

*Wrong hypothesis, recorded so it is not re-raised.* The spec compares the planned command through
spec **aliases** and says it caught the need "on the first 8-prompt run"; `replayPrompt` compares
`decision.route.action === row.truth` with no alias handling anywhere, which looks like the shared
util having lost a lesson — and it is used by four harnesses including `measure:ai-retrieval-gap`.
It is not a bug: `decidePlannerRoute` does `const action = spec.aliases[0]`, normalising the
canonical id back to the legacy alias the traces record. The two agree by different routes — the util
normalises then compares exactly, the spec does not normalise so it compares through aliases. **All
705 specs have an alias differing from their id**, so had this been real it would have mis-scored
every correct answer in four harnesses; it was worth checking rather than filing.

*Three differences that are real:*

| | spec | `replayPrompt` |
|---|---|---|
| routing | stops at `validatePlan`, reads `steps[0].command` | also runs `decidePlannerRoute`, so `enabledDomains` can reject with `domain_not_enabled` |
| validation scope | `validatePlan(promptSpecs, …)` — the **narrowed** list | `validatePlan(config.specs, …)` — the **full** list |
| retrieval diagnostics | tracks `truth_in_shortlist` and names what was missing | `ReplayOutcome` carries only `shortlistSize` |

The first needs every domain passed (the config's own comment says so). The second changes what
"executable" means. The third is measurement the migration would drop unless `ReplayOutcome` grows a
field — and it is the number that distinguishes "the model chose wrong" from "retrieval never showed
it the command", which is A5's whole subject.

**Done, and verified the way the ticket asked.** F2's safety condition is its own — *"smoke-run
before and after and compare, since no gate will"* — and that run makes real, billed OpenAI calls, so
it was put to the user rather than taken as a side effect of tidying. A small run (n=20) was
authorised.

The sample is deterministic (`ORDER BY md5(prompt_raw)`), so both runs saw the same 20 prompts.
**Every reported number is identical:**

| metric | before | after |
|---|---|---|
| agreed | 12 | 12 |
| disagreed / undecodable | 0 / 0 | 0 / 0 |
| not executable | 8 | 8 |
| avg shortlist | 77 | 77 |
| truth in shortlist | 19/20 | 19/20 |
| missing | `explain_floor_status (provider)` | same |

That covers the three differences identified above: domain gating is neutralised by passing every
domain (the config's own guidance); the validation-scope change (narrowed → full specs) altered no
outcome on this sample; and `truthInShortlist` was **added to `ReplayOutcome`** rather than dropped,
so the migration moved the measurement into the shared util instead of losing it — all four
harnesses now have it.

**Caveat, stated because the evidence deserves it.** The planner runs at temperature 0.1, so it is
not perfectly deterministic; identical numbers across two runs is strong evidence of behaviour
preservation, not proof. It is stronger than an agreement rate alone would be, because *every* metric
matched, including the retrieval miss naming the same command.

One display regression was caught and fixed after the comparison: `ReplayOutcome` carries no surface,
so `MISSING: explain_floor_status (provider)` had become `MISSING: explain_floor_status`. The surface
is now looked up from the query rows. That edit touches a log string only, and postdates the numbers
above.

**Related:** §131.

## F3 · e2e-bug.415 — neither command service can be built in a test

**What is wrong.** `AiCommandService` and `CustomerAiCommandService` have no test construction path, so
behaviour in their method bodies can only be asserted by comment. This has blocked verification twice:
§129 worked around it by extracting `shouldConfirmBeforeExecute` into a pure function; §137 could not,
because the property was *"every one of ~40 exits is stamped"* — a property of the method's shape,
which now holds by construction rather than by test.

Both are load-bearing: the execute-time confirmation gate, and trace attribution for the majority of
traffic.

- [x] **a construction path exists, 2026-08-13** — `ai-command.service.test-harness.ts`.
      `createAiCommandServiceForTest(overrides?)` builds `AiCommandService` with all **73** declared
      dependencies stubbed, and `AI_COMMAND_SERVICE_DEPS` names them in one place for the first time.
- [x] **the same factory for `CustomerAiCommandService`** — `customer-ai-command.service.test-harness.ts`,
      **43** dependencies. Both services the ticket names are now constructible.
- [x] **§137's stamping is backfilled** — `customer-ai-command.trace-stamping.spec.ts`, 6 tests.
- [x] **§129's gate is backfilled** — `ai-command.confirmation-gate-wiring.spec.ts`, 4 tests.
      **F3 is now clear of both blockages it records.**

**§129's missing half was the call site, not the predicate.** The extraction gave
`shouldConfirmBeforeExecute` its own thorough spec; what nothing covered was that
`executeSingleIntent` asks the question with live inputs and honours a `true` *before* dispatching.
That is the half that fails open — the predicate can be perfect and a T2 money command still executes
silently if `alreadyConfirmed` is stale or a dispatch moves above the gate.

Asserted: the gate precedes `dashboardCore.tryDispatch`; `alreadyConfirmed` is the live
`isExecutionConfirmed(session)` rather than a literal; `candidateSource` is threaded from `traceCtx`
(losing it would let the planner execute `appointment.mark_paid` silently — e2e-bug.404, where the
action-name list covers only 59 of the 210 commands `CommandSpec` requires confirming); and the
positive branch returns a confirmation result rather than falling through.

**These are source-shape assertions, deliberately, and that is a real limitation worth naming.**
Driving `executeSingleIntent` to the gate needs `understand` and the completion handoff stubbed into
exact internal shapes; such a test breaks whenever those shapes move and teaches nothing about the
invariant that matters, which is *ordering*. The behavioural half lives in the predicate's own spec —
the two together are the property §129 wanted, and neither alone is it.

**Negative-controlled with the dangerous mutation**: hard-coding `alreadyConfirmed: true` — the
fail-open, which would look like a passing build — fails the "live confirmation state" test. Service
file restored and diffed clean.

**What §137's tests prove, and what they do not.** They do not walk 40 exits. `executeCommand` is a
thin wrapper with **one** exit around `runCommand`'s ~40, so the guarantee the structure provides is
"whatever `runCommand` returns is stamped on the way out". That is what is asserted: the stamp lands
on success *and* failure results, the sink's `confidence`/`candidateSource`/`params` reach
`details`, fields the result already carried are not overwritten (`metadata.x ?? result.details?.x`),
and the un-traced passthrough is deliberate rather than a hole. `params` is pinned specifically
because e2e-bug.419 was this surface recording `params = {}` for 99.4% of traces.

The generality rests on the wrapper having one stamping point, so **that is asserted too** — the test
reads `executeCommand.toString()` and requires exactly two `return`s and a `stampCommandTraceDetails`
call. A future edit that adds a bypassing early return fails there, which is the only way the other
five tests could quietly stop being general.

`runCommand` is stubbed by assigning to the instance (it is called as `this.runCommand`, so an own
property shadows the prototype) — standing in for the ~40 exits without enumerating them.

**Negative-controlled by deliberate breakage**, since these tests are new against unchanged code and
there was nothing to revert: disabling the stamp fails **4 of 6**, including the structural check,
which caught the extra `return` the control injected. File restored and diffed clean afterwards.

**Both harnesses assert their own dep list against `Service.length`.** The lists are extracted from
the constructors by hand, so a dependency added later would be left `undefined` and surface as a
confusing `TypeError` inside whatever method a future test happens to call. Comparing against the
constructor's arity turns that into a named failure in the harness spec instead. Worth noting the two
services declare their parameters differently — `AiCommandService` uses `private x`,
`CustomerAiCommandService` uses `private readonly x` — which the first extraction pass missed; the
arity check is what would have caught it.

**Why an auto-stub rather than a `TestingModule`.** The existing
`customer-ai-command.integration.harness.ts` wires *real* collaborators, because the behaviour it
tests spans them. F3 needs the opposite: assertions on the **method bodies** of one service. Listing
73 providers to reach a method body is ceremony that rots, so each dependency is a proxy yielding a
`jest.fn()` for any member touched, with `overrides` for the collaborators a test actually exercises.
Every stub returns `undefined` deliberately — a dependency the test did not think about fails at the
point of use rather than quietly returning something plausible.

**Demonstrated, not asserted.** `ai-command.service.test-harness.spec.ts` drives the real
`executeReadOnlySubIntent` through the harness and checks the resolved provider name is threaded to
the collaborator as the scope label (`mock.calls[0][4] === 'Anna Petrova'`) — precisely the kind of
method-body property F3 says could until now only be recorded in a comment.

This session supplied its own evidence for the ticket: two specs written before this
(`ai-command.read-subintent-ambiguity`, `public-booking-assistant.provider-ambiguity`) each
hand-rolled `Object.create(Service.prototype)` because no construction path existed.

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
