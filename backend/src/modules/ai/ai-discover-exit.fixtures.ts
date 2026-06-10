import { BUDGET_DOMAIN_FIXTURE_IDS } from './ai-budget-service-discovery.fixtures.js';
import { CONSUMER_DISCOVERY_CHIP_FIXTURE_IDS } from './ai-consumer-discovery-chips.fixtures.js';
import { AVAIL_DOMAIN_FIXTURE_IDS } from './ai-flexible-availability.fixtures.js';
import { SERVICE_DISCOVERY_PUBLIC_INTEGRATION_IDS } from './ai-service-discovery.fixtures.js';
import { SERVICE_DISCOVERY_MULTILINGUAL_FIXTURE_IDS } from './ai-service-discovery-multilingual.fixtures.js';
import { RANK_DOMAIN_FIXTURE_IDS } from './ai-service-rank-discovery.fixtures.js';

/** Cross-sprint discover fixtures (discover-1.4–1.6 + multilingual section I). */
export const DISCOVER_CROSS_SPRINT_FIXTURE_IDS: readonly string[] = [
  ...new Set([
    ...SERVICE_DISCOVERY_PUBLIC_INTEGRATION_IDS,
    ...SERVICE_DISCOVERY_MULTILINGUAL_FIXTURE_IDS,
    ...CONSUMER_DISCOVERY_CHIP_FIXTURE_IDS,
  ]),
];

/** Union of budget + rank + avail + cross-sprint discover fixture ids (discover-exit-1). */
export const DISCOVER_EXIT_FIXTURE_IDS: readonly string[] = [
  ...new Set([
    ...BUDGET_DOMAIN_FIXTURE_IDS,
    ...RANK_DOMAIN_FIXTURE_IDS,
    ...AVAIL_DOMAIN_FIXTURE_IDS,
    ...DISCOVER_CROSS_SPRINT_FIXTURE_IDS,
  ]),
];

export const DISCOVER_EXIT_MIN_UNIQUE_FIXTURE_IDS = 120;

export function collectUniqueFixtureIds(
  rows: ReadonlyArray<{ id: string }>,
): string[] {
  return [...new Set(rows.map((row) => row.id))];
}

export function findOrphanFixtureIds(
  requiredIds: readonly string[],
  coveredIds: ReadonlySet<string>,
): string[] {
  return requiredIds.filter((id) => !coveredIds.has(id));
}
