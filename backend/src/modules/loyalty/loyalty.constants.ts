/** Each bonus unit equals $1 when redeemed. */
export const BONUS_DOLLAR_VALUE = 1;

/** Default earn rate when tenant has not configured loyalty (5% of amount paid). */
export const DEFAULT_EARN_PERCENT_CASHBACK = 5;

export function roundBonus(value: number): number {
  return Math.round(Math.max(0, value) * 100) / 100;
}
