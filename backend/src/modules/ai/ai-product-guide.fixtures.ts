import type { CommandSurface } from './ai-command-registry.types.js';
import type { GuideResponse } from './command-completion.types.js';
import type {
  AppGuideIntent,
  ProductGuideIntentBucket,
  ProductGuidePromptCue,
} from './ai-product-guide.util.js';

/** ai-guide-1.0.1 — prompt → bucket taxonomy scenarios (all surfaces). */
export interface ProductGuideTaxonomyScenario {
  id: string;
  prompt: string;
  surface?: CommandSurface;
  expectedBucket: ProductGuideIntentBucket;
}

/** ai-guide-1.0.1 — misroute rescue when classifier picked wrong bucket. */
export interface ProductGuideDisambiguationScenario {
  id: string;
  prompt: string;
  classifiedAction: string;
  surface?: CommandSurface;
  expectedAction: string | null;
  expectedReason?: string;
}

export const PRODUCT_GUIDE_TAXONOMY_SCENARIOS: readonly ProductGuideTaxonomyScenario[] =
  [
    {
      id: 'guide-online-payments-where',
      prompt: 'Where do I turn on online payment for services?',
      surface: 'dashboard',
      expectedBucket: 'guide',
    },
    {
      id: 'guide-add-staff-flow',
      prompt: 'Walk me through adding a new stylist to the team',
      surface: 'dashboard',
      expectedBucket: 'guide',
    },
    {
      id: 'guide-this-page',
      prompt: 'What can I do on this page?',
      surface: 'dashboard',
      expectedBucket: 'guide',
    },
    {
      id: 'guide-provider-mark-paid',
      prompt: 'How do I mark a booking as paid on the Today tab?',
      surface: 'provider',
      expectedBucket: 'guide',
    },
    {
      id: 'guide-public-checkout-steps',
      prompt: 'Help me understand the booking steps on this site',
      surface: 'public',
      expectedBucket: 'guide',
    },
    {
      id: 'guide-consumer-tabs',
      prompt: 'Where are my appointments in the app?',
      surface: 'customer',
      expectedBucket: 'guide',
    },
    {
      id: 'domain-checkout-tax',
      prompt: 'Why is there VAT on my checkout total?',
      surface: 'public',
      expectedBucket: 'domain_explain',
    },
    {
      id: 'domain-checkout-currency',
      prompt: 'What currency are these prices shown in on the booking page?',
      surface: 'public',
      expectedBucket: 'domain_explain',
    },
    {
      id: 'domain-deposit-meaning',
      prompt: 'What does the deposit on checkout mean?',
      surface: 'customer',
      expectedBucket: 'domain_explain',
    },
    {
      id: 'domain-tenant-currency',
      prompt: 'Why does the salon app show prices in euros after I log in?',
      surface: 'customer',
      expectedBucket: 'domain_explain',
    },
    {
      id: 'domain-gdpr-rights',
      prompt: 'What are my data privacy rights as a customer?',
      surface: 'customer',
      expectedBucket: 'domain_explain',
    },
    {
      id: 'domain-reports-currency',
      prompt: 'Why does the revenue report show amounts in AMD?',
      surface: 'dashboard',
      expectedBucket: 'domain_explain',
    },
    {
      id: 'action-enable-online-payment',
      prompt: 'Enable online payment for haircuts',
      surface: 'dashboard',
      expectedBucket: 'action',
    },
    {
      id: 'action-create-employee',
      prompt: 'Add John as a stylist and assign haircut services',
      surface: 'dashboard',
      expectedBucket: 'action',
    },
    {
      id: 'action-book-appointment',
      prompt: 'Book Anna for a haircut tomorrow at 3pm',
      surface: 'dashboard',
      expectedBucket: 'action',
    },
    {
      id: 'action-provider-mark-paid',
      prompt: 'Mark Sofia paid for her 2pm appointment',
      surface: 'provider',
      expectedBucket: 'action',
    },
    {
      id: 'action-cancel-booking',
      prompt: 'Cancel my booking for Friday',
      surface: 'customer',
      expectedBucket: 'action',
    },
    {
      id: 'guide-vs-mutate-retention',
      prompt: 'How do I change customer data retention in settings?',
      surface: 'dashboard',
      expectedBucket: 'guide',
    },
    {
      id: 'action-set-retention',
      prompt: 'Keep customer data for 3 years',
      surface: 'dashboard',
      expectedBucket: 'action',
    },
    {
      id: 'domain-tour-slots',
      prompt: 'Why does this tour only show morning departures?',
      surface: 'public',
      expectedBucket: 'domain_explain',
    },
  ] as const;

export const PRODUCT_GUIDE_DISAMBIGUATION_SCENARIOS: readonly ProductGuideDisambiguationScenario[] =
  [
    {
      id: 'misroute-configure-online-payment',
      prompt: 'Where do I turn on online payment for services?',
      classifiedAction: 'configure_service_online_payment',
      surface: 'dashboard',
      expectedAction: 'guide_user_flow',
      expectedReason: 'product_guide_navigation',
    },
    {
      id: 'misroute-create-employee',
      prompt: 'How do I add a staff member?',
      classifiedAction: 'create_employee',
      surface: 'dashboard',
      expectedAction: 'guide_user_flow',
      expectedReason: 'product_guide_navigation',
    },
    {
      id: 'misroute-configure-retention',
      prompt: 'Where is customer data retention configured?',
      classifiedAction: 'configure_privacy_retention',
      surface: 'dashboard',
      expectedAction: 'explain_app_feature',
      expectedReason: 'product_guide_navigation',
    },
    {
      id: 'misroute-enable-push',
      prompt: 'How do I enable push notifications in the provider app?',
      classifiedAction: 'enable_push_notifications',
      surface: 'provider',
      expectedAction: 'guide_user_flow',
      expectedReason: 'product_guide_navigation',
    },
    {
      id: 'keep-explicit-mutate',
      prompt: 'Enable online payment for haircuts',
      classifiedAction: 'configure_service_online_payment',
      surface: 'dashboard',
      expectedAction: null,
    },
    {
      id: 'keep-domain-tax',
      prompt: 'Why is there tax on checkout?',
      classifiedAction: 'explain_checkout_tax',
      surface: 'public',
      expectedAction: null,
    },
    {
      id: 'misroute-book-to-guide',
      prompt: 'How do I book an appointment on this page?',
      classifiedAction: 'create_booking',
      surface: 'public',
      expectedAction: 'guide_user_flow',
      expectedReason: 'product_guide_navigation',
    },
    {
      id: 'keep-explicit-book',
      prompt: 'Book me a haircut tomorrow at 3pm',
      classifiedAction: 'book_appointment',
      surface: 'public',
      expectedAction: null,
    },
    {
      id: 'misroute-mark-paid-guide',
      prompt: 'Where do I mark a client as paid?',
      classifiedAction: 'mark_paid',
      surface: 'provider',
      expectedAction: 'guide_user_flow',
      expectedReason: 'product_guide_navigation',
    },
    {
      id: 'screen-context-current',
      prompt: 'Explain what I am looking at here',
      classifiedAction: 'unknown',
      surface: 'dashboard',
      expectedAction: 'explain_current_screen',
      expectedReason: 'product_guide_screen',
    },
  ] as const;

export const APP_GUIDE_INTENT_BUCKET_SCENARIOS: readonly {
  id: string;
  action: string;
  expectedBucket: ProductGuideIntentBucket;
}[] = [
  {
    id: 'app-guide-feature',
    action: 'explain_app_feature',
    expectedBucket: 'guide',
  },
  { id: 'app-guide-flow', action: 'guide_user_flow', expectedBucket: 'guide' },
  {
    id: 'app-guide-screen',
    action: 'explain_current_screen',
    expectedBucket: 'guide',
  },
  {
    id: 'app-guide-prefix',
    action: 'guide_billing_setup',
    expectedBucket: 'guide',
  },
  {
    id: 'surrogate-booking-help',
    action: 'booking_help',
    expectedBucket: 'guide',
  },
  {
    id: 'domain-explain-tax',
    action: 'explain_checkout_tax',
    expectedBucket: 'domain_explain',
  },
  {
    id: 'domain-explain-currency',
    action: 'explain_tenant_currency',
    expectedBucket: 'domain_explain',
  },
  {
    id: 'domain-explain-compliance',
    action: 'explain_compliance_status',
    expectedBucket: 'domain_explain',
  },
  { id: 'action-mutate', action: 'create_booking', expectedBucket: 'action' },
  { id: 'action-read-list', action: 'list_services', expectedBucket: 'action' },
  {
    id: 'action-read-open',
    action: 'open_billing_settings',
    expectedBucket: 'action',
  },
] as const;

/** ai-guide-1.0.2 — pipe-1.2 product guide prompt detector. */
export interface ProductGuidePromptScenario {
  id: string;
  prompt: string;
  surface?: CommandSurface;
  expectedMatch: boolean;
  expectedIntent?: AppGuideIntent;
  expectedCue?: ProductGuidePromptCue;
}

export const PRODUCT_GUIDE_PROMPT_SCENARIOS: readonly ProductGuidePromptScenario[] =
  [
    {
      id: 'heuristic-how-do-i',
      prompt: 'How do I add online payments?',
      surface: 'dashboard',
      expectedMatch: true,
      expectedIntent: 'guide_user_flow',
      expectedCue: 'navigation',
    },
    {
      id: 'heuristic-where-is',
      prompt: 'Where is the staff settings page?',
      surface: 'dashboard',
      expectedMatch: true,
      expectedIntent: 'guide_user_flow',
      expectedCue: 'navigation',
    },
    {
      id: 'heuristic-walk-through',
      prompt: 'Walk me through setting up gift cards',
      surface: 'dashboard',
      expectedMatch: true,
      expectedIntent: 'guide_user_flow',
      expectedCue: 'walkthrough',
    },
    {
      id: 'heuristic-help-this-page',
      prompt: 'Help me with this page',
      surface: 'dashboard',
      expectedMatch: true,
      expectedIntent: 'explain_current_screen',
      expectedCue: 'help_page',
    },
    {
      id: 'heuristic-ui-feature-meaning',
      prompt: 'What does the online booking toggle mean?',
      surface: 'dashboard',
      expectedMatch: true,
      expectedIntent: 'explain_app_feature',
      expectedCue: 'feature_meaning',
    },
    {
      id: 'heuristic-screen',
      prompt: 'What can I do on this page?',
      surface: 'dashboard',
      expectedMatch: true,
      expectedIntent: 'explain_current_screen',
      expectedCue: 'screen',
    },
    {
      id: 'heuristic-provider-today',
      prompt: 'How do I mark paid on Today?',
      surface: 'provider',
      expectedMatch: true,
      expectedIntent: 'guide_user_flow',
      expectedCue: 'navigation',
    },
    {
      id: 'negative-domain-tax',
      prompt: 'Why is there VAT on checkout?',
      surface: 'public',
      expectedMatch: false,
    },
    {
      id: 'negative-mutate-enable',
      prompt: 'Enable online payment for haircuts',
      surface: 'dashboard',
      expectedMatch: false,
    },
    {
      id: 'negative-deposit-meaning',
      prompt: 'What does the deposit on checkout mean?',
      surface: 'customer',
      expectedMatch: false,
    },
    {
      id: 'negative-list-action',
      prompt: 'List appointments for tomorrow',
      surface: 'dashboard',
      expectedMatch: false,
    },
    {
      id: 'negative-empty',
      prompt: '   ',
      expectedMatch: false,
    },
  ] as const;

/** ai-guide-1.0.4 — sample GuideResponse for tests / eval seeds. */
export const SAMPLE_GUIDE_RESPONSE: GuideResponse = {
  topicId: 'dashboard.core.employees',
  summary: 'Turn on online payment from Services, then pick a service.',
  steps: [
    {
      title: 'Open Services',
      body: 'In the dashboard sidebar, choose Services.',
      navigate: { path: '/dashboard/services', hash: 'online-payment' },
    },
    {
      title: 'Enable online payment',
      body: 'Edit a service and set prepayment to deposit or full online payment.',
    },
  ],
  navigate: { path: '/dashboard/services' },
  relatedActions: [
    {
      action: 'configure_service_online_payment',
      label: 'Configure online payment for a service',
      prompt: 'Configure online payment for a service',
    },
  ],
  sources: [
    {
      topicId: 'dashboard.core.employees',
      label: 'Services — online payment',
      kind: 'topic',
    },
  ],
};

/** ai-guide-1.0.5 — bulk mutate misroute guard scenarios. */
export interface ProductGuideMisrouteScenario {
  id: string;
  prompt: string;
  classifiedAction: string;
  surface?: CommandSurface;
  expectedAction: string | null;
  expectedReason?: string;
}

export const PRODUCT_GUIDE_MISROUTE_SCENARIOS: readonly ProductGuideMisrouteScenario[] =
  [
    {
      id: 'bulk-cancel-bookings-how-to',
      prompt: 'How do I cancel bookings for a client?',
      classifiedAction: 'cancel_bookings',
      surface: 'dashboard',
      expectedAction: 'guide_user_flow',
      expectedReason: 'product_guide_bulk_misroute',
    },
    {
      id: 'bulk-payment-sweep-how-to',
      prompt: 'How do I run a payment sweep at end of day?',
      classifiedAction: 'payment_sweep',
      surface: 'dashboard',
      expectedAction: 'guide_user_flow',
      expectedReason: 'product_guide_bulk_misroute',
    },
    {
      id: 'bulk-mark-no-shows-where',
      prompt: 'Where do I mark no-shows for yesterday?',
      classifiedAction: 'mark_no_shows',
      surface: 'dashboard',
      expectedAction: 'guide_user_flow',
      expectedReason: 'product_guide_bulk_misroute',
    },
    {
      id: 'bulk-update-bookings-walkthrough',
      prompt: 'Walk me through updating payment status on multiple bookings',
      classifiedAction: 'update_bookings',
      surface: 'dashboard',
      expectedAction: 'guide_user_flow',
      expectedReason: 'product_guide_bulk_misroute',
    },
    {
      id: 'bulk-clear-schedule-help',
      prompt: 'Help me with this page — how do I clear the schedule?',
      classifiedAction: 'clear_schedule',
      surface: 'dashboard',
      expectedAction: 'explain_current_screen',
      expectedReason: 'product_guide_bulk_misroute',
    },
    {
      id: 'provider-bulk-cancel-how-to',
      prompt: 'How do I cancel all appointments for today?',
      classifiedAction: 'cancel_bookings',
      surface: 'provider',
      expectedAction: 'guide_user_flow',
      expectedReason: 'product_guide_bulk_misroute',
    },
    {
      id: 'keep-imperative-bulk-cancel',
      prompt: 'Cancel all bookings for tomorrow',
      classifiedAction: 'cancel_bookings',
      surface: 'dashboard',
      expectedAction: null,
    },
    {
      id: 'keep-explicit-payment-sweep',
      prompt: 'Run payment sweep for today',
      classifiedAction: 'payment_sweep',
      surface: 'dashboard',
      expectedAction: null,
    },
    {
      id: 'non-bulk-still-disambiguates',
      prompt: 'Where do I turn on online payment?',
      classifiedAction: 'configure_service_online_payment',
      surface: 'dashboard',
      expectedAction: 'guide_user_flow',
      expectedReason: 'product_guide_navigation',
    },
  ] as const;

/** ai-guide-1.6.1 — dashboard classifier appendix for product guide intents. */
export const APP_GUIDE_CLASSIFIER_RULES = `- explain_app_feature: READ — explain what a dashboard feature, menu, or setting does and where to find it in the UI. Triggers: what does X mean (UI feature/button/tab), what is X (feature), where is X, which menu/page has X. Optional topicId when the user names a known guide section. Returns GuideResponse steps from /dashboard/guide corpus. NOT domain explain_* (tax, currency, checkout lines), NOT configure_* / enable_* mutates, NOT booking_help on public/customer surfaces.
- guide_user_flow: READ — numbered walkthrough for a dashboard setup task without executing mutations. Triggers: how do I, how can I, walk me through, show me how, help me with (without imperative cancel/book/enable). Optional topicId. Misroute guard: question-shaped bulk prompts (cancel all, payment sweep) → guide_user_flow NOT cancel_bookings / payment_sweep.
- explain_current_screen: READ — explain capabilities of the current dashboard page using session route context (/dashboard/schedule, /dashboard/operations, …). Triggers: this page, this screen, what can I do here/on this page, help me with this page, what am I looking at. Prefers route-mapped corpus topicId. NOT show_appointments, NOT list_* operational reads, NOT summarize_* analytics.

Params:
- topicId: optional stable guide corpus id (e.g. dashboard.core.schedule, dashboard.ai.command-bar) when the user names a guide section.

Examples:
- "Where is the schedule template editor?" → guide_user_flow
- "What does the command bar do?" → explain_app_feature
- "What can I do on this page?" with route /dashboard/schedule → explain_current_screen
- "Walk me through Operations inventory setup" → guide_user_flow, topicId=dashboard.operations.inventory
- "How do I cancel bookings for a client?" → guide_user_flow (NOT cancel_bookings)
- "How do I run a payment sweep at end of day?" → guide_user_flow (NOT payment_sweep)
- "Where do I turn on online payment?" → guide_user_flow (NOT configure_service_online_payment)
- "What does the deposit field mean on checkout?" → explain_checkout_total or domain explain (NOT explain_app_feature)`;

/** @deprecated use APP_GUIDE_CLASSIFIER_RULES (ai-guide-1.6.1) */
export const PRODUCT_GUIDE_CLASSIFIER_RULES = APP_GUIDE_CLASSIFIER_RULES;

/** ai-guide-1.6.1 — provider mobile product guide classifier appendix (ai-cmd-provider-5.21 / 5.24). */
export const PROVIDER_APP_GUIDE_CLASSIFIER_RULES = `- explain_staff_invite: READ — staff invitation / Accept invite page FAQ (AiProductGuideService playbook provider-staff-invite). Triggers: what is this invite link, join salon as stylist, accept invite email. NOT complete_staff_invite mutate.
- explain_provider_app_tabs: READ — Today vs Calendar vs Schedule tabs (playbook provider-today-calendar). Triggers: what's on Today tab, where is Schedule tab, Today vs Calendar difference. NOT show_appointments list read.
- explain_team_view_scope: READ — manager team view vs my-calendar-only scope (playbook provider-view-scope). Triggers: why do I see everyone's bookings, switch to my calendar only, team view. NOT team_whos_next operational read.
- explain_profile_settings: READ — profile title, avatar, display name walkthrough (playbook provider-profile-settings). Triggers: change my title, update avatar, edit profile. Mutations stay in Profile UI — NOT update_provider_profile unless user gives imperative edit command.
- explain_assistant_confirm_swipe: READ — swipe-to-confirm safety preview (playbook provider-assistant-confirm). Triggers: why swipe to confirm, what will change before confirm. NOT bulk mutate execution.
- explain_provider_compound_steps: READ — multi-step provider compounds run sequentially with shared context (playbook provider-compound-steps). Triggers: one at a time, what happens next in compound, do these separately. NOT provider_booking_compound execution.`;

/** ai-guide-1.6.1 — consumer mobile product guide classifier appendix (ai-guide-1.5.2 / 1.5.4). */
export const CUSTOMER_APP_GUIDE_CLASSIFIER_RULES = `- explain_app_feature: READ — consumer app UI feature semantics (tabs, profile fields, packages/gift cards/subscriptions screens) and activation funnel steps (welcome → salon → service → slot → confirm). Triggers: what does X mean, what is the account tab, where is profile, how do gift cards or subscriptions work (read-only explain). Uses session activationStep/guidedBookingStep/screen/route for consumer-activation-* vs consumer-tabs vs consumer-account playbooks. Returns GuideResponse steps. NOT book_package / discover_packages mutate, NOT promo_code_help apply, NOT domain explain_* checkout/tax/currency.
- guide_user_flow: READ — step-by-step consumer app walkthrough (profile update, buy package, use tabs, first booking activation). Triggers: walk me through, step by step, how do I book my first appointment, what's next in onboarding. activationStep welcome → salon → service → slot → confirm drives playbook. Returns GuideResponse steps. NOT create_booking / book_nearest_slot mutate.
- explain_current_screen: READ — explain the current consumer screen from session route/tab/screen/activationStep. Triggers: this page, this screen, what am I looking at here. On activation funnel screens, uses step-aware consumer-activation-* playbooks. NOT domain checkout currency/tax explainers.`;

/** ai-guide-1.6.1 — public booking product guide classifier appendix (ai-guide-1.5.3). */
export const PUBLIC_APP_GUIDE_CLASSIFIER_RULES = `- explain_app_feature: READ — public booking page UI semantics for the current funnel step (professionals, services, checkout). Triggers: what does this step mean, what is the services page, where do I pick a provider. Uses session bookingStep/screen/route for playbook selection (public-booking-professionals, public-booking-services, public-checkout). NOT explain_checkout_currency/tax, NOT list_services catalog browse.
- guide_user_flow: READ — step-by-step public booking funnel walkthrough for the current step. Triggers: walk me through, step by step, what happens next on this page. bookingStep professionals → services → checkout drives playbook. NOT book_appointment mutate.
- explain_current_screen: READ — explain capabilities of the current booking step from bookingStep/screen context. Triggers: this page, this screen, what am I looking at. NOT domain checkout currency/tax explainers.`;

export interface ProductGuideClassifierScenario {
  id: string;
  prompt: string;
  expectedAction: AppGuideIntent;
  route?: string;
  topicId?: string;
  notAction?: string;
}

/** Classifier golden scenarios for dashboard product guide intents (ai-guide-1.2.6). */
export const PRODUCT_GUIDE_CLASSIFIER_SCENARIOS: readonly ProductGuideClassifierScenario[] =
  [
    {
      id: 'flow-schedule-templates',
      prompt: 'How do I set up weekly schedule templates?',
      expectedAction: 'guide_user_flow',
      route: '/dashboard/schedule',
    },
    {
      id: 'feature-command-bar',
      prompt: 'What does the Orchestrix command bar do?',
      expectedAction: 'explain_app_feature',
    },
    {
      id: 'screen-schedule-page',
      prompt: 'What can I do on this page?',
      expectedAction: 'explain_current_screen',
      route: '/dashboard/schedule',
    },
    {
      id: 'flow-online-payment-where',
      prompt: 'Where do I turn on online payment?',
      expectedAction: 'guide_user_flow',
      notAction: 'configure_service_online_payment',
    },
    {
      id: 'misroute-bulk-cancel',
      prompt: 'How do I cancel bookings for a client?',
      expectedAction: 'guide_user_flow',
      notAction: 'cancel_bookings',
    },
    {
      id: 'misroute-payment-sweep',
      prompt: 'How do I run a payment sweep at end of day?',
      expectedAction: 'guide_user_flow',
      notAction: 'payment_sweep',
    },
    {
      id: 'screen-help-this-page',
      prompt: 'Help me with this page — how do I clear the schedule?',
      expectedAction: 'explain_current_screen',
      route: '/dashboard/schedule',
    },
    {
      id: 'feature-ai-approval',
      prompt: 'What does plan approval mean in Orchestrix?',
      expectedAction: 'explain_app_feature',
      topicId: 'dashboard.ai.approval',
    },
    {
      id: 'flow-inventory-walkthrough',
      prompt: 'Walk me through linking products to services in Operations',
      expectedAction: 'guide_user_flow',
      topicId: 'dashboard.operations.inventory',
    },
    {
      id: 'screen-operations-overview',
      prompt: 'Explain what I am looking at on the Operations page',
      expectedAction: 'explain_current_screen',
      route: '/dashboard/operations',
    },
  ] as const;

export interface ProductGuideHandlerScenario {
  id: string;
  intent: AppGuideIntent;
  prompt: string;
  route?: string;
  topicId?: string;
  expectedTopicId: string;
  minSteps?: number;
}

export const PRODUCT_GUIDE_HANDLER_SCENARIOS: readonly ProductGuideHandlerScenario[] =
  [
    {
      id: 'flow-schedule-how-to',
      intent: 'guide_user_flow',
      prompt: 'How do I set up weekly schedule templates?',
      route: '/dashboard/schedule',
      expectedTopicId: 'dashboard.core.schedule',
      minSteps: 4,
    },
    {
      id: 'feature-command-bar',
      intent: 'explain_app_feature',
      prompt: 'What does the Orchestrix command bar do?',
      expectedTopicId: 'dashboard.ai.command-bar',
      minSteps: 1,
    },
    {
      id: 'screen-operations',
      intent: 'explain_current_screen',
      prompt: 'What can I do on this page?',
      route: '/dashboard/operations',
      expectedTopicId: 'dashboard.operations.overview',
      minSteps: 1,
    },
    {
      id: 'flow-explicit-topic',
      intent: 'guide_user_flow',
      prompt: 'Walk me through AI approval settings',
      topicId: 'dashboard.ai.approval',
      expectedTopicId: 'dashboard.ai.approval',
      minSteps: 4,
    },
  ] as const;

/** ai-guide-1.2.5 — handoff scenarios for deterministic guide responses. */
export interface ProductGuideHandoffScenario {
  id: string;
  prompt: string;
  expectedTopicId: string;
  expectedAction: string;
}

export const PRODUCT_GUIDE_HANDOFF_SCENARIOS: readonly ProductGuideHandoffScenario[] =
  [
    {
      id: 'handoff-online-payment',
      prompt: 'Where do I turn on online payment?',
      expectedTopicId: 'dashboard.core.employees',
      expectedAction: 'configure_service_online_payment',
    },
    {
      id: 'handoff-schedule-template',
      prompt: 'How do I set up weekly schedule templates?',
      expectedTopicId: 'dashboard.core.schedule',
      expectedAction: 'apply_schedule',
    },
    {
      id: 'handoff-setup-week',
      prompt: 'How do I set up recurring weekly hours for all providers?',
      expectedTopicId: 'dashboard.core.schedule',
      expectedAction: 'setup_week_schedule',
    },
    {
      id: 'handoff-block-schedule',
      prompt: 'How do I block time off on the schedule?',
      expectedTopicId: 'dashboard.core.schedule',
      expectedAction: 'block_schedule',
    },
    {
      id: 'handoff-create-template',
      prompt: 'How do I create a new schedule template?',
      expectedTopicId: 'dashboard.core.schedule',
      expectedAction: 'create_schedule_template',
    },
    {
      id: 'handoff-add-service',
      prompt: 'How do I add a new service to the catalog?',
      expectedTopicId: 'dashboard.core.employees',
      expectedAction: 'create_service',
    },
    {
      id: 'handoff-add-staff',
      prompt: 'How do I invite a new stylist?',
      expectedTopicId: 'dashboard.core.employees',
      expectedAction: 'create_employee',
    },
    {
      id: 'handoff-assign-services',
      prompt: 'How do I assign services to a provider?',
      expectedTopicId: 'dashboard.core.employees',
      expectedAction: 'assign_employee_services',
    },
    {
      id: 'handoff-inventory-link',
      prompt: 'How do I link inventory products to services?',
      expectedTopicId: 'dashboard.operations.inventory',
      expectedAction: 'assign_employee_services',
    },
  ] as const;

/** ai-guide-1.2.4 — grounding failure fixtures. */
export interface ProductGuideGroundingScenario {
  id: string;
  guide: GuideResponse;
  expectedIssueCodes: readonly string[];
  validateSettingsKeys?: boolean;
}

export const PRODUCT_GUIDE_GROUNDING_SCENARIOS: readonly ProductGuideGroundingScenario[] =
  [
    {
      id: 'unknown-route',
      guide: {
        summary: 'Go somewhere unknown.',
        steps: [{ title: 'Step 1', body: 'Open the page.' }],
        navigate: { path: '/dashboard/unknown-feature' },
        topicId: 'dashboard.core.schedule',
        sources: [{ topicId: 'dashboard.core.schedule', kind: 'topic' }],
      },
      expectedIssueCodes: ['unknown_route'],
    },
    {
      id: 'unknown-handoff-action',
      guide: {
        summary: 'Try this action.',
        steps: [{ title: 'Step 1', body: 'Do the thing.' }],
        topicId: 'dashboard.core.schedule',
        sources: [{ topicId: 'dashboard.core.schedule', kind: 'topic' }],
        relatedActions: [{ action: 'totally_fake_action', label: 'Fake' }],
      },
      expectedIssueCodes: ['unknown_handoff_action'],
    },
    {
      id: 'unknown-intent-citation',
      guide: {
        summary: 'Run configure_fake_payment_toggle next.',
        steps: [
          {
            title: 'Step 1',
            body: 'Use configure_fake_payment_toggle in settings.',
          },
        ],
        topicId: 'dashboard.core.schedule',
        sources: [{ topicId: 'dashboard.core.schedule', kind: 'topic' }],
      },
      expectedIssueCodes: ['unknown_intent_citation'],
    },
    {
      id: 'unknown-setting-key',
      guide: {
        summary: 'Enable settings.fakePaymentToggle in the dashboard.',
        steps: [
          {
            title: 'Step 1',
            body: 'Open business.settings.fakePaymentToggle.',
          },
        ],
        topicId: 'dashboard.core.schedule',
        sources: [{ topicId: 'dashboard.core.schedule', kind: 'topic' }],
      },
      expectedIssueCodes: ['unknown_setting_key'],
      validateSettingsKeys: true,
    },
    {
      id: 'grounded-setting-key',
      guide: {
        summary: 'Review settings.notifications for reminder toggles.',
        steps: [
          {
            title: 'Step 1',
            body: 'Open Settings and check settings.notifications.',
          },
        ],
        topicId: 'dashboard.core.schedule',
        sources: [{ topicId: 'dashboard.core.schedule', kind: 'topic' }],
      },
      expectedIssueCodes: [],
      validateSettingsKeys: true,
    },
  ] as const;

/** ai-guide-1.2.3 — semantic retrieval paraphrases (keyword rank below threshold). */
export interface ProductGuideSemanticScenario {
  id: string;
  prompt: string;
  intent: AppGuideIntent;
  route?: string;
  expectedTopicId: string;
}

export const PRODUCT_GUIDE_SEMANTIC_SCENARIOS: readonly ProductGuideSemanticScenario[] =
  [
    {
      id: 'semantic-command-bar-paraphrase',
      prompt: 'where do I type commands instead of clicking menus',
      intent: 'explain_app_feature',
      expectedTopicId: 'dashboard.ai.command-bar',
    },
    {
      id: 'semantic-schedule-paraphrase',
      prompt: 'configure repeating availability blocks for staff',
      intent: 'guide_user_flow',
      expectedTopicId: 'dashboard.core.schedule',
    },
    {
      id: 'semantic-online-payment-paraphrase',
      prompt: 'accept card payment when client books remotely',
      intent: 'guide_user_flow',
      expectedTopicId: 'dashboard.core.employees',
    },
  ] as const;

/** ai-guide-1.2.3 — LLM polish merge scenarios. */
export interface ProductGuidePolishScenario {
  id: string;
  baseSummary: string;
  polishedSummary: string;
  stepCount: number;
}

export const PRODUCT_GUIDE_POLISH_SCENARIOS: readonly ProductGuidePolishScenario[] =
  [
    {
      id: 'polish-rewrites-summary',
      baseSummary: 'Set up weekly schedule templates.',
      polishedSummary:
        'Here is how to configure weekly schedule templates for your team.',
      stepCount: 3,
    },
    {
      id: 'polish-preserves-step-count',
      baseSummary: 'Enable online payment.',
      polishedSummary:
        'You can turn on online prepayment from the service catalog.',
      stepCount: 4,
    },
  ] as const;

/** ai-guide-1.6.2 — top-20 guide flows per surface + NL prompt variants (generated). */
export type {
  SimilarAppGuidePrompt,
  TopAppGuideFlowDef,
} from './similar-app-guide-prompts.generated.js';
export {
  SIMILAR_APP_GUIDE_PROMPTS,
  TOP_APP_GUIDE_FLOWS,
} from './similar-app-guide-prompts.generated.js';
