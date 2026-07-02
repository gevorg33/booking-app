import type { AiCommandSurface } from './ai-platform.util.js';
import type { AiEventsService } from './ai-events.service.js';
import type {
  PipelineStage,
  PipelineTrace,
} from './command-completion.types.js';
import type {
  IntentCandidate,
  PipelineUnderstandResult,
  PipelineUnderstandStatus,
} from './command-understanding.types.js';
import { findSemanticCandidate } from './command-understanding-result.util.js';
import { resolveSemanticWinnerCandidate } from './semantic-rescue-param-hints.util.js';
import { AVAILABILITY_DISAMBIGUATION_SCENARIOS } from './ai-intent-disambiguation.fixtures.js';
import { COMPOUND_RESCUE_SCENARIOS } from './ai-rescue-pipeline.fixtures.js';
import {
  CHECK_AND_BOOK_EVAL_SCENARIOS,
  FLEXIBLE_BOOKING_EVAL_SCENARIOS,
} from './ai-check-and-book.fixtures.js';
import { MISROUTE_TELEMETRY_PIPE_MARKER } from './ai-misroute-telemetry.fixtures.js';

export { MISROUTE_TELEMETRY_PIPE_MARKER };

export interface MisrouteTelemetryInput {
  surface: AiCommandSurface;
  prompt: string;
  classifierAction: string;
  rescuedAction: string;
  rescueReason?: string;
  classifierConfidence?: number;
  compoundStepCount?: number;
  scenarioId?: string;
  /** pipe-1.10.2 — top semantic_match hypothesis when gate escalated. */
  semanticAction?: string;
  semanticConfidence?: number;
  /** pipe-1.10.2 — terminal pipeline stage at telemetry capture. */
  pipelineStage?: MisroutePipelineStage;
}

export interface MisrouteTelemetryPayload {
  surface: AiCommandSurface;
  prompt: string;
  classifierAction: string;
  rescuedAction: string;
  rescueReason?: string;
  classifierConfidence?: number;
  compoundStepCount: number;
  scenarioId?: string;
  misrouted: boolean;
  timestamp: string;
  semanticAction?: string;
  semanticConfidence?: number;
  pipelineStage?: MisroutePipelineStage;
  pipeMarker?: string;
}

export type MisroutePipelineStage =
  | PipelineStage
  | 'unknown'
  | 'compound'
  | 'blocked';

type TopMisrouteScenario = {
  id: string;
  surface?: AiCommandSurface;
  prompt: string;
  rescueReason?: string;
};

/** Curated high-frequency mis-route prompts from eval + rescue fixtures (ai-cmd-h4.4). */
export const TOP_MISROUTE_SCENARIOS: TopMisrouteScenario[] = [
  ...AVAILABILITY_DISAMBIGUATION_SCENARIOS.map((s) => ({
    id: s.id,
    surface: s.surface,
    prompt: s.prompt,
    rescueReason: s.rescueReason,
  })),
  ...COMPOUND_RESCUE_SCENARIOS.map((s) => ({
    id: s.id,
    surface: 'dashboard' as const,
    prompt: s.prompt,
    rescueReason: s.rescueReason,
  })),
  ...FLEXIBLE_BOOKING_EVAL_SCENARIOS.map((s) => ({
    id: s.id,
    prompt: s.prompt,
    rescueReason: s.rescueReason,
  })),
  ...CHECK_AND_BOOK_EVAL_SCENARIOS.map((s) => ({
    id: s.id,
    surface: s.surface,
    prompt: s.prompt,
    rescueReason: 'check_and_book_compound',
  })),
];

const RESULT_PIPELINE_STAGE_MAP: Record<string, MisroutePipelineStage> = {
  unknown_intent_clarify: 'clarify',
  self_verify_clarify: 'clarify',
  clarify: 'clarify',
};

export function normalizeMisroutePrompt(prompt: string): string {
  return prompt.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function matchTopMisrouteScenario(
  prompt: string,
  surface: AiCommandSurface,
): TopMisrouteScenario | null {
  const norm = normalizeMisroutePrompt(prompt);
  for (const scenario of TOP_MISROUTE_SCENARIOS) {
    if (scenario.surface && scenario.surface !== surface) continue;
    if (norm === normalizeMisroutePrompt(scenario.prompt)) return scenario;
  }
  return null;
}

export function resolveSemanticTelemetry(
  candidates: IntentCandidate[],
): Pick<MisrouteTelemetryInput, 'semanticAction' | 'semanticConfidence'> {
  const winner =
    resolveSemanticWinnerCandidate(candidates) ??
    candidates.find((candidate) => candidate.source === 'semantic_match') ??
    null;
  if (!winner) return {};
  return {
    semanticAction: winner.action,
    semanticConfidence: winner.confidence,
  };
}

export function resolveMisroutePipelineStage(
  trace?: PipelineTrace[],
  options?: {
    status?: PipelineUnderstandStatus;
    resultPipelineStage?: string;
  },
): MisroutePipelineStage | undefined {
  const mapped = options?.resultPipelineStage
    ? RESULT_PIPELINE_STAGE_MAP[options.resultPipelineStage]
    : undefined;
  if (mapped) return mapped;

  if (options?.resultPipelineStage) {
    return options.resultPipelineStage as MisroutePipelineStage;
  }

  if (trace?.length) {
    return trace[trace.length - 1]?.stage;
  }

  if (options?.status === 'unknown') return 'unknown';
  if (options?.status === 'clarify') return 'clarify';
  if (options?.status === 'blocked') return 'blocked';

  return undefined;
}

export function enrichMisrouteTelemetryFromUnderstand(
  input: MisrouteTelemetryInput,
  understood?: PipelineUnderstandResult,
  pipelineTrace?: PipelineTrace[],
): MisrouteTelemetryInput {
  if (!understood && !pipelineTrace?.length) return input;

  const semantic = understood
    ? resolveSemanticTelemetry(understood.candidates)
    : resolveSemanticTelemetry([]);

  const pipelineStage = resolveMisroutePipelineStage(
    pipelineTrace ?? understood?.trace,
    { status: understood?.status },
  );

  return {
    ...input,
    ...semantic,
    pipelineStage: input.pipelineStage ?? pipelineStage,
  };
}

export function shouldRecordMisrouteTelemetry(
  input: MisrouteTelemetryInput,
): boolean {
  return matchTopMisrouteScenario(input.prompt, input.surface) !== null;
}

export function buildMisrouteTelemetryPayload(
  input: MisrouteTelemetryInput,
): MisrouteTelemetryPayload {
  const scenario =
    input.scenarioId != null
      ? TOP_MISROUTE_SCENARIOS.find((s) => s.id === input.scenarioId)
      : matchTopMisrouteScenario(input.prompt, input.surface);

  return {
    surface: input.surface,
    prompt: input.prompt,
    classifierAction: input.classifierAction,
    rescuedAction: input.rescuedAction,
    rescueReason: input.rescueReason ?? scenario?.rescueReason,
    classifierConfidence: input.classifierConfidence,
    compoundStepCount: input.compoundStepCount ?? 1,
    scenarioId: input.scenarioId ?? scenario?.id,
    misrouted: input.classifierAction !== input.rescuedAction,
    timestamp: new Date().toISOString(),
    semanticAction: input.semanticAction,
    semanticConfidence: input.semanticConfidence,
    pipelineStage: input.pipelineStage,
    pipeMarker: MISROUTE_TELEMETRY_PIPE_MARKER,
  };
}

/** Fire-and-forget telemetry for curated mis-route prompts (ai-cmd-h4.4). */
export function recordMisrouteTelemetry(
  aiEvents: Pick<AiEventsService, 'emitMisrouteTelemetry'>,
  businessId: string,
  input: MisrouteTelemetryInput,
): MisrouteTelemetryPayload | null {
  if (!shouldRecordMisrouteTelemetry(input)) return null;
  const payload = buildMisrouteTelemetryPayload(input);
  aiEvents.emitMisrouteTelemetry(businessId, payload);
  return payload;
}
