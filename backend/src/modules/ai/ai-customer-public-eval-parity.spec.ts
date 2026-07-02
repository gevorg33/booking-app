import {
  budgetScenarioEligibleForSurface,
  budgetSurfacesForScenario,
} from './ai-budget-service-discovery.eval.util.js';
import { SIMILAR_BUDGET_SERVICE_PROMPTS } from './ai-budget-service-discovery.fixtures.js';
import {
  AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_CUSTOMER_CASES,
  AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_PUBLIC_CASES,
} from './ai-budget-service-discovery.eval.util.js';
import { SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS } from './ai-flexible-availability.fixtures.js';
import {
  AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CUSTOMER_CASES,
  AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_PUBLIC_CASES,
  flexibleAvailabilityScenarioEligibleForEval,
  flexibleAvailabilitySurfacesForScenario,
} from './ai-flexible-availability.eval.util.js';
import { SIMILAR_SERVICE_RANK_PROMPTS } from './ai-service-rank-discovery.fixtures.js';
import {
  AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_CUSTOMER_CASES,
  AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_PUBLIC_CASES,
  rankScenarioEligibleForEval,
  rankSurfacesForScenario,
} from './ai-service-rank-discovery.eval.util.js';
import {
  AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_MULTILINGUAL_CASES,
  isMultilingualDiscoverEvalEligible,
  multilingualEvalCaseId,
  multilingualSurfacesForScenario,
} from './ai-service-discovery.eval.util.js';
import { MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS } from './ai-service-discovery-multilingual.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

type SharedDiscoveryDomain = 'budget' | 'rank' | 'availability';

const SHARED_DISCOVERY_EVAL: Record<
  SharedDiscoveryDomain,
  {
    fixtures: readonly { id: string; surface?: string; phase2?: boolean }[];
    publicCases: readonly { id: string }[];
    customerCases: readonly { id: string }[];
    evalIdPrefix: string;
    surfacesFor: (fixture: {
      surface?: string;
    }) => Array<'public' | 'customer'>;
    eligible: (
      fixture: { id: string; surface?: string; phase2?: boolean },
      surface: 'public' | 'customer',
    ) => boolean;
  }
> = {
  budget: {
    fixtures: SIMILAR_BUDGET_SERVICE_PROMPTS,
    publicCases: AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_PUBLIC_CASES,
    customerCases: AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_CUSTOMER_CASES,
    evalIdPrefix: 'budget',
    surfacesFor: budgetSurfacesForScenario,
    eligible: (fixture, surface) =>
      !fixture.phase2 &&
      budgetScenarioEligibleForSurface(
        fixture as (typeof SIMILAR_BUDGET_SERVICE_PROMPTS)[number],
        surface,
      ),
  },
  rank: {
    fixtures: SIMILAR_SERVICE_RANK_PROMPTS,
    publicCases: AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_PUBLIC_CASES,
    customerCases: AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_CUSTOMER_CASES,
    evalIdPrefix: 'rank',
    surfacesFor: rankSurfacesForScenario,
    eligible: (fixture, surface) =>
      rankScenarioEligibleForEval(
        fixture as (typeof SIMILAR_SERVICE_RANK_PROMPTS)[number],
        surface,
      ),
  },
  availability: {
    fixtures: SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS,
    publicCases: AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_PUBLIC_CASES,
    customerCases: AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CUSTOMER_CASES,
    evalIdPrefix: 'avail',
    surfacesFor: flexibleAvailabilitySurfacesForScenario,
    eligible: (fixture, surface) =>
      flexibleAvailabilityScenarioEligibleForEval(
        fixture as (typeof SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS)[number],
        surface,
      ),
  },
};

describe('ai customer public eval parity (ai-cmd-customer-3.2 / gap-5)', () => {
  it.each(['budget', 'rank', 'availability'] as const)(
    'duplicates EN eval rows for every eval-eligible both-surface %s fixture',
    (domain) => {
      const {
        fixtures,
        publicCases,
        customerCases,
        evalIdPrefix,
        surfacesFor,
        eligible,
      } = SHARED_DISCOVERY_EVAL[domain];
      const publicIds = publicCases.map((row) => row.id);
      const customerIds = customerCases.map((row) => row.id);

      for (const fixture of fixtures.filter((row) => row.surface === 'both')) {
        for (const surface of surfacesFor(fixture).filter(
          (entry): entry is 'public' | 'customer' =>
            entry === 'public' || entry === 'customer',
        )) {
          if (!eligible(fixture, surface)) continue;
          const evalId = `${evalIdPrefix}-${surface}-${fixture.id}`;
          if (surface === 'public') {
            expect(publicIds).toContain(evalId);
          } else {
            expect(customerIds).toContain(evalId);
          }
        }
      }
    },
  );

  it('duplicates multilingual eval rows for every eval-eligible both-surface scenario', () => {
    const evalIds = new Set(
      AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_MULTILINGUAL_CASES.map(
        (row) => row.id,
      ),
    );

    for (const scenario of MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS.filter(
      (row) =>
        row.surface === 'both' && isMultilingualDiscoverEvalEligible(row),
    )) {
      for (const surface of multilingualSurfacesForScenario(scenario)) {
        expect(evalIds).toContain(multilingualEvalCaseId(scenario, surface));
      }
    }
  });

  it('tags duplicated multilingual eval rows with the correct surface', () => {
    const byId = new Map(
      AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_MULTILINGUAL_CASES.map((row) => [
        row.id,
        row,
      ]),
    );

    for (const scenario of MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS.filter(
      (row) =>
        row.surface === 'both' && isMultilingualDiscoverEvalEligible(row),
    )) {
      for (const surface of multilingualSurfacesForScenario(scenario)) {
        const evalCase = byId.get(multilingualEvalCaseId(scenario, surface));
        expect(evalCase?.surface).toBe(surface);
      }
    }
  });

  it('ships HY and RU multilingual eval coverage on public and customer surfaces', () => {
    const locales = new Set<AiEvalLocale>();

    for (const evalCase of AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_MULTILINGUAL_CASES) {
      if (evalCase.locale === 'hy' || evalCase.locale === 'ru') {
        locales.add(evalCase.locale);
      }
    }

    expect(locales.has('hy')).toBe(true);
    expect(locales.has('ru')).toBe(true);

    const hyPublic =
      AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'hy' && row.surface === 'public',
      ).length;
    const hyCustomer =
      AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'hy' && row.surface === 'customer',
      ).length;
    const ruPublic =
      AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'ru' && row.surface === 'public',
      ).length;
    const ruCustomer =
      AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'ru' && row.surface === 'customer',
      ).length;

    expect(hyPublic).toBeGreaterThanOrEqual(4);
    expect(hyCustomer).toBeGreaterThanOrEqual(4);
    expect(ruPublic).toBeGreaterThanOrEqual(4);
    expect(ruCustomer).toBeGreaterThanOrEqual(4);
  });
});
