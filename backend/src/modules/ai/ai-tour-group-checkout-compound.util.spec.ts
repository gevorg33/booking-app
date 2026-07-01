import {
  TOUR_GROUP_CHECKOUT_COMPOUND_PROMPTS,
  TOUR_GROUP_CHECKOUT_NEGATIVE_PROMPTS,
  TOUR_GROUP_CHECKOUT_RESCUE_SCENARIOS,
} from './ai-tour-group-checkout-compound.fixtures.js';
import { TOUR_GROUP_CHECKOUT_MULTILINGUAL_SCENARIOS } from './ai-tour-group-checkout-compound-multilingual.fixtures.js';
import { isBookTourNearestDepartureCompoundPrompt } from './ai-book-tour-nearest-departure.util.js';
import { isDiagnoseTourCapacityPrompt } from './ai-tour-capacity.util.js';
import {
  decomposeCustomerTourGroupCheckoutCompoundPrompt,
  decomposePublicTourGroupCheckoutCompoundPrompt,
  hasTourGroupCheckoutCapacityGateCue,
  hasTourGroupCheckoutTopic,
  isTourGroupCheckoutCompoundPrompt,
  rescueTourGroupCheckoutCompoundIntent,
} from './ai-tour-group-checkout-compound.util.js';

describe('ai-tour-group-checkout-compound.util (ai-cmd-customer-4.21.2)', () => {
  it.each(TOUR_GROUP_CHECKOUT_COMPOUND_PROMPTS)(
    'detects tour_group_checkout compound for $id',
    ({ prompt, orderedActions, paxCount }) => {
      expect(isTourGroupCheckoutCompoundPrompt(prompt)).toBe(true);
      expect(hasTourGroupCheckoutCapacityGateCue(prompt)).toBe(true);
      expect(hasTourGroupCheckoutTopic(prompt)).toBe(true);
      const decompose =
        orderedActions[2] === 'book_appointment'
          ? decomposePublicTourGroupCheckoutCompoundPrompt(prompt)
          : decomposeCustomerTourGroupCheckoutCompoundPrompt(prompt);
      expect(decompose.map((step) => step.action)).toEqual([...orderedActions]);
      expect(decompose[0]?.params.tourGroupCheckout).toBe(true);
      expect(decompose[0]?.params.aspect).toBe('groupSize');
      expect(decompose[1]?.params.requestedPax).toBe(paxCount);
      expect(decompose[2]?.params.continueAfterCapacityCheck).toBe(true);
    },
  );

  it.each(TOUR_GROUP_CHECKOUT_MULTILINGUAL_SCENARIOS)(
    'detects multilingual compound $id',
    ({ prompt, orderedActions, surface }) => {
      expect(isTourGroupCheckoutCompoundPrompt(prompt)).toBe(true);
      const decompose =
        surface === 'public'
          ? decomposePublicTourGroupCheckoutCompoundPrompt(prompt)
          : decomposeCustomerTourGroupCheckoutCompoundPrompt(prompt);
      expect(decompose.map((step) => step.action)).toEqual([...orderedActions]);
    },
  );

  it.each(TOUR_GROUP_CHECKOUT_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueTourGroupCheckoutCompoundIntent(prompt, misclassifiedAction!),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'tour_group_checkout_compound',
      });
    },
  );

  it.each(TOUR_GROUP_CHECKOUT_NEGATIVE_PROMPTS)(
    'does not steal $id',
    ({ prompt }) => {
      expect(isTourGroupCheckoutCompoundPrompt(prompt)).toBe(false);
    },
  );

  it('nearest departure without capacity gate stays on book_tour_nearest_departure', () => {
    const prompt = 'Book the wine tour earliest date for 2 people';
    expect(isBookTourNearestDepartureCompoundPrompt(prompt)).toBe(true);
    expect(isTourGroupCheckoutCompoundPrompt(prompt)).toBe(false);
  });

  it('checkout rejection diagnose stays on diagnose_tour_capacity', () => {
    const prompt =
      'Why did checkout reject 4 people for the mountain trek on 15/08/2026?';
    expect(isDiagnoseTourCapacityPrompt(prompt)).toBe(true);
    expect(isTourGroupCheckoutCompoundPrompt(prompt)).toBe(false);
  });

  it('uses heuristic detection outside fixtures', () => {
    const prompt =
      'Book coastal tour for 9 guests next month if enough spots remain';
    expect(isTourGroupCheckoutCompoundPrompt(prompt)).toBe(true);
    expect(
      decomposeCustomerTourGroupCheckoutCompoundPrompt(prompt),
    ).toHaveLength(3);
  });

  it('returns null rescue when already compound_intent', () => {
    expect(
      rescueTourGroupCheckoutCompoundIntent(
        'Wine tour for 6 next Saturday — book if enough seats',
        'compound_intent',
      ),
    ).toBeNull();
  });
});
