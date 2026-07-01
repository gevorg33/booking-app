import { isUseSubscriptionCreditPrompt } from './ai-self-service-booking.util.js';
import { hasSubscriptionCheckoutCompareCue } from './ai-explain-subscription-vs-one-time.util.js';
import {
  hasSubscriptionFirstVisitBookCue,
  hasSubscriptionFirstVisitMembershipCue,
} from './ai-subscription-first-visit-cue.util.js';
import {
  EXPLAIN_MY_SUBSCRIPTION_PROMPTS,
  type ExplainMySubscriptionPromptFixture,
} from './ai-explain-my-subscription.fixtures.js';
import { EXPLAIN_MY_SUBSCRIPTION_MULTILINGUAL_SCENARIOS } from './ai-explain-my-subscription-multilingual.fixtures.js';

export const EXPLAIN_MY_SUBSCRIPTION_INTENTS = [
  'explain_my_subscription',
] as const;

export type ExplainMySubscriptionIntent =
  (typeof EXPLAIN_MY_SUBSCRIPTION_INTENTS)[number];

export type ExplainMySubscriptionFocus =
  | 'visits'
  | 'renewal'
  | 'overview'
  | 'status';

const VISITS_LEFT_CUE =
  /\b(how\s+many|what)\b.*\b(visits?|credits?|appointments?)\b.*\b(left|remaining)\b|\b(visits?|credits?)\b.*\b(left|remaining)\b.*\b(on\s+)?my\b/i;

const RENEWAL_CUE =
  /\b(when\s+does|when\s+will|when\s+is)\b.*\b(my\s+)?(subscription|membership|plan)\b.*\b(expire|renew|end)\b|\b(expir|renew|end)\b.*\b(my\s+)?(subscription|membership|plan)\b/i;

const OVERVIEW_CUE =
  /\b(explain|tell\s+me\s+about|how\s+does|how\s+do|what\s+is\s+included)\b.*\b(my\s+)?(subscription|membership|plan)\b|\b(my\s+)?(subscription|membership|plan)\b.*\b(work|include)\b/i;

const STATUS_CUE =
  /\bwhat(?:'s|\s+is)\s+on\s+my\s+(subscription|membership|plan)(?!\s+account)\b|\bstatus\s+of\s+my\s+(subscription|membership|plan)\b/i;

const LIST_ONLY_CUE =
  /\b(show|list|view|open)\b.*\bmy\b.*\b(subscriptions?|memberships?|plans?)\b|\bwhat\s+memberships?\s+do\s+i\s+have\b|\bwhat\s+(?:are\s+)?my\s+active\s+subscriptions?\b|\bdo\s+i\s+have\s+(?:a\s+)?(?:subscription|membership|plan)s?\b/i;

function matchExplainMySubscriptionScenario(
  prompt: string,
): ExplainMySubscriptionPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_MY_SUBSCRIPTION_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_MY_SUBSCRIPTION_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function inferExplainMySubscriptionFocus(
  prompt: string,
): ExplainMySubscriptionFocus {
  const scenario = matchExplainMySubscriptionScenario(prompt);
  if (scenario?.focus) return scenario.focus;
  if (VISITS_LEFT_CUE.test(prompt)) return 'visits';
  if (RENEWAL_CUE.test(prompt)) return 'renewal';
  if (STATUS_CUE.test(prompt)) return 'status';
  return 'overview';
}

export function isExplainMySubscriptionPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (
    hasSubscriptionFirstVisitMembershipCue(text) &&
    hasSubscriptionFirstVisitBookCue(text)
  ) {
    return false;
  }
  if (matchExplainMySubscriptionScenario(text)) return true;
  if (hasSubscriptionCheckoutCompareCue(text)) return false;
  if (isUseSubscriptionCreditPrompt(text)) return false;
  if (LIST_ONLY_CUE.test(text)) return false;
  if (
    /\b(discover|browse|sign\s+up|subscribe\s+to|select|choose|pick)\b/i.test(
      text,
    ) &&
    /\b(subscription|membership|plan)s?\b/i.test(text)
  ) {
    return false;
  }

  if (
    /(?:բացատր|объясн|сколько|քանի).{0,30}(?:subscription|membership|plan|visit|այց|визит|подписк|membership)/iu.test(
      text,
    )
  ) {
    return true;
  }

  if (
    VISITS_LEFT_CUE.test(text) ||
    RENEWAL_CUE.test(text) ||
    OVERVIEW_CUE.test(text) ||
    STATUS_CUE.test(text)
  ) {
    return /\bmy\b/i.test(text) || /(?:իմ|мо[ей]|мой|моя)/iu.test(text);
  }

  return (
    (/\b(explain|tell\s+me|how\s+does|how\s+do)\b/i.test(text) ||
      /(?:բացատր|объясн)/iu.test(text)) &&
    /\b(subscription|membership|plan)\b/i.test(text) &&
    /\bmy\b/i.test(text)
  );
}

export function isExplainMySubscriptionIntent(
  action: string,
): action is ExplainMySubscriptionIntent {
  return (EXPLAIN_MY_SUBSCRIPTION_INTENTS as readonly string[]).includes(
    action,
  );
}

export function parseExplainMySubscriptionFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { focus: ExplainMySubscriptionFocus } | null {
  const fromCompound = params.subscriptionFirstVisit === true;
  if (!isExplainMySubscriptionPrompt(prompt) && !fromCompound) return null;
  const focusFromParams =
    params.focus === 'visits' ||
    params.focus === 'renewal' ||
    params.focus === 'overview' ||
    params.focus === 'status'
      ? params.focus
      : undefined;
  return {
    focus: focusFromParams ?? inferExplainMySubscriptionFocus(prompt),
  };
}

type SubscriptionExplainLine = {
  planName: string;
  serviceName?: string;
  appointmentsRemaining: number;
  appointmentsIncluded: number;
  status: string;
  expiresAt?: Date;
  usageEventCount?: number;
};

function formatSubscriptionDate(value?: Date): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function buildMySubscriptionExplainCopy(input: {
  subscriptions: SubscriptionExplainLine[];
  focus: ExplainMySubscriptionFocus;
}): { summary: string; focus: ExplainMySubscriptionFocus } {
  const { subscriptions, focus } = input;
  if (!subscriptions.length) {
    return {
      focus,
      summary:
        'You do not have a subscription on this account yet. Browse membership plans to sign up.',
    };
  }

  const primary = subscriptions[0];
  const expiry = formatSubscriptionDate(primary.expiresAt);
  const planLabel = primary.planName || 'Membership plan';
  const serviceSuffix = primary.serviceName
    ? ` for ${primary.serviceName}`
    : '';
  const visitsLine = `${primary.appointmentsRemaining} of ${primary.appointmentsIncluded} visit${primary.appointmentsIncluded === 1 ? '' : 's'} remaining`;
  const statusLine = `Status: ${primary.status}`;
  const expiryLine = expiry ? `Expires ${expiry}.` : undefined;
  const usageLine =
    primary.usageEventCount != null
      ? `${primary.usageEventCount} usage event${primary.usageEventCount === 1 ? '' : 's'} recorded.`
      : undefined;

  if (focus === 'visits') {
    return {
      focus,
      summary: `Your ${planLabel}${serviceSuffix} has ${visitsLine}.${expiryLine ? ` ${expiryLine}` : ''}`,
    };
  }

  if (focus === 'renewal') {
    return {
      focus,
      summary: expiry
        ? `Your ${planLabel}${serviceSuffix} ${primary.status === 'active' ? 'is active and' : ''} expires on ${expiry}. ${visitsLine}.`
        : `Your ${planLabel}${serviceSuffix} does not show an expiry date. ${visitsLine}.`,
    };
  }

  if (focus === 'status') {
    return {
      focus,
      summary: [
        `Your ${planLabel}${serviceSuffix}: ${visitsLine}.`,
        statusLine,
        expiryLine,
        usageLine,
      ]
        .filter(Boolean)
        .join(' '),
    };
  }

  const extra =
    subscriptions.length > 1
      ? ` You also have ${subscriptions.length - 1} other subscription${subscriptions.length - 1 === 1 ? '' : 's'} on your account.`
      : '';

  return {
    focus,
    summary: [
      `${planLabel}${serviceSuffix}: ${visitsLine}.`,
      statusLine,
      expiryLine,
      usageLine,
      extra,
    ]
      .filter(Boolean)
      .join(' ')
      .trim(),
  };
}

export function rescueExplainMySubscriptionIntent(
  prompt: string,
  action: string,
): { action: ExplainMySubscriptionIntent; rescueReason: string } | null {
  if (isExplainMySubscriptionIntent(action)) return null;
  if (!parseExplainMySubscriptionFromPrompt(prompt)) return null;
  return {
    action: 'explain_my_subscription',
    rescueReason: 'explain_my_subscription',
  };
}
