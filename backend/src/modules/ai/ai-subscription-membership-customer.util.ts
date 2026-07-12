import {
  applyRelativeDateFromPrompt,
  toIsoDay,
} from '../../common/utils/date-format.util.js';
import {
  rescueCustomerCrmIntent,
  isMySubscriptionsPrompt,
  isDiscoverSubscriptionPlansPrompt,
} from './ai-customer-crm.util.js';
import { extractServiceNameFromPrompt } from './ai-payments.util.js';
import {
  extractPlanNameFromPrompt,
  isUseSubscriptionCreditPrompt,
  rescueSelfServiceBookingIntent,
} from './ai-self-service-booking.util.js';
import { rescueSubscriptionFirstVisitCompoundIntent } from './ai-subscription-first-visit-compound.util.js';

export const CUSTOMER_SUBSCRIPTION_MEMBERSHIP_CLASSIFIER_RULES = `- use_subscription_credit: MUTATE — apply an active membership/subscription visit credit when booking or at checkout (logged-in customer). Triggers: use|apply|redeem + subscription|membership|credit|visit without a named service visit booking. Sets useSubscriptionId in session and paymentMethod subscription_credit. NOT subscription_first_visit (explain plan + book named visit with credit); NOT my_subscriptions (list plans), NOT subscription_usage (visits remaining read), NOT select_subscription_plan (pick a new plan), NOT discover_subscription_plans (browse catalog), NOT explain_subscription_vs_one_time (compare checkout options).
- my_subscriptions: READ — list the signed-in customer's active membership/subscription plans on their account. Triggers: show|list|view my subscriptions/memberships/plans; what memberships do I have; do I have a membership. Navigates to account subscriptions tab. NOT explain_my_subscription (visits/expiry/plan explain), NOT subscription_usage (raw usage ledger), NOT use_subscription_credit (apply credit), NOT discover_subscription_plans (salon catalog), NOT explain_subscription_vs_one_time (checkout compare).`;

export type SubscriptionMembershipCustomerPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'use_subscription_credit' | 'my_subscriptions';
  serviceName?: string;
  date?: string;
  rescueReason: string;
};

export const USE_SUBSCRIPTION_CREDIT_PROMPTS: readonly SubscriptionMembershipCustomerPromptFixture[] =
  [
    {
      id: 'use-subscription-credit-customer',
      prompt: 'Use subscription credit',
      surface: 'customer',
      expectedAction: 'use_subscription_credit',
      rescueReason: 'subscription_credit',
    },
    {
      id: 'apply-membership-visit-customer',
      prompt: 'Apply my membership visit',
      surface: 'customer',
      expectedAction: 'use_subscription_credit',
      rescueReason: 'subscription_credit',
    },
    {
      id: 'book-with-my-subscription-customer',
      prompt: 'Book with my subscription',
      surface: 'customer',
      expectedAction: 'use_subscription_credit',
      rescueReason: 'subscription_credit',
    },
    {
      id: 'pay-with-membership-customer',
      prompt: 'Pay with membership credit',
      surface: 'customer',
      expectedAction: 'use_subscription_credit',
      rescueReason: 'subscription_credit',
    },
    {
      id: 'apply-subscription-checkout-customer',
      prompt: 'Apply my subscription to this booking',
      surface: 'customer',
      expectedAction: 'use_subscription_credit',
      rescueReason: 'subscription_credit',
    },
    {
      id: 'use-membership-visit-customer',
      prompt: 'I want to use a visit from my membership',
      surface: 'customer',
      expectedAction: 'use_subscription_credit',
      rescueReason: 'subscription_credit',
    },
    {
      id: 'use-monthly-membership-customer',
      prompt: 'Use my monthly membership',
      surface: 'customer',
      expectedAction: 'use_subscription_credit',
      rescueReason: 'subscription_credit',
    },
    {
      id: 'redeem-subscription-visit-customer',
      prompt: 'Redeem subscription visit at checkout',
      surface: 'customer',
      expectedAction: 'use_subscription_credit',
      rescueReason: 'subscription_credit',
    },
    {
      id: 'apply-membership-credit-checkout-customer',
      prompt: 'Apply membership credit at checkout',
      surface: 'customer',
      expectedAction: 'use_subscription_credit',
      rescueReason: 'subscription_credit',
    },
    {
      id: 'use-plan-credit-checkout-customer',
      prompt: 'Use my plan credit at checkout',
      surface: 'customer',
      expectedAction: 'use_subscription_credit',
      rescueReason: 'subscription_credit',
    },
    {
      id: 'redeem-membership-at-visit-customer',
      prompt: 'Redeem my membership at this visit',
      surface: 'customer',
      expectedAction: 'use_subscription_credit',
      rescueReason: 'subscription_credit',
    },
    {
      id: 'pay-with-my-subscription-customer',
      prompt: 'Pay with my subscription',
      surface: 'customer',
      expectedAction: 'use_subscription_credit',
      rescueReason: 'subscription_credit',
    },
  ];

export const MY_SUBSCRIPTIONS_PROMPTS: readonly SubscriptionMembershipCustomerPromptFixture[] =
  [
    {
      id: 'show-my-subscriptions-customer',
      prompt: 'Show my subscriptions',
      surface: 'customer',
      expectedAction: 'my_subscriptions',
      rescueReason: 'my_subscriptions',
    },
    {
      id: 'list-my-memberships-customer',
      prompt: 'List my memberships',
      surface: 'customer',
      expectedAction: 'my_subscriptions',
      rescueReason: 'my_subscriptions',
    },
    {
      id: 'what-memberships-customer',
      prompt: 'What memberships do I have?',
      surface: 'customer',
      expectedAction: 'my_subscriptions',
      rescueReason: 'my_subscriptions',
    },
    {
      id: 'my-membership-plans-customer',
      prompt: 'Show my membership plans',
      surface: 'customer',
      expectedAction: 'my_subscriptions',
      rescueReason: 'my_subscriptions',
    },
    {
      id: 'active-subscriptions-customer',
      prompt: 'What are my active subscriptions?',
      surface: 'customer',
      expectedAction: 'my_subscriptions',
      rescueReason: 'my_subscriptions',
    },
    {
      id: 'do-i-have-membership-customer',
      prompt: 'Do I have a membership?',
      surface: 'customer',
      expectedAction: 'my_subscriptions',
      rescueReason: 'my_subscriptions',
    },
    {
      id: 'view-my-subscriptions-customer',
      prompt: 'View my subscriptions',
      surface: 'customer',
      expectedAction: 'my_subscriptions',
      rescueReason: 'my_subscriptions',
    },
    {
      id: 'open-subscriptions-tab-customer',
      prompt: 'Open my subscriptions tab',
      surface: 'customer',
      expectedAction: 'my_subscriptions',
      rescueReason: 'my_subscriptions',
    },
    {
      id: 'where-memberships-customer',
      prompt: 'Where are my salon memberships?',
      surface: 'customer',
      expectedAction: 'my_subscriptions',
      rescueReason: 'my_subscriptions',
    },
    {
      id: 'my-subscription-account-customer',
      prompt: 'What is on my subscription account?',
      surface: 'customer',
      expectedAction: 'my_subscriptions',
      rescueReason: 'my_subscriptions',
    },
    {
      id: 'membership-details-customer',
      prompt: 'Show membership details for my account',
      surface: 'customer',
      expectedAction: 'my_subscriptions',
      rescueReason: 'my_subscriptions',
    },
    {
      id: 'my-plans-customer',
      prompt: 'List my plans',
      surface: 'customer',
      expectedAction: 'my_subscriptions',
      rescueReason: 'my_subscriptions',
    },
  ];

export const SUBSCRIPTION_MEMBERSHIP_CUSTOMER_PROMPTS: readonly SubscriptionMembershipCustomerPromptFixture[] =
  [...USE_SUBSCRIPTION_CREDIT_PROMPTS, ...MY_SUBSCRIPTIONS_PROMPTS];

const MEMBERSHIP_CUSTOMER_RESCUE_ACTIONS = new Set<string>([
  'use_subscription_credit',
  'my_subscriptions',
  'select_subscription_plan',
]);

const MEMBERSHIP_CRM_RESCUE_ACTIONS = new Set<string>([
  'my_subscriptions',
  'discover_subscription_plans',
]);

export function rescueMembershipCustomerIntent(
  prompt: string,
  action: string,
): {
  action:
    | 'use_subscription_credit'
    | 'my_subscriptions'
    | 'select_subscription_plan'
    | 'discover_subscription_plans'
    | 'compound_intent';
  rescueReason: string;
} | null {
  const compound = rescueSubscriptionFirstVisitCompoundIntent(prompt, action);
  if (compound) return compound;

  // Checked ahead of self-service/my_subscriptions: discover_subscription_plans
  // catalog-browse prompts ("show/list your plans") otherwise fall through to
  // my_subscriptions' broad "mentions membership" catch-all, and some RU
  // discovery phrasing ("планы подписки") overlaps select_subscription_plan's
  // "подпис*" cue. Excludes possessive phrasing ("show MY plans") so it
  // doesn't shadow my_subscriptions.
  const isPossessive = /\b(my|mine)\b|мои|моя|моих|իմ/i.test(prompt);
  if (!isPossessive && isDiscoverSubscriptionPlansPrompt(prompt)) {
    return {
      action: 'discover_subscription_plans',
      rescueReason: 'discover_subscriptions',
    };
  }

  // Also checked ahead of self-service: select_subscription_plan's RU cue
  // ("подпис*") is a bare fragment that also matches "подписки" (plural noun
  // in "мои подписки"/"активные подписки"), so my_subscriptions prompts must
  // win that overlap.
  if (isMySubscriptionsPrompt(prompt)) {
    return { action: 'my_subscriptions', rescueReason: 'my_subscriptions' };
  }

  const selfService = rescueSelfServiceBookingIntent(prompt, action);
  if (
    selfService &&
    MEMBERSHIP_CUSTOMER_RESCUE_ACTIONS.has(selfService.action)
  ) {
    return {
      action: selfService.action as
        | 'use_subscription_credit'
        | 'select_subscription_plan',
      rescueReason: selfService.rescueReason,
    };
  }
  const crm = rescueCustomerCrmIntent(prompt, action);
  if (crm && MEMBERSHIP_CRM_RESCUE_ACTIONS.has(crm.action)) {
    return {
      action: crm.action as 'my_subscriptions' | 'discover_subscription_plans',
      rescueReason: crm.rescueReason,
    };
  }
  return null;
}

export function detectMembershipCustomerAction(
  prompt: string,
):
  | SubscriptionMembershipCustomerPromptFixture['expectedAction']
  | 'select_subscription_plan'
  | 'discover_subscription_plans'
  | 'compound_intent'
  | null {
  return rescueMembershipCustomerIntent(prompt, 'unknown')?.action ?? null;
}

export function enrichUseSubscriptionCreditParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
  timeZone = 'UTC',
): Record<string, unknown> {
  const next = { ...params };
  if (!next.serviceName) {
    const serviceName =
      extractServiceNameFromPrompt(prompt) ||
      prompt.match(
        /\b(?:for|with)\s+(?:today's\s+|tomorrow's\s+)?(massage|haircut|facial|color|manicure|blowdry|nail\s+care)\b/i,
      )?.[1] ||
      prompt.match(/\b(massage|haircut|facial|color|manicure|blowdry)\b/i)?.[1];
    if (serviceName) {
      next.serviceName = serviceName.replace(/^today's\s+/i, '').trim();
    }
  }
  if (!next.date) {
    applyRelativeDateFromPrompt(next, prompt, timeZone);
    if (!next.date && /\btoday\b/i.test(prompt)) {
      next.date = toIsoDay('today', timeZone);
    }
  }
  const planName = extractPlanNameFromPrompt(prompt);
  if (planName && !next.planName) {
    next.planName = planName;
  }
  return next;
}
export { isUseSubscriptionCreditPrompt, isMySubscriptionsPrompt };
