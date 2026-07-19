import { describe, expect, it } from 'vitest';
import {
  GUIDED_BOOKING_SCENARIOS,
  NEAREST_SLOT_SCENARIOS,
  SLOT_PRESELECTION_SCENARIOS,
} from './guided-booking-flow.fixtures.js';
import {
  guidedBookingProgress,
  guidedBookingStepLabel,
  pickEarliestSlot,
  resolveGuidedBookingStep,
  resolveNearestSlotSelection,
  resolveSlotPreselection,
  shouldAttemptNearestSlot,
} from './guided-booking-flow.util.js';

describe('guided-booking-flow.util', () => {
  it.each(GUIDED_BOOKING_SCENARIOS)(
    'resolveGuidedBookingStep $id',
    ({ pathname, step, progress, slotSelected }) => {
      expect(resolveGuidedBookingStep(pathname, { slotSelected })).toBe(step);
      expect(guidedBookingProgress(step)).toBe(progress);
    },
  );

  it.each(SLOT_PRESELECTION_SCENARIOS)(
    'resolveSlotPreselection $id',
    ({ nearest, slots, currentDate, expected }) => {
      expect(resolveSlotPreselection({ nearest, slots, currentDate })).toEqual(expected);
    },
  );

  it('shouldAttemptNearestSlot skips when slot exists or fetch already ran', () => {
    expect(shouldAttemptNearestSlot({ nearestAttempted: false, slot: '' })).toBe(true);
    expect(shouldAttemptNearestSlot({ nearestAttempted: true, slot: '' })).toBe(false);
    expect(shouldAttemptNearestSlot({ nearestAttempted: false, slot: '2026-06-10T09:00:00.000Z' })).toBe(
      false,
    );
  });

  it.each(NEAREST_SLOT_SCENARIOS)('pickEarliestSlot $id', ({ slots, expected }) => {
    expect(pickEarliestSlot(slots)).toBe(expected);
  });

  it('maps nearest slot API payload', () => {
    expect(
      resolveNearestSlotSelection({
        dateKey: '2026-06-10',
        startTime: '2026-06-10T09:00:00.000Z',
        employeeId: 'emp-1',
      }),
    ).toEqual({
      date: '2026-06-10',
      slot: '2026-06-10T09:00:00.000Z',
      employeeId: 'emp-1',
    });
  });

  it('labels guided booking steps and handles unknown paths', () => {
    expect(
      guidedBookingStepLabel('slot', {
        guidedStepWelcome: 'Home',
        guidedStepSalon: 'Salon',
        guidedStepService: 'Service',
        guidedStepSlot: 'Time',
        guidedStepConfirm: 'Confirm',
      }),
    ).toBe('Time');
    expect(resolveGuidedBookingStep('/s/salon/unknown')).toBe('salon');
  });
});
