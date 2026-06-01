import { randomBytes } from 'crypto';
import type { GiftCardType } from './gift-card.types.js';

const PREFIX: Record<GiftCardType, string> = {
  monetary: 'GCM',
  service: 'GCS',
  bundle: 'GCB',
};

export function generateGiftCardCode(type: GiftCardType): string {
  const token = randomBytes(5).toString('hex').toUpperCase();
  return `${PREFIX[type]}-${token}`;
}

export function giftCardCodePrefix(type: GiftCardType): string {
  return PREFIX[type];
}
