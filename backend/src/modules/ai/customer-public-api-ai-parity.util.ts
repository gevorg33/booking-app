import { CUSTOMER_INTENTS, PUBLIC_INTENTS } from './ai-command-registry.build.js';
import type {
  CustomerPublicApiParityEntry,
  CustomerPublicApiAiParityCoverage,
} from './customer-public-api-ai-parity.fixtures.js';

export function isCustomerIntentRegistered(intent: string): boolean {
  return CUSTOMER_INTENTS.includes(intent);
}

export function isPublicIntentRegistered(intent: string): boolean {
  return PUBLIC_INTENTS.includes(intent);
}

export function listUnknownCustomerIntents(
  intents: readonly string[],
): string[] {
  return intents.filter((intent) => !isCustomerIntentRegistered(intent));
}

export function listUnknownPublicIntents(intents: readonly string[]): string[] {
  return intents.filter((intent) => !isPublicIntentRegistered(intent));
}

export function validateParityCoverage(
  coverage: CustomerPublicApiAiParityCoverage,
): string[] {
  if (coverage.kind === 'dashboard-only' || coverage.kind === 'no-ai') {
    return coverage.reason.trim() ? [] : [`missing reason for ${coverage.kind}`];
  }
  if (!coverage.intents.length) {
    return [`${coverage.kind} coverage requires at least one intent`];
  }
  return coverage.kind === 'customer-ai'
    ? listUnknownCustomerIntents(coverage.intents)
    : listUnknownPublicIntents(coverage.intents);
}

export function listParityViolations(
  entries: readonly CustomerPublicApiParityEntry[] = [],
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

export function assertCustomerPublicApiAiParity(
  entries: readonly CustomerPublicApiParityEntry[],
): void {
  const violations = listParityViolations(entries);
  if (violations.length) {
    throw new Error(
      `Customer/public API AI parity violations (${violations.length}): ${violations.slice(0, 8).join('; ')}`,
    );
  }
}

export function formatParityEntryForDocs(
  entry: CustomerPublicApiParityEntry,
): string {
  if (entry.coverage.kind === 'dashboard-only' || entry.coverage.kind === 'no-ai') {
    return `${entry.coverage.kind} — ${entry.coverage.reason}`;
  }
  return entry.coverage.intents.join(', ');
}

/** Mutating intents (registry `mutateIntents`) that are missing an API binding row here. */
export function listMutateIntentsMissingApiBinding(
  mutateIntents: readonly string[],
  entries: readonly CustomerPublicApiParityEntry[] = [],
): string[] {
  const bound = new Set(
    entries.flatMap((entry) =>
      entry.coverage.kind === 'customer-ai' || entry.coverage.kind === 'public-ai'
        ? entry.coverage.intents
        : [],
    ),
  );
  return mutateIntents.filter((intent) => !bound.has(intent));
}
