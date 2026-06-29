/** Tab bar + FAB layout constants (keep CSS and JS in sync). */
export const PROVIDER_TAB_BAR_CORE_HEIGHT_PX = 52;
export const PROVIDER_FAB_MARGIN_ABOVE_TAB_PX = 12;

export function getProviderFabDefaultBottomInset(): number {
  return PROVIDER_TAB_BAR_CORE_HEIGHT_PX + PROVIDER_FAB_MARGIN_ABOVE_TAB_PX;
}
