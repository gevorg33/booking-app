import { PROVIDER_INTENTS } from '../ai/ai-command-registry.build.js';
import type {
  ProviderExpUiActionParity,
  ProviderExpAiParityCoverage,
} from './provider-exp-ai-parity.fixtures.js';

export function isProviderIntentRegistered(intent: string): boolean {
  return (PROVIDER_INTENTS as readonly string[]).includes(intent);
}

export function listUnknownProviderIntents(
  intents: readonly string[],
): string[] {
  return intents.filter((intent) => !isProviderIntentRegistered(intent));
}

export function validateParityCoverage(
  coverage: ProviderExpAiParityCoverage,
): string[] {
  if (coverage.kind === 'dashboard-only') {
    return coverage.dashboardReason.trim() ? [] : ['missing dashboardReason'];
  }
  if (!coverage.intents.length) {
    return ['provider-ai coverage requires at least one intent'];
  }
  return listUnknownProviderIntents(coverage.intents);
}

export function listParityViolations(
  entries: readonly ProviderExpUiActionParity[] = [],
): string[] {
  const violations: string[] = [];
  const seenIds = new Set<string>();

  for (const entry of entries) {
    if (seenIds.has(entry.id)) {
      violations.push(`${entry.id}: duplicate parity id`);
    }
    seenIds.add(entry.id);

    const coverageErrors = validateParityCoverage(entry.coverage);
    for (const error of coverageErrors) {
      violations.push(`${entry.id}: ${error}`);
    }
  }

  return violations;
}

export function assertProviderExpAiParity(
  entries: readonly ProviderExpUiActionParity[],
): void {
  const violations = listParityViolations(entries);
  if (violations.length) {
    throw new Error(
      `Provider exp AI parity violations (${violations.length}): ${violations.slice(0, 8).join('; ')}`,
    );
  }
}

export function formatParityEntryForDocs(
  entry: ProviderExpUiActionParity,
): string {
  if (entry.coverage.kind === 'dashboard-only') {
    return `dashboard-only — ${entry.coverage.dashboardReason}`;
  }
  return entry.coverage.intents.join(', ');
}
