# AI-TODO — Semantic Intent Matching Plan

**Date**: 2026-07-19
**Status**: PLANNED — not started

**Purpose**: Replace the command-identification system's dependence on regex / keyword / exact-pattern matching with semantic intent matching, and consolidate all AI-classifier-accuracy work in one place. The `ai-semantics-accuracy-plan.1` section was moved here from `TODO.md` (see below) and forms the foundation; the "Semantic intent matching rollout" section builds the user's semantic-matching spec on top of it.

---

## Current state — does the system rely on regex / exact pattern matching?

**Yes — heavily, despite having a semantic layer.** The pipeline (`backend/src/modules/ai/command-understanding-pipeline.service.ts`) runs: normalize → fast heuristics → semantic classify → rerank → narrow reclassify → rescue. A genuine semantic stage exists (`ai-semantic-intent.service.ts` + `ai-embedding-index.util.ts`), but it is surrounded — and can be overridden — by literal matchers:

- `FastIntentHeuristicsService` — regex fast path (boundary documented in `docs/FAST_INTENT_HEURISTICS_BOUNDARY.md`).
- `ai-intent-rescue.service.ts` — **159 `private tryRescue*` methods**, keyword/regex-based overrides. e2e-bug.171 (see TODO.md) proved a rescue regex silently overwrote a *correct* 0.9-confidence semantic classification when the same command was merely paraphrased.
- ~141 files under `backend/src/modules/ai/` contain regex/pattern-matching logic (`ai-*.util.ts` heuristic matchers, e.g. `isMultiServiceAvailabilityDiscoveryPrompt` in `ai-self-service-booking.util.ts`).
- The `normalize` stage is currently a `passthrough` (observed in the live pipeline trace), so every downstream matcher faces unbounded surface variety ("9am" vs "9 in the morning" vs "09:00").

## Requirements (the semantic intent matching spec)

1. **No exact-match requirement.** Do not require the user's input to exactly match predefined command patterns or keywords. Analyze the user's intent and infer the most appropriate command or set of commands based on the *meaning* of the request, even if wording, phrasing, grammar, or sentence structure differs significantly.
2. **Semantic over literal.** Prioritize semantic understanding over literal keyword or regex matching.
3. **Ranked multi-command results.** When multiple commands are relevant, return all applicable commands ranked by confidence, with the most relevant command first.
4. **Clarify, never guess.** If the user's intent is ambiguous or there is insufficient information to confidently determine the correct command, do not guess. Ask a clarifying question to gather the missing information before selecting or executing any command.

---

## Moved from TODO.md: ai-semantics-accuracy-plan.1

> **Note**: this section was moved verbatim from `TODO.md` (formerly the `## ai-semantics-accuracy-plan.1` section, 2026-07-19). TODO.md retains a one-line pointer to this file.

### ai-semantics-accuracy-plan.1 — make command semantics normalize across phrasings & systematically raise classifier accuracy (PLANNED — not started)

**Status**: planned only, no implementation yet. Written 2026-07-19 at the user's request, directly motivated by this session's live findings — especially e2e-bug.171 (a correct 0.9-confidence dashboard classification silently overwritten by a customer-only keyword rescue when the same command was merely *paraphrased*), e2e-bug.169 (unresolved employee-name entities crashing execution), and the accuracy gate discovered to be permanently red from a stale baseline. Every phase below names the observed failure it prevents. Phases are ordered by leverage-per-effort; 1 and 2 are the highest-value and smallest.

### Phase 1 — Make the accuracy gate green and blocking (~1 day)

**Motivation**: `ai-command-eval.accuracy-gate.spec.ts` currently fails on *every* run — not from misclassification, but because the committed baseline covers 3,696 cases while the suite has grown to ~8,294 (`"AI accuracy baseline is stale (acc-2.9)"`). A permanently red gate protects nothing; regressions sail through unnoticed because failure is the expected state.

- [ ] Run `npm run test:ai-accuracy:update-baseline`, review the per-intent diff it prints (this session's run showed only *improvements*: `explain_assistant_approval` 50%→100%, `configure_service_online_payment` 63%→100%, +216 new intents), commit the refreshed baseline.
- [ ] Confirm `npx jest --testPathPatterns='ai-command-eval'` is fully green afterward (the 4 currently-failing eval specs all trace to the stale count, verified byte-identical on the clean tree during e2e-bug.171's verification).
- [ ] Make the gate a hard CI blocker (fail the pipeline on any accuracy delta below baseline or any baseline-count drift), so the baseline can never silently go stale again.
- [ ] Fix or quarantine the 30 pre-existing failing suites / 63 tests in `src/modules/ai/` (full list preserved in `/tmp/ai_suite_full.log` from this session; includes `ai-customer-intent-coverage.spec.ts`, `ai-capability.matrix.integration.spec.ts`, `customer-ai-command.service.spec.ts`, `ai-intent-rescue.service.spec.ts` "rescues move appointment as reschedule", etc.) — same reasoning: a suite that's always partially red can't catch new breakage.

### Phase 2 — Paraphrase-invariance eval layer (the direct fix for "same meaning, different words")

**Motivation**: every golden case in `ai-command-eval.cases.ts` tests exactly one phrasing per intent. That is precisely why `"working hours 9am-6pm... give them Sundays off"` worked while `"on the clock from 9 in the morning until 6 in the evening... completely free on Sundays"` was hijacked (e2e-bug.171) — nothing ever tested meaning-preserving rewording.

- [ ] Build a one-time offline generator (LLM-assisted) that produces 3–5 natural English paraphrases per golden case for a prioritized subset (start with the ~40 highest-traffic mutating dashboard intents + all customer booking intents), varying: synonyms ("create/set up/build"), register (terse vs. conversational), word order, time-expression style ("9am-6pm" vs. "9 in the morning until 6 in the evening"), and connective structure ("and"-chains — the exact e2e-bug.171 trigger).
- [ ] Human-review the generated paraphrases once, then freeze them as fixtures — new file pair `ai-paraphrase-invariance.fixtures.ts` + `ai-paraphrase-invariance.spec.ts`, asserting every paraphrase resolves to the **same action** (and same critical params) as its canonical case. Model it on the repo's existing `*-multilingual.fixtures.ts` pattern (e.g. `ai-self-service-booking-multilingual.fixtures.ts`), which already proves this fixture-per-variant approach works here — this is the same idea applied to English register instead of language.
- [ ] Wire the new spec into the accuracy gate from Phase 1 so paraphrase regressions block CI like exact-phrase regressions do.
- [ ] Add a rule to the intent-authoring checklist (top of this file, the "Rescue/heuristic + ≥10 NL variants in fixtures" item): every *new* intent must ship with ≥3 reviewed paraphrase fixtures, not just exact-phrase variants.

### Phase 3 — Make rescue subordinate to classification (never override a confident classifier)

**Motivation**: in e2e-bug.171 the pipeline trace showed the classifier was *right* — `create_direct_schedule` at confidence 0.9, above the 0.85 high threshold, `narrow_reclassify: skipped, top candidate not ambiguous` — and then the rescue stage overwrote it anyway with `check_multi_service_availability` off a keyword match. A regex should never beat a high-confidence semantic classification.

- [ ] In `command-understanding-pipeline.service.ts` / `ai-intent-rescue.service.ts`: gate the entire known-action rescue phase (`runRescueKnownPhase`) behind confidence — if the classified action's confidence ≥ the high threshold (the same 0.85 used by `confidence_gate: skip_semantic`), skip rescue entirely except for explicitly-whitelisted disambiguation pairs (e.g. the legitimate `create_booking → reschedule_booking` correction that has its own tests).
- [ ] Record in `pipelineTrace` when rescue was *suppressed* by this gate (`stage: 'rescue', action: 'suppressed_high_confidence'`) so live debugging via the widget's "Show details" (which is how e2e-bug.171 was diagnosed) keeps working.
- [ ] Add regression tests: the exact e2e-bug.171 paraphrase must classify to `create_direct_schedule` and show rescue-suppressed in the trace.

### Phase 4 — Central surface registry for rescue heuristics

**Motivation**: e2e-bug.171's fix gated one method (`tryRescueSelfServiceBooking`) behind `surface !== 'customer' && surface !== 'public' → return null`. But `ai-intent-rescue.service.ts` has ~40 sibling `tryRescueX` methods, each deciding *by convention* whether to check `surface` — the exact copy-paste-or-forget pattern that produced the bug (one correct precedent existed at the old line 3536 and was ignored everywhere else in the same method).

- [ ] Replace per-method convention with declaration: a registry mapping each rescue function → allowed surfaces (`{ tryRescueSelfServiceBooking: ['customer','public'], tryRescueStaffOperations: ['dashboard'], tryRescueProviderTimeOff: ['provider'], ... }`), enforced once in the dispatcher before any rescue function is invoked.
- [ ] Audit all ~40 `tryRescueX` methods (list obtainable via `grep -n "private tryRescue" ai-intent-rescue.service.ts`) and assign each a surface set — most are obvious from their names (Provider*, staff/dashboard, customer self-service).
- [ ] Meta-test: iterate every `tryRescueX` method on the service via reflection and assert each one appears in the registry — so adding a new rescue heuristic without declaring its scope fails CI.
- [ ] Remove the now-redundant inline guard from `tryRescueSelfServiceBooking` (keep its regression tests).

### Phase 5 — Production feedback loop (accuracy that compounds)

**Motivation**: this session found misclassifications only because a human happened to paraphrase one command. Production users do that all day — their corrective behavior is a free, continuous eval set that's currently discarded.

- [ ] Persist every command's `pipelineTrace` + final action + surface (the trace already exists in-memory; add storage keyed by command id, with retention policy).
- [ ] Instrument two implicit-misclassification signals the UI already emits: (a) "Undo latest command" clicked within N minutes of execution (undo infra exists — `agent-task-undo.service.ts`, the widget's "Undo now" button), and (b) the same session re-sending a semantically-similar prompt immediately after a response (rephrase-retry). Also mine the explicit `give_ai_feedback` / `give_provider_ai_feedback` intents, which already exist.
- [ ] Weekly triage view (could be a simple dashboard AI action, e.g. `list_suspected_misclassifications`): each confirmed miss gets converted into a Phase-2 golden case + paraphrases, permanently. This turns every field failure into a regression test instead of a recurring incident.

### Phase 6 — Clarify instead of guessing at dead ends

**Motivation**: when e2e-bug.171's misroute hit `clarify: true, missing: ["serviceNames"]`, the user saw neither a clarifying question nor an error — they got a garbled, unrelated product tour (*"Here's how to provider calendar on this page"*, missing a verb). That fallback template bug is still latent for any other clarify-needed path even after the misroute itself was fixed.

- [ ] Find and fix the broken guide-handoff template (grep the guide/product-tour handoff path for the interpolation producing "Here's how to <label> on this page" with a noun-only label — likely in `ai-product-guide-handoff.util.ts` or the guide corpus).
- [ ] Change clarify-dead-end behavior: when the pipeline resolves an action but `clarify: true` with named missing params, respond with a targeted question listing the missing param(s) and the top-2 candidate intents ("Did you want X or Y? I still need: service names") instead of falling through to the product guide.
- [ ] Test both: the template renders grammatically for every registered action label; a clarify-needed command yields a question, never a tour handoff.

### Phase 7 — Real normalization in the normalize stage

**Motivation**: the observed trace shows `stage: 'normalize', action: 'passthrough'` — the stage exists but does nothing. Downstream matchers therefore face unbounded surface variety ("9 in the morning" vs "9am" vs "09:00"), and unresolved entities leak all the way to execution (e2e-bug.169's `create_direct_schedule requires employeeId`; fixed for that path, but the class remains for others).

- [ ] Canonicalize time expressions pre-classification: "9 in the morning" / "9am" / "09:00" → one form; "an hour off for lunch starting at 1pm" → a break window; reuse `normalizeTime24` + `parseTimeWindow` which already exist in `ai-orchestration.helpers.ts` / `time-format.util.ts`.
- [ ] Pre-resolve entities in normalize: employee names → IDs (reuse `fuzzyMatchByName` / the e2e-bug.169 `resolveEmployeeId` pattern from `booking-tool-context.helpers.ts`), service names → IDs, relative dates ("next 10 days", "coming 10 days") → ISO ranges (reuse `resolveDateRange`) — attached as structured hints alongside the prompt, so every downstream stage (classifier, rescue, param extraction, react_agent tools) reads the same canonical entities instead of re-parsing raw text independently (today at least 4 places re-parse names/dates separately, which is why e2e-bug.169 could exist in one path while sibling paths worked).
- [ ] Record what normalize did in `pipelineTrace` (replacing `passthrough`) for debuggability.

### Cross-cutting verification (applies to every phase)

- [ ] `npx tsc --noEmit` — no new errors vs. baseline.
- [ ] Full `ai-command-eval` suite green (post-Phase-1 this is meaningful).
- [ ] Per-surface accuracy reported separately (dashboard / customer / public / provider) in the eval report, so a fix for one surface can't hide a regression on another — the e2e-bug.171 class was invisible precisely because nothing measured dashboard prompts against customer heuristics.
- [ ] Live spot-check via the Orchestrix AI widget with both the canonical and paraphrased forms of at least the schedule-creation command family (the exact prompts are recorded in e2e-bug.168–171 above).

---

## Semantic intent matching rollout (implements the Requirements above)

These phases put the semantic-matching spec into production, on top of the foundation plan above. They cross-reference its phases instead of duplicating them. **Prerequisite: foundation Phase 1** (a green, blocking accuracy gate) — no semantic migration should land without a working gate to measure it against.

### Phase S1 — Semantic classifier as the single authority

- [ ] Land foundation Phase 3 first: rescue never overrides a ≥0.85-confidence semantic classification.
- [ ] Then demote `FastIntentHeuristicsService` and the entire `tryRescue*` layer to *candidate producers only*: they may contribute candidates to the rerank pool (via `rescueResultToCandidate` in `intent-candidate-rerank.util.ts`) but may never decide the final action. The final action always comes from the semantic rerank (`mergeAndRerankIntentCandidates` / `rerankIntentCandidates`).
- [ ] Files: `command-understanding-pipeline.service.ts`, `ai-intent-rescue.service.ts`, `intent-candidate-rerank.util.ts`, `fast-intent-heuristics.service.ts`.
- [ ] Regression test: the e2e-bug.171 paraphrase classifies to `create_direct_schedule` with the keyword-rescue candidate visible in the trace but *not* selected.

### Phase S2 — Ranked multi-command results

- [ ] Extend the understand-result contract to expose the top-N ranked candidates (action + confidence + source stage), most relevant first, instead of collapsing to a single action. The pipeline already collects `IntentCandidate[]` and reranks them — this is an exposure change, not a new ranking engine.
- [ ] Update the surface adapters (`*-command-understanding.adapter.ts`) to pass the ranked list through, and the widget's "Show details" to render it.
- [ ] Define consumer behavior: single clearly-dominant candidate → execute as today; multiple relevant candidates → present all, ranked (feeds Phase S3).
- [ ] Tests: contract tests for the ranked output shape; golden-case suite asserts top-1 stability (no regression to today's exact-phrase accuracy).

### Phase S3 — Clarify on ambiguity, never guess

- [ ] Define the ambiguity rule in one place (pipeline config): if the top-2 ranked candidates are within a confidence margin (e.g. Δ < 0.1), **or** the top candidate is below the high threshold for a *mutating* action, **or** required params are unresolved, the pipeline returns a clarifying question — naming the top candidates and missing params ("Did you want X or Y? I still need: service names") — instead of selecting or executing any command.
- [ ] Build on foundation Phase 6 (clarify-at-dead-ends) and the existing `buildSelfVerifyClarifyUnderstandResult` in `ai-unknown-intent.util.ts`; the clarifying-question response becomes a first-class pipeline outcome, not a fallback.
- [ ] Tests: ambiguous phrasing fixtures (deliberately confusable intent pairs) must yield a question, never an execution; unambiguous paraphrases must still execute (no clarify-noise regression).

### Phase S4 — Convert literal matchers to semantic anchors

- [ ] Inventory the 159 `tryRescue*` methods (`grep -n "private tryRescue" backend/src/modules/ai/ai-intent-rescue.service.ts`) plus the `ai-*.util.ts` keyword/regex matchers; group by intent family.
- [ ] Migrate each family to semantic-anchor / embedding matching, reusing the existing patterns: `ai-embedding-index.util.ts`, `ai-semantic-intent.deterministic.boundary.ts`, and the boundary contracts in `docs/SEMANTIC_INTENT_DETERMINISTIC_BOUNDARY.md`, `docs/INTENT_ANCHOR_BANK_BOUNDARY.md`, `docs/FAST_INTENT_HEURISTICS_BOUNDARY.md`. Retire the regex gate per family only after its semantic replacement passes the accuracy gate + paraphrase suite with no per-surface regression.
- [ ] Order families by traffic and observed failure rate (scheduling/staff-operations first — the e2e-bug.171 family).
- [ ] Apply foundation Phase 4's surface registry throughout, so no migrated matcher can fire on the wrong surface.

### Phase S5 — Paraphrase-invariance proof (acceptance harness)

- [ ] Execute foundation Phase 2 (paraphrase fixtures) and Phase 7 (real normalization) as the acceptance harness for S1–S4: every migrated intent family must pass ≥3 human-reviewed paraphrases resolving to the same action and critical params.
- [ ] Per-surface accuracy reported separately (dashboard / customer / public / provider) — see Cross-cutting verification above.
- [ ] Wire everything into the blocking CI gate from foundation Phase 1.

## Acceptance criteria (overall)

- [ ] Full `ai-command-eval` suite green and blocking in CI (foundation Phase 1).
- [ ] Paraphrase-invariance suite green and blocking (foundation Phase 2 / S5).
- [ ] e2e-bug.171 regression test: canonical and paraphrased forms of the schedule-creation command both resolve to `create_direct_schedule`, with no keyword-rescue override (S1).
- [ ] Understand-result exposes ranked candidates; a deliberately ambiguous prompt produces a clarifying question and executes nothing (S2 + S3).
- [ ] At least the top-40 mutating dashboard intents + all customer booking intents identified semantically (no regex gate on the decision path) with zero per-surface accuracy regression (S4).
- [ ] Live spot-check via the Orchestrix AI widget with canonical + paraphrased forms of at least the schedule-creation command family.
