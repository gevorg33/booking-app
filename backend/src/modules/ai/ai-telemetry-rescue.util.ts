import type { CommandSurface } from './ai-command-registry.types.js';
import {
  matchLearnedTelemetryRescueRule,
} from './ai-failure-closure.util.js';
import type { LearnedTelemetryRescueRule } from './ai-settings.types.js';
import { applyDeterministicRescue } from './ai-n99-deterministic-rescue.util.js';

export type { TelemetryRescueMatch } from './ai-n99-deterministic-rescue.util.js';

/** acc-3.8 / n99-2.5 — deterministic rescue from telemetry + suspected_miss rules (no LLM). */
export function applyTelemetryRescueRule(
  prompt: string,
  fromAction: string,
  surface?: CommandSurface,
  learnedRules: LearnedTelemetryRescueRule[] = [],
) {
  return applyDeterministicRescue(prompt, fromAction, surface, learnedRules);
}

/** Classifier-enrichment lookup (acc-3.8). */
export function matchTelemetryRescueHint(
  prompt: string,
  action: string,
  surface?: CommandSurface,
  learnedRules: LearnedTelemetryRescueRule[] = [],
): { toAction: string; hintId: string } | null {
  const match = applyDeterministicRescue(
    prompt,
    action,
    surface,
    learnedRules,
  );
  if (!match) return null;
  return { toAction: match.toAction, hintId: match.ruleId };
}
