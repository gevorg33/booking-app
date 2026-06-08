/** adopt-4.5 — win-back message helpers and loyalty incentive resolution. */

import { pointsToCurrency } from '../loyalty/loyalty-settings.util.js';
import { roundBonus } from '../loyalty/loyalty.constants.js';
import { t, type AppLocale } from '../../common/i18n/messages.js';

export interface WinBackIncentiveSettings {
  reEngagementPromoCode?: string | null;
  reEngagementLoyaltyBonusPoints?: number | null;
}

export interface WinBackIncentiveLines {
  promoLine: string;
  loyaltyLine: string;
}

export function resolveWinBackLoyaltyBonusPoints(
  settings: WinBackIncentiveSettings,
): number {
  const raw = settings.reEngagementLoyaltyBonusPoints;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0;
  return roundBonus(Math.max(0, Math.min(500, Math.round(raw))));
}

export function isWinBackLoyaltyIncentiveConfigured(
  settings: WinBackIncentiveSettings,
): boolean {
  return resolveWinBackLoyaltyBonusPoints(settings) > 0;
}

export function formatWinBackBonusAmount(points: number): string {
  return pointsToCurrency(points).toFixed(2);
}

export function buildWinBackIncentiveLines(
  settings: WinBackIncentiveSettings,
  locale: AppLocale,
): WinBackIncentiveLines {
  const promoCode = settings.reEngagementPromoCode?.trim();
  const promoLine = promoCode
    ? t(locale, 'email.winBackPromoLine', { promoCode })
    : '';

  const bonusPoints = resolveWinBackLoyaltyBonusPoints(settings);
  const loyaltyLine =
    bonusPoints > 0
      ? t(locale, 'email.winBackLoyaltyLine', {
          bonusAmount: formatWinBackBonusAmount(bonusPoints),
        })
      : '';

  return { promoLine, loyaltyLine };
}
