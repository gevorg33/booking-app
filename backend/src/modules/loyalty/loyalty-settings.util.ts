import {
  BONUS_DOLLAR_VALUE,
  DEFAULT_EARN_PERCENT_CASHBACK,
  roundBonus,
} from './loyalty.constants.js';

export function getLoyaltyEarnExcludedServiceIds(
  settings?: Record<string, unknown> | null,
): string[] {
  const loyalty = settings?.loyalty;
  if (!loyalty || typeof loyalty !== 'object') {
    return [];
  }
  const raw = (loyalty as Record<string, unknown>).earnExcludedServiceIds;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(
    (id): id is string => typeof id === 'string' && id.length > 0,
  );
}

export function isServiceExcludedFromLoyaltyEarn(
  settings: Record<string, unknown> | null | undefined,
  serviceId: string | null | undefined,
): boolean {
  if (!serviceId) return false;
  return getLoyaltyEarnExcludedServiceIds(settings).includes(serviceId);
}

export function resolveEarnPercentForService(
  settings: Record<string, unknown> | null | undefined,
  serviceId: string,
): number {
  if (isServiceExcludedFromLoyaltyEarn(settings, serviceId)) {
    return 0;
  }
  return getEarnPercentCashback(settings);
}

export function getEarnPercentCashback(
  settings?: Record<string, unknown> | null,
): number {
  const loyalty = settings?.loyalty;
  if (!loyalty || typeof loyalty !== 'object') {
    return DEFAULT_EARN_PERCENT_CASHBACK;
  }
  const raw = (loyalty as Record<string, unknown>).earnPercentCashback;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
    return raw;
  }
  return DEFAULT_EARN_PERCENT_CASHBACK;
}

/** Earn bonuses from eligible cash paid only (excludes loyalty redemption). */
export function calculateEarnPoints(
  amountPaid: number,
  earnPercentCashback: number,
): number {
  const paid = Math.max(0, Number(amountPaid) || 0);
  const percent = Math.max(0, Number(earnPercentCashback) || 0);
  if (paid <= 0 || percent <= 0) return 0;
  return roundBonus((paid * percent) / 100);
}

export function pointsToCurrency(points: number): number {
  return roundBonus(Number(points) || 0);
}

export function maxRedeemablePoints(
  balance: number,
  amountDue: number,
): number {
  const maxByAmount = roundBonus(Math.max(0, amountDue));
  return Math.min(roundBonus(balance), maxByAmount);
}

export function getLoyaltySettingsResponse(
  settings?: Record<string, unknown> | null,
) {
  return {
    earnPercentCashback: getEarnPercentCashback(settings),
    earnExcludedServiceIds: getLoyaltyEarnExcludedServiceIds(settings),
    bonusDollarValue: BONUS_DOLLAR_VALUE,
  };
}
