# Fast intent heuristics boundary (pipe-1.2.3 / acc-3.14)

`FastIntentHeuristicsService` runs **early** in the understand pipeline (`normalize` → **fast_heuristics** → `classify` → … → `rerank`). It emits `IntentCandidate[]` with `source: 'fast_heuristic'`. This document is the **acc-3.14 guard**: what may live here vs what must not.

## In scope (routing + structural hints only)

| Category | Purpose | Implementation today |
|----------|---------|----------------------|
| **Complexity routing** | `read_only` / `compound` tier hints for re-rank | `CommandComplexityRouterService.routeDeterministic()` |
| **Compound detection** | Multi-step command shape (decomposition path) | `IntentDecompositionService.isCompoundPrompt()` + compound tier |
| **Structural read-only shape** | Obvious list/show command grammar | `SHOW_APPOINTMENTS_PATTERN`, `isUpcomingAppointmentsPrompt()` |
| **Structural availability routing** | Disambiguate availability *shape* (not paraphrase synonyms) | `resolveAvailabilityIntentFromPrompt()` (dashboard) |
| **Param hints** | `complexityTier`, `useDecomposition`, `allProviders`, scope lists | `paramHints` on candidates — merged after classify wins |

High-confidence hits (≥ 0.90) **feed re-rank** but **do not bypass LLM classify** in phase 1 (`pickPhase1RerankWinner`).

## Out of scope (intent *meaning* / paraphrase)

Do **not** add new regex, detectors, or rescue logic in `fast-intent-heuristics.*` for:

- Implied booking intent (*"my hair is long"*, *"need a trim soon"*)
- Paraphrase synonyms (*"gap soonest"* vs *"first available"*)
- Revenue / utilization / forecast metric wording
- Team-wide availability **paraphrase** detectors (`isTeamWideProviderAvailabilityQuery`, etc.)
- Post-classify rescue overrides

Put those in the correct layer instead:

| Need | Layer |
|------|--------|
| Novel phrasing, same meaning | `AiSemanticIntentService` + intent anchor bank (**acc-3.4**) |
| Classifier mislabel / unknown | `AiIntentRescueService` (after classify) |
| Dates, times, counts, IDs | Structural enrich / `ai-structural-extractors.ts` **extraction** only (**acc-3.14** migration) |
| Eval / regression | `*.fixtures.ts`, `eval/ai-command-eval.cases.ts` |

## Allowed files and imports

Gated production files (CI: `npm run test:pipe-fast-heuristics-boundary`):

- `fast-intent-heuristics.service.ts`
- `fast-intent-heuristics.util.ts`

Relative imports must match the allowlist in `fast-intent-heuristics.boundary.ts`. Forbidden modules include `ai-intent-heuristics`, `ai-intent-rescue`, `ai-semantic-intent`, and revenue/ops scheduling rescue utils.

## Adding a new fast heuristic

1. Confirm it is **routing** or **structural shape**, not paraphrase meaning.
2. Prefer delegating to an existing structural util; do not copy regex from `ai-structural-extractors.ts`.
3. Add fixture + `it.each` in `fast-intent-heuristics.service.spec.ts`.
4. If you need a new import, update `FAST_HEURISTIC_ALLOWED_IMPORT_MODULES` and this doc.
5. Run `npm run test:pipe-fast-heuristics-boundary`.

## Related roadmap

- **pipe-1.2** — fast heuristics stage in `CommandUnderstandingPipelineService`
- **acc-3.14** — paraphrase detectors removed from `ai-structural-extractors.ts`; semantic migration complete for booking-param hints + metric resolvers (**pipe-1.13**, gate **`npm run test:pipe-acc-3.14`**)
- **acc-3.16** — paraphrase corpus coverage gate **`npm run test:pipe-acc-3.16`** (≥5 EN/HY/RU paraphrases per core semantic intent)
