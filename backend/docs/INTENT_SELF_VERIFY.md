# Intent self-verify (pipe-1.6.1)

Cheap deterministic rule pass after rescue — verifies resolved action matches prompt vocabulary before structural enrich.

## Rules

| Rule | Detects | Correction |
|------|---------|------------|
| `booking_vs_clear_mismatch` | Booking actions on clear/hide schedule cleanup phrasing (and vice versa) | `clear_schedule`, `hide_appointments_from_calendar`, `create_booking` via `disambiguateClearScheduleVsHideCalendar` |
| `schedule_vocab_mismatch` | Work time / direct schedule / template phrasing labeled as booking (and vice versa) | `create_direct_schedule`, `create_schedule_template`, `create_booking` |

## Pipeline

`CommandUnderstandingPipelineService.stageSelfVerify()` calls `applySelfVerifyCorrection()` and records trace detail with rule id + correction.

## Uncorrectable failures (pipe-1.6.2)

When a rule fails **without** a deterministic `correctedAction` and intent `confidence` is below **0.55**, the understand pipeline returns `status: 'clarify'` via `ai-unknown-intent.util.ts` — targeted `intentChoice` disambiguation plus 2–3 example commands (**acc-3.4**, **acc-4.7**). Structural enrich is skipped.

Example: `Block Gevorg schedule tomorrow` classified as `create_booking` at 0.42 confidence → schedule vocab mismatch with no single correction → clarify instead of executing a guess.

## Structural enrichment (pipe-1.7.1)

After self-verify locks intent, `stageStructuralEnrich()` runs `applyStructuralIntentEnrichment()`:

- `enrichDateRangeFromPrompt` — schedule mutation actions
- `matchEmployeesInPrompt` — multi-provider scope + `sanitizeProviderScopeFromPrompt`
- `inferDirectSchedulePeriods` — `create_direct_schedule` (pipe-1.7.2 defaults **09:00–19:00** when no hours in prompt via `applyDefaultWorkTimeSchedulePeriods`)
- `applyAvailabilityFollowUpFromSession` — availability time-of-day follow-ups

`AiCommandService` passes `sessionContext` into understand; compound sub-steps call the same util directly.

When self-verify emits **clarify** (uncorrectable failure + confidence below 0.55), structural enrich is **skipped** — trace `skipped; self_verify clarify (pipe-1.7.3). Correctable failures still run enrich on the corrected action.

## Unknown intent guard (pipe-1.8.1)

When understand returns `action: unknown` and post-rescue (clear-schedule prompt, vertical plugin) does not resolve a concrete intent, `AiCommandService` returns targeted clarify via `buildUnknownIntentClarifyResult()` — **never** the handler switch default / unwired helper. Emits `intentChoice` with 2–3 surface-appropriate example commands (**acc-4.7**).

## Completion validate handoff (pipe-1.8.2)

After understand + post-rescue, `runCompletionValidateHandoff()` in `command-completion-handoff.util.ts` resolves entities via `CommandCompletionPipelineService.resolve()` then validates with `command-completion.validator.ts`. Validation failures return structured clarify (`needsClarification` + `missing` fields) with `pipeMarker: pipe-1.8.2`. Used by `AiCommandService.executeSingleIntent` and `CompoundCommandGraphService`.

## Pipeline mutating guard (pipe-1.9.1)

After validate handoff, `shouldBlockLowConfidencePipelineMutate()` blocks auto-execute when a mutating intent — including pipeline-resolved schedule intents like `create_direct_schedule` — is below `confidence.low`. Shared set lives in `command-pipeline-mutating-actions.util.ts`.

## ReAct fallback (pipe-1.9.2)

`BookingCommandGraphService` runs the full understand pipeline first. ReAct (`shouldUseReactAgentFallback`) runs only when the result is still `action: unknown` after semantic + rescue — never upfront on orchestration/ambiguous regex. Successful fallback responses include `reactFallback: true` and `pipeMarker: pipe-1.9.2`.

## Command trace persistence (pipe-1.10.1)

`ai_command_trace` table (`entities/ai-command-trace.entity.ts`) stores one row per command with redacted prompts/params, outcome, routing tier, source (`deterministic` | `llm`), latency, model/token cost, and `pipelineTrace` JSON (**acc-1.1**). `AiCommandTraceService.record()` / `recordFireAndForget()` builds rows via `ai-command-trace.util.ts` (PHI redaction + internal `_` param stripping). **pipe-1.10.3** wires `AiGatewayService` to persist one trace per command on clarify, execute, security-block, and misroute paths; `traceId` threads classify→execute via `_commandTraceId` context; dashboard stamps `pipelineTrace` + misroute telemetry stage via `ai-command-trace-recorder.util.ts`.

## Misroute telemetry enrichment (pipe-1.10.2)

`ai-misroute-telemetry.util.ts` adds `semanticAction`, `semanticConfidence`, and `pipelineStage` to curated misroute events. Dashboard `executeSingleIntent` enriches via `enrichMisrouteTelemetryFromUnderstand()` using understand `candidates` + `trace` (**acc-1**).

## CI

```bash
npm run test:pipe-self-verify   # 44 unit scenarios (pipe-1.6.3)
npm run test:pipe-unknown-clarify   # self-verify clarify + unknown guard (pipe-1.6.2, pipe-1.8.1)
npm run test:pipe-completion-handoff # resolve + validate handoff (pipe-1.8.2)
npm run test:pipe-mutating-actions   # schedule mutating guard (pipe-1.9.1)
npm run test:pipe-react-fallback     # ReAct after unknown (pipe-1.9.2)
npm run test:pipe-command-trace      # ai_command_trace entity + service (pipe-1.10.1)
npm run test:pipe-misroute-telemetry   # semantic + pipelineStage fields (pipe-1.10.2)
npm run test:pipe-implication-corpus   # implication corpus + eval golden cases (pipe-1.11.1–1.11.2)
npm run test:pipe-confidence         # confidence gate + implication + self-verify (pipe-1.11.3)
npm run test:pipe-structural-enrich
npm run test:pipe-work-time-default
npm run test:pipe-structural-enrich-skip
```
