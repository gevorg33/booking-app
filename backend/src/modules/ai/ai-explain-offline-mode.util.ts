import {
  EXPLAIN_OFFLINE_MODE_PROMPTS,
  type ExplainOfflineModeAspect,
  type ExplainOfflineModeFixture,
} from './ai-explain-offline-mode.fixtures.js';
import { EXPLAIN_OFFLINE_MODE_MULTILINGUAL_SCENARIOS } from './ai-explain-offline-mode-multilingual.fixtures.js';
import {
  isOfflineQueueStatusPrompt,
  isRetryOfflineActionPrompt,
} from './ai-push-notifications.util.js';
import { isExplainAppUpdateRequiredPrompt } from './ai-explain-app-update-required.util.js';
import { isSwitchToConsumerAppPrompt } from './ai-marketing-growth.util.js';
import { isHowToDownloadAppPrompt } from './ai-how-to-download-app.util.js';
import { isExplainRecommendationAnalyticsPrompt } from './ai-recommendation-analytics.util.js';
import { isSummarizeRecommendationPerformancePrompt } from './ai-recommendation-performance.util.js';

export const EXPLAIN_OFFLINE_MODE_INTENTS = ['explain_offline_mode'] as const;

export type ExplainOfflineModeIntent =
  (typeof EXPLAIN_OFFLINE_MODE_INTENTS)[number];

export { CUSTOMER_EXPLAIN_OFFLINE_MODE_CLASSIFIER_RULES } from './ai-explain-offline-mode.fixtures.js';

const PROVIDER_OFFLINE_CUE =
  /\b(provider\s+app|provider\s+mobile|today\s+tab|floor\s+status|staff\s+app)\b/i;

const CONSUMER_OFFLINE_CUE =
  /\b(why.{0,30}(offline|no internet)|say(?:s|ing)?\s+offline|offline\s+banner|consumer\s+app|this\s+app|saved\s+salon|cached|waiting\s+to\s+sync|changes?\s+waiting|pending\s+sync|will.{0,20}sync|back\s+online|reconnect)\b/i;

const CONSUMER_OFFLINE_BOOKING_CUE =
  /\b(?:my\s+booking|go\s+through)\b.*\b(?:offline|sync|queue|reconnect|online)\b|\b(?:offline|sync|queue|reconnect|online)\b.*\b(?:my\s+booking|go\s+through)\b/i;

const WHY_OFFLINE_CUE =
  /\b(why.{0,30}offline|offline\s+banner|no\s+internet|say(?:s|ing)?\s+offline)\b/i;

const WILL_SYNC_CUE =
  /\b(will.{0,30}sync|sync\s+when|go\s+through|reconnect|canceled?\s+offline|reschedule.{0,20}offline)\b/i;

const QUEUED_CUE =
  /\b(how\s+many|waiting\s+to\s+sync|pending\s+sync|queued|changes?\s+waiting)\b/i;

const CACHED_CUE =
  /\b(saved\s+salon|cached|last\s+visit|saved\s+info|showing\s+saved)\b/i;

function containsArmenianScript(prompt: string): boolean {
  return /[\u0530-\u058F]/.test(prompt);
}

function containsCyrillicScript(prompt: string): boolean {
  return /[\u0400-\u04FF]/.test(prompt);
}

function matchExplainOfflineModeScenario(
  prompt: string,
): ExplainOfflineModeFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_OFFLINE_MODE_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_OFFLINE_MODE_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function resolveExplainOfflineModeAspect(
  prompt: string,
): ExplainOfflineModeAspect {
  const scenario = matchExplainOfflineModeScenario(prompt);
  if (scenario?.aspect) return scenario.aspect;
  if (CACHED_CUE.test(prompt)) return 'cached_browse';
  if (QUEUED_CUE.test(prompt)) return 'queued_changes';
  if (WILL_SYNC_CUE.test(prompt)) return 'will_sync';
  if (WHY_OFFLINE_CUE.test(prompt)) return 'why_offline';
  if (/\bhow\s+does\s+offline\b/i.test(prompt)) return 'how_it_works';
  return 'how_it_works';
}

export function isExplainOfflineModePrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (isSwitchToConsumerAppPrompt(text)) return false;
  if (isHowToDownloadAppPrompt(text)) return false;
  if (isExplainRecommendationAnalyticsPrompt(text)) return false;
  if (isSummarizeRecommendationPerformancePrompt(text)) return false;
  if (matchExplainOfflineModeScenario(text)) return true;
  if (isExplainAppUpdateRequiredPrompt(text)) return false;
  if (PROVIDER_OFFLINE_CUE.test(text)) return false;
  if (
    (isOfflineQueueStatusPrompt(text) || isRetryOfflineActionPrompt(text)) &&
    !CONSUMER_OFFLINE_CUE.test(text)
  ) {
    return false;
  }

  if (
    (containsArmenianScript(text) &&
      /(offline|համաժամաց|փոփոխություն|internet)/i.test(text) &&
      /(ինչու|կհամաժամաց|սպասում|գրվում)/i.test(text)) ||
    (containsCyrillicScript(text) &&
      /(offline|синхрониз|изменен|интернет|сохран)/i.test(text) &&
      /(почему|синхрониз|ожида|показыва)/i.test(text))
  ) {
    return true;
  }

  return (
    CONSUMER_OFFLINE_CUE.test(text) || CONSUMER_OFFLINE_BOOKING_CUE.test(text)
  );
}

export function isExplainOfflineModeIntent(
  action: string,
): action is ExplainOfflineModeIntent {
  return (EXPLAIN_OFFLINE_MODE_INTENTS as readonly string[]).includes(action);
}

export interface ParsedExplainOfflineMode {
  aspect: ExplainOfflineModeAspect;
}

export function parseExplainOfflineModeFromPrompt(
  prompt: string,
): ParsedExplainOfflineMode | null {
  if (!isExplainOfflineModePrompt(prompt)) return null;
  return { aspect: resolveExplainOfflineModeAspect(prompt) };
}

export function rescueExplainOfflineModeIntent(
  prompt: string,
  action: string,
): { action: ExplainOfflineModeIntent; rescueReason: string } | null {
  if (isExplainOfflineModeIntent(action)) return null;
  if (!parseExplainOfflineModeFromPrompt(prompt)) return null;
  return {
    action: 'explain_offline_mode',
    rescueReason: 'consumer_offline',
  };
}

export interface ConsumerOfflineExplainContext {
  online: boolean;
  queuedCount: number;
  fromCache: boolean;
}

export function resolveConsumerOfflineExplainContext(
  params: Record<string, unknown>,
): ConsumerOfflineExplainContext {
  const online = params.online !== false && params.isOnline !== false;
  const rawCount = Number(params.offlineQueueCount ?? params.queuedCount ?? 0);
  const queuedCount =
    Number.isFinite(rawCount) && rawCount > 0 ? Math.round(rawCount) : 0;
  const fromCache =
    params.fromCache === true || params.offlineFromCache === true;
  return { online, queuedCount, fromCache };
}

export function buildWhyOfflineLines(
  ctx: ConsumerOfflineExplainContext,
): string[] {
  const lines = [
    'The consumer app shows offline when your phone loses network connectivity.',
    'You can still browse saved salon info, but live availability and payments need internet.',
  ];
  if (!ctx.online) {
    lines.push(
      'You are offline right now — booking changes you make may queue until you reconnect.',
    );
  }
  if (ctx.fromCache) {
    lines.push(
      'Services or salon details may show from your last visit while offline.',
    );
  }
  return lines;
}

export function buildWillSyncLines(
  ctx: ConsumerOfflineExplainContext,
): string[] {
  const lines = [
    'Cancel and reschedule actions you start while offline are saved on this device and replay automatically when you reconnect.',
    'Supported queued mutations include account cancel/reschedule and manage-link cancel/reschedule.',
  ];
  if (ctx.queuedCount > 0) {
    lines.push(
      `You currently have ${ctx.queuedCount} change${ctx.queuedCount === 1 ? '' : 's'} waiting to sync.`,
    );
  } else if (ctx.online) {
    lines.push(
      'You are online and nothing is waiting in the offline queue right now.',
    );
  } else {
    lines.push(
      'When you are back online, the banner clears after the queue finishes syncing.',
    );
  }
  return lines;
}

export function buildQueuedChangesLines(
  ctx: ConsumerOfflineExplainContext,
): string[] {
  if (ctx.queuedCount > 0) {
    return [
      `${ctx.queuedCount} booking change${ctx.queuedCount === 1 ? ' is' : 's are'} queued on this device.`,
      ctx.online
        ? 'You are online — the app is syncing them now. The banner clears when the queue is empty.'
        : 'Stay on the app after you reconnect so the queue can replay safely.',
    ];
  }
  return [
    'No booking changes are queued on this device right now.',
    'If you cancel or reschedule while offline, the count appears in the offline banner.',
  ];
}

export function buildCachedBrowseLines(): string[] {
  return [
    'When offline, the app may show salon services and details cached from your last visit.',
    'Prices, slots, and live availability refresh once you are back online.',
    'Queued cancel/reschedule actions still sync separately from cached browsing.',
  ];
}

export function buildOfflineModeHowItWorksLines(
  ctx: ConsumerOfflineExplainContext,
): string[] {
  const lines = [
    'Offline mode lets you review saved salon info and queue safe booking mutations without a live connection.',
    'New bookings and payments still need internet. Cancel/reschedule can queue and replay on reconnect.',
  ];
  if (!ctx.online)
    lines.push(
      'You appear offline — watch the banner at the top for queue status.',
    );
  if (ctx.queuedCount > 0) {
    lines.push(
      `${ctx.queuedCount} queued action${ctx.queuedCount === 1 ? '' : 's'} will sync when possible.`,
    );
  }
  return lines;
}

export function assembleOfflineModeSummary(
  aspect: ExplainOfflineModeAspect,
  ctx: ConsumerOfflineExplainContext,
): string {
  let lines: string[];
  switch (aspect) {
    case 'why_offline':
      lines = buildWhyOfflineLines(ctx);
      break;
    case 'will_sync':
      lines = buildWillSyncLines(ctx);
      break;
    case 'queued_changes':
      lines = buildQueuedChangesLines(ctx);
      break;
    case 'cached_browse':
      lines = buildCachedBrowseLines();
      break;
    case 'how_it_works':
    default:
      lines = buildOfflineModeHowItWorksLines(ctx);
      break;
  }
  return lines.join(' ');
}
