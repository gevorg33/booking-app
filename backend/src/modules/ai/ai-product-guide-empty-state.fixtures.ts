import type { GuideFlowSurface } from './guide/guide-flow.types.js';

/** ai-guide-1.8.9 — live permission / empty-state guides (not static FAQ). */
export const EMPTY_STATE_GUIDE_INTENTS = [
  'explain_visibility_block',
  'explain_empty_catalog',
  'explain_stripe_not_connected',
] as const;

export type EmptyStateGuideIntent = (typeof EMPTY_STATE_GUIDE_INTENTS)[number];

/** Dashboard admin — all three empty-state guides. */
export const DASHBOARD_EMPTY_STATE_GUIDE_INTENTS = [
  ...EMPTY_STATE_GUIDE_INTENTS,
] as const;

/** Provider mobile — role/team visibility + catalog empty states. */
export const PROVIDER_EMPTY_STATE_GUIDE_INTENTS = [
  'explain_visibility_block',
  'explain_empty_catalog',
] as const;

export type ProviderEmptyStateGuideIntent =
  (typeof PROVIDER_EMPTY_STATE_GUIDE_INTENTS)[number];

/** Customer + public booking — catalog + Stripe checkout empty states. */
export const CUSTOMER_PUBLIC_EMPTY_STATE_GUIDE_INTENTS = [
  'explain_empty_catalog',
  'explain_stripe_not_connected',
] as const;

export type CustomerPublicEmptyStateGuideIntent =
  (typeof CUSTOMER_PUBLIC_EMPTY_STATE_GUIDE_INTENTS)[number];

export const EMPTY_STATE_GUIDE_PIPE_MARKER = 'ai-guide-1.8.9';

export interface EmptyStateGuideRescueScenario {
  id: string;
  intent: EmptyStateGuideIntent;
  surface: GuideFlowSurface;
  prompt: RegExp;
  samplePrompt: string;
  fromActions?: readonly string[];
}

export const EMPTY_STATE_GUIDE_RESCUE_SCENARIOS: readonly EmptyStateGuideRescueScenario[] =
  [
    {
      id: 'dashboard-visibility-block',
      intent: 'explain_visibility_block',
      surface: 'dashboard',
      samplePrompt: "Why can't I see the Integrations menu?",
      prompt:
        /\b(?:why\s+(?:can(?:'|no)?t|don(?:'|no)?t)\s+i\s+see|why\s+is\s+.+\s+(?:hidden|missing|not\s+showing)|can(?:'|no)?t\s+see\s+(?:the\s+)?(?:menu|tab|page|section|feature)|no\s+access\s+to|missing\s+(?:menu|tab|page|section))\b/i,
      fromActions: ['unknown', 'explain_app_feature', 'guide_user_flow', 'list_integration_health'],
    },
    {
      id: 'dashboard-empty-catalog',
      intent: 'explain_empty_catalog',
      surface: 'dashboard',
      samplePrompt: 'No services shown on the booking page',
      prompt:
        /\b(?:no\s+services?\s+(?:shown|listed|available|displayed)|empty\s+(?:service|catalog)\s*(?:list|page)?|why\s+(?:are\s+there\s+)?no\s+services?|services?\s+(?:list\s+)?(?:is\s+)?empty|booking\s+page\s+(?:shows\s+)?no\s+services?)\b/i,
      fromActions: ['unknown', 'list_services', 'explain_app_feature', 'guide_user_flow'],
    },
    {
      id: 'dashboard-stripe-not-connected',
      intent: 'explain_stripe_not_connected',
      surface: 'dashboard',
      samplePrompt: 'Stripe is not connected — how do I fix it?',
      prompt:
        /\b(?:stripe\s+(?:is\s+)?not\s+connected|connect\s+stripe|finish\s+stripe\s+onboarding|online\s+(?:card\s+)?payments?\s+(?:not\s+)?(?:set\s*up|configured|working)|accept\s+cards?\s+online|stripe\s+connect\s+(?:setup|missing))\b/i,
      fromActions: [
        'unknown',
        'explain_why_stripe_required',
        'explain_stripe_currency_warning',
        'list_integration_health',
      ],
    },
    {
      id: 'provider-visibility-block',
      intent: 'explain_visibility_block',
      surface: 'provider',
      samplePrompt: "Why can't I see team schedule?",
      prompt:
        /\b(?:why\s+(?:can(?:'|no)?t|don(?:'|no)?t)\s+i\s+see|can(?:'|no)?t\s+see\s+(?:team|everyone|other\s+providers?)|missing\s+(?:tab|menu|screen)|no\s+access\s+to)\b/i,
      fromActions: ['unknown', 'explain_team_view_scope', 'explain_provider_app_tabs'],
    },
    {
      id: 'provider-empty-catalog',
      intent: 'explain_empty_catalog',
      surface: 'provider',
      samplePrompt: 'No services are assigned to my profile',
      prompt:
        /\b(?:no\s+services?\s+(?:shown|assigned|linked)|services?\s+are\s+assigned|why\s+are\s+no\s+services?\s+assigned|empty\s+service\s*list|why\s+(?:are\s+(?:there\s+)?)?no\s+services?|my\s+services?\s+(?:list\s+)?(?:is\s+)?empty)\b/i,
      fromActions: ['unknown', 'show_appointments', 'explain_app_feature'],
    },
    {
      id: 'customer-empty-catalog',
      intent: 'explain_empty_catalog',
      surface: 'customer',
      samplePrompt: 'Why are no services showing for this salon?',
      prompt:
        /\b(?:no\s+services?\s+(?:shown|showing|available|listed)|why\s+are\s+no\s+services?\s+(?:shown|showing|available|listed)|empty\s+service\s*list|why\s+(?:are\s+there\s+)?no\s+services?|can(?:'|no)?t\s+(?:find|see)\s+(?:any\s+)?services?)\b/i,
      fromActions: ['unknown', 'discover_services', 'list_services', 'explain_app_feature'],
    },
    {
      id: 'customer-stripe-not-connected',
      intent: 'explain_stripe_not_connected',
      surface: 'customer',
      samplePrompt: 'Online card payment is unavailable — why?',
      prompt:
        /\b(?:(?:why\s+is\s+)?online\s+(?:card\s+)?pay(?:ment)?(?:\s+is)?\s+(?:unavailable|not\s+(?:available|working|set\s*up))|stripe\s+(?:is\s+)?not\s+connected|can(?:'|no)?t\s+pay\s+online|card\s+checkout\s+(?:unavailable|disabled))\b/i,
      fromActions: ['unknown', 'explain_why_stripe_required', 'choose_payment_method'],
    },
    {
      id: 'public-empty-catalog',
      intent: 'explain_empty_catalog',
      surface: 'public',
      samplePrompt: 'No services shown on the booking page',
      prompt:
        /\b(?:no\s+services?\s+(?:shown|available|listed)|empty\s+(?:service|booking)\s*(?:list|page)?|why\s+(?:are\s+there\s+)?no\s+services?|booking\s+page\s+(?:shows\s+)?no\s+services?)\b/i,
      fromActions: ['unknown', 'list_services', 'booking_help', 'explain_app_feature'],
    },
    {
      id: 'public-stripe-not-connected',
      intent: 'explain_stripe_not_connected',
      surface: 'public',
      samplePrompt: 'Stripe not connected — can I still book?',
      prompt:
        /\b(?:stripe\s+(?:is\s+)?not\s+connected|online\s+(?:card\s+)?pay(?:ment)?(?:\s+is)?\s+(?:unavailable|not\s+(?:available|working|set\s*up))|can(?:'|no)?t\s+pay\s+(?:online|by\s+card)|card\s+checkout\s+(?:unavailable|disabled))\b/i,
      fromActions: [
        'unknown',
        'explain_why_stripe_required',
        'explain_stripe_checkout_currency',
        'booking_help',
      ],
    },
  ] as const;

export const DASHBOARD_EMPTY_STATE_GUIDE_CLASSIFIER_RULES = `- explain_visibility_block: READ — live diagnosis when a dashboard menu/page/feature is missing: role tier (staff vs manager), plan tier, disabled business module, or playbook gate. Uses session role/planTierId/enabledModules + route/topicId. Triggers: why can't I see X, missing menu/tab, no access to feature. NOT explain_app_feature generic UI tour and NOT configure_* mutates.
- explain_empty_catalog: READ — live service/provider catalog counts (active vs total), public booking enabled flag, employee assignments. Triggers: no services shown, empty service list, booking page has no services. NOT list_services browse and NOT explain_app_feature generic tour.
- explain_stripe_not_connected: READ — live Stripe Connect health from tenant settings (configured, detailsSubmitted, chargesEnabled) plus online payment settings. Triggers: Stripe not connected, finish Connect onboarding, online payments not set up. NOT explain_why_stripe_required (customer checkout requirement), NOT explain_stripe_currency_warning (Settings banner), and NOT diagnose_stripe_checkout_failure.`;

export const PROVIDER_EMPTY_STATE_GUIDE_CLASSIFIER_RULES = `- explain_visibility_block: READ — provider mobile live visibility: staff tier blocked screens vs manager team view; optional feature/subject from prompt. Triggers: why can't I see team/schedule/menu. NOT explain_team_view_scope when user asks why they see everyone (inverse) and NOT explain_provider_app_tabs tab tour.
- explain_empty_catalog: READ — live assigned-service count for linked employee + salon active catalog totals. Triggers: no services assigned, empty service list. NOT show_appointments list read.`;

export const CUSTOMER_EMPTY_STATE_GUIDE_CLASSIFIER_RULES = `- explain_empty_catalog: READ — live salon active service count + public booking enabled for consumer app empty states. Triggers: no services showing, can't find services. NOT discover_services browse.
- explain_stripe_not_connected: READ — live Stripe Connect readiness + cash-at-venue fallback for consumer checkout. Triggers: online payment unavailable, Stripe not connected. NOT explain_why_stripe_required (why card required at checkout) and NOT pay_online mutate.`;

export const PUBLIC_EMPTY_STATE_GUIDE_CLASSIFIER_RULES = `- explain_empty_catalog: READ — live public booking catalog: publicBooking.enabled, active service count, active provider count. Triggers: no services on booking page, empty catalog. NOT list_services browse.
- explain_stripe_not_connected: READ — live Stripe Connect readiness + acceptCashPayments for anonymous booking checkout. Triggers: Stripe not connected, card checkout unavailable. NOT explain_why_stripe_required, NOT explain_stripe_checkout_currency, and NOT book_appointment mutate.`;

export const EMPTY_STATE_GUIDE_CLASSIFIER_SCENARIOS = [
  {
    id: '8.9-visibility-dashboard',
    intent: 'explain_visibility_block' as const,
    surface: 'dashboard' as const,
    prompt: "Why can't I see Integrations on my plan?",
  },
  {
    id: '8.9-catalog-dashboard',
    intent: 'explain_empty_catalog' as const,
    surface: 'dashboard' as const,
    prompt: 'No services shown on our public booking page',
  },
  {
    id: '8.9-stripe-dashboard',
    intent: 'explain_stripe_not_connected' as const,
    surface: 'dashboard' as const,
    prompt: 'Stripe is not connected — what should I do?',
  },
  {
    id: '8.9-visibility-provider',
    intent: 'explain_visibility_block' as const,
    surface: 'provider' as const,
    prompt: "Why can't I see the team schedule tab?",
  },
  {
    id: '8.9-catalog-provider',
    intent: 'explain_empty_catalog' as const,
    surface: 'provider' as const,
    prompt: 'No services are assigned to my profile',
  },
  {
    id: '8.9-catalog-customer',
    intent: 'explain_empty_catalog' as const,
    surface: 'customer' as const,
    prompt: 'Why are no services showing for this salon?',
  },
  {
    id: '8.9-stripe-customer',
    intent: 'explain_stripe_not_connected' as const,
    surface: 'customer' as const,
    prompt: 'Online card payment is unavailable — why?',
  },
  {
    id: '8.9-catalog-public',
    intent: 'explain_empty_catalog' as const,
    surface: 'public' as const,
    prompt: 'The booking page shows no services',
  },
  {
    id: '8.9-stripe-public',
    intent: 'explain_stripe_not_connected' as const,
    surface: 'public' as const,
    prompt: 'Stripe not connected — can I pay online?',
  },
] as const;
