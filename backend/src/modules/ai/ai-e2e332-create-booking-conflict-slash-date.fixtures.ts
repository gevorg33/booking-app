/**
 * e2e-bug.332 — create_booking's provider-not-free / conflict summary
 * (BookingSlotResolverService.describeUnavailable, invoked from
 * AiBookingCoreService's executeCreateBooking availability check) must use
 * formatDateForAiLabel ("2 August 2026"), never DD/MM slash ("02/08/2026")
 * — sibling of Fixed e2e-bug.306 (no-slot messages) / e2e-bug.285 (plan date).
 */

export type E2e332ConflictCase = {
  id: string;
  dateKey: string;
  serviceName: string;
  employeeName: string;
  timeSlot: string;
  reason:
    | 'no_schedule'
    | 'service_not_scheduled'
    | 'slot_unavailable'
    | 'past_time';
  expectContains: string;
  forbidSlash: string;
};

export const E2E332_CONFLICT_CASES: readonly E2e332ConflictCase[] = [
  {
    id: 'ai-e2e332-slot-unavailable-aug-1',
    dateKey: '2026-08-01',
    serviceName: 'Deep tissue massage',
    employeeName: 'Gevorg Gasparyan',
    timeSlot: '13:10',
    reason: 'slot_unavailable',
    expectContains: '1 August 2026',
    forbidSlash: '01/08/2026',
  },
  {
    id: 'ai-e2e332-slot-unavailable-aug-3',
    dateKey: '2026-08-03',
    serviceName: 'Swedish massage',
    employeeName: 'Karo',
    timeSlot: '09:30',
    reason: 'slot_unavailable',
    expectContains: '3 August 2026',
    forbidSlash: '03/08/2026',
  },
  {
    id: 'ai-e2e332-no-schedule-jun-7',
    dateKey: '2026-06-07',
    serviceName: 'Permanent lashes',
    employeeName: 'Anahit',
    timeSlot: '10:00',
    reason: 'no_schedule',
    expectContains: '7 June 2026',
    forbidSlash: '07/06/2026',
  },
  {
    id: 'ai-e2e332-service-not-scheduled-dec-25',
    dateKey: '2026-12-25',
    serviceName: 'Haircut',
    employeeName: 'Mari',
    timeSlot: '11:00',
    reason: 'service_not_scheduled',
    expectContains: '25 December 2026',
    forbidSlash: '25/12/2026',
  },
] as const;

/** Slash DD/MM must never appear in AI conflict summaries. */
export const E2E332_SLASH_DATE_RE = /\b\d{2}\/\d{2}\/\d{4}\b/;
