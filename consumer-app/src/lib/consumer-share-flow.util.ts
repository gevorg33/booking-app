/** adopt-6.2 — share flow + optional reward claim after native share. */

import { track } from './app-analytics.js';
import type { ShareRewardClaimResponse } from './types.js';
import {
  shareBookingLink,
  shareSalonLink,
  type NativeSharePayload,
} from './consumer-growth-loops.util.js';

export async function shareSalonLinkWithReward(input: {
  slug: string;
  businessName: string;
  serviceId?: string | null;
  serviceName?: string | null;
  employeeId?: string | null;
  origin?: string;
  claimReward?: () => Promise<ShareRewardClaimResponse>;
}): Promise<{
  status: 'shared' | 'copied' | 'unavailable';
  reward?: ShareRewardClaimResponse;
}> {
  const status = await shareSalonLink(input);
  return finalizeShareReward(status, 'salon', input.slug, input.claimReward);
}

export async function shareBookingLinkWithReward(input: {
  slug: string;
  businessName: string;
  booking: {
    id: string;
    serviceId: string;
    serviceName: string;
    employeeId: string;
  };
  origin?: string;
  claimReward?: () => Promise<ShareRewardClaimResponse>;
}): Promise<{
  status: 'shared' | 'copied' | 'unavailable';
  reward?: ShareRewardClaimResponse;
}> {
  const status = await shareBookingLink(input);
  return finalizeShareReward(status, 'booking', input.slug, input.claimReward);
}

async function finalizeShareReward(
  status: 'shared' | 'copied' | 'unavailable',
  channel: 'salon' | 'booking',
  slug: string,
  claimReward?: () => Promise<ShareRewardClaimResponse>,
): Promise<{
  status: 'shared' | 'copied' | 'unavailable';
  reward?: ShareRewardClaimResponse;
}> {
  if (status === 'unavailable' || !claimReward) return { status };
  try {
    const reward = await claimReward();
    if (reward.awarded) {
      track('share_reward_claimed', { channel, slug });
    }
    return { status, reward };
  } catch {
    return { status };
  }
}

export function formatShareRewardToast(
  reward: ShareRewardClaimResponse | undefined,
  template: string,
): string | null {
  if (!reward?.awarded || !reward.rewardSummary) return null;
  return template.replace('{reward}', reward.rewardSummary);
}

export type { NativeSharePayload };
