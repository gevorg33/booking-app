import { CLAIM_GIFT_CARD_BALANCE_MULTILINGUAL_SCENARIOS } from './ai-claim-gift-card-balance-multilingual.fixtures.js';
import {
  CLAIM_GIFT_CARD_BALANCE_PROMPTS,
  CLAIM_GIFT_CARD_BALANCE_RESCUE_SCENARIOS,
  CUSTOMER_CLAIM_GIFT_CARD_BALANCE_CLASSIFIER_RULES,
} from './ai-claim-gift-card-balance.fixtures.js';
import {
  buildClaimGiftCardBalanceNavigate,
  buildClaimGiftCardBalanceSignInNavigate,
  buildClaimGiftCardBalanceSummary,
  enrichClaimGiftCardBalanceParamsFromPrompt,
  isClaimGiftCardBalanceIntent,
  isClaimGiftCardBalancePrompt,
  parseClaimGiftCardBalanceFromPrompt,
  rescueClaimGiftCardBalanceIntent,
} from './ai-claim-gift-card-balance.util.js';
import { rescueCustomerCrmIntent } from './ai-customer-crm.util.js';

describe('ai-claim-gift-card-balance.util', () => {
  it('exports classifier rules for claim_gift_card_balance', () => {
    expect(CUSTOMER_CLAIM_GIFT_CARD_BALANCE_CLASSIFIER_RULES).toContain(
      'claim_gift_card_balance',
    );
  });

  it.each([
    ...CLAIM_GIFT_CARD_BALANCE_PROMPTS,
    ...CLAIM_GIFT_CARD_BALANCE_MULTILINGUAL_SCENARIOS,
  ])('detects claim_gift_card_balance for $id', (row) => {
    expect(isClaimGiftCardBalancePrompt(row.prompt)).toBe(true);
    expect(
      rescueClaimGiftCardBalanceIntent(row.prompt, 'unknown')?.action,
    ).toBe('claim_gift_card_balance');
  });

  it.each(CLAIM_GIFT_CARD_BALANCE_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueClaimGiftCardBalanceIntent(prompt, misclassifiedAction)?.action,
      ).toBe('claim_gift_card_balance');
      expect(rescueCustomerCrmIntent(prompt, misclassifiedAction)?.action).toBe(
        'claim_gift_card_balance',
      );
    },
  );

  it('does not steal checkout apply prompts', () => {
    expect(
      isClaimGiftCardBalancePrompt('Apply gift card GCM-TEST at checkout'),
    ).toBe(false);
  });

  it('does not steal balance check prompts', () => {
    expect(
      isClaimGiftCardBalancePrompt('Check gift card balance for GCM-TEST'),
    ).toBe(false);
  });

  it('enriches giftCardCode from prompt', () => {
    expect(
      enrichClaimGiftCardBalanceParamsFromPrompt(
        {},
        'Redeem gift card code GCM-ABCD1234',
      ).giftCardCode,
    ).toBe('GCM-ABCD1234');
  });

  it('parses navigate target with optional code', () => {
    expect(buildClaimGiftCardBalanceNavigate('GCM-ABCD1234')).toEqual({
      path: 'account',
      query: { section: 'gift-card-claim', giftCardCode: 'GCM-ABCD1234' },
    });
    expect(buildClaimGiftCardBalanceNavigate()).toEqual({
      path: 'account',
      query: { section: 'gift-card-claim' },
    });
  });

  it('returns null parse for unrelated prompt', () => {
    expect(parseClaimGiftCardBalanceFromPrompt('Book a haircut')).toBeNull();
    expect(isClaimGiftCardBalancePrompt('Book a haircut')).toBe(false);
    expect(isClaimGiftCardBalancePrompt('Activate GCM-TEST1234')).toBe(false);
    expect(
      enrichClaimGiftCardBalanceParamsFromPrompt({}, 'Book a haircut'),
    ).toEqual({});
  });

  it('builds navigate-only summary when code is present but not claimed', () => {
    expect(
      buildClaimGiftCardBalanceSummary({ giftCardCode: 'GCM-TEST' }),
    ).toContain('GCM-TEST');
  });

  it('recognizes claim intent constant', () => {
    expect(isClaimGiftCardBalanceIntent('claim_gift_card_balance')).toBe(true);
    expect(isClaimGiftCardBalanceIntent('apply_gift_card_code')).toBe(false);
    expect(
      rescueClaimGiftCardBalanceIntent(
        'Redeem gift card code GCM-ABCD1234',
        'claim_gift_card_balance',
      ),
    ).toBeNull();
  });

  it('builds sign-in navigate with optional code', () => {
    expect(buildClaimGiftCardBalanceSignInNavigate('GCM-ABCD1234')).toEqual({
      path: 'login',
      query: { reason: 'claim_gift_card', giftCardCode: 'GCM-ABCD1234' },
    });
  });
});
