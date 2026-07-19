import {
  decomposeGuestManageVisitCompoundPrompt,
  isGuestManageVisitCompoundPrompt,
  rescueGuestManageVisitCompoundIntent,
} from './ai-guest-manage-visit-compound.util.js';

describe('ai-guest-manage-visit-compound.util', () => {
  describe('isGuestManageVisitCompoundPrompt', () => {
    it('matches a guest cancel prompt with contact info', () => {
      expect(
        isGuestManageVisitCompoundPrompt(
          'Cancel my haircut, my email is john@example.com',
        ),
      ).toBe(true);
    });

    it('matches a guest reschedule prompt with contact info', () => {
      expect(
        isGuestManageVisitCompoundPrompt(
          'Move my appointment to Friday 2pm, my email is jane@example.com',
        ),
      ).toBe(true);
    });

    it('does not match without guest contact info', () => {
      expect(isGuestManageVisitCompoundPrompt('Cancel my haircut')).toBe(false);
    });

    it('does not match a policy question', () => {
      expect(
        isGuestManageVisitCompoundPrompt(
          'What is your cancel policy? My email is john@example.com',
        ),
      ).toBe(false);
    });

    it('does not match when a session customer id is present', () => {
      expect(
        isGuestManageVisitCompoundPrompt(
          'Cancel my haircut, my email is john@example.com',
          { sessionCustomerId: 'cust-1' },
        ),
      ).toBe(false);
    });

    it('e2e-bug.103 does not match when manage-link credentials are already present', () => {
      expect(
        isGuestManageVisitCompoundPrompt(
          'Cancel my package visit https://example.com/manage?bookingId=b1&token=t1',
        ),
      ).toBe(false);
    });
  });

  describe('decomposeGuestManageVisitCompoundPrompt', () => {
    it('decomposes a cancel prompt into get_manage_link + cancel_booking_with_token', () => {
      const steps = decomposeGuestManageVisitCompoundPrompt(
        'Cancel my haircut, my email is john@example.com',
      );
      expect(steps.map((s) => s.action)).toEqual([
        'get_manage_link',
        'cancel_booking_with_token',
      ]);
      expect(steps[0].params).toMatchObject({
        guestLookup: true,
        email: 'john@example.com',
      });
    });

    it('decomposes a reschedule prompt into get_manage_link + reschedule_booking_with_token', () => {
      const steps = decomposeGuestManageVisitCompoundPrompt(
        'Move my appointment to Friday 2pm, my email is jane@example.com',
      );
      expect(steps.map((s) => s.action)).toEqual([
        'get_manage_link',
        'reschedule_booking_with_token',
      ]);
      expect(steps[1].params).toMatchObject({ timeSlot: '14:00' });
    });

    it('returns no steps for a non-matching prompt', () => {
      expect(decomposeGuestManageVisitCompoundPrompt('Cancel my haircut')).toEqual(
        [],
      );
    });
  });

  describe('rescueGuestManageVisitCompoundIntent', () => {
    it('rescues to compound_intent when the prompt matches', () => {
      const rescued = rescueGuestManageVisitCompoundIntent(
        'Cancel my haircut, my email is john@example.com',
        'unknown',
      );
      expect(rescued?.action).toBe('compound_intent');
    });

    it('returns null when already compound_intent', () => {
      expect(
        rescueGuestManageVisitCompoundIntent(
          'Cancel my haircut, my email is john@example.com',
          'compound_intent',
        ),
      ).toBeNull();
    });

    it('returns null for a non-matching prompt', () => {
      expect(
        rescueGuestManageVisitCompoundIntent('Cancel my haircut', 'unknown'),
      ).toBeNull();
    });
  });
});
