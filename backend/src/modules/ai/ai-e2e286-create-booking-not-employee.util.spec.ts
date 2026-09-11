import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { isFirstAvailableBookingPrompt } from './booking-first-available.semantic.util.js';
import {
  isCreateBookingNotEmployeePrompt,
  isCreateEmployeePrompt,
  rescueStaffOperationsIntent,
} from './ai-staff-operations.util.js';
import {
  E2E286_CREATE_BOOKING_NOT_EMPLOYEE_CASES,
  E2E286_CREATE_EMPLOYEE_CONTROLS,
  E2E286_RESCUE_FROM_CREATE_EMPLOYEE,
} from './ai-e2e286-create-booking-not-employee.fixtures.js';

describe('e2e-bug.286 create booking not stolen by create_employee', () => {
  it.each(
    E2E286_CREATE_BOOKING_NOT_EMPLOYEE_CASES.map(
      (row) => [row.id, row] as const,
    ),
  )('%s — detectors', (_id, row) => {
    expect(isCreateEmployeePrompt(row.prompt)).toBe(false);
    expect(isCreateBookingNotEmployeePrompt(row.prompt)).toBe(
      row.expectCreateBookingCue,
    );
    expect(rescueStaffOperationsIntent(row.prompt, 'unknown')).toBeNull();
    expect(
      rescueStaffOperationsIntent(row.prompt, 'create_booking'),
    ).toBeNull();
    if (row.expectFirstAvailable) {
      expect(isFirstAvailableBookingPrompt(row.prompt)).toBe(true);
    }
  });

  it.each(E2E286_CREATE_EMPLOYEE_CONTROLS.map((row) => [row.id, row] as const))(
    '%s — hire-staff still matches',
    (_id, row) => {
      expect(isCreateEmployeePrompt(row.prompt)).toBe(true);
      expect(isCreateBookingNotEmployeePrompt(row.prompt)).toBe(false);
      expect(rescueStaffOperationsIntent(row.prompt, 'unknown')?.action).toBe(
        'create_employee',
      );
    },
  );

  describe('rescue remaps create_employee → create_booking', () => {
    const rescue = new AiIntentRescueService();

    it.each(
      E2E286_RESCUE_FROM_CREATE_EMPLOYEE.map((row) => [row.id, row] as const),
    )('%s', (_id, row) => {
      const result = rescue.rescue({
        prompt: row.prompt,
        action: row.fromAction,
        params: {},
        surface: 'dashboard',
      });
      // `rescue` returns null when it declines, which is the failure this suite
      // exists to catch. Asserted explicitly rather than reached through `?.`,
      // because `expect(result?.action).not.toBe(…)` passes on null.
      expect(result).not.toBeNull();
      expect(result!.action).toBe(row.expectedAction);
      if (row.expectBookingFirstAvailable) {
        expect(result!.params?.bookingFirstAvailable).toBe(true);
      }
      if (row.expectAllProviders) {
        expect(result!.params?.allProviders).toBe(true);
      }
      expect(result!.action).not.toBe('create_employee');
    });
  });

  it('documents scenario ids', () => {
    expect(E2E286_CREATE_BOOKING_NOT_EMPLOYEE_CASES.map((c) => c.id)).toEqual([
      'ai-e2e286-canonical-create-booking-first-available',
      'ai-e2e286-create-a-booking-first-available-short',
      'ai-e2e286-create-booking-soonest-any-provider',
      'ai-e2e286-create-an-appointment-first-available',
      'ai-e2e286-schedule-a-booking-nearest-slot',
      'ai-e2e286-make-a-booking-first-available',
      'ai-e2e286-book-first-available-still-ok',
    ]);
  });
});
