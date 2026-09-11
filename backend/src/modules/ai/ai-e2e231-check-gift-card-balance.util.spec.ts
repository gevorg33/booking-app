import {
  E2E231_CHECK_BALANCE_BY_CODE_CASES,
  E2E231_NEGATIVE_CASES,
} from './ai-e2e231-check-gift-card-balance.fixtures.js';
import { isGiftCardBalancePrompt } from './ai-customer-crm.util.js';
import { isExplainPublicBookingCheckoutPrompt } from './ai-explain-public-booking-checkout.util.js';
import {
  isApplyGiftCardCodePrompt,
  isCheckGiftCardBalancePrompt,
  rescuePaymentsIntent,
} from './ai-payments.util.js';

describe('e2e-bug.231 check_gift_card_balance by code', () => {
  it.each(
    E2E231_CHECK_BALANCE_BY_CODE_CASES.map((row) => [row.id, row] as const),
  )('detects code balance prompt $id', (_id, row) => {
    expect(isCheckGiftCardBalancePrompt(row.prompt)).toBe(true);
    expect(isGiftCardBalancePrompt(row.prompt)).toBe(false);
    expect(isApplyGiftCardCodePrompt(row.prompt)).toBe(false);
    expect(isExplainPublicBookingCheckoutPrompt(row.prompt)).toBe(false);
  });

  it.each(
    E2E231_CHECK_BALANCE_BY_CODE_CASES.map((row) => [row.id, row] as const),
  )('rescues $id from sibling steals', (_id, row) => {
    for (const from of row.forbidActions) {
      expect(rescuePaymentsIntent(row.prompt, from)?.action).toBe(
        'check_gift_card_balance',
      );
    }
    expect(rescuePaymentsIntent(row.prompt, 'unknown')?.action).toBe(
      'check_gift_card_balance',
    );
    expect(
      rescuePaymentsIntent(row.prompt, 'apply_gift_card_code')?.action,
    ).toBe('check_gift_card_balance');
    expect(rescuePaymentsIntent(row.prompt, 'gift_card_balance')?.action).toBe(
      'check_gift_card_balance',
    );
  });

  it('keeps account wallet balance off code lookup', () => {
    expect(isCheckGiftCardBalancePrompt('What is my gift card balance?')).toBe(
      false,
    );
    expect(isGiftCardBalancePrompt('What is my gift card balance?')).toBe(true);
  });

  it('keeps apply-at-checkout on apply_gift_card_code', () => {
    const prompt = 'Apply gift card code GCM-E5B7056C84 at checkout';
    expect(isCheckGiftCardBalancePrompt(prompt)).toBe(false);
    expect(isApplyGiftCardCodePrompt(prompt)).toBe(true);
  });

  it('keeps public checkout explain for multi-method how-it-works', () => {
    expect(
      isExplainPublicBookingCheckoutPrompt(
        'How do gift cards work at public booking checkout?',
      ),
    ).toBe(true);
    expect(
      isCheckGiftCardBalancePrompt(
        'How do gift cards work at public booking checkout?',
      ),
    ).toBe(false);
  });

  it.each(E2E231_NEGATIVE_CASES.map((row) => [row.id, row] as const))(
    'negative $id stays off check_gift_card_balance detector',
    (_id, row) => {
      expect(isCheckGiftCardBalancePrompt(row.prompt)).toBe(false);
    },
  );
});
