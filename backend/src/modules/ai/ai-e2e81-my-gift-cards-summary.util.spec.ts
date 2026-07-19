import {
  E2E81_MY_GIFT_CARDS_SUMMARY_CASES,
  E2E81_STATIC_SUMMARY_FORBIDDEN,
} from './ai-e2e81-my-gift-cards-summary.fixtures.js';
import { handleMyGiftCardsLogic } from './ai-customer-crm.logic.js';
import {
  buildMyGiftCardsNavigate,
  buildMyGiftCardsSummary,
} from './ai-customer-crm.util.js';
import { commandResultToPublicAssistantResult } from './customer-ai-command.util.js';

describe('e2e-bug.81 my_gift_cards summary is data-bearing', () => {
  it.each(E2E81_MY_GIFT_CARDS_SUMMARY_CASES)(
    '$id: buildMyGiftCardsSummary',
    ({ account, expectedSummary }) => {
      expect(buildMyGiftCardsSummary(account)).toBe(expectedSummary);
      expect(buildMyGiftCardsSummary(account)).not.toBe(
        E2E81_STATIC_SUMMARY_FORBIDDEN,
      );
    },
  );

  it('buildMyGiftCardsNavigate deep-links to account gift cards', () => {
    expect(buildMyGiftCardsNavigate()).toEqual({
      path: 'account',
      query: { tab: 'giftCards' },
    });
  });

  it.each(E2E81_MY_GIFT_CARDS_SUMMARY_CASES)(
    '$id: handler summary + navigate survive public assistant shaping',
    async ({ account, expectedSummary }) => {
      const result = await handleMyGiftCardsLogic(
        {
          giftCardOrderService: {
            listCustomerGiftCardAccount: jest.fn(async () => account),
          },
        } as any,
        'biz-1',
        { sessionCustomerId: 'cust-1' },
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('my_gift_cards');
      expect(result.summary).toBe(expectedSummary);
      expect(result.summary).not.toBe(E2E81_STATIC_SUMMARY_FORBIDDEN);
      expect(result.details?.navigate).toEqual(buildMyGiftCardsNavigate());

      const publicResult = commandResultToPublicAssistantResult(result);
      expect(publicResult.summary).toBe(expectedSummary);
      expect(publicResult.navigate).toEqual(buildMyGiftCardsNavigate());
      // account payload is intentionally not in the public whitelist —
      // summary + navigate must carry the value for the customer.
      expect(publicResult.details?.account).toBeUndefined();
    },
  );

  it('requires sign-in', async () => {
    const result = await handleMyGiftCardsLogic(
      {
        giftCardOrderService: {
          listCustomerGiftCardAccount: jest.fn(),
        },
      } as any,
      'biz-1',
      {},
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
