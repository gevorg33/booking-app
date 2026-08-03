/**
 * e2e-bug.344 — `isConfirmMyBookingDetailsPrompt`'s `BOOKING_CONTEXT` regex
 * let bare "this" pair with a service-type noun (massage/haircut/facial/
 * service) across an intervening temporal-window phrase ("this evening ...
 * for Swedish massage"), hijacking any "is X ... this <period> for <service>"
 * availability question before `check_providers_for_service` ever got a
 * chance. "this" is now restricted to the actual booking-container nouns
 * (booking/appointment/visit/reservation).
 */

export type E2e344ThisPeriodCase = {
  id: string;
  prompt: string;
  expectConfirmMyBookingDetails: boolean;
  expectCheckProvidersForService: boolean;
};

export const E2E344_THIS_PERIOD_CASES: readonly E2e344ThisPeriodCase[] = [
  {
    id: 'e344-exact-reported-repro-someone-this-evening',
    prompt: 'is someone free this evening for Swedish massage',
    expectConfirmMyBookingDetails: false,
    expectCheckProvidersForService: true,
  },
  {
    id: 'e344-exact-reported-repro-everyone-this-week',
    prompt: 'is everyone available this week for a haircut',
    expectConfirmMyBookingDetails: false,
    expectCheckProvidersForService: true,
  },
  {
    id: 'e344-anybody-this-afternoon',
    prompt: 'is anybody free this afternoon for a facial',
    expectConfirmMyBookingDetails: false,
    expectCheckProvidersForService: true,
  },
  {
    id: 'e344-named-provider-this-morning',
    prompt: 'is Karo free this morning for a massage',
    expectConfirmMyBookingDetails: false,
    expectCheckProvidersForService: false,
  },
] as const;

/** Controls — legitimate "this booking/appointment" phrasing must be unaffected. */
export const E2E344_LEGIT_THIS_BOOKING_CONTROL_CASES: readonly E2e344ThisPeriodCase[] =
  [
    {
      id: 'e344-legit-tell-me-about-this-booking',
      prompt: 'Tell me about this booking',
      expectConfirmMyBookingDetails: true,
      expectCheckProvidersForService: false,
    },
    {
      id: 'e344-legit-details-for-this-appointment',
      prompt: 'Details for this appointment',
      expectConfirmMyBookingDetails: true,
      expectCheckProvidersForService: false,
    },
    {
      id: 'e344-legit-this-evenings-appointment',
      prompt: "What's happening with this evening's appointment?",
      expectConfirmMyBookingDetails: true,
      expectCheckProvidersForService: false,
    },
  ] as const;
