import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  E2E102_PHONE_FALSE_POSITIVE_PROMPTS,
  E2E103_PACKAGE_VISIT_WITH_TOKEN_SCENARIOS,
} from './ai-e2e103-package-visit-with-token.fixtures.js';
import { isPackageBookingPrompt } from './ai-booking-depth.util.js';
import { extractGuestContactFromPrompt } from './ai-get-manage-link.util.js';
import { isGuestManageVisitCompoundPrompt } from './ai-guest-manage-visit-compound.util.js';
import { isCancelPackageVisitSelfPrompt } from './ai-cancel-package-visit-self.util.js';
import { isReschedulePackageVisitSelfPrompt } from './ai-reschedule-package-visit-self.util.js';
import { rescueManageBookingWithTokenIntent } from './ai-manage-booking-with-token.util.js';

describe('e2e-bug.103 package visit with_token NL routing', () => {
  const rescue = new AiIntentRescueService();

  it.each(
    E2E103_PACKAGE_VISIT_WITH_TOKEN_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues %s to guest with_token action', (_id, row) => {
    const session =
      'session' in row && row.session
        ? row.session
        : {
            bookingId: row.bookingId,
            manageToken: row.manageToken,
          };
    expect(
      rescueManageBookingWithTokenIntent(
        row.prompt,
        row.misclassifiedAction,
        session,
      )?.action,
    ).toBe(row.expectedAction);

    const result = rescue.rescue({
      prompt: row.prompt,
      action: row.misclassifiedAction,
      params: { ...session },
      surface: 'public',
    });
    expect(result?.action).toBe(row.expectedAction);
    expect(result?.params?.bookingId).toBeTruthy();
    expect(result?.params?.manageToken).toBeTruthy();
  });

  it.each(E2E102_PHONE_FALSE_POSITIVE_PROMPTS.map((row) => [row.id, row]))(
    'e2e-bug.102 does not extract phone from UUID noise (%s)',
    (_id, row) => {
      expect(extractGuestContactFromPrompt(row.prompt).phone).toBeUndefined();
      expect(isGuestManageVisitCompoundPrompt(row.prompt)).toBe(false);
    },
  );

  it('still extracts real phones with contact cues', () => {
    expect(
      extractGuestContactFromPrompt(
        'Text me the booking manage link at 5551234567',
      ),
    ).toEqual({ phone: '5551234567' });
  });

  it('manage-link package prompts do not match signed-in self detectors', () => {
    const cancelUrl =
      'Cancel my package visit https://x/manage?bookingId=b1&token=t1';
    const rescheduleUrl =
      'Reschedule my package visit to Monday https://x/manage?bookingId=b1&token=t1';
    expect(isCancelPackageVisitSelfPrompt(cancelUrl)).toBe(false);
    expect(isReschedulePackageVisitSelfPrompt(rescheduleUrl)).toBe(false);
    expect(isPackageBookingPrompt(cancelUrl)).toBe(false);
    expect(isPackageBookingPrompt(rescheduleUrl)).toBe(false);
    expect(isGuestManageVisitCompoundPrompt(cancelUrl)).toBe(false);
  });

  it('cancel/reschedule package phrasing is not staff create_package_booking', () => {
    expect(isPackageBookingPrompt('Cancel my package visit')).toBe(false);
    expect(isPackageBookingPrompt('Reschedule my spa day to Monday')).toBe(
      false,
    );
    expect(isPackageBookingPrompt('Book spa day for James')).toBe(true);
  });
});
