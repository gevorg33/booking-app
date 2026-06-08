export interface RedeemedGiftCardBookability {
  cardType: string;
  serviceCredits: Array<{ quantityRemaining: number }>;
}

export function canBookWithRedeemedGift(item: RedeemedGiftCardBookability): boolean {
  if (item.cardType === 'package' || item.cardType === 'subscription') {
    return true;
  }
  if (item.cardType === 'service' || item.cardType === 'bundle') {
    return item.serviceCredits.some((credit) => credit.quantityRemaining > 0);
  }
  return false;
}

export function hasRedeemedServiceCreditsRemaining(item: RedeemedGiftCardBookability): boolean {
  return item.serviceCredits.some((credit) => credit.quantityRemaining > 0);
}
