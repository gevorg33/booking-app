import type { ClassificationSurface } from './ai-classification-engine.types.js';

/** acc-3.5 — router vs classify disagreement scenarios for tie-breaker tests. */
export const ESCALATION_CONSENSUS_SCENARIOS: ReadonlyArray<{
  id: string;
  prompt: string;
  surface: ClassificationSurface;
  routeTier: 'read_only' | 'simple_mutate' | 'compound' | 'orchestration';
  llmAction: string;
  expectEscalation: boolean;
}> = [
  {
    id: 'dash-read-vs-book',
    prompt: 'Who is free tomorrow evening for permanent lashes',
    surface: 'dashboard',
    routeTier: 'read_only',
    llmAction: 'create_booking',
    expectEscalation: true,
  },
  {
    id: 'dash-analytics-vs-book',
    prompt: 'How many appointments did we have today',
    surface: 'dashboard',
    routeTier: 'read_only',
    llmAction: 'create_booking',
    expectEscalation: true,
  },
  {
    id: 'dash-book-aligned',
    prompt: 'Book massage with Gevorg tomorrow at 10:00',
    surface: 'dashboard',
    routeTier: 'simple_mutate',
    llmAction: 'create_booking',
    expectEscalation: false,
  },
  {
    id: 'dash-read-check-providers-ok',
    prompt: 'Who is free tomorrow evening for permanent lashes',
    surface: 'dashboard',
    routeTier: 'read_only',
    llmAction: 'check_providers_for_service',
    expectEscalation: false,
  },
];

export const ESCALATION_TIEBREAKER_RULES = `- Tie-breaker (acc-3.5): resolve router vs classifier disagreement.
- When the deterministic router says read_only, prefer check_providers_for_service / check_availability / list_bookings / summarize_bookings unless the user explicitly asks to book/cancel/reschedule/configure.
- Never choose a mutating action for a pure availability or analytics question.
- Preserve params from the stronger side when they match the user message; fill missing date/service/provider from the prompt.`;
