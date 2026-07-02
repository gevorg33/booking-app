import {
  EXPLAIN_SHARE_REWARD_PROMPTS,
  type ExplainShareRewardAspect,
  type ExplainShareRewardFixture,
} from './ai-explain-share-reward.fixtures.js';
import { EXPLAIN_SHARE_REWARD_MULTILINGUAL_SCENARIOS } from './ai-explain-share-reward-multilingual.fixtures.js';
import { isReferAFriendPrompt } from './ai-growth-loops-customer.util.js';
import { isShareMyBookingPrompt } from './ai-share-my-booking.util.js';

export const EXPLAIN_SHARE_REWARD_INTENTS = ['explain_share_reward'] as const;

export type ExplainShareRewardIntent =
  (typeof EXPLAIN_SHARE_REWARD_INTENTS)[number];

export { CUSTOMER_EXPLAIN_SHARE_REWARD_CLASSIFIER_RULES } from './ai-explain-share-reward.fixtures.js';

const SHARE_SALON_ACTION_CUE =
  /\b(share|send|copy).{0,30}\b(salon|business|place)\b.{0,20}\b(link|page)\b|\bshare (?:this|the) (?:salon|business)\b/i;

const EXPLAIN_SHARE_REWARD_CUE =
  /\b(do i get|earn|points?).{0,40}\b(shar|share)|\bwhat happens when i share|\bhow do share rewards|\bshare reward|\bpoints when i share|\breward for sharing|\bhow often can i earn|\bwhen can i share again|\bclaim my share reward|\bafter i use the share sheet|\bgrowth card reward|\bshare reward (?:program|policy|cooldown)\b/i;

const BOOKING_REWARD_CUE =
  /\b(share my booking|sharing my (?:booking|appointment|visit)|when i share my booking|share a booking|appointment link reward)\b/i;

const SALON_REWARD_CUE =
  /\b(sharing the salon|share the salon link|salon link reward|growth card|share this (?:salon|place))\b/i;

const COOLDOWN_CUE =
  /\b(how often|when can i share again|cooldown|limit|again for a reward)\b/i;

const CLAIM_FLOW_CUE =
  /\b(claim|after i use the share sheet|after (?:i )?share|native share|share sheet)\b/i;

function matchExplainShareRewardScenario(
  prompt: string,
): ExplainShareRewardFixture | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of EXPLAIN_SHARE_REWARD_PROMPTS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_SHARE_REWARD_MULTILINGUAL_SCENARIOS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function containsArmenianScript(prompt: string): boolean {
  return /[\u0530-\u058F]/.test(prompt);
}

function containsCyrillicScript(prompt: string): boolean {
  return /[\u0400-\u04FF]/.test(prompt);
}

export function resolveExplainShareRewardAspect(
  prompt: string,
): ExplainShareRewardAspect {
  const scenario = matchExplainShareRewardScenario(prompt);
  if (scenario?.aspect) return scenario.aspect;
  if (COOLDOWN_CUE.test(prompt)) return 'cooldown';
  if (CLAIM_FLOW_CUE.test(prompt)) return 'claim_flow';
  if (BOOKING_REWARD_CUE.test(prompt)) return 'booking_reward';
  if (SALON_REWARD_CUE.test(prompt)) return 'salon_reward';
  return 'how_it_works';
}

export function isExplainShareRewardPrompt(prompt: string): boolean {
  if (matchExplainShareRewardScenario(prompt)) return true;
  if (isReferAFriendPrompt(prompt)) return false;
  if (isShareMyBookingPrompt(prompt)) return false;
  if (
    SHARE_SALON_ACTION_CUE.test(prompt) &&
    !EXPLAIN_SHARE_REWARD_CUE.test(prompt)
  ) {
    return false;
  }

  if (
    (containsArmenianScript(prompt) &&
      /(միավոր|պարգև|կիս)/i.test(prompt) &&
      /(կիս|ամրագր|հղում|սրահ)/i.test(prompt) &&
      /(ստան|ինչ|պարգև|միավոր)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(балл|наград|подел|делюсь)/i.test(prompt) &&
      /(подел|запис|ссылк|салон|публикац)/i.test(prompt) &&
      /(получ|что|наград|балл|часто)/i.test(prompt))
  ) {
    return true;
  }

  return EXPLAIN_SHARE_REWARD_CUE.test(prompt);
}

export function isExplainShareRewardIntent(
  action: string,
): action is ExplainShareRewardIntent {
  return (EXPLAIN_SHARE_REWARD_INTENTS as readonly string[]).includes(action);
}

export interface ParsedExplainShareReward {
  aspect: ExplainShareRewardAspect;
}

export function parseExplainShareRewardFromPrompt(
  prompt: string,
): ParsedExplainShareReward | null {
  if (!isExplainShareRewardPrompt(prompt)) return null;
  return { aspect: resolveExplainShareRewardAspect(prompt) };
}

export function rescueExplainShareRewardIntent(
  prompt: string,
  action: string,
): { action: ExplainShareRewardIntent; rescueReason: string } | null {
  if (isExplainShareRewardIntent(action)) return null;
  if (!parseExplainShareRewardFromPrompt(prompt)) return null;
  return {
    action: 'explain_share_reward',
    rescueReason: 'share_reward',
  };
}

export interface ShareRewardExplainContext {
  enabled: boolean;
  bookingShareEnabled: boolean;
  salonShareEnabled: boolean;
  bookingRewardSummary: string;
  salonRewardSummary: string;
  cooldownHours: number;
  bookingNextEligibleAt: string | null;
  salonNextEligibleAt: string | null;
}

function formatEligibleAt(value: string | null): string {
  if (!value) return 'available now';
  const when = value.slice(0, 16).replace('T', ' ');
  return `after ${when}`;
}

export function buildShareRewardHowItWorksLines(
  view?: ShareRewardExplainContext | null,
): string[] {
  const lines = [
    'When share rewards are enabled, sharing a confirmed booking or the salon link from Account can earn a perk after a successful native share.',
    'Booking shares: open Account → My bookings and tap Share booking. Salon shares: Account → Growth → Share link.',
  ];
  if (view?.enabled) {
    if (view.bookingShareEnabled) {
      lines.push(`Booking share reward: ${view.bookingRewardSummary}.`);
    }
    if (view.salonShareEnabled) {
      lines.push(`Salon share reward: ${view.salonRewardSummary}.`);
    }
  } else if (view && !view.enabled) {
    lines.push(
      'Share rewards are not enabled for this salon right now — you can still share links, but no bonus is awarded.',
    );
  }
  return lines;
}

export function buildShareRewardBookingLines(
  view?: ShareRewardExplainContext | null,
): string[] {
  const lines = [
    'Tap Share booking on a confirmed visit in My bookings to open the native share sheet with a deep link.',
    'After a successful share, the app automatically tries to claim a booking share reward when you are eligible.',
  ];
  if (view?.bookingShareEnabled) {
    lines.push(`Eligible shares can earn ${view.bookingRewardSummary}.`);
  } else if (view && view.enabled) {
    lines.push('Booking share rewards are not enabled for this salon.');
  }
  return lines;
}

export function buildShareRewardSalonLines(
  view?: ShareRewardExplainContext | null,
): string[] {
  const lines = [
    'Open Account → Growth and tap Share link to share the salon booking page through the native share sheet.',
    'After sharing, the app may claim a salon share reward when eligible.',
  ];
  if (view?.salonShareEnabled) {
    lines.push(`Eligible shares can earn ${view.salonRewardSummary}.`);
  } else if (view && view.enabled) {
    lines.push('Salon share rewards are not enabled for this salon.');
  }
  return lines;
}

export function buildShareRewardCooldownLines(
  view?: ShareRewardExplainContext | null,
): string[] {
  const cooldown = view?.cooldownHours ?? 24;
  const lines = [
    `Share rewards may have a cooldown of about ${cooldown} hours between claims per channel.`,
    'Booking and salon share rewards are tracked separately.',
  ];
  if (view) {
    lines.push(
      `Booking share reward ${formatEligibleAt(view.bookingNextEligibleAt)}.`,
      `Salon share reward ${formatEligibleAt(view.salonNextEligibleAt)}.`,
    );
  }
  return lines;
}

export function buildShareRewardClaimFlowLines(
  view?: ShareRewardExplainContext | null,
): string[] {
  const lines = [
    'You do not tap a separate Claim button — after the native share completes, the app calls the share-reward API in the background.',
    'If you are eligible, you will see a toast such as "You earned {reward} for sharing!"',
    'If rewards are disabled, on cooldown, or the booking is not shareable, no bonus is awarded.',
  ];
  if (view?.enabled && (view.bookingShareEnabled || view.salonShareEnabled)) {
    lines.push(
      'Sign in with the same account you used to book so rewards can be credited.',
    );
  }
  return lines;
}

export function assembleShareRewardSummary(
  aspect: ExplainShareRewardAspect,
  view?: ShareRewardExplainContext | null,
): string {
  const lines: string[] = [];
  switch (aspect) {
    case 'booking_reward':
      lines.push(...buildShareRewardBookingLines(view));
      break;
    case 'salon_reward':
      lines.push(...buildShareRewardSalonLines(view));
      break;
    case 'cooldown':
      lines.push(...buildShareRewardCooldownLines(view));
      break;
    case 'claim_flow':
      lines.push(...buildShareRewardClaimFlowLines(view));
      break;
    case 'how_it_works':
    default:
      lines.push(...buildShareRewardHowItWorksLines(view));
      break;
  }

  if (aspect !== 'claim_flow' && aspect !== 'cooldown') {
    lines.push(
      'Ask "How do I claim my share reward?" to hear about automatic claiming after the share sheet.',
    );
  }

  return lines.join(' ');
}

export function buildExplainShareRewardNavigate(
  aspect: ExplainShareRewardAspect,
) {
  if (aspect === 'booking_reward') {
    return { path: 'account', query: { section: 'bookings' } };
  }
  return { path: 'account', query: { section: 'growth' } };
}
