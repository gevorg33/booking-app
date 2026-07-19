import { describe, expect, it } from '@jest/globals';
import {
  isClinicPreVisitIntakeIntent,
  isAssignPreVisitIntakeToBookingPrompt,
  rescueClinicPreVisitIntakeIntent,
} from './ai-clinic-pre-visit-intake.util.js';

describe('ai-clinic-pre-visit-intake.util (ai-cmd-dashboard-6.3.3)', () => {
  it('recognizes the intent', () => {
    expect(
      isClinicPreVisitIntakeIntent('assign_pre_visit_intake_to_booking'),
    ).toBe(true);
    expect(isClinicPreVisitIntakeIntent('cancel_bookings')).toBe(false);
  });

  it('detects assign-intake prompts', () => {
    expect(
      isAssignPreVisitIntakeToBookingPrompt(
        'Assign a pre-visit intake to booking b1',
      ),
    ).toBe(true);
    expect(
      isAssignPreVisitIntakeToBookingPrompt('Cancel all bookings today'),
    ).toBe(false);
  });

  describe('rescueClinicPreVisitIntakeIntent', () => {
    it('returns null when already the intent', () => {
      expect(
        rescueClinicPreVisitIntakeIntent(
          'anything',
          'assign_pre_visit_intake_to_booking',
        ),
      ).toBeNull();
    });

    it('rescues assign-intake phrasing', () => {
      expect(
        rescueClinicPreVisitIntakeIntent(
          'assign a pre-visit intake to this booking',
          'unknown',
        ),
      ).toEqual({
        action: 'assign_pre_visit_intake_to_booking',
        rescueReason: 'assign_intake',
      });
    });

    it('returns null for unrelated prompts', () => {
      expect(
        rescueClinicPreVisitIntakeIntent('cancel all bookings today', 'unknown'),
      ).toBeNull();
    });
  });
});
