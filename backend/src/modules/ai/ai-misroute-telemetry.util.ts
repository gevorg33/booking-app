import type { AiCommandSurface } from './ai-platform.util.js';
import type { AiEventsService } from './ai-events.service.js';
import { AVAILABILITY_DISAMBIGUATION_SCENARIOS } from './ai-intent-disambiguation.fixtures.js';
import { COMPOUND_RESCUE_SCENARIOS } from './ai-rescue-pipeline.fixtures.js';
import {
  CHECK_AND_BOOK_EVAL_SCENARIOS,
  FLEXIBLE_BOOKING_EVAL_SCENARIOS,
} from './ai-check-and-book.fixtures.js';

export interface MisrouteTelemetryInput {
  surface: AiCommandSurface;
  prompt: string;
  classifierAction: string;
  rescuedAction: string;
  rescueReason?: string;
  classifierConfidence?: number;
  compoundStepCount?: number;
  scenarioId?: string;
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
}

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
  };
}

/** Fire-and-forget telemetry for curated mis-route prompts (ai-cmd-h4.4). */
export function recordMisrouteTelemetry(
  aiEvents: Pick<AiEventsService, 'emitMisrouteTelemetry'>,
  businessId: string,
  input: MisrouteTelemetryInput,
): void {
  if (!shouldRecordMisrouteTelemetry(input)) return;
  aiEvents.emitMisrouteTelemetry(
    businessId,
    buildMisrouteTelemetryPayload(input),
  );
}
