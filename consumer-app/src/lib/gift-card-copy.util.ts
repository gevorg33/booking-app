import type { ConsumerCopy } from './consumer-copy.types.js';
import type { PublicGiftCardType } from './gift-card.types.js';

const TYPE_LABEL_KEYS: Record<PublicGiftCardType, keyof ConsumerCopy> = {
  monetary: 'giftCardTypeMonetary',
  service: 'giftCardTypeService',
  bundle: 'giftCardTypeBundle',
  package: 'giftCardTypePackage',
  subscription: 'giftCardTypeSubscription',
};

const TYPE_DESC_KEYS: Record<PublicGiftCardType, keyof ConsumerCopy> = {
  monetary: 'giftCardTypeDescMonetary',
  service: 'giftCardTypeDescService',
  bundle: 'giftCardTypeDescBundle',
  package: 'giftCardTypeDescPackage',
  subscription: 'giftCardTypeDescSubscription',
};

export function giftCardTypeLabel(copy: ConsumerCopy, cardType: PublicGiftCardType): string {
  const value = copy[TYPE_LABEL_KEYS[cardType]];
  return typeof value === 'string' ? value : '';
}

export function giftCardTypeDescription(copy: ConsumerCopy, cardType: PublicGiftCardType): string {
  const value = copy[TYPE_DESC_KEYS[cardType]];
  return typeof value === 'string' ? value : '';
}
