import {
  E2E332_CONFLICT_CASES,
  E2E332_SLASH_DATE_RE,
} from './ai-e2e332-create-booking-conflict-slash-date.fixtures.js';
import { BookingSlotResolverService } from '../booking/booking-slot-resolver.service.js';
import { formatDateForAiLabel } from './ai-date-label.util.js';
import type { SlotAvailabilityCheck } from '../booking/booking-slot-resolver.types.js';

describe('e2e-bug.332: create_booking conflict summary avoids DD/MM slash', () => {
  // describeUnavailable is pure w.r.t. `this` (no repo access), so a bare
  // instance is sufficient — mirrors AiBookingCoreService's real call shape:
  // this.slotResolver.describeUnavailable(availability, name, timeSlot, formatDateForAiLabel(isoDay)).
  const resolver = new BookingSlotResolverService(
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
  );

  it.each(E2E332_CONFLICT_CASES)(
    '$id',
    ({
      dateKey,
      serviceName,
      employeeName,
      timeSlot,
      reason,
      expectContains,
      forbidSlash,
    }) => {
      const check: SlotAvailabilityCheck = {
        employeeId: 'e1',
        employeeName,
        available: false,
        hasSchedule: reason !== 'no_schedule',
        openSlots: [],
        reason,
      };
      const message = resolver.describeUnavailable(
        check,
        serviceName,
        timeSlot,
        formatDateForAiLabel(dateKey),
      );
      expect(message).toContain(expectContains);
      expect(message).not.toContain(forbidSlash);
      expect(message).not.toMatch(E2E332_SLASH_DATE_RE);
    },
  );

  it('reproduces the exact reported ticket string shape', () => {
    const check: SlotAvailabilityCheck = {
      employeeId: 'e1',
      employeeName: 'Gevorg Gasparyan',
      available: false,
      hasSchedule: true,
      openSlots: [],
      reason: 'slot_unavailable',
    };
    const message = resolver.describeUnavailable(
      check,
      'Deep tissue massage',
      '13:10',
      formatDateForAiLabel('2026-08-01'),
    );
    expect(message).toBe(
      'Gevorg Gasparyan is not free at 13:10 on 1 August 2026 for Deep tissue massage.',
    );
  });
});
