import {
  DASHBOARD_STAFF_SCOPE_SCENARIOS,
  PROVIDER_STAFF_SCOPE_SCENARIOS,
} from './ai-provider-staff-scope.fixtures.js';
import {
  assertStaffScopedIntentRegistered,
  extractNotesFromPrompt,
  isAssignedBookingsPrompt,
  isBreakBlockPrompt,
  isCheckInPrompt,
  isOwnSchedulePrompt,
  isUpdateBookingNotesPrompt,
  mergeCheckInParams,
  mergeNotesParams,
  rescueStaffScopeIntent,
  STAFF_SCOPE_INTENT_IDS,
} from './ai-provider-staff-scope.util.js';

describe('ai-provider-staff-scope.util (parity-2.2)', () => {
  it('registers all staff scope intents in STAFF_SCOPED_INTENTS', () => {
    for (const intentId of STAFF_SCOPE_INTENT_IDS) {
      expect(assertStaffScopedIntentRegistered(intentId)).toBe(true);
    }
    expect(STAFF_SCOPE_INTENT_IDS).toContain('update_bookings');
    expect(STAFF_SCOPE_INTENT_IDS).toContain('mark_paid');
  });

  it.each(PROVIDER_STAFF_SCOPE_SCENARIOS)(
    'provider scenario $id detection',
    ({ prompt, expectedAction }) => {
      if (expectedAction === 'update_bookings') {
        expect(
          isCheckInPrompt(prompt) || isUpdateBookingNotesPrompt(prompt),
        ).toBe(true);
      } else if (expectedAction === 'show_appointments') {
        expect(
          isOwnSchedulePrompt(prompt) || /who'?s\s+next/i.test(prompt),
        ).toBe(true);
      } else if (expectedAction === 'list_bookings') {
        expect(isAssignedBookingsPrompt(prompt)).toBe(true);
      } else if (expectedAction === 'block_schedule') {
        expect(isBreakBlockPrompt(prompt)).toBe(true);
      }
    },
  );

  it.each([...PROVIDER_STAFF_SCOPE_SCENARIOS, ...DASHBOARD_STAFF_SCOPE_SCENARIOS])(
    'rescues scenario $id',
    ({ prompt, expectedAction }) => {
      const rescued = rescueStaffScopeIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
    },
  );

  it('merges check-in and notes params', () => {
    expect(mergeCheckInParams({})).toEqual({ status: 'in_progress' });
    expect(
      mergeNotesParams('Add note: prefers window seat', {}).notes,
    ).toBe('prefers window seat');
    expect(extractNotesFromPrompt('Save notes on this booking: allergic')).toBe(
      'allergic',
    );
  });
});
