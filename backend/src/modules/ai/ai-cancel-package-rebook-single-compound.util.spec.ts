import {
  CANCEL_PACKAGE_REBOOK_SINGLE_COMPOUND_PROMPTS,
  CANCEL_PACKAGE_REBOOK_SINGLE_NEGATIVE_PROMPTS,
  CANCEL_PACKAGE_REBOOK_SINGLE_RESCUE_SCENARIOS,
} from './ai-cancel-package-rebook-single-compound.fixtures.js';
import { CANCEL_PACKAGE_REBOOK_SINGLE_MULTILINGUAL_SCENARIOS } from './ai-cancel-package-rebook-single-compound-multilingual.fixtures.js';
import {
  buildCancelPackageRebookSingleCompoundParams,
  decomposeCancelPackageRebookSingleCompoundPrompt,
  isCancelPackageRebookSingleCompoundPrompt,
  rescueCancelPackageRebookSingleCompoundIntent,
} from './ai-cancel-package-rebook-single-compound.util.js';
import { isCancelPackageVisitSelfPrompt } from './ai-cancel-package-visit-self.util.js';
import { isCancelAndRebookCompoundPrompt } from './ai-cancel-and-rebook-compound.util.js';

describe('ai-cancel-package-rebook-single-compound.util (ai-cmd-customer-4.21.7)', () => {
  it.each(CANCEL_PACKAGE_REBOOK_SINGLE_COMPOUND_PROMPTS)(
    'isCancelPackageRebookSingleCompoundPrompt $id',
    ({ prompt }) => {
      expect(isCancelPackageRebookSingleCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(CANCEL_PACKAGE_REBOOK_SINGLE_COMPOUND_PROMPTS)(
    'decomposeCancelPackageRebookSingleCompoundPrompt $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const steps = decomposeCancelPackageRebookSingleCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps[0]?.params.cancelPackageRebookSingle).toBe(true);
      expect(steps[1]?.params.continueAfterPackageCancel).toBe(true);
      expect(steps[1]?.params.singleServiceBooking).toBe(true);
      if (expectedParams?.visitIndex != null) {
        expect(steps[0]?.params.visitIndex).toBe(expectedParams.visitIndex);
      }
      if (expectedParams?.serviceName) {
        expect(steps[1]?.params.serviceName).toBe(expectedParams.serviceName);
      }
    },
  );

  it.each(CANCEL_PACKAGE_REBOOK_SINGLE_MULTILINGUAL_SCENARIOS)(
    'decomposeCancelPackageRebookSingleCompoundPrompt multilingual $id',
    ({ prompt, orderedActions }) => {
      const steps = decomposeCancelPackageRebookSingleCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
    },
  );

  it.each(CANCEL_PACKAGE_REBOOK_SINGLE_RESCUE_SCENARIOS)(
    'rescueCancelPackageRebookSingleCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueCancelPackageRebookSingleCompoundIntent(
          prompt,
          misclassifiedAction!,
        ),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'cancel_package_rebook_single_compound',
      });
    },
  );

  it.each(CANCEL_PACKAGE_REBOOK_SINGLE_NEGATIVE_PROMPTS)(
    'negative prompt $id is not compound',
    ({ prompt }) => {
      expect(isCancelPackageRebookSingleCompoundPrompt(prompt)).toBe(false);
      expect(decomposeCancelPackageRebookSingleCompoundPrompt(prompt)).toEqual(
        [],
      );
    },
  );

  it('package cancel only stays on cancel_package_visit_self', () => {
    const prompt = 'Cancel my package visit';
    expect(isCancelPackageRebookSingleCompoundPrompt(prompt)).toBe(false);
    expect(isCancelPackageVisitSelfPrompt(prompt)).toBe(true);
  });

  it('cancel nearest stays on cancel_and_rebook', () => {
    const prompt = 'Cancel Friday and book the next available slot';
    expect(isCancelPackageRebookSingleCompoundPrompt(prompt)).toBe(false);
    expect(isCancelAndRebookCompoundPrompt(prompt)).toBe(true);
  });

  it('buildCancelPackageRebookSingleCompoundParams extracts visit and service', () => {
    const params = buildCancelPackageRebookSingleCompoundParams(
      'Skip package visit 2 and book a trim instead',
    );
    expect(params.visitIndex).toBe(2);
    expect(params.serviceName).toBe('trim');
    expect(params.cancelPackageRebookSingle).toBe(true);
  });

  it('rescueCancelPackageRebookSingleCompoundIntent returns null for non-compound', () => {
    expect(
      rescueCancelPackageRebookSingleCompoundIntent(
        'Cancel my package visit',
        'cancel_package_visit_self',
      ),
    ).toBeNull();
  });
});
