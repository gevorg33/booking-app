import type { ComplexityRoute } from './command-complexity-router.service.js';

export type FastHeuristicRoutingCategory = 'read_only' | 'compound' | 'negative';

export type FastHeuristicRoutingScenario = {
  id: string;
  prompt: string;
  category: FastHeuristicRoutingCategory;
  surface?: 'dashboard' | 'provider' | 'customer' | 'public';
  employees?: Array<{ id: string; name: string }>;
  expectedCandidateCount: number;
  expectedActions: string[];
  expectedComplexityTier?: ComplexityRoute['tier'];
  minTopConfidence?: number;
  expectUseDecomposition?: boolean;
};

/** @deprecated Use FastHeuristicRoutingScenario */
export type FastHeuristicScenario = FastHeuristicRoutingScenario;

const DEFAULT_EMPLOYEES = [
  { id: 'emp-1', name: 'Gevorg Gasparyan' },
  { id: 'emp-2', name: 'Mary Torgomyan' },
];

export const FAST_HEURISTIC_READ_ONLY_SCENARIOS: FastHeuristicRoutingScenario[] =
  [
  {
    id: 'read-only-show-appointments',
    category: 'read_only',
    prompt: 'Show appointments today',
    expectedCandidateCount: 1,
    expectedActions: ['show_appointments'],
    expectedComplexityTier: 'read_only',
    minTopConfidence: 0.9,
  },
  {
    id: 'read-only-list-bookings',
    category: 'read_only',
    prompt: 'List all bookings for tomorrow',
    expectedCandidateCount: 1,
    expectedActions: ['show_appointments'],
    expectedComplexityTier: 'read_only',
    minTopConfidence: 0.9,
  },
  {
    id: 'read-only-upcoming-appointments',
    category: 'read_only',
    prompt: 'Show upcoming appointments for Gevorg and Mary',
    expectedCandidateCount: 1,
    expectedActions: ['show_appointments'],
    expectedComplexityTier: 'read_only',
    minTopConfidence: 0.9,
  },
  {
    id: 'read-only-team-availability',
    category: 'read_only',
    prompt: 'Who can do facemassage today?',
    employees: DEFAULT_EMPLOYEES,
    expectedCandidateCount: 1,
    expectedActions: ['check_providers_for_service'],
    expectedComplexityTier: 'read_only',
    minTopConfidence: 0.9,
  },
  {
    id: 'read-only-named-provider-availability',
    category: 'read_only',
    prompt: 'Is Gevorg available tomorrow at 10:00?',
    employees: DEFAULT_EMPLOYEES,
    expectedCandidateCount: 1,
    expectedActions: ['check_availability'],
    expectedComplexityTier: 'read_only',
    minTopConfidence: 0.9,
  },
  {
    id: 'read-only-how-many-appointments',
    category: 'read_only',
    prompt: 'How many appointments do we have today?',
    expectedCandidateCount: 1,
    expectedActions: ['unknown'],
    expectedComplexityTier: 'read_only',
    minTopConfidence: 0.85,
  },
  {
    id: 'read-only-tier-no-structural-action',
    category: 'read_only',
    prompt: 'Summarize utilization this week',
    expectedCandidateCount: 1,
    expectedActions: ['unknown'],
    expectedComplexityTier: 'read_only',
    minTopConfidence: 0.85,
  },
  ];

export const FAST_HEURISTIC_COMPOUND_SCENARIOS: FastHeuristicRoutingScenario[] =
  [
  {
    id: 'compound-and-then',
    category: 'compound',
    prompt: 'Cancel all appointments and then clear schedule for Gevorg',
    employees: DEFAULT_EMPLOYEES,
    expectedCandidateCount: 1,
    expectedActions: ['unknown'],
    expectedComplexityTier: 'compound',
    minTopConfidence: 0.9,
    expectUseDecomposition: true,
  },
  {
    id: 'compound-period-separated',
    category: 'compound',
    prompt: 'Cancel appointments. Clear schedule for Mary.',
    employees: DEFAULT_EMPLOYEES,
    expectedCandidateCount: 1,
    expectedActions: ['unknown'],
    expectedComplexityTier: 'compound',
    minTopConfidence: 0.9,
    expectUseDecomposition: true,
  },
  {
    id: 'compound-semicolon-chain',
    category: 'compound',
    prompt: 'Hide Friday appointments; notify customers; fill from waitlist',
    expectedCandidateCount: 1,
    expectedActions: ['unknown'],
    expectedComplexityTier: 'compound',
    minTopConfidence: 0.9,
    expectUseDecomposition: true,
  },
  ];

export const FAST_HEURISTIC_NEGATIVE_SCENARIOS: FastHeuristicRoutingScenario[] =
  [
  {
    id: 'simple-mutate-booking',
    category: 'negative',
    prompt: 'Book facemassage with Gevorg tomorrow at 10:00',
    employees: DEFAULT_EMPLOYEES,
    expectedCandidateCount: 0,
    expectedActions: [],
  },
  {
    id: 'orchestration-optimize',
    category: 'negative',
    prompt: 'Optimize schedule for tomorrow',
    expectedCandidateCount: 0,
    expectedActions: [],
  },
  {
    id: 'orchestration-first-available',
    category: 'negative',
    prompt: 'Book whoever has a gap soonest tomorrow for massage',
    employees: DEFAULT_EMPLOYEES,
    expectedCandidateCount: 0,
    expectedActions: [],
  },
  {
    id: 'empty-prompt',
    category: 'negative',
    prompt: '   ',
    expectedCandidateCount: 0,
    expectedActions: [],
  },
  ];

/** All routing scenarios for pipe-1.2.4 it.each (read_only + compound + negative). */
export const FAST_HEURISTIC_ROUTING_SCENARIOS: FastHeuristicRoutingScenario[] = [
  ...FAST_HEURISTIC_READ_ONLY_SCENARIOS,
  ...FAST_HEURISTIC_COMPOUND_SCENARIOS,
  ...FAST_HEURISTIC_NEGATIVE_SCENARIOS,
];

export const FAST_HEURISTIC_ROUTING_SCENARIO_IDS =
  FAST_HEURISTIC_ROUTING_SCENARIOS.map((scenario) => scenario.id);

/** @deprecated Use FAST_HEURISTIC_ROUTING_SCENARIOS */
export const FAST_HEURISTIC_ALL_SCENARIOS = FAST_HEURISTIC_ROUTING_SCENARIOS;
