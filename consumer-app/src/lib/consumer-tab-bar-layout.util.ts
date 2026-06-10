/** Shared tab bar + FAB layout constants (keep CSS and JS in sync). */
export const CONSUMER_TAB_BAR_CORE_HEIGHT_PX = 52;
export const CONSUMER_FAB_MARGIN_ABOVE_TAB_PX = 12;

/** Default FAB anchor bottom when salon tabs are visible. */
export function getConsumerFabDefaultBottomInset(): number {
  return CONSUMER_TAB_BAR_CORE_HEIGHT_PX + CONSUMER_FAB_MARGIN_ABOVE_TAB_PX;
}
