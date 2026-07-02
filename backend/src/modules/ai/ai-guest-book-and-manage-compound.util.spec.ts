import {
  GUEST_BOOK_AND_MANAGE_COMPOUND_PROMPTS,
  GUEST_BOOK_AND_MANAGE_CUSTOMER_PROMPTS,
  GUEST_BOOK_AND_MANAGE_NEGATIVE_PROMPTS,
  GUEST_BOOK_AND_MANAGE_RESCUE_SCENARIOS,
} from './ai-guest-book-and-manage-compound.fixtures.js';
import { GUEST_BOOK_AND_MANAGE_MULTILINGUAL_SCENARIOS } from './ai-guest-book-and-manage-compound-multilingual.fixtures.js';
import {
  buildGuestBookAndManageCompoundParams,
  decomposeGuestBookAndManageCompoundPrompt,
  hasGuestBookAndManageGuestCue,
  hasGuestBookAndManageManageLinkCue,
  isGuestBookAndManageCompoundPrompt,
  isGuestBookAndManagePastBookingPrompt,
  rescueGuestBookAndManageCompoundIntent,
} from './ai-guest-book-and-manage-compound.util.js';
import { isGetManageLinkPrompt } from './ai-get-manage-link.util.js';

describe('ai-guest-book-and-manage-compound.util (ai-cmd-customer-4.8.6)', () => {
  it.each(GUEST_BOOK_AND_MANAGE_CUSTOMER_PROMPTS)(
    'isGuestBookAndManageCompoundPrompt $id',
    ({ prompt }) => {
      expect(isGuestBookAndManageCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(GUEST_BOOK_AND_MANAGE_COMPOUND_PROMPTS)(
    'decomposeGuestBookAndManageCompoundPrompt $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const steps = decomposeGuestBookAndManageCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps[0]?.params.guestCheckout).toBe(true);
      expect(steps[1]?.params.guestLookup).toBe(true);
      if (expectedParams?.email) {
        expect(steps[1]?.params.email).toBe(expectedParams.email);
      }
      if (expectedParams?.delivery) {
        expect(steps[1]?.params.delivery).toBe(expectedParams.delivery);
      }
    },
  );

  it.each(GUEST_BOOK_AND_MANAGE_MULTILINGUAL_SCENARIOS)(
    'decomposeGuestBookAndManageCompoundPrompt multilingual $id',
    ({ prompt, orderedActions }) => {
      const steps = decomposeGuestBookAndManageCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
    },
  );

  it.each(GUEST_BOOK_AND_MANAGE_RESCUE_SCENARIOS)(
    'rescueGuestBookAndManageCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueGuestBookAndManageCompoundIntent(prompt, misclassifiedAction!),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'guest_book_and_manage_compound',
      });
    },
  );

  it.each(GUEST_BOOK_AND_MANAGE_NEGATIVE_PROMPTS)(
    'negative prompt $id is not compound',
    ({ prompt }) => {
      expect(isGuestBookAndManageCompoundPrompt(prompt)).toBe(false);
      expect(decomposeGuestBookAndManageCompoundPrompt(prompt)).toEqual([]);
    },
  );

  it('past-booking manage-link is stolen by guest recovery heuristics', () => {
    const prompt =
      'I booked as a guest — email me the manage link at mia@salon.com';
    expect(isGuestBookAndManagePastBookingPrompt(prompt)).toBe(true);
    expect(isGuestBookAndManageCompoundPrompt(prompt)).toBe(false);
    expect(isGetManageLinkPrompt(prompt)).toBe(false);
  });

  it('buildGuestBookAndManageCompoundParams extracts email and delivery', () => {
    const params = buildGuestBookAndManageCompoundParams(
      'Book haircut as guest and email manage link to john@example.com',
    );
    expect(params.guestCheckout).toBe(true);
    expect(params.email).toBe('john@example.com');
    expect(params.delivery).toBe('email');
    expect(params.serviceName).toBe('haircut');
  });

  it('hasGuestBookAndManageGuestCue matches guest booking phrasing', () => {
    expect(
      hasGuestBookAndManageGuestCue(
        'Book as guest and email me the manage link',
      ),
    ).toBe(true);
    expect(
      hasGuestBookAndManageGuestCue('Resend manage link to john@example.com'),
    ).toBe(false);
  });

  it('hasGuestBookAndManageManageLinkCue matches delivery phrasing', () => {
    expect(
      hasGuestBookAndManageManageLinkCue(
        'Book without an account and send me the manage link',
      ),
    ).toBe(true);
  });

  it('rescueGuestBookAndManageCompoundIntent returns null for non-compound', () => {
    expect(
      rescueGuestBookAndManageCompoundIntent(
        'Get manage link for my booking',
        'get_manage_link',
      ),
    ).toBeNull();
  });
});
