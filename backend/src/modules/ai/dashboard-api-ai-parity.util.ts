import { DASHBOARD_INTENTS } from './ai-command-registry.build.js';
import type {
  DashboardApiParityEntry,
  DashboardApiAiParityCoverage,
} from './dashboard-api-ai-parity.fixtures.js';

export function isDashboardIntentRegistered(intent: string): boolean {
  return DASHBOARD_INTENTS.includes(intent);
}

export function listUnknownDashboardIntents(
  intents: readonly string[],
): string[] {
  return intents.filter((intent) => !isDashboardIntentRegistered(intent));
}

export function validateDashboardParityCoverage(
  coverage: DashboardApiAiParityCoverage,
): string[] {
  if (
    coverage.kind === 'no-ai' ||
    coverage.kind === 'no-ai-binary' ||
    coverage.kind === 'no-ai-realtime'
  ) {
    return coverage.reason.trim() ? [] : [`missing reason for ${coverage.kind}`];
  }
  if (!coverage.intents.length) {
    return [`${coverage.kind} coverage requires at least one intent`];
  }
  return listUnknownDashboardIntents(coverage.intents);
}

export function listDashboardParityViolations(
  entries: readonly DashboardApiParityEntry[] = [],
): string[] {
  const violations: string[] = [];
  const seenIds = new Set<string>();

  for (const entry of entries) {
    if (seenIds.has(entry.id)) {
      violations.push(`${entry.id}: duplicate parity id`);
    }
    seenIds.add(entry.id);

    const coverageErrors = validateDashboardParityCoverage(entry.coverage);
    for (const error of coverageErrors) {
      violations.push(`${entry.id}: ${error}`);
    }
  }

  return violations;
}

export function assertDashboardApiAiParity(
  entries: readonly DashboardApiParityEntry[],
): void {
  const violations = listDashboardParityViolations(entries);
  if (violations.length) {
    throw new Error(
      `Dashboard API AI parity violations (${violations.length}): ${violations.slice(0, 8).join('; ')}`,
    );
  }
}

export function formatDashboardParityEntryForDocs(
  entry: DashboardApiParityEntry,
): string {
  if (
    entry.coverage.kind === 'no-ai' ||
    entry.coverage.kind === 'no-ai-binary' ||
    entry.coverage.kind === 'no-ai-realtime'
  ) {
    return `${entry.coverage.kind} — ${entry.coverage.reason}`;
  }
  return `${entry.coverage.kind}: ${entry.coverage.intents.join(', ')}`;
}

/** Mutating intents (registry `mutateIntents`) that are missing an API binding row here. */
export function listMutatingDashboardIntentsMissingApiBinding(
  mutateIntents: readonly string[],
  entries: readonly DashboardApiParityEntry[] = [],
): string[] {
  const bound = new Set(
    entries.flatMap((entry) =>
      entry.coverage.kind === 'dashboard-ai' ||
      entry.coverage.kind === 'ai-bulk-internal'
        ? entry.coverage.intents
        : [],
    ),
  );
  return mutateIntents.filter((intent) => !bound.has(intent));
}
