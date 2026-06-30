import {
  CANCEL_PACKAGE_VISIT_SELF_PROMPTS,
  CUSTOMER_PACKAGE_VISIT_SELF_CLASSIFIER_RULES,
  PACKAGE_VISIT_SELF_CUSTOMER_PROMPTS,
  RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS,
  detectPackageVisitSelfCustomerAction,
  enrichPackageVisitSelfParamsFromPrompt,
  extractPackageVisitIndexFromPrompt,
  rescuePackageVisitSelfCustomerIntent,
} from './ai-package-visit-self-customer.util.js';
import {
  isCancelPackageVisitSelfPrompt,
  isReschedulePackageVisitSelfPrompt,
  isCancelMyBookingPrompt,
  isRescheduleMyBookingPrompt,
  rescueSelfServiceBookingIntent,
} from './ai-self-service-booking.util.js';
import { isCancelPackageVisitPrompt } from './ai-booking-depth.util.js';
import { AI_COMMAND_EVAL_PACKAGE_VISIT_SELF_CUSTOMER_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-package-visit-self-customer.util (ai-cmd-customer-4.0 P2)', () => {
  it('exports classifier rules for package visit cancel and reschedule', () => {
    expect(CUSTOMER_PACKAGE_VISIT_SELF_CLASSIFIER_RULES).toContain(
      'cancel_package_visit_self',
    );
    expect(CUSTOMER_PACKAGE_VISIT_SELF_CLASSIFIER_RULES).toContain(
      'reschedule_package_visit_self',
    );
  });

  it.each(
    CANCEL_PACKAGE_VISIT_SELF_PROMPTS.map((row) => [row.id, row] as const),
  )('detects cancel package visit prompt $id', (_id, row) => {
    expect(isCancelPackageVisitSelfPrompt(row.prompt)).toBe(true);
    expect(detectPackageVisitSelfCustomerAction(row.prompt)).toBe(
      row.expectedAction,
    );
  });

  it.each(
    RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS.map((row) => [row.id, row] as const),
  )('detects reschedule package visit prompt $id', (_id, row) => {
    expect(isReschedulePackageVisitSelfPrompt(row.prompt)).toBe(true);
    expect(detectPackageVisitSelfCustomerAction(row.prompt)).toBe(
      row.expectedAction,
    );
  });

  it.each(
    PACKAGE_VISIT_SELF_CUSTOMER_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues package visit self prompt $id from unknown', (_id, row) => {
    const rescued = rescuePackageVisitSelfCustomerIntent(row.prompt, 'unknown');
    expect(rescued?.action).toBe(row.expectedAction);
    expect(rescued?.rescueReason).toBe(row.rescueReason);
    expect(rescueSelfServiceBookingIntent(row.prompt, 'unknown')?.action).toBe(
      row.expectedAction,
    );
  });

  it('extracts visit index and package name from prompts', () => {
    expect(extractPackageVisitIndexFromPrompt('Cancel visit 2 of my package')).toBe(
      2,
    );
    expect(
      enrichPackageVisitSelfParamsFromPrompt(
        {},
        'Cancel visit 2 of my package',
        'cancel_package_visit_self',
      ),
    ).toEqual(expect.objectContaining({ visitIndex: 2 }));
    expect(
      enrichPackageVisitSelfParamsFromPrompt(
        {},
        'Reschedule my spa day to next week',
        'reschedule_package_visit_self',
      ).packageName,
    ).toBe('Spa Day');
  });

  it('does not steal single-booking cancel/reschedule or staff dashboard prompts', () => {
    expect(isCancelMyBookingPrompt('Cancel my booking')).toBe(true);
    expect(isCancelPackageVisitSelfPrompt('Cancel my booking')).toBe(false);
    expect(
      detectPackageVisitSelfCustomerAction('Cancel my booking'),
    ).toBeNull();

    expect(isRescheduleMyBookingPrompt('Reschedule my appointment')).toBe(true);
    expect(
      isReschedulePackageVisitSelfPrompt('Reschedule my appointment'),
    ).toBe(false);

    expect(
      isCancelPackageVisitPrompt('Cancel package visit for Anna'),
    ).toBe(true);
    expect(
      isCancelPackageVisitSelfPrompt('Cancel package visit for Anna'),
    ).toBe(false);
    expect(
      rescuePackageVisitSelfCustomerIntent(
        'Cancel package visit for Anna',
        'unknown',
      ),
    ).toBeNull();
  });

  it('prefers cancel over reschedule when cancel cue dominates', () => {
    expect(
      detectPackageVisitSelfCustomerAction(
        'Cancel my package visit instead of rescheduling it',
      ),
    ).toBe('cancel_package_visit_self');
  });

  it('maps package visit self fixtures to passing eval golden cases', () => {
    expect(CANCEL_PACKAGE_VISIT_SELF_PROMPTS.length).toBeGreaterThanOrEqual(10);
    expect(RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS.length).toBeGreaterThanOrEqual(
      10,
    );
    expect(AI_COMMAND_EVAL_PACKAGE_VISIT_SELF_CUSTOMER_CASES.length).toBe(
      PACKAGE_VISIT_SELF_CUSTOMER_PROMPTS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_PACKAGE_VISIT_SELF_CUSTOMER_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
