/** Dashboard share reward settings (business.settings.shareRewards). */

export type ShareRewardKind = 'loyalty_points' | 'gift_card';

export interface ShareRewardChannelForm {
  enabled: boolean;
  rewardType: ShareRewardKind;
  loyaltyPoints: number;
  giftCardAmount: number;
}

export interface ShareRewardsFormState {
  enabled: boolean;
  cooldownHours: number;
  salon: ShareRewardChannelForm;
  booking: ShareRewardChannelForm;
}

export const DEFAULT_SHARE_REWARDS_FORM: ShareRewardsFormState = {
  enabled: true,
  cooldownHours: 24,
  salon: {
    enabled: true,
    rewardType: 'loyalty_points',
    loyaltyPoints: 5,
    giftCardAmount: 5,
  },
  booking: {
    enabled: true,
    rewardType: 'loyalty_points',
    loyaltyPoints: 10,
    giftCardAmount: 10,
  },
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

function readChannel(raw: unknown, defaults: ShareRewardChannelForm): ShareRewardChannelForm {
  if (!raw || typeof raw !== 'object') return { ...defaults };
  const input = raw as Record<string, unknown>;
  return {
    enabled: input.enabled !== false,
    rewardType: input.rewardType === 'gift_card' ? 'gift_card' : 'loyalty_points',
    loyaltyPoints: clampPoints(input.loyaltyPoints, defaults.loyaltyPoints),
    giftCardAmount: clampAmount(input.giftCardAmount, defaults.giftCardAmount),
  };
}

export function readShareRewardsForm(
  settings?: Record<string, unknown> | null,
): ShareRewardsFormState {
  const raw = settings?.shareRewards;
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SHARE_REWARDS_FORM };
  const input = raw as Record<string, unknown>;
  const cooldown = Number(input.cooldownHours);
  return {
    enabled: input.enabled !== false,
    cooldownHours: Number.isFinite(cooldown)
      ? Math.max(1, Math.min(168, Math.round(cooldown)))
      : DEFAULT_SHARE_REWARDS_FORM.cooldownHours,
    salon: readChannel(input.salon, DEFAULT_SHARE_REWARDS_FORM.salon),
    booking: readChannel(input.booking, DEFAULT_SHARE_REWARDS_FORM.booking),
  };
}

export function buildShareRewardsSavePayload(
  form: ShareRewardsFormState,
): Record<string, unknown> {
  return {
    enabled: form.enabled,
    cooldownHours: form.cooldownHours,
    salon: form.salon,
    booking: form.booking,
  };
}

export function describeShareReward(
  channel: ShareRewardChannelForm,
  formatMoney: (amount: number) => string,
): string {
  if (channel.rewardType === 'gift_card') return formatMoney(channel.giftCardAmount);
  return `${channel.loyaltyPoints} pts`;
}
