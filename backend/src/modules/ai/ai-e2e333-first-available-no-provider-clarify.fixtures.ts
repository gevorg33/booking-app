/**
 * e2e-bug.333 — short "Create a booking for the first available…" without
 * "any provider" and without a named provider must never fall through to a
 * misleading fixed-time conflict message. `pickCreateBookingFirstAvailable`
 * (ai-booking-core.service.ts) now validates search targets up front:
 * neither a resolved employee nor `allProviders` → a clear clarification
 * ("Specify a provider or say \"any provider\"…"), never a fabricated
 * wall-clock slot check. `allProviders=true` with zero active providers gets
 * its own distinct message ("No active providers found…").
 */

export type E2e333PromptHintCase = {
  id: string;
  prompt: string;
  expectFirstAvailable: boolean;
  expectAllProviders: boolean;
};

/** enrichBookingTimeHintsFromPrompt must set bookingFirstAvailable without
 * ever guessing allProviders=true unless the prompt actually says so. */
export const E2E333_PROMPT_HINT_CASES: readonly E2e333PromptHintCase[] = [
  {
    id: 'bare-first-available-no-provider-cue',
    prompt: 'Create a booking for the first available massage slot',
    expectFirstAvailable: true,
    expectAllProviders: false,
  },
  {
    id: 'first-available-with-any-provider-cue',
    prompt:
      'Create a booking for the first available massage slot on Monday for any provider',
    expectFirstAvailable: true,
    expectAllProviders: true,
  },
  {
    id: 'first-available-named-provider-no-any-cue',
    prompt:
      'Create a booking for the first available massage slot with Gevorg Gasparyan',
    expectFirstAvailable: true,
    expectAllProviders: false,
  },
  {
    id: 'soonest-synonym-no-provider-cue',
    prompt: 'Book the soonest Deep tissue massage',
    expectFirstAvailable: true,
    expectAllProviders: false,
  },
] as const;
