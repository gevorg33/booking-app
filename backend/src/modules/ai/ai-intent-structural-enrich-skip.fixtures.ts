/** pipe-1.7.3 — structural enrich skip when self-verify emits clarify. */
export const STRUCTURAL_ENRICH_SKIP_PIPE_MARKER = 'pipe-1.7.3';

export type StructuralEnrichSkipFixtureScenario = {
  id: string;
  prompt: string;
  classifyAction: string;
  classifyConfidence: number;
  classifyParams?: Record<string, unknown>;
  employees?: Array<{ id: string; name: string }>;
  expectSkipStructuralEnrich: boolean;
  expectStatus: 'clarify' | 'resolved';
  expectFinalAction?: string;
  expectStructuralDetailContains?: string;
  expectNoStructuralHints?: boolean;
};

export const STRUCTURAL_ENRICH_SKIP_SCENARIOS: StructuralEnrichSkipFixtureScenario[] =
  [
    {
      id: 'uncorrectable-fail-clarify-skips-enrich',
      prompt: 'Block Gevorg schedule tomorrow',
      classifyAction: 'create_booking',
      classifyConfidence: 0.42,
      employees: [{ id: 'e1', name: 'Gevorg Gasparyan' }],
      expectSkipStructuralEnrich: true,
      expectStatus: 'clarify',
      expectFinalAction: 'create_booking',
      expectStructuralDetailContains: 'skipped; self_verify clarify',
      expectNoStructuralHints: true,
    },
    {
      id: 'fill-slots-uncorrectable-clarify-skips-enrich',
      prompt: 'Fill unused slots on Maria schedule Friday',
      classifyAction: 'create_booking',
      classifyConfidence: 0.38,
      employees: [{ id: 'e2', name: 'Maria Lopez' }],
      expectSkipStructuralEnrich: true,
      expectStatus: 'clarify',
      expectStructuralDetailContains: 'skipped; self_verify clarify',
      expectNoStructuralHints: true,
    },
    {
      id: 'correctable-fail-runs-structural-enrich',
      prompt: 'Clear Gevorg schedule for the next 5 days',
      classifyAction: 'create_booking',
      classifyConfidence: 0.42,
      employees: [{ id: 'e1', name: 'Gevorg Gasparyan' }],
      expectSkipStructuralEnrich: false,
      expectStatus: 'resolved',
      expectFinalAction: 'clear_schedule',
      expectStructuralDetailContains: 'dateRange',
    },
    {
      id: 'self-verify-pass-runs-structural-enrich',
      prompt: 'Clear Gevorg schedule for the next 5 days',
      classifyAction: 'clear_schedule',
      classifyConfidence: 0.9,
      employees: [{ id: 'e1', name: 'Gevorg Gasparyan' }],
      expectSkipStructuralEnrich: false,
      expectStatus: 'resolved',
      expectFinalAction: 'clear_schedule',
      expectStructuralDetailContains: 'dateRange',
    },
    {
      id: 'work-time-default-not-skipped-after-correction',
      prompt: 'Create work time for Gevorg next week',
      classifyAction: 'create_booking',
      classifyConfidence: 0.65,
      employees: [{ id: 'e1', name: 'Gevorg Gasparyan' }],
      expectSkipStructuralEnrich: false,
      expectStatus: 'resolved',
      expectFinalAction: 'create_direct_schedule',
      expectStructuralDetailContains: 'workTimeDefault',
    },
  ];
