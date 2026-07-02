/** adopt-6.1 — referral codes, settings, and customer metadata helpers. */

import {
  DEFAULT_REFERRAL_PROGRAM_SETTINGS,
  REFERRAL_METADATA_CODE_USED,
  REFERRAL_METADATA_CONVERTED_AT,
  REFERRAL_METADATA_CONVERTED_BOOKING_ID,
  REFERRAL_METADATA_REFERRED_BY,
  REFERRER_REWARD_TYPES,
  type ReferrerRewardType,
} from './referral-program.fixtures.js';
import { getBusinessDefaultCurrency } from './business-currency.util.js';
import { buildTenantPublicUrl } from './tenant-public-url.util.js';

export {
  DEFAULT_REFERRAL_PROGRAM_SETTINGS,
  REFERRAL_CODE_SCENARIOS,
  REFERRAL_METADATA_CODE_USED,
  REFERRAL_METADATA_CONVERTED_AT,
  REFERRAL_METADATA_CONVERTED_BOOKING_ID,
  REFERRAL_METADATA_REFERRED_BY,
  REFERRAL_RESOLVE_SCENARIOS,
  REFERRAL_SETTINGS_MERGE_SCENARIOS,
  REFERRER_REWARD_TYPES,
  type ReferrerRewardType,
} from './referral-program.fixtures.js';

export interface ReferralProgramSettings {
  enabled: boolean;
  referrerRewardType: ReferrerRewardType;
  referrerBonusPoints: number;
  referrerGiftCardAmount: number;
  refereeBonusPoints: number;
  refereePromoCode: string | null;
}

export function deriveReferralCodeFromCustomerId(customerId: string): string {
  return customerId.replace(/-/g, '').slice(0, 8).toUpperCase() || 'FRIEND';
}

export function normalizeReferralCode(
  raw: string | null | undefined,
): string | null {
  const code = raw?.trim().toUpperCase();
  if (!code || code.length < 4 || code.length > 16) return null;
  if (!/^[A-Z0-9]+$/.test(code)) return null;
  return code;
}

export function mergeReferralProgramSettings(
  businessSettings?: Record<string, unknown> | null,
): ReferralProgramSettings {
  const raw = businessSettings?.referralProgram;
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_REFERRAL_PROGRAM_SETTINGS };
  }
  const input = raw as Record<string, unknown>;
  return {
    enabled: input.enabled !== false,
    referrerRewardType: parseReferrerRewardType(input.referrerRewardType),
    referrerBonusPoints: clampBonusPoints(input.referrerBonusPoints, 25),
    referrerGiftCardAmount: clampGiftCardAmount(
      input.referrerGiftCardAmount,
      25,
    ),
    refereeBonusPoints: clampBonusPoints(input.refereeBonusPoints, 25),
    refereePromoCode:
      typeof input.refereePromoCode === 'string' &&
      input.refereePromoCode.trim()
        ? input.refereePromoCode.trim().toUpperCase()
        : null,
  };
}

function parseReferrerRewardType(raw: unknown): ReferrerRewardType {
  if (
    typeof raw === 'string' &&
    (REFERRER_REWARD_TYPES as readonly string[]).includes(raw)
  ) {
    return raw as ReferrerRewardType;
  }
  return DEFAULT_REFERRAL_PROGRAM_SETTINGS.referrerRewardType;
}

function clampBonusPoints(raw: unknown, fallback: number): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return fallback;
  return Math.max(0, Math.min(500, Math.round(raw)));
}

function clampGiftCardAmount(raw: unknown, fallback: number): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return fallback;
  return Math.max(1, Math.min(500, Math.round(raw * 100) / 100));
}

export function buildReferrerRewardSummary(
  settings: Pick<
    ReferralProgramSettings,
    'referrerRewardType' | 'referrerBonusPoints' | 'referrerGiftCardAmount'
  >,
  businessSettings?: Record<string, unknown> | null,
): string {
  if (settings.referrerRewardType === 'gift_card') {
    const currency = getBusinessDefaultCurrency(businessSettings);
    return `${settings.referrerGiftCardAmount} ${currency} gift card`;
  }
  return `${settings.referrerBonusPoints} loyalty points`;
}

export function readReferredByCustomerId(
  metadata?: Record<string, unknown> | null,
): string | null {
  const value = metadata?.[REFERRAL_METADATA_REFERRED_BY];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function hasReferralConversion(
  metadata?: Record<string, unknown> | null,
): boolean {
  return Boolean(metadata?.[REFERRAL_METADATA_CONVERTED_AT]);
}

export function buildReferralAttributionMetadata(input: {
  referrerCustomerId: string;
  referralCode: string;
}): Record<string, string> {
  return {
    [REFERRAL_METADATA_REFERRED_BY]: input.referrerCustomerId,
    [REFERRAL_METADATA_CODE_USED]: input.referralCode,
  };
}

export function buildReferralConversionMetadata(input: {
  bookingId: string;
  convertedAt?: string;
}): Record<string, string> {
  return {
    [REFERRAL_METADATA_CONVERTED_AT]:
      input.convertedAt ?? new Date().toISOString(),
    [REFERRAL_METADATA_CONVERTED_BOOKING_ID]: input.bookingId,
  };
}

export function buildReferralShareUrl(
  frontendUrl: string,
  slug: string,
  referralCode: string,
  rootDomain?: string,
): string {
  const url = new URL(buildTenantPublicUrl({ slug, frontendUrl, rootDomain }));
  url.searchParams.set('ref', referralCode);
  url.searchParams.set('src', 'referral');
  return url.toString();
}

export function resolveReferrerFromCandidates(
  referralCode: string,
  customerIds: readonly string[],
): string | null {
  const normalized = normalizeReferralCode(referralCode);
  if (!normalized) return null;
  const matches = customerIds.filter(
    (id) => deriveReferralCodeFromCustomerId(id) === normalized,
  );
  return matches.length === 1 ? matches[0] : null;
}

export function canSelfRefer(
  referrerCustomerId: string,
  refereeCustomerId: string,
): boolean {
  return referrerCustomerId !== refereeCustomerId;
}
