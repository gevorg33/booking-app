/** ids exercised by `it.each` in the discover merge gate (discover-exit-1). */
import {
  BUDGET_CURRENCY_EDGE_SCENARIOS,
  BUDGET_DISAMBIGUATION_SCENARIOS,
  BUDGET_DOMAIN_FIXTURE_IDS,
  BUDGET_HANDLER_OUTCOME_SCENARIOS,
  BUDGET_MAX_PRICE_EXTRACTION_SCENARIOS,
  BUDGET_SERVICE_DISCOVERY_CUSTOMER_PROMPTS,
  BUDGET_SERVICE_DISCOVERY_PUBLIC_PROMPTS,
  BUDGET_SESSION_SCENARIOS,
  BUDGET_VOICE_SCENARIOS,
  SIMILAR_BUDGET_SERVICE_PROMPTS,
} from './ai-budget-service-discovery.fixtures.js';
import { CONSUMER_DISCOVERY_CHIP_FIXTURES } from './ai-consumer-discovery-chips.fixtures.js';
import {
  AVAILABILITY_WINDOW_ENRICHMENT_SCENARIOS,
  AVAILABILITY_WINDOW_NORMALIZE_SCENARIOS,
  AVAILABILITY_WINDOW_PARSE_SCENARIOS,
  AVAILABILITY_WINDOW_SINGLE_SCENARIOS,
  AVAIL_BUDGET_OR_SCENARIOS,
  FLEXIBLE_AVAILABILITY_BUDGET_CLARIFY_SCENARIOS,
  FLEXIBLE_AVAILABILITY_BUDGET_SCENARIOS,
  FLEXIBLE_AVAILABILITY_CHECK_FILTER_SCENARIOS,
  FLEXIBLE_AVAILABILITY_COMPOUND_SCENARIOS,
  FLEXIBLE_AVAILABILITY_NEAREST_PICK_SCENARIOS,
  FLEXIBLE_AVAILABILITY_NEAREST_WINDOW_SCENARIOS,
  FLEXIBLE_AVAILABILITY_OVERLAP_SCENARIOS,
  FLEXIBLE_AVAILABILITY_WINDOW_LABEL_SCENARIOS,
  PUBLIC_AVAIL_HANDLER_INTEGRATION_SCENARIOS,
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS,
} from './ai-flexible-availability.fixtures.js';
import { AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_CASES } from './ai-budget-service-discovery.eval.util.js';
import { AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CASES } from './ai-flexible-availability.eval.util.js';
import { AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CASES } from './ai-service-discovery.eval.util.js';
import { RANK_LIMIT_FROM_PROMPT_SCENARIOS } from './ai-rank-list-services.fixtures.js';
import {
  APPLY_SERVICE_DISCOVERY_TO_CATALOG_SCENARIOS,
  FILTER_SERVICES_BY_MAX_PRICE_SCENARIOS,
  PICK_RANKED_SERVICES_SCENARIOS,
  RESOLVE_SERVICE_DISCOVERY_PARAMS_SCENARIOS,
  SERVICE_DISCOVERY_ENRICHMENT_PIPELINE_SCENARIOS,
  SHARED_BUDGET_FILTER_SCENARIO_IDS,
  SORT_SERVICES_BY_PRICE_ASC_SCENARIOS,
  SORT_SERVICES_BY_PRICE_DESC_SCENARIOS,
} from './ai-service-catalog-rank.fixtures.js';
import {
  SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS,
} from './ai-service-discovery.fixtures.js';
import {
  MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS,
} from './ai-service-discovery-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_CASES } from './ai-service-rank-discovery.eval.util.js';
import {
  RANK_HANDLER_OUTCOME_SCENARIOS,
  RANK_MOBILE_SCENARIOS,
  RANK_NAVIGATE_SCENARIOS,
  RANK_SESSION_SCENARIOS,
  RANK_SYNONYM_SCENARIOS,
  SERVICE_RANK_COMPOUND_NEGATIVE_SCENARIOS,
  SERVICE_RANK_COMPOUND_SCENARIOS,
  SERVICE_RANK_EXTRACTION_SCENARIOS,
  SERVICE_RANK_RECOMMEND_SPECIALISTS_RESCUE_SCENARIOS,
  SIMILAR_SERVICE_RANK_PROMPTS,
} from './ai-service-rank-discovery.fixtures.js';
import { collectUniqueFixtureIds } from './ai-discover-exit.fixtures.js';

function ids(rows: ReadonlyArray<{ id: string }>): string[] {
  return rows.map((row) => row.id);
}

/** Union of fixture ids referenced by discover-suite `it.each` blocks. */
export function buildDiscoverExitItEachCoveredIds(): Set<string> {
  const covered = new Set<string>();

  for (const id of ids(SIMILAR_BUDGET_SERVICE_PROMPTS)) covered.add(id);
  for (const id of ids(BUDGET_SESSION_SCENARIOS)) covered.add(id);
  for (const id of ids(BUDGET_HANDLER_OUTCOME_SCENARIOS)) covered.add(id);
  for (const id of ids(BUDGET_DISAMBIGUATION_SCENARIOS)) covered.add(id);
  for (const id of ids(BUDGET_MAX_PRICE_EXTRACTION_SCENARIOS)) covered.add(id);
  for (const id of ids(BUDGET_VOICE_SCENARIOS)) covered.add(id);
  for (const id of [
    ...ids(BUDGET_CURRENCY_EDGE_SCENARIOS.filter((scenario) => !scenario.phase2)),
  ]) {
    covered.add(id);
  }
  for (const id of ids(
    SIMILAR_BUDGET_SERVICE_PROMPTS.filter(
      (scenario) =>
        scenario.publicCompoundSteps?.length ||
        scenario.customerCompoundSteps?.length,
    ),
  )) {
    covered.add(id);
  }
  for (const id of ids(BUDGET_SERVICE_DISCOVERY_PUBLIC_PROMPTS.filter(
    (scenario) => !scenario.skipMaxPrice && scenario.expectedParams?.maxPrice != null,
  ))) {
    covered.add(id);
  }
  for (const id of ids(BUDGET_SERVICE_DISCOVERY_CUSTOMER_PROMPTS.filter(
    (scenario) => scenario.surface === 'customer',
  ))) {
    covered.add(id);
  }
  for (const id of ids(
    SIMILAR_BUDGET_SERVICE_PROMPTS.filter(
      (scenario) => scenario.customerCompoundSteps?.length,
    ),
  )) {
    covered.add(id);
  }
  for (const id of SHARED_BUDGET_FILTER_SCENARIO_IDS) covered.add(id);
  for (const id of ids(AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_CASES)) covered.add(id);

  for (const id of ids(SIMILAR_SERVICE_RANK_PROMPTS)) covered.add(id);
  for (const id of ids(
    SIMILAR_SERVICE_RANK_PROMPTS.filter(
      (scenario) =>
        scenario.expectedParams?.serviceRank &&
        !scenario.blocked &&
        !scenario.phase2,
    ),
  )) {
    covered.add(id);
  }
  for (const id of ids(
    RANK_SYNONYM_SCENARIOS.filter((scenario) => !scenario.phase2),
  )) {
    covered.add(id);
  }
  for (const id of ids(
    RANK_MOBILE_SCENARIOS.filter(
      (scenario) => !scenario.phase2 && scenario.expectedParams?.serviceRank,
    ),
  )) {
    covered.add(id);
  }
  for (const id of ids(SERVICE_RANK_EXTRACTION_SCENARIOS)) covered.add(id);
  for (const id of ids(SERVICE_RANK_RECOMMEND_SPECIALISTS_RESCUE_SCENARIOS)) covered.add(id);
  for (const id of ids(SERVICE_RANK_COMPOUND_SCENARIOS)) covered.add(id);
  for (const id of ids(SERVICE_RANK_COMPOUND_NEGATIVE_SCENARIOS)) covered.add(id);
  for (const id of ids(RANK_HANDLER_OUTCOME_SCENARIOS)) covered.add(id);
  for (const id of ids(RANK_NAVIGATE_SCENARIOS)) covered.add(id);
  for (const id of ids(RANK_SESSION_SCENARIOS)) covered.add(id);
  for (const id of ids(RANK_LIMIT_FROM_PROMPT_SCENARIOS)) covered.add(id);
  for (const id of ids(AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_CASES)) covered.add(id);

  for (const id of ids(SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS)) covered.add(id);
  for (const id of ids(AVAILABILITY_WINDOW_PARSE_SCENARIOS)) covered.add(id);
  for (const id of ids(AVAILABILITY_WINDOW_SINGLE_SCENARIOS)) covered.add(id);
  for (const id of ids(AVAILABILITY_WINDOW_NORMALIZE_SCENARIOS)) covered.add(id);
  for (const id of ids(AVAILABILITY_WINDOW_ENRICHMENT_SCENARIOS)) covered.add(id);
  for (const id of ids(FLEXIBLE_AVAILABILITY_CHECK_FILTER_SCENARIOS)) covered.add(id);
  for (const id of ids(FLEXIBLE_AVAILABILITY_WINDOW_LABEL_SCENARIOS)) covered.add(id);
  for (const id of ids(FLEXIBLE_AVAILABILITY_BUDGET_SCENARIOS)) covered.add(id);
  for (const id of ids(FLEXIBLE_AVAILABILITY_COMPOUND_SCENARIOS)) covered.add(id);
  for (const id of ids(FLEXIBLE_AVAILABILITY_OVERLAP_SCENARIOS)) covered.add(id);
  for (const id of ids(FLEXIBLE_AVAILABILITY_BUDGET_CLARIFY_SCENARIOS)) covered.add(id);
  for (const id of ids(FLEXIBLE_AVAILABILITY_NEAREST_PICK_SCENARIOS)) covered.add(id);
  for (const id of ids(FLEXIBLE_AVAILABILITY_NEAREST_WINDOW_SCENARIOS)) covered.add(id);
  for (const id of ids(
    AVAIL_BUDGET_OR_SCENARIOS.filter(
      (scenario) => !scenario.handlerOutcome && scenario.id === 'avail-budget-or-en',
    ),
  )) {
    covered.add(id);
  }
  for (const id of ids(AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CASES)) covered.add(id);
  for (const id of ids(AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CASES)) covered.add(id);

  for (const id of ids(FILTER_SERVICES_BY_MAX_PRICE_SCENARIOS)) covered.add(id);
  for (const id of ids(SORT_SERVICES_BY_PRICE_ASC_SCENARIOS)) covered.add(id);
  for (const id of ids(SORT_SERVICES_BY_PRICE_DESC_SCENARIOS)) covered.add(id);
  for (const id of ids(PICK_RANKED_SERVICES_SCENARIOS)) covered.add(id);
  for (const id of ids(RESOLVE_SERVICE_DISCOVERY_PARAMS_SCENARIOS)) covered.add(id);
  for (const id of ids(APPLY_SERVICE_DISCOVERY_TO_CATALOG_SCENARIOS)) covered.add(id);
  for (const id of ids(SERVICE_DISCOVERY_ENRICHMENT_PIPELINE_SCENARIOS)) covered.add(id);

  for (const id of ids(SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS)) covered.add(id);
  for (const id of ids(MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS)) covered.add(id);
  for (const id of ids(CONSUMER_DISCOVERY_CHIP_FIXTURES)) covered.add(id);
  for (const id of ids(PUBLIC_AVAIL_HANDLER_INTEGRATION_SCENARIOS)) covered.add(id);

  return covered;
}

export function listDiscoverExitItEachCoverageGaps(
  requiredIds: readonly string[],
): string[] {
  const covered = buildDiscoverExitItEachCoveredIds();
  return requiredIds.filter((id) => !covered.has(id));
}

export function summarizeDiscoverExitCoverage(requiredIds: readonly string[]): {
  required: number;
  covered: number;
  orphans: string[];
} {
  const covered = buildDiscoverExitItEachCoveredIds();
  const orphans = findOrphanFixtureIds(requiredIds, covered);
  return {
    required: requiredIds.length,
    covered: requiredIds.length - orphans.length,
    orphans,
  };
}

function findOrphanFixtureIds(
  requiredIds: readonly string[],
  coveredIds: ReadonlySet<string>,
): string[] {
  return requiredIds.filter((id) => !coveredIds.has(id));
}

export const DISCOVER_EXIT_IT_EACH_COVERED_COUNT = (): number =>
  buildDiscoverExitItEachCoveredIds().size;

export const DISCOVER_EXIT_IT_EACH_COVERED_IDS = (): string[] =>
  [...buildDiscoverExitItEachCoveredIds()].sort();

/** Convenience export for specs asserting non-empty coverage sources. */
export const DISCOVER_EXIT_IT_EACH_SOURCE_ROW_COUNT = collectUniqueFixtureIds([
  ...SIMILAR_BUDGET_SERVICE_PROMPTS,
  ...SIMILAR_SERVICE_RANK_PROMPTS,
  ...SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS,
  ...SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS,
  ...MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS,
  ...CONSUMER_DISCOVERY_CHIP_FIXTURES,
]).length;
