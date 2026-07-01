import {
  CANCEL_PACKAGE_VISIT_SELF_PROMPTS,
  CANCEL_PACKAGE_VISIT_SELF_RESCUE_SCENARIOS,
  CUSTOMER_CANCEL_PACKAGE_VISIT_SELF_CLASSIFIER_RULES,
  buildCancelPackageVisitSelfAmbiguousSummary,
  buildCancelPackageVisitSelfNavigate,
  enrichCancelPackageVisitSelfParamsFromPrompt,
  extractPackageVisitIndexFromPrompt,
  isCancelPackageVisitSelfIntent,
  isCancelPackageVisitSelfPrompt,
  matchCustomerOwnedPackageVisit,
  parseCancelPackageVisitSelfFromPrompt,
  rescueCancelPackageVisitSelfIntent,
} from './ai-cancel-package-visit-self.util.js';
import { CANCEL_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS } from './ai-cancel-package-visit-self-multilingual.fixtures.js';
import { isCancelMyBookingPrompt } from './ai-self-service-booking.util.js';
import { isCancelPackageVisitPrompt } from './ai-booking-depth.util.js';
import { AI_COMMAND_EVAL_CANCEL_PACKAGE_VISIT_SELF_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-cancel-package-visit-self.util (ai-cmd-customer-4.15.2)', () => {
  it('exports classifier rules for cancel_package_visit_self', () => {
    expect(CUSTOMER_CANCEL_PACKAGE_VISIT_SELF_CLASSIFIER_RULES).toContain(
      'cancel_package_visit_self',
    );
    expect(CUSTOMER_CANCEL_PACKAGE_VISIT_SELF_CLASSIFIER_RULES).toContain(
      'NOT cancel_my_booking',
    );
  });

  it.each(CANCEL_PACKAGE_VISIT_SELF_PROMPTS)(
    'detects cancel_package_visit_self for $id',
    ({ prompt, packageName, visitIndex }) => {
      expect(isCancelPackageVisitSelfPrompt(prompt)).toBe(true);
      const parsed = parseCancelPackageVisitSelfFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (packageName) expect(parsed?.packageName).toBe(packageName);
      if (visitIndex != null) expect(parsed?.visitIndex).toBe(visitIndex);
    },
  );

  it.each(CANCEL_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS)(
    'detects multilingual cancel_package_visit_self for $id',
    ({ prompt }) => {
      expect(isCancelPackageVisitSelfPrompt(prompt)).toBe(true);
    },
  );

  it.each(CANCEL_PACKAGE_VISIT_SELF_RESCUE_SCENARIOS)(
    'rescues misclassified action for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueCancelPackageVisitSelfIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('does not steal single-booking cancel or staff dashboard prompts', () => {
    expect(isCancelMyBookingPrompt('Cancel my booking')).toBe(true);
    expect(isCancelPackageVisitSelfPrompt('Cancel my booking')).toBe(false);
    expect(isCancelPackageVisitPrompt('Cancel package visit for Anna')).toBe(
      true,
    );
    expect(
      isCancelPackageVisitSelfPrompt('Cancel package visit for Anna'),
    ).toBe(false);
    expect(
      rescueCancelPackageVisitSelfIntent(
        'Cancel package visit for Anna',
        'unknown',
      ),
    ).toBeNull();
  });

  it('matches package visits by index and builds summaries', () => {
    const bookings = [
      {
        id: 'b1',
        status: 'confirmed',
        startTime: '2026-07-01T10:00:00Z',
        packagePurchaseId: 'p1',
        packageName: 'Spa Day',
        serviceName: 'Massage',
      },
      {
        id: 'b2',
        status: 'confirmed',
        startTime: '2026-07-08T10:00:00Z',
        packagePurchaseId: 'p1',
        packageName: 'Spa Day',
        serviceName: 'Facial',
      },
    ];
    expect(
      matchCustomerOwnedPackageVisit(bookings, { visitIndex: 2 }).booking?.id,
    ).toBe('b2');
    expect(
      matchCustomerOwnedPackageVisit(bookings, { bookingId: 'b1' }).booking?.id,
    ).toBe('b1');
    expect(
      matchCustomerOwnedPackageVisit(bookings, { packageName: 'Spa Day' })
        .ambiguous.length,
    ).toBe(2);
    expect(
      enrichCancelPackageVisitSelfParamsFromPrompt(
        {},
        'Cancel visit 2 of my package',
      ).visitIndex,
    ).toBe(2);
    expect(
      extractPackageVisitIndexFromPrompt('Cancel visit 2 of my package'),
    ).toBe(2);
    expect(buildCancelPackageVisitSelfAmbiguousSummary(bookings)).toContain(
      'several upcoming package visits',
    );
    expect(buildCancelPackageVisitSelfNavigate('b1')).toEqual({
      path: '/account',
      query: { tab: 'bookings', cancelPackageVisit: 'b1' },
    });
  });

  it('recognizes intent and eval cases', () => {
    expect(isCancelPackageVisitSelfIntent('cancel_package_visit_self')).toBe(
      true,
    );
    expect(isCancelPackageVisitSelfIntent('cancel_my_booking')).toBe(false);
    expect(AI_COMMAND_EVAL_CANCEL_PACKAGE_VISIT_SELF_CASES.length).toBe(
      CANCEL_PACKAGE_VISIT_SELF_PROMPTS.length +
        CANCEL_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_CANCEL_PACKAGE_VISIT_SELF_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
