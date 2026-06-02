import { deactivateCancelledGiftCard } from './gift-card-refund.util.js';
import type { GiftCard } from './entities/gift-card.entity.js';

describe('gift-card-refund.util', () => {
  it('deactivates monetary gift cards and zeros credits', () => {
    const card = {
      fulfillmentStatus: 'delivered',
      isActive: true,
      balance: 50,
      serviceCredits: [{ quantityRemaining: 2 }, { quantityRemaining: 1 }],
    } as GiftCard;

    deactivateCancelledGiftCard(card);

    expect(card.fulfillmentStatus).toBe('cancelled');
    expect(card.isActive).toBe(false);
    expect(card.balance).toBe(0);
    expect(card.serviceCredits?.[0].quantityRemaining).toBe(0);
    expect(card.serviceCredits?.[1].quantityRemaining).toBe(0);
  });

  it('handles cards without service credits', () => {
    const card = {
      fulfillmentStatus: 'pending',
      isActive: true,
      balance: 25,
      serviceCredits: undefined,
    } as GiftCard;

    deactivateCancelledGiftCard(card);

    expect(card.fulfillmentStatus).toBe('cancelled');
    expect(card.isActive).toBe(false);
    expect(card.balance).toBe(0);
  });
});
