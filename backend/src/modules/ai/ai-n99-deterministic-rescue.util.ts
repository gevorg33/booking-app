/** n99-2.5 — mine recurring suspected_miss patterns into no-LLM rescues (acc-1.4, acc-3.8). */

import { isTotalEarningsPrompt } from './dashboard-revenue-analytics.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import {
  matchLearnedTelemetryRescueRule,
} from './ai-failure-closure.util.js';
import type { LearnedTelemetryRescueRule } from './ai-settings.types.js';
import {
  N99_SUSPECTED_MISS_RESCUE_RULES,
  type N99DeterministicRescueScenario,
} from './ai-n99-deterministic-rescue.fixtures.js';
import {
  TELEMETRY_RESCUE_BOOK_VERB,
  TELEMETRY_RESCUE_RULES,
  type TelemetryRescueRule,
} from './ai-telemetry-rescue.fixtures.js';

export const N99_SUSPECTED_MISS_MIN_OCCURRENCES = 3;

export interface TelemetryRescueMatch {
  ruleId: string;
  toAction: string;
  rescueReason: string;
  params?: Record<string, unknown>;
}

export interface SuspectedMissMiningRow {
  promptSnippet: string;
  action: string;
  correctedAction?: string | null;
  surface: string;
  failureCount: number;
  failureSignals: { suspected_miss?: number };
}

export interface SuspectedMissRescueCandidate {
  fromAction: string;
  toAction: string;
  surface?: string;
  count: number;
  promptSnippet: string;
}

function ruleMatchesPrompt(rule: TelemetryRescueRule, prompt: string): boolean {
  if (rule.matches) {
    return rule.matches(prompt);
  }
  if (!rule.pattern) {
    return false;
  }
  return rule.pattern.test(prompt);
}

function resolveRuleParams(
  rule: TelemetryRescueRule,
  prompt: string,
): Record<string, unknown> | undefined {
  if (!rule.params) return undefined;
  return typeof rule.params === 'function' ? rule.params(prompt) : rule.params;
}

function applyRuleSet(
  prompt: string,
  fromAction: string,
  surface: CommandSurface | undefined,
  rules: ReadonlyArray<TelemetryRescueRule>,
): TelemetryRescueMatch | null {
  for (const rule of rules) {
    if (rule.fromAction !== fromAction) continue;
    if (rule.surfaces?.length) {
      if (!surface || !rule.surfaces.includes(surface)) {
        continue;
      }
    }
    if (rule.skipPattern?.test(prompt)) continue;
    if (!ruleMatchesPrompt(rule, prompt)) continue;
    return {
      ruleId: rule.id,
      toAction: rule.toAction,
      rescueReason: rule.rescueReason,
      params: resolveRuleParams(rule, prompt),
    };
  }
  return null;
}

/** Unified deterministic rescue: learned → n99 suspected_miss → telemetry corpus. */
export function applyDeterministicRescue(
  prompt: string,
  fromAction: string,
  surface?: CommandSurface,
  learnedRules: LearnedTelemetryRescueRule[] = [],
): TelemetryRescueMatch | null {
  const learned = matchLearnedTelemetryRescueRule(
    prompt,
    fromAction,
    learnedRules,
    surface,
  );
  if (learned) {
    return {
      ruleId: learned.id,
      toAction: learned.toAction,
      rescueReason: learned.rescueReason,
    };
  }

  const n99Match = applyRuleSet(
    prompt,
    fromAction,
    surface,
    N99_SUSPECTED_MISS_RESCUE_RULES,
  );
  if (n99Match) return n99Match;

  const telemetryMatch = applyRuleSet(
    prompt,
    fromAction,
    surface,
    TELEMETRY_RESCUE_RULES,
  );
  if (telemetryMatch) return telemetryMatch;

  if (
    fromAction === 'create_booking' &&
    !TELEMETRY_RESCUE_BOOK_VERB.test(prompt) &&
    isTotalEarningsPrompt(prompt)
  ) {
    return {
      ruleId: 'telemetry-create-to-summarize-revenue',
      toAction: 'summarize_bookings',
      rescueReason: 'telemetry_create_to_summarize_revenue',
      params: { bookingMetric: 'revenue' },
    };
  }

  return null;
}

/** acc-1.4 — aggregate recurring suspected_miss confusion pairs from trace rows. */
export function mineSuspectedMissRescueCandidates(
  rows: SuspectedMissMiningRow[],
  minOccurrences = N99_SUSPECTED_MISS_MIN_OCCURRENCES,
): SuspectedMissRescueCandidate[] {
  const counts = new Map<string, SuspectedMissRescueCandidate>();

  for (const row of rows) {
    const suspectedMissCount = row.failureSignals.suspected_miss ?? 0;
    if (suspectedMissCount <= 0) continue;
    const toAction = row.correctedAction;
    if (!toAction || toAction === row.action) continue;

    const key = `${row.surface}::${row.action}->${toAction}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count += row.failureCount;
      continue;
    }
    counts.set(key, {
      fromAction: row.action,
      toAction,
      surface: row.surface,
      count: row.failureCount,
      promptSnippet: row.promptSnippet,
    });
  }

  return [...counts.values()]
    .filter((entry) => entry.count >= minOccurrences)
    .sort((a, b) => b.count - a.count);
}

export function evaluateN99DeterministicRescueScenario(
  scenario: N99DeterministicRescueScenario,
): { passed: boolean; match: TelemetryRescueMatch | null; errors: string[] } {
  const match = applyDeterministicRescue(
    scenario.prompt,
    scenario.fromAction,
    scenario.surface,
  );
  const errors: string[] = [];

  if (!match) {
    errors.push('deterministicRescue: expected match');
  } else {
    if (match.toAction !== scenario.expectedAction) {
      errors.push(
        `deterministicRescue.action: expected ${scenario.expectedAction}, got ${match.toAction}`,
      );
    }
    if (match.rescueReason !== scenario.rescueReason) {
      errors.push(
        `deterministicRescue.reason: expected ${scenario.rescueReason}, got ${match.rescueReason}`,
      );
    }
    if (match.ruleId !== scenario.ruleId) {
      errors.push(
        `deterministicRescue.ruleId: expected ${scenario.ruleId}, got ${match.ruleId}`,
      );
    }
  }

  return {
    passed: errors.length === 0,
    match,
    errors,
  };
}
