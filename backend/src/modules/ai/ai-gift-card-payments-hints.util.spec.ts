import {
  applyGiftCardPaymentsPromptHints,
  decomposeGiftCardPaymentsCompoundPrompt,
  disambiguateGiftCardPaymentsAction,
  inheritGiftCardPaymentsFollowUpContext,
  isPhysicalGiftCardHandoffCompoundPrompt,
  tryDecomposePhysicalGiftCardHandoff,
} from './ai-gift-card-payments-hints.util.js';

describe('ai-gift-card-payments-hints.util', () => {
  it('detects physical gift card handoff compounds', () => {
    expect(
      isPhysicalGiftCardHandoffCompoundPrompt(
        'Buy physical gift card $100 and track my order',
      ),
    ).toBe(true);
  });

  it('disambiguates create_booking to book_nearest_slot checkout', () => {
    expect(
      disambiguateGiftCardPaymentsAction(
        'Book nearest slot for massage and apply gift card GCM-TEST',
        'create_booking',
      )?.action,
    ).toBe('book_nearest_slot');
  });

  it('disambiguates digital buy to physical gift card', () => {
    expect(
      disambiguateGiftCardPaymentsAction(
        'Buy mailed physical gift card $50',
        'buy_gift_card',
      )?.action,
    ).toBe('buy_gift_card_physical');
  });

  it('inherits gift card code into checkout follow-up', () => {
    const params: Record<string, any> = {};
    inheritGiftCardPaymentsFollowUpContext(
      params,
      {
        lastAction: 'book_nearest_slot',
        serviceName: 'massage',
        date: '07/06/2026',
        giftCardCode: 'GCM-ABCD1234',
      },
      'apply_gift_card_code',
      'apply gift card GCM-ABCD1234',
    );
    expect(params.serviceName).toBe('massage');
    expect(params.giftCardCode).toBe('GCM-ABCD1234');
  });

  it('enriches apply_gift_card_code params from prompt', () => {
    const params: Record<string, any> = {};
    applyGiftCardPaymentsPromptHints(
      'apply_gift_card_code',
      params,
      'Apply code GCM-TEST at checkout',
    );
    expect(params.giftCardCode).toBe('GCM-TEST');
  });

  it('decomposes book + apply + choose payment checkout', () => {
    const steps = decomposeGiftCardPaymentsCompoundPrompt(
      'Book nearest slot for massage tomorrow and apply gift card GCM-ABCD1234 and choose payment method',
    );
    expect(steps.map((s) => s.action)).toEqual([
      'book_nearest_slot',
      'apply_gift_card_code',
      'choose_payment_method',
    ]);
    expect(steps[1].params.giftCardCode).toBe('GCM-ABCD1234');
    expect(steps[2].params.giftCardCode).toBe('GCM-ABCD1234');
  });

  it('decomposes physical purchase + track handoff', () => {
    const steps = tryDecomposePhysicalGiftCardHandoff(
      'Buy physical gift card $100 and track my order',
    );
    expect(steps?.map((s) => s.action)).toEqual([
      'buy_gift_card_physical',
      'track_physical_gift_card_order',
    ]);
    expect(steps?.[0].params.amount).toBe(100);
    expect(steps?.[0].params.deliveryMethod).toBe('physical');
  });
});
