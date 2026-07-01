import { Test } from '@nestjs/testing';
import { FastIntentHeuristicsService } from './fast-intent-heuristics.service.js';
import { CommandComplexityRouterService } from './command-complexity-router.service.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';
import { isCompoundPrompt } from './intent-decomposition.util.js';
import {
  FAST_HEURISTIC_ROUTING_SCENARIO_IDS,
  FAST_HEURISTIC_ROUTING_SCENARIOS,
  type FastHeuristicRoutingScenario,
} from './fast-intent-heuristics.fixtures.js';
import {
  FAST_HEURISTIC_ROUTING_IT_EACH_SCENARIO_IDS,
  findOrphanFastHeuristicRoutingIds,
} from './fast-intent-heuristics-routing.coverage.js';

const DEFAULT_EMPLOYEES = [
  { id: 'emp-1', name: 'Gevorg Gasparyan' },
  { id: 'emp-2', name: 'Mary Torgomyan' },
];

function assertRoutingScenario(
  service: FastIntentHeuristicsService,
  scenario: FastHeuristicRoutingScenario,
) {
  const candidates = service.score({
    prompt: scenario.prompt,
    surface: scenario.surface ?? 'dashboard',
    employees: scenario.employees ?? DEFAULT_EMPLOYEES,
  });

  expect(candidates).toHaveLength(scenario.expectedCandidateCount);

  if (scenario.expectedCandidateCount === 0) {
    return;
  }

  expect(candidates.map((candidate) => candidate.action)).toEqual(
    scenario.expectedActions,
  );
  expect(
    candidates.every((candidate) => candidate.source === 'fast_heuristic'),
  ).toBe(true);

  if (scenario.expectedComplexityTier) {
    expect(candidates[0]?.paramHints?.complexityTier).toBe(
      scenario.expectedComplexityTier,
    );
  }

  if (scenario.minTopConfidence != null) {
    expect(candidates[0]?.confidence).toBeGreaterThanOrEqual(
      scenario.minTopConfidence,
    );
  }

  if (scenario.expectUseDecomposition) {
    expect(candidates[0]?.paramHints?.useDecomposition).toBe(true);
  }

  if (scenario.category === 'negative') {
    throw new Error(
      `negative scenario ${scenario.id} must have zero candidates`,
    );
  }
}

describe('FastIntentHeuristicsService routing fixtures (pipe-1.2.4)', () => {
  let service: FastIntentHeuristicsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        FastIntentHeuristicsService,
        CommandComplexityRouterService,
        {
          provide: IntentDecompositionService,
          useValue: { isCompoundPrompt },
        },
      ],
    }).compile();

    service = moduleRef.get(FastIntentHeuristicsService);
  });

  it('routing it.each covers every fixture id with no orphans', () => {
    expect(FAST_HEURISTIC_ROUTING_IT_EACH_SCENARIO_IDS).toEqual(
      FAST_HEURISTIC_ROUTING_SCENARIO_IDS,
    );
    expect(
      findOrphanFastHeuristicRoutingIds(
        FAST_HEURISTIC_ROUTING_SCENARIO_IDS,
        FAST_HEURISTIC_ROUTING_IT_EACH_SCENARIO_IDS,
      ),
    ).toEqual([]);
    expect(new Set(FAST_HEURISTIC_ROUTING_SCENARIO_IDS).size).toBe(
      FAST_HEURISTIC_ROUTING_SCENARIOS.length,
    );
  });

  it.each(FAST_HEURISTIC_ROUTING_SCENARIOS)(
    'routing fixture $id ($category)',
    (scenario) => {
      assertRoutingScenario(service, scenario);
    },
  );
});
