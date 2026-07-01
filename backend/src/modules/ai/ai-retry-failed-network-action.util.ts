import { isExplainOfflineModePrompt } from './ai-explain-offline-mode.util.js';
import {
  isOfflineQueueStatusPrompt,
  isRetryOfflineActionPrompt,
} from './ai-push-notifications.util.js';
import { isConsumerDiagnoseStripeCheckoutFailurePrompt } from './ai-diagnose-stripe-checkout-failure.util.js';
import { CUSTOMER_RETRY_FAILED_NETWORK_ACTION_CLASSIFIER_RULES } from './ai-retry-failed-network-action.fixtures.js';
import { RETRY_FAILED_NETWORK_ACTION_MULTILINGUAL_SCENARIOS } from './ai-retry-failed-network-action-multilingual.fixtures.js';
import type { RetryFailedNetworkActionAspect } from './ai-retry-failed-network-action.fixtures.js';
import {
  resolveConsumerOfflineExplainContext,
  type ConsumerOfflineExplainContext,
} from './ai-explain-offline-mode.util.js';

export { CUSTOMER_RETRY_FAILED_NETWORK_ACTION_CLASSIFIER_RULES };

/** Matches consumer-app `networkRetryAction`. */
export const NETWORK_RETRY_ACTION_LABEL = 'Try again';

/** Matches consumer-app `networkLoadFailed`. */
export const NETWORK_LOAD_FAILED_HINT =
  'Could not load. Check your connection and try again.';

export const RETRY_FAILED_NETWORK_ACTION_INTENTS = [
  'retry_failed_network_action',
] as const;

export type RetryFailedNetworkActionIntent =
  (typeof RETRY_FAILED_NETWORK_ACTION_INTENTS)[number];

const PROVIDER_OFFLINE_CUE =
  /\b(provider\s+app|provider\s+mobile|today\s+tab|floor\s+status|staff\s+app)\b/i;

const RETRY_CUE = new RegExp(
  String.raw`\b(retry|try\s+again|resync|replay|reload|re-?try)\b|կրկին\s+փորձ|повтор`,
  'iu',
);

const NETWORK_FAILURE_CUE = new RegExp(
  String.raw`\b(sync\s+failed|failed\s+to\s+sync|stuck\s+sync|booking\s+(?:did(?:n't| not)\s+save|failed|not\s+saved)|did(?:n't| not)\s+save|could(?:n't| not)\s+load|network\s+error|connection\s+(?:lost|failed)|submit\s+failed|load\s+failed|offline\s+queue|queued\s+(?:booking\s+)?changes?)\b|չպահպան|ձախող|не\s+сохран|синхрониз`,
  'iu',
);

const EXPLAIN_ONLY_CUE = new RegExp(
  String.raw`\b(why.{0,30}offline|will.{0,30}sync|how\s+does\s+offline|what\s+is\s+offline)\b`,
  'iu',
);

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function matchMultilingualScenario(
  prompt: string,
): (typeof RETRY_FAILED_NETWORK_ACTION_MULTILINGUAL_SCENARIOS)[number] | null {
  const trimmed = prompt.trim();
  return (
    RETRY_FAILED_NETWORK_ACTION_MULTILINGUAL_SCENARIOS.find(
      (scenario) => scenario.prompt === trimmed,
    ) ?? null
  );
}

export function isRetryFailedNetworkActionIntent(
  action: string,
): action is RetryFailedNetworkActionIntent {
  return (RETRY_FAILED_NETWORK_ACTION_INTENTS as readonly string[]).includes(
    action,
  );
}

export function parseRetryFailedNetworkActionAspect(
  prompt: string,
  params: Record<string, unknown> = {},
): RetryFailedNetworkActionAspect {
  const fromParams = readString(params.aspect);
  if (
    fromParams === 'booking_not_saved' ||
    fromParams === 'sync_failed' ||
    fromParams === 'load_failed' ||
    fromParams === 'retry_queued' ||
    fromParams === 'generic' ||
    fromParams === 'all'
  ) {
    return fromParams;
  }

  const text = prompt.trim();
  if (/\bsync\s+failed\b/i.test(text) || /\bstuck\s+sync/i.test(text)) {
    return 'sync_failed';
  }
  if (
    /\b(could(?:n't| not)\s+load|page\s+failed|load\s+failed)\b/i.test(text)
  ) {
    return 'load_failed';
  }
  if (/\b(queued|offline\s+queue|resync)\b/i.test(text)) return 'retry_queued';
  if (
    /\b(booking\s+(?:did(?:n't| not)\s+save|failed|not\s+saved)|did(?:n't| not)\s+save|submit\s+failed|connection\s+lost)\b/i.test(
      text,
    )
  ) {
    return 'booking_not_saved';
  }
  return 'generic';
}

export function isRetryFailedNetworkActionPrompt(prompt: string): boolean {
  if (matchMultilingualScenario(prompt)) return true;
  if (isConsumerDiagnoseStripeCheckoutFailurePrompt(prompt)) return false;
  if (PROVIDER_OFFLINE_CUE.test(prompt)) return false;
  if (EXPLAIN_ONLY_CUE.test(prompt) && !RETRY_CUE.test(prompt)) return false;
  if (isExplainOfflineModePrompt(prompt) && !RETRY_CUE.test(prompt))
    return false;
  if (isOfflineQueueStatusPrompt(prompt)) return false;
  if (
    isRetryOfflineActionPrompt(prompt) &&
    !/\b(booking|consumer|my\s+changes?|queued\s+booking)\b/i.test(prompt)
  ) {
    return false;
  }

  const text = prompt.trim();
  if (!text) return false;

  if (/\bbooking\s+did(?:n't| not)\s+save\b/i.test(text)) return true;
  if (/^sync\s+failed\.?$/i.test(text)) return true;
  if (/^try\s+again\.?$/i.test(text)) return true;
  if (/\bcould(?:n't| not)\s+load\b/i.test(text) && RETRY_CUE.test(text)) {
    return true;
  }
  if (/\bnetwork\s+error\b/i.test(text) && RETRY_CUE.test(text)) return true;
  if (/\bbooking\s+failed\b/i.test(text) && RETRY_CUE.test(text)) return true;
  if (/\bresync\b/i.test(text) && /\b(failed|changes?|sync)\b/i.test(text)) {
    return true;
  }
  if (/\bconnection\s+lost\b/i.test(text) && RETRY_CUE.test(text)) return true;
  if (
    /\bretry\s+queued\b/i.test(text) &&
    /\b(booking|changes?)\b/i.test(text)
  ) {
    return true;
  }
  if (/\bsubmit\s+failed\b/i.test(text)) return true;
  if (/\bchanges?\s+stuck\s+sync/i.test(text)) return true;
  if (/\bpage\s+failed\s+to\s+load\b/i.test(text)) return true;

  return RETRY_CUE.test(text) && NETWORK_FAILURE_CUE.test(text);
}

export function parseRetryFailedNetworkActionFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { aspect: RetryFailedNetworkActionAspect } | null {
  if (!isRetryFailedNetworkActionPrompt(prompt)) return null;
  return { aspect: parseRetryFailedNetworkActionAspect(prompt, params) };
}

export function rescueRetryFailedNetworkActionIntent(
  prompt: string,
  action: string,
): { action: RetryFailedNetworkActionIntent; rescueReason: string } | null {
  if (isRetryFailedNetworkActionIntent(action)) return null;
  if (!isRetryFailedNetworkActionPrompt(prompt)) return null;
  return {
    action: 'retry_failed_network_action',
    rescueReason: 'retry_failed_network_action',
  };
}

export function buildRetryFailedNetworkActionGuidance(
  ctx: ConsumerOfflineExplainContext,
  aspect: RetryFailedNetworkActionAspect,
): {
  summary: string;
  canRetry: boolean;
  steps: string[];
  retryActionLabel: string;
  replayRequested: boolean;
} {
  const retryActionLabel = NETWORK_RETRY_ACTION_LABEL;
  const steps: string[] = [];

  if (ctx.queuedCount > 0 && ctx.online) {
    steps.push(
      'Stay on this screen while the consumer app replays queued booking changes.',
      'Watch the offline banner — it clears when sync finishes.',
    );
    return {
      summary: `Syncing ${ctx.queuedCount} queued change${ctx.queuedCount === 1 ? '' : 's'} now. Tap ${retryActionLabel} if the banner stays stuck.`,
      canRetry: true,
      steps,
      retryActionLabel,
      replayRequested: true,
    };
  }

  if (ctx.queuedCount > 0 && !ctx.online) {
    steps.push(
      'Reconnect to Wi‑Fi or mobile data.',
      'Return to the app — queued cancel/reschedule actions replay automatically.',
      `If nothing moves after reconnecting, tap ${retryActionLabel} on the error card.`,
    );
    return {
      summary: `${ctx.queuedCount} booking change${ctx.queuedCount === 1 ? ' is' : 's are'} waiting to sync. Reconnect first, then tap ${retryActionLabel}.`,
      canRetry: false,
      steps,
      retryActionLabel,
      replayRequested: false,
    };
  }

  if (aspect === 'load_failed') {
    steps.push(
      NETWORK_LOAD_FAILED_HINT,
      `Tap ${retryActionLabel} on the error card to reload this page.`,
    );
  } else if (aspect === 'sync_failed' || aspect === 'retry_queued') {
    steps.push(
      'Check your connection, then tap Try again on the offline banner or error message.',
      'Cancel/reschedule changes made offline replay when you are back online.',
    );
  } else {
    steps.push(
      'Check your connection is stable.',
      `Tap ${retryActionLabel} on the booking screen to resubmit — your slot may still be available.`,
      'If checkout was open, confirm your time is still free before paying again.',
    );
  }

  return {
    summary:
      aspect === 'load_failed'
        ? `${NETWORK_LOAD_FAILED_HINT} Tap ${retryActionLabel} to reload.`
        : `Tap ${retryActionLabel} to retry the last action once you are back online.`,
    canRetry: ctx.online,
    steps,
    retryActionLabel,
    replayRequested: false,
  };
}

export function resolveRetryFailedNetworkActionContext(
  params: Record<string, unknown> = {},
): ConsumerOfflineExplainContext {
  return resolveConsumerOfflineExplainContext(params);
}
