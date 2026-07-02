import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import { enrichUseSubscriptionCreditParamsFromPrompt } from './ai-subscription-membership-customer.util.js';
import {
  hasSubscriptionFirstVisitBookCue,
  hasSubscriptionFirstVisitMembershipCue,
} from './ai-subscription-first-visit-cue.util.js';
import {
  SUBSCRIPTION_FIRST_VISIT_COMPOUND_PROMPTS,
  type SubscriptionFirstVisitCompoundFixture,
} from './ai-subscription-first-visit-compound.fixtures.js';
import { SUBSCRIPTION_FIRST_VISIT_MULTILINGUAL_SCENARIOS } from './ai-subscription-first-visit-compound-multilingual.fixtures.js';

export const SUBSCRIPTION_FIRST_VISIT_RECIPE_ID = 'subscription_first_visit';

export type SubscriptionFirstVisitCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

function matchSubscriptionFirstVisitScenario(
  prompt: string,
): SubscriptionFirstVisitCompoundFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of SUBSCRIPTION_FIRST_VISIT_COMPOUND_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of SUBSCRIPTION_FIRST_VISIT_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function isSubscriptionFirstVisitCompoundPrompt(
  prompt: string,
): boolean {
  const text = prompt.trim();
  if (text.length < 16) return false;
  if (matchSubscriptionFirstVisitScenario(text)) return true;
  if (!hasSubscriptionFirstVisitMembershipCue(text)) return false;
  if (!hasSubscriptionFirstVisitBookCue(text)) return false;
  return true;
}

export function buildSubscriptionFirstVisitCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const scenario = matchSubscriptionFirstVisitScenario(prompt);
  const params = enrichUseSubscriptionCreditParamsFromPrompt(
    {
      ...buildSharedBookingContextFromPrompt(prompt),
      subscriptionFirstVisit: true,
      paymentMethod: 'subscription_credit',
    },
    prompt,
  );

  if (scenario?.serviceName) params.serviceName = scenario.serviceName;
  if (scenario?.date) params.date = scenario.date;

  return params;
}

export function decomposeSubscriptionFirstVisitCompoundPrompt(
  prompt: string,
): SubscriptionFirstVisitCompoundStep[] {
  if (!isSubscriptionFirstVisitCompoundPrompt(prompt)) return [];

  const base = buildSubscriptionFirstVisitCompoundParams(prompt);

  return propagateSharedBookingContextAcrossSteps([
    {
      action: 'explain_my_subscription',
      params: { ...base, focus: 'overview' },
      segment: prompt,
    },
    {
      action: 'use_subscription_credit',
      params: { ...base, continueAfterSubscriptionExplain: true },
      segment: prompt,
    },
  ]);
}

export function rescueSubscriptionFirstVisitCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isSubscriptionFirstVisitCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'subscription_first_visit_compound',
  };
}
