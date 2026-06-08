/** adopt-6.2 — share salon/booking reward settings and cooldown helpers. */

import { getBusinessDefaultCurrency } from './business-currency.util.js';
import {
  DEFAULT_SHARE_REWARDS_SETTINGS,
  SHARE_REWARD_METADATA_BOOKING_LAST_AT,
  SHARE_REWARD_METADATA_SALON_LAST_AT,
} from './share-rewards.fixtures.js';

export {
  DEFAULT_SHARE_REWARDS_SETTINGS,
  SHARE_REWARD_COOLDOWN_SCENARIOS,
  SHARE_REWARD_METADATA_BOOKING_LAST_AT,
  SHARE_REWARD_METADATA_SALON_LAST_AT,
} from './share-rewards.fixtures.js';

export type ShareRewardChannel = 'salon' | 'booking';
export type ShareRewardKind = 'loyalty_points' | 'gift_card';

export interface ShareRewardChannelSettings {
  enabled: boolean;
  rewardType: ShareRewardKind;
  loyaltyPoints: number;
  giftCardAmount: number;
}

export interface ShareRewardsSettings {
  enabled: boolean;
  cooldownHours: number;
  salon: ShareRewardChannelSettings;
  booking: ShareRewardChannelSettings;
}

export function mergeShareRewardsSettings(
  businessSettings?: Record<string, unknown> | null,
): ShareRewardsSettings {
  const raw = businessSettings?.shareRewards;
  if (!raw || typeof raw !== 'object') {
    return {
      enabled: DEFAULT_SHARE_REWARDS_SETTINGS.enabled,
      cooldownHours: DEFAULT_SHARE_REWARDS_SETTINGS.cooldownHours,
      salon: { ...DEFAULT_SHARE_REWARDS_SETTINGS.salon },
      booking: { ...DEFAULT_SHARE_REWARDS_SETTINGS.booking },
    };
  }
  const input = raw as Record<string, unknown>;
  return {
    enabled: input.enabled !== false,
    cooldownHours: clampCooldownHours(input.cooldownHours),
    salon: mergeChannelSettings(
      input.salon,
      DEFAULT_SHARE_REWARDS_SETTINGS.salon,
    ),
    booking: mergeChannelSettings(
      input.booking,
      DEFAULT_SHARE_REWARDS_SETTINGS.booking,
    ),
  };
}

function mergeChannelSettings(
  raw: unknown,
  defaults: ShareRewardChannelSettings,
): ShareRewardChannelSettings {
  if (!raw || typeof raw !== 'object') return { ...defaults };
  const input = raw as Record<string, unknown>;
  return {
    enabled: input.enabled !== false,
    rewardType: parseRewardKind(input.rewardType, defaults.rewardType),
    loyaltyPoints: clampPoints(input.loyaltyPoints, defaults.loyaltyPoints),
    giftCardAmount: clampAmount(input.giftCardAmount, defaults.giftCardAmount),
  };
}

function parseRewardKind(raw: unknown, fallback: ShareRewardKind): ShareRewardKind {
  return raw === 'gift_card' ? 'gift_card' : fallback === 'gift_card' ? 'gift_card' : 'loyalty_points';
}

function clampCooldownHours(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return DEFAULT_SHARE_REWARDS_SETTINGS.cooldownHours;
  }
  return Math.max(1, Math.min(168, Math.round(raw)));
}

function clampPoints(raw: unknown, fallback: number): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return fallback;
  return Math.max(0, Math.min(500, Math.round(raw)));
}

function clampAmount(raw: unknown, fallback: number): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return fallback;
  return Math.max(1, Math.min(500, Math.round(raw * 100) / 100));
}

export function shareRewardMetadataKey(channel: ShareRewardChannel): string {
  return channel === 'salon'
    ? SHARE_REWARD_METADATA_SALON_LAST_AT
    : SHARE_REWARD_METADATA_BOOKING_LAST_AT;
}

export function readShareRewardLastAt(
  metadata: Record<string, unknown> | null | undefined,
  channel: ShareRewardChannel,
): string | null {
  const value = metadata?.[shareRewardMetadataKey(channel)];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function isShareRewardEligible(
  lastAt: string | null | undefined,
  cooldownHours: number,
  now = new Date(),
): boolean {
  if (!lastAt) return true;
  const previous = Date.parse(lastAt);
  if (!Number.isFinite(previous)) return true;
  const elapsedMs = now.getTime() - previous;
  return elapsedMs >= cooldownHours * 60 * 60 * 1000;
}

export function nextShareRewardEligibleAt(
  lastAt: string | null | undefined,
  cooldownHours: number,
): string | null {
  if (!lastAt) return null;
  const previous = Date.parse(lastAt);
  if (!Number.isFinite(previous)) return null;
  return new Date(previous + cooldownHours * 60 * 60 * 1000).toISOString();
}

export function buildShareRewardSummary(
  channelSettings: ShareRewardChannelSettings,
  businessSettings?: Record<string, unknown> | null,
): string {
  if (channelSettings.rewardType === 'gift_card') {
    const currency = getBusinessDefaultCurrency(businessSettings);
    return `${channelSettings.giftCardAmount} ${currency} gift card`;
  }
  return `${channelSettings.loyaltyPoints} loyalty points`;
}

export function channelSettingsFor(
  settings: ShareRewardsSettings,
  channel: ShareRewardChannel,
): ShareRewardChannelSettings {
  return channel === 'salon' ? settings.salon : settings.booking;
}

export function isShareChannelEnabled(
  settings: ShareRewardsSettings,
  channel: ShareRewardChannel,
): boolean {
  if (!settings.enabled) return false;
  return channelSettingsFor(settings, channel).enabled;
}
