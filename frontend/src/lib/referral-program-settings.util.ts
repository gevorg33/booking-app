/** Dashboard referral program settings (stored on business.settings.referralProgram). */

export type ReferrerRewardType = 'loyalty_points' | 'gift_card';

export interface ReferralProgramFormState {
  enabled: boolean;
  referrerRewardType: ReferrerRewardType;
  referrerBonusPoints: number;
  referrerGiftCardAmount: number;
  refereeBonusPoints: number;
  refereePromoCode: string;
}

export const DEFAULT_REFERRAL_PROGRAM_FORM: ReferralProgramFormState = {
  enabled: true,
  referrerRewardType: 'loyalty_points',
  referrerBonusPoints: 25,
  referrerGiftCardAmount: 25,
  refereeBonusPoints: 25,
  refereePromoCode: '',
};

function clampPoints(raw: unknown, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(500, Math.round(n)));
}

function clampAmount(raw: unknown, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(500, Math.round(n * 100) / 100));
}

function parseRewardType(raw: unknown): ReferrerRewardType {
  return raw === 'gift_card' ? 'gift_card' : 'loyalty_points';
}

export function readReferralProgramForm(
  settings?: Record<string, unknown> | null,
): ReferralProgramFormState {
  const raw = settings?.referralProgram;
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_REFERRAL_PROGRAM_FORM };
  }
  const input = raw as Record<string, unknown>;
  return {
    enabled: input.enabled !== false,
    referrerRewardType: parseRewardType(input.referrerRewardType),
    referrerBonusPoints: clampPoints(input.referrerBonusPoints, 25),
    referrerGiftCardAmount: clampAmount(input.referrerGiftCardAmount, 25),
    refereeBonusPoints: clampPoints(input.refereeBonusPoints, 25),
    refereePromoCode:
      typeof input.refereePromoCode === 'string' ? input.refereePromoCode.trim().toUpperCase() : '',
  };
}

export function buildReferralProgramSavePayload(
  form: ReferralProgramFormState,
): Record<string, unknown> {
  return {
    enabled: form.enabled,
    referrerRewardType: form.referrerRewardType,
    referrerBonusPoints: form.referrerBonusPoints,
    referrerGiftCardAmount: form.referrerGiftCardAmount,
    refereeBonusPoints: form.refereeBonusPoints,
    refereePromoCode: form.refereePromoCode.trim().toUpperCase() || null,
  };
}

export function describeReferrerReward(
  form: Pick<
    ReferralProgramFormState,
    'referrerRewardType' | 'referrerBonusPoints' | 'referrerGiftCardAmount'
  >,
  formatMoney: (amount: number) => string,
): string {
  if (form.referrerRewardType === 'gift_card') {
    return formatMoney(form.referrerGiftCardAmount);
  }
  return `${form.referrerBonusPoints} pts`;
}
