/** Shared tab bar + FAB layout constants (keep CSS and JS in sync). */
export const CONSUMER_TAB_BAR_CORE_HEIGHT_PX = 52;
export const CONSUMER_FAB_MARGIN_ABOVE_TAB_PX = 12;
export const CONSUMER_FIXED_ACTION_ACTIVE_CLASS = 'consumer-fixed-action-active';

/** Default FAB anchor bottom when salon tabs are visible. */
export function getConsumerFabDefaultBottomInset(
  options: { hasFixedActionBar?: boolean } = {},
): number {
  const hasFixedActionBar =
    options.hasFixedActionBar ??
    (typeof document !== 'undefined' &&
      document.body.classList.contains(CONSUMER_FIXED_ACTION_ACTIVE_CLASS));
  const fixedActionExtra = hasFixedActionBar ? CONSUMER_TAB_BAR_CORE_HEIGHT_PX : 0;
  return CONSUMER_TAB_BAR_CORE_HEIGHT_PX + CONSUMER_FAB_MARGIN_ABOVE_TAB_PX + fixedActionExtra;
}
