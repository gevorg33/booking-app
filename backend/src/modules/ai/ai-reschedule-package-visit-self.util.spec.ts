import {
  CUSTOMER_RESCHEDULE_PACKAGE_VISIT_SELF_CLASSIFIER_RULES,
  RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS,
  RESCHEDULE_PACKAGE_VISIT_SELF_RESCUE_SCENARIOS,
  buildReschedulePackageVisitSelfAmbiguousSummary,
  buildReschedulePackageVisitSelfNavigate,
  enrichReschedulePackageVisitSelfParamsFromPrompt,
  isReschedulePackageVisitSelfIntent,
  isReschedulePackageVisitSelfPrompt,
  matchCustomerOwnedPackageVisit,
  parseReschedulePackageVisitSelfFromPrompt,
  rescueReschedulePackageVisitSelfIntent,
} from './ai-reschedule-package-visit-self.util.js';
import { extractPackageVisitIndexFromPrompt } from './ai-cancel-package-visit-self.util.js';
import { RESCHEDULE_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS } from './ai-reschedule-package-visit-self-multilingual.fixtures.js';
import { isRescheduleMyBookingPrompt } from './ai-self-service-booking.util.js';
import { isReschedulePackageVisitPrompt } from './ai-booking-depth.util.js';
import { AI_COMMAND_EVAL_RESCHEDULE_PACKAGE_VISIT_SELF_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-reschedule-package-visit-self.util (ai-cmd-customer-4.15.3)', () => {
  it('exports classifier rules for reschedule_package_visit_self', () => {
    expect(CUSTOMER_RESCHEDULE_PACKAGE_VISIT_SELF_CLASSIFIER_RULES).toContain(
      'reschedule_package_visit_self',
    );
    expect(CUSTOMER_RESCHEDULE_PACKAGE_VISIT_SELF_CLASSIFIER_RULES).toContain(
      'NOT reschedule_my_booking',
    );
  });

  it.each(RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS)(
    'detects reschedule_package_visit_self for $id',
    ({ prompt, packageName, visitIndex }) => {
      expect(isReschedulePackageVisitSelfPrompt(prompt)).toBe(true);
      const parsed = parseReschedulePackageVisitSelfFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (packageName) expect(parsed?.packageName).toBe(packageName);
      if (visitIndex != null) expect(parsed?.visitIndex).toBe(visitIndex);
    },
  );

  it.each(RESCHEDULE_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS)(
    'detects multilingual reschedule_package_visit_self for $id',
    ({ prompt }) => {
      expect(isReschedulePackageVisitSelfPrompt(prompt)).toBe(true);
    },
  );

  it.each(RESCHEDULE_PACKAGE_VISIT_SELF_RESCUE_SCENARIOS)(
    'rescues misclassified action for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueReschedulePackageVisitSelfIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe(expectedAction);
    },
  );

  it('does not steal single-booking reschedule or staff dashboard prompts', () => {
    expect(isRescheduleMyBookingPrompt('Reschedule my appointment')).toBe(true);
    expect(
      isReschedulePackageVisitSelfPrompt('Reschedule my appointment'),
    ).toBe(false);
    expect(
      isReschedulePackageVisitPrompt('Reschedule package visit to Friday'),
    ).toBe(true);
    expect(
      isReschedulePackageVisitSelfPrompt('Reschedule package visit to Friday'),
    ).toBe(false);
    expect(
      rescueReschedulePackageVisitSelfIntent(
        'Reschedule package visit to Friday',
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
      enrichReschedulePackageVisitSelfParamsFromPrompt(
        {},
        'Reschedule visit 2 of my package',
      ).visitIndex,
    ).toBe(2);
    expect(
      extractPackageVisitIndexFromPrompt('Reschedule visit 2 of my package'),
    ).toBe(2);
    expect(buildReschedulePackageVisitSelfAmbiguousSummary(bookings)).toContain(
      'several upcoming package visits',
    );
    expect(buildReschedulePackageVisitSelfNavigate('b1')).toEqual({
      path: '/account',
      query: { tab: 'bookings', reschedulePackage: 'b1' },
    });
  });

  it('recognizes intent and eval cases', () => {
    expect(
      isReschedulePackageVisitSelfIntent('reschedule_package_visit_self'),
    ).toBe(true);
    expect(isReschedulePackageVisitSelfIntent('reschedule_my_booking')).toBe(
      false,
    );
    expect(AI_COMMAND_EVAL_RESCHEDULE_PACKAGE_VISIT_SELF_CASES.length).toBe(
      RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS.length +
        RESCHEDULE_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_RESCHEDULE_PACKAGE_VISIT_SELF_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
