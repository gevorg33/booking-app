/**
 * e2e-bug.104 — tour_group_checkout / diagnose_tour_capacity crashed with
 * `column booking.start_time does not exist` when BookingService.findAll
 * received a startDate+endDate range (same-day departure key).
 *
 * Root fix lives in booking.service.ts (startTime camelCase). These scenarios
 * document the tour call shape that hit the bug.
 */
export const E2E104_TOUR_FINDALL_RANGE_SCENARIOS = [
  {
    id: 'e2e-bug-104-city-tour-group-checkout-date',
    prompt: 'City tour for 8 on 15/08/2026 — book only if enough spots',
    dateKey: '2026-08-15',
  },
  {
    id: 'e2e-bug-104-same-day-capacity-lookup',
    prompt: 'Why did checkout reject 4 people for the mountain trek on 20/08/2026?',
    dateKey: '2026-08-20',
  },
] as const;
