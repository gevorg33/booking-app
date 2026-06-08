import type { ClassificationSurface } from './ai-classification-engine.types.js';

/** acc-6.5 — offer human handoff after this many clarify rounds on the same task. */
export const ESCALATION_HANDOFF_CLARIFY_ROUNDS = 2;

export interface EscalationHandoffScenario {
  id: string;
  surface: ClassificationSurface;
  clarifyRound: number;
  action: string;
  expectHandoff: boolean;
}

export const ESCALATION_HANDOFF_SCENARIOS: EscalationHandoffScenario[] = [
  {
    id: 'dash-first-clarify-no-handoff',
    surface: 'dashboard',
    clarifyRound: 0,
    action: 'unknown',
    expectHandoff: false,
  },
  {
    id: 'dash-after-one-clarify-no-handoff',
    surface: 'dashboard',
    clarifyRound: 1,
    action: 'unknown',
    expectHandoff: false,
  },
  {
    id: 'dash-after-two-clarifies-handoff',
    surface: 'dashboard',
    clarifyRound: 2,
    action: 'cancel_bookings',
    expectHandoff: true,
  },
  {
    id: 'customer-handoff',
    surface: 'customer',
    clarifyRound: 2,
    action: 'unknown',
    expectHandoff: true,
  },
  {
    id: 'provider-handoff',
    surface: 'provider',
    clarifyRound: 2,
    action: 'unknown',
    expectHandoff: true,
  },
];
