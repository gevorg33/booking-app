/**
 * e2e-bug.58 — do not advertise physical delivery when the business has it off.
 */
export function resolveGiftCardCatalogSubtitleKey(
  physicalDeliveryEnabled: boolean,
): 'public.giftCards.subtitle' | 'public.giftCards.subtitleDigitalOnly' {
  return physicalDeliveryEnabled
    ? 'public.giftCards.subtitle'
    : 'public.giftCards.subtitleDigitalOnly';
}
