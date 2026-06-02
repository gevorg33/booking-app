import type { GiftCard } from './entities/gift-card.entity.js';

/** Mark a gift card as cancelled and zero out redeemable value. */
export function deactivateCancelledGiftCard(card: GiftCard): void {
  card.fulfillmentStatus = 'cancelled';
  card.isActive = false;
  card.balance = 0;
  for (const credit of card.serviceCredits ?? []) {
    credit.quantityRemaining = 0;
  }
}
