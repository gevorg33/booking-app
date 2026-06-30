import {
  CLINIC_LAB_REVIEW_COMPOUND_PROMPTS,
  CLINIC_LAB_REVIEW_RESCUE_SCENARIOS,
} from './ai-clinic-lab-review-compound.fixtures.js';
import {
  buildClinicLabReviewCompoundParams,
  decomposeClinicLabReviewCompoundPrompt,
  isClinicLabReviewCompoundPrompt,
  CLINIC_LAB_REVIEW_STEP_ACTIONS,
  rescueClinicLabReviewCompoundIntent,
} from './ai-clinic-lab-review-compound.util.js';

describe('ai-clinic-lab-review-compound.util (ai-cmd-clinic-6-gap-6.1)', () => {
  it.each(CLINIC_LAB_REVIEW_COMPOUND_PROMPTS)(
    'isClinicLabReviewCompoundPrompt $id',
    ({ prompt }) => {
      expect(isClinicLabReviewCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(CLINIC_LAB_REVIEW_COMPOUND_PROMPTS)(
    'decomposeClinicLabReviewCompoundPrompt $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const steps = decomposeClinicLabReviewCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps).toHaveLength(CLINIC_LAB_REVIEW_STEP_ACTIONS.length);
      if (expectedParams?.customerName) {
        expect(steps[0].params.customerName).toBe(expectedParams.customerName);
        expect(steps[1].params.customerName).toBe(expectedParams.customerName);
      }
      if (expectedParams?.orderId) {
        expect(steps[0].params.orderId).toBe(expectedParams.orderId);
        expect(steps[1].params.orderId).toBe(expectedParams.orderId);
      }
    },
  );

  it.each(CLINIC_LAB_REVIEW_RESCUE_SCENARIOS)(
    'rescues misclassified compound $id',
    ({ prompt, misclassifiedAction }) => {
      expect(rescueClinicLabReviewCompoundIntent(prompt, misclassifiedAction!)).toEqual({
        action: 'compound_intent',
        rescueReason: 'clinic_lab_review_compound',
      });
    },
  );

  it('buildClinicLabReviewCompoundParams merges customer and order hints', () => {
    const params = buildClinicLabReviewCompoundParams(
      'Lab review for Maria on order #abc123 — list abnormal flags and explain results',
    );
    expect(params.customerName).toBe('Maria');
    expect(params.orderId).toBe('abc123');
  });

  it('does not treat single-intent prompts as lab review compound', () => {
    expect(
      isClinicLabReviewCompoundPrompt('List abnormal results for today'),
    ).toBe(false);
    expect(
      decomposeClinicLabReviewCompoundPrompt('Explain Maria lab results'),
    ).toEqual([]);
  });
});
