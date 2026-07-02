import {
  CANCEL_AND_REBOOK_COMPOUND_PROMPTS,
  CANCEL_AND_REBOOK_CUSTOMER_PROMPTS,
  CANCEL_AND_REBOOK_NEGATIVE_PROMPTS,
  CANCEL_AND_REBOOK_RESCUE_SCENARIOS,
} from './ai-cancel-and-rebook-compound.fixtures.js';
import { CANCEL_AND_REBOOK_MULTILINGUAL_SCENARIOS } from './ai-cancel-and-rebook-compound-multilingual.fixtures.js';
import {
  buildCancelAndRebookCompoundParams,
  decomposeCancelAndRebookCompoundPrompt,
  hasCancelAndRebookBookCue,
  hasCancelAndRebookCancelCue,
  isCancelAndRebookCompoundPrompt,
  rescueCancelAndRebookCompoundIntent,
} from './ai-cancel-and-rebook-compound.util.js';
import { isCancelMyBookingPrompt } from './ai-self-service-booking.util.js';

describe('ai-cancel-and-rebook-compound.util (ai-cmd-customer-4.8.3)', () => {
  it.each(CANCEL_AND_REBOOK_CUSTOMER_PROMPTS)(
    'isCancelAndRebookCompoundPrompt customer $id',
    ({ prompt }) => {
      expect(isCancelAndRebookCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(CANCEL_AND_REBOOK_COMPOUND_PROMPTS)(
    'decomposeCancelAndRebookCompoundPrompt $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const steps = decomposeCancelAndRebookCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps).toHaveLength(2);
      if (expectedParams?.serviceName) {
        expect(steps[0].params.serviceName).toBe(expectedParams.serviceName);
      }
      if (expectedParams?.bookingFirstAvailable) {
        expect(steps[1].params.bookingFirstAvailable).toBe(true);
      }
    },
  );

  it.each(CANCEL_AND_REBOOK_MULTILINGUAL_SCENARIOS)(
    'decomposeCancelAndRebookCompoundPrompt multilingual $id',
    ({ prompt, orderedActions }) => {
      const steps = decomposeCancelAndRebookCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
    },
  );

  it.each(CANCEL_AND_REBOOK_RESCUE_SCENARIOS)(
    'rescueCancelAndRebookCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueCancelAndRebookCompoundIntent(prompt, misclassifiedAction!),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'cancel_and_rebook_compound',
      });
    },
  );

  it.each(CANCEL_AND_REBOOK_NEGATIVE_PROMPTS)(
    'does not match negative prompt $id',
    ({ prompt }) => {
      expect(isCancelAndRebookCompoundPrompt(prompt)).toBe(false);
      expect(decomposeCancelAndRebookCompoundPrompt(prompt)).toEqual([]);
    },
  );

  it('cancel-only prompt stays on cancel_my_booking', () => {
    const prompt = 'Cancel my booking';
    expect(hasCancelAndRebookBookCue(prompt)).toBe(false);
    expect(isCancelAndRebookCompoundPrompt(prompt)).toBe(false);
    expect(isCancelMyBookingPrompt(prompt)).toBe(true);
  });

  it('buildCancelAndRebookCompoundParams extracts service and first available', () => {
    const params = buildCancelAndRebookCompoundParams(
      "Cancel tomorrow's massage and book the soonest slot",
    );
    expect(params.serviceName).toBe('massage');
    expect(params.bookingFirstAvailable).toBe(true);
  });

  it('rescueCancelAndRebookCompoundIntent returns null for non-compound', () => {
    expect(
      rescueCancelAndRebookCompoundIntent(
        'Cancel my booking',
        'cancel_my_booking',
      ),
    ).toBeNull();
  });

  it('hasCancelAndRebookCancelCue accepts weekday cancel without my', () => {
    expect(
      hasCancelAndRebookCancelCue(
        'Cancel Friday and book the next available slot',
      ),
    ).toBe(true);
  });

  it('detects heuristic cancel and rebook without fixture id', () => {
    const prompt =
      'Cancel my next visit and schedule the earliest available opening';
    expect(isCancelAndRebookCompoundPrompt(prompt)).toBe(true);
    const steps = decomposeCancelAndRebookCompoundPrompt(prompt);
    expect(steps.map((step) => step.action)).toEqual([
      'cancel_my_booking',
      'book_nearest_slot',
    ]);
  });
});
