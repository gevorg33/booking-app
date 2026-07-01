import { describe, expect, it } from 'vitest';
import { parseGiftCardAssistantPrefill } from './consumer-gift-card-assistant-prefill.util.js';

describe('consumer-gift-card-assistant-prefill.util', () => {
  it('parses gift assistant navigation query params', () => {
    const params = new URLSearchParams(
      'buyAsGift=1&amount=100&recipientName=Mom&recipientEmail=mom@example.com&deliveryMethod=digital',
    );
    expect(parseGiftCardAssistantPrefill(params)).toEqual({
      buyAsGift: true,
      amount: '100',
      recipientName: 'Mom',
      recipientEmail: 'mom@example.com',
      deliveryMethod: 'digital',
    });
  });
});
