# Intent rescue pipeline boundary (pipe-1.5.1)

`AiIntentRescueService.rescue()` runs **deterministic domain rescues only**. Semantic paraphrase matching is **not** a rescue tier — it runs earlier in `CommandUnderstandingPipelineService` (`semantic_match` stage).

## Pipeline order (understand phase)

1. normalize → fast_heuristics → classify → confidence_gate
2. **semantic_match** (when escalated)
3. rerank → narrow_reclassify
4. **rescue** (domain heuristics)
5. self_verify → structural_enrich

## Rescue internal order (domain-first)

Orchestrated by `runIntentRescuePipeline()` in `ai-intent-rescue-pipeline.util.ts`:

| Phase | When | Purpose |
|-------|------|---------|
| `provider_surface` | `surface === 'provider'` | Provider mobile rescues |
| `classified_disambiguation` | `action !== 'unknown'` | Fix misclassified LLM labels |
| `unknown_domain` | always after prior phases | Unknown → domain intent |

## Semantic param hints (pipe-1.5.2)

`CommandUnderstandingPipelineService.stageRescue()` passes the **highest-confidence `semantic_match` candidate's `paramHints`** into `AiIntentRescueService.rescue()` as `semanticParamHints`. Rescue uses hints to **fill param gaps only** — never to pick or override the rescued action.

| Allowed in rescue | Forbidden in rescue |
|-------------------|---------------------|
| `semanticParamHints` on `IntentRescueInput` | `AiSemanticIntentService.match()` |
| `mergeSemanticParamHintsOnly()` gap-fill | `semantic.action` as rescue driver |
| Anchor hints e.g. `bookingFirstAvailable` | `trySemanticIntentRescue` |

## Guardrails

- **No** `AiSemanticIntentService`, `trySemanticIntentRescue`, or embedding calls in `ai-intent-rescue.service.ts`
- CI: `npm run test:pipe-rescue-boundary`, `npm run test:pipe-semantic-rescue-hints`
