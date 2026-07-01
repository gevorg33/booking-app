import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';
import {
  CATALOG_NOTIFY_DASHBOARD_SCENARIOS,
  type CatalogNotifyDashboardScenario,
} from './ai-catalog-notify.fixtures.js';

export type AiCmdDomain =
  | 'booking'
  | 'catalog'
  | 'crm'
  | 'schedule'
  | 'payments'
  | 'gift'
  | 'integrations'
  | 'retail'
  | 'marketing'
  | 'push'
  | 'customer'
  | 'provider'
  | 'revenue';

export type AiCmdSurface = 'dashboard' | 'provider' | 'customer';

export interface AiCmdRescueScenario {
  id: string;
  domain: AiCmdDomain;
  surface: AiCmdSurface;
  prompt: string;
  expectedAction: string;
  /** Classifier action passed to rescue (default unknown). */
  action?: string;
  paramsPartial?: Record<string, unknown>;
}

export function catalogNotifyDashboardToRescueScenario(
  scenario: CatalogNotifyDashboardScenario,
): AiCmdRescueScenario {
  return {
    id: `catalog-notify-${scenario.id}`,
    domain: 'catalog',
    surface: 'dashboard',
    prompt: scenario.prompt,
    expectedAction: scenario.expectedAction,
    paramsPartial: { notifyCustomers: scenario.notifyCustomers },
  };
}

export const CATALOG_NOTIFY_RESCUE_SCENARIOS: AiCmdRescueScenario[] =
  CATALOG_NOTIFY_DASHBOARD_SCENARIOS.map(
    catalogNotifyDashboardToRescueScenario,
  );

/** Per-domain NL rescue scenarios (ai-cmd-t2 / ai-cmd-t3). */
export const AI_CMD_RESCUE_SCENARIOS: AiCmdRescueScenario[] = [
  // Sprint 26 — booking depth (dashboard)
  {
    id: 'booking-package-create',
    domain: 'booking',
    surface: 'dashboard',
    prompt: 'Book spa day package for James Friday 2pm',
    expectedAction: 'create_package_booking',
  },
  {
    id: 'booking-multi-create',
    domain: 'booking',
    surface: 'dashboard',
    prompt: 'Book haircut and beard trim Tuesday 10am with Anna',
    expectedAction: 'create_multi_service_booking',
  },
  {
    id: 'booking-mark-paid',
    domain: 'booking',
    surface: 'dashboard',
    prompt: 'mark booking b1 paid',
    expectedAction: 'mark_paid',
  },
  {
    id: 'booking-list-packages',
    domain: 'booking',
    surface: 'dashboard',
    prompt: 'list package visits this week',
    expectedAction: 'list_package_bookings',
  },
  {
    id: 'booking-cancel-visit',
    domain: 'booking',
    surface: 'dashboard',
    prompt: 'cancel package visit for booking b1',
    expectedAction: 'cancel_package_visit',
  },
  {
    id: 'booking-assign-resource',
    domain: 'booking',
    surface: 'dashboard',
    prompt: 'assign room 2 to the 2pm facial',
    expectedAction: 'assign_booking_resource',
  },
  {
    id: 'booking-upcoming-all-providers',
    domain: 'booking',
    surface: 'dashboard',
    prompt: 'Show upcoming appointments for all providers',
    expectedAction: 'show_appointments',
    paramsPartial: { upcomingOnly: true, allProviders: true },
  },
  {
    id: 'booking-upcoming-named-providers',
    domain: 'booking',
    surface: 'dashboard',
    prompt: 'List upcoming appointments for Gevorg and Maria',
    expectedAction: 'show_appointments',
    paramsPartial: { upcomingOnly: true },
  },
  // Sprint 27 — catalog (dashboard)
  {
    id: 'catalog-bulk-create',
    domain: 'catalog',
    surface: 'dashboard',
    prompt: "Create category Hair with services: Women's cut 60m $65",
    expectedAction: 'bulk_create_catalog',
  },
  {
    id: 'catalog-category-10-translations',
    domain: 'catalog',
    surface: 'dashboard',
    prompt:
      'We are adding a new Nails category, create 10 linked services and add translations in Armenian and Russian',
    expectedAction: 'bulk_create_catalog',
  },
  {
    id: 'catalog-create-package',
    domain: 'catalog',
    surface: 'dashboard',
    prompt: 'Create Spa Day package with massage + facial 15% off',
    expectedAction: 'create_package',
  },
  {
    id: 'catalog-list-packages',
    domain: 'catalog',
    surface: 'dashboard',
    prompt: 'list packages',
    expectedAction: 'list_packages',
  },
  {
    id: 'catalog-subscription-plan',
    domain: 'catalog',
    surface: 'dashboard',
    prompt: 'Add 12-month nail plan 24 visits for Nail Care',
    expectedAction: 'create_subscription_plan',
  },
  ...CATALOG_NOTIFY_RESCUE_SCENARIOS,
  // Sprint 28 — CRM (dashboard + customer)
  {
    id: 'crm-list-subscriptions',
    domain: 'crm',
    surface: 'dashboard',
    prompt: "List Anna's subscriptions",
    expectedAction: 'list_customer_subscriptions',
  },
  {
    id: 'crm-tag-customer',
    domain: 'crm',
    surface: 'dashboard',
    prompt: 'Tag Anna as VIP',
    expectedAction: 'tag_customer',
  },
  {
    id: 'crm-customer-booking-context',
    domain: 'crm',
    surface: 'dashboard',
    prompt:
      'Summarize customer Maria Lopez who has a booking with Gevorg today at 10:00',
    expectedAction: 'lookup_customer',
    paramsPartial: { bookingContext: true, date: 'today' },
  },
  {
    id: 'crm-discover-packages',
    domain: 'crm',
    surface: 'customer',
    prompt: 'What packages are available?',
    expectedAction: 'discover_packages',
  },
  // Dashboard ops — provider revenue
  {
    id: 'revenue-provider-last-week',
    domain: 'revenue',
    surface: 'dashboard',
    prompt: 'Summarize Gevorg revenue last week',
    expectedAction: 'summarize_staff',
    paramsPartial: { staffMetric: 'most_revenue', employeeName: 'Gevorg' },
  },
  {
    id: 'revenue-provider-today',
    domain: 'revenue',
    surface: 'dashboard',
    prompt: 'Show service provider revenue today',
    expectedAction: 'summarize_staff',
    paramsPartial: { staffMetric: 'most_revenue' },
  },
  {
    id: 'revenue-provider-named-month',
    domain: 'revenue',
    surface: 'dashboard',
    prompt: 'Show revenue for Maria Lopez last month',
    expectedAction: 'summarize_staff',
    paramsPartial: { staffMetric: 'most_revenue', employeeName: 'Maria Lopez' },
  },
  // Sprint 29 — schedule resources
  {
    id: 'schedule-create-resource',
    domain: 'schedule',
    surface: 'dashboard',
    prompt: 'Create room Treatment 2',
    expectedAction: 'create_resource',
  },
  {
    id: 'schedule-package-line-availability',
    domain: 'schedule',
    surface: 'customer',
    prompt: 'Check package line availability tomorrow',
    expectedAction: 'check_package_line_availability',
  },
  {
    id: 'schedule-provider-assignments',
    domain: 'schedule',
    surface: 'provider',
    prompt: 'Show my resource assignments',
    expectedAction: 'my_resource_assignments',
  },
  // Sprint 30 — payments
  {
    id: 'payments-summarize-unpaid',
    domain: 'payments',
    surface: 'dashboard',
    prompt: 'Summarize unpaid bookings',
    expectedAction: 'summarize_unpaid',
  },
  {
    id: 'payments-gift-card-balance',
    domain: 'payments',
    surface: 'customer',
    prompt: 'Check gift card balance by code GCM-ABCD',
    expectedAction: 'check_gift_card_balance',
  },
  {
    id: 'payments-collect-cash',
    domain: 'payments',
    surface: 'provider',
    prompt: 'Confirm cash payment received',
    expectedAction: 'collect_cash_confirm',
  },
  // Sprint 31 — gift fulfillment
  {
    id: 'gift-creation-queue',
    domain: 'gift',
    surface: 'provider',
    prompt: 'Show gift card creation queue',
    expectedAction: 'gift_card_creation_queue',
  },
  {
    id: 'gift-track-order',
    domain: 'gift',
    surface: 'customer',
    prompt: 'Track my physical gift card order',
    expectedAction: 'track_physical_gift_card_order',
  },
  // Sprint 32 — integrations (dashboard + customer)
  {
    id: 'integrations-zendesk',
    domain: 'integrations',
    surface: 'dashboard',
    prompt: 'Configure Zendesk integration',
    expectedAction: 'configure_zendesk',
  },
  {
    id: 'integrations-contact-support',
    domain: 'integrations',
    surface: 'customer',
    prompt: 'Contact support about my order',
    expectedAction: 'contact_support',
  },
  // Sprint 33 — retail / finance
  {
    id: 'retail-create-product',
    domain: 'retail',
    surface: 'dashboard',
    prompt: 'Create product shampoo 500ml $18',
    expectedAction: 'create_product',
  },
  {
    id: 'retail-upsell',
    domain: 'retail',
    surface: 'provider',
    prompt: 'Suggest retail upsell for this booking',
    expectedAction: 'suggest_retail_upsell',
  },
  // Sprint 34 — marketing
  {
    id: 'marketing-inactive-customers',
    domain: 'marketing',
    surface: 'dashboard',
    prompt: 'List inactive customers',
    expectedAction: 'list_inactive_customers',
  },
  {
    id: 'marketing-reengagement',
    domain: 'marketing',
    surface: 'dashboard',
    prompt: 'Trigger reengagement campaign',
    expectedAction: 'trigger_reengagement',
  },
  {
    id: 'marketing-loyalty-balance',
    domain: 'marketing',
    surface: 'customer',
    prompt: 'Show my loyalty points balance',
    expectedAction: 'loyalty_points_balance',
  },
  // Sprint 35 — push / notifications
  {
    id: 'push-explain-last',
    domain: 'push',
    surface: 'provider',
    prompt: 'Explain last push',
    expectedAction: 'explain_last_push',
  },
  {
    id: 'push-reminder-prefs',
    domain: 'push',
    surface: 'customer',
    prompt: 'Appointment reminder preferences',
    expectedAction: 'appointment_reminder_preferences',
  },
  // Sprint 36 — customer self-service
  {
    id: 'customer-book-package',
    domain: 'customer',
    surface: 'customer',
    prompt: 'Book spa day package tomorrow at 10am',
    expectedAction: 'book_package',
  },
  {
    id: 'customer-buy-package',
    domain: 'customer',
    surface: 'customer',
    prompt: 'Buy the spa day package',
    expectedAction: 'book_package',
  },
  {
    id: 'customer-discover-packages',
    domain: 'customer',
    surface: 'customer',
    prompt: 'What packages do you have?',
    expectedAction: 'discover_packages',
  },
  {
    id: 'customer-list-appointments',
    domain: 'customer',
    surface: 'customer',
    prompt: 'List my appointments',
    expectedAction: 'list_my_appointments',
  },
  {
    id: 'customer-book-cash',
    domain: 'customer',
    surface: 'customer',
    prompt: 'Book haircut tomorrow 3pm pay at venue',
    expectedAction: 'book_with_cash',
  },
  {
    id: 'customer-cart-add',
    domain: 'customer',
    surface: 'customer',
    prompt: 'Add massage to my cart',
    expectedAction: 'add_services_to_cart',
  },
  // Sprint 37 — provider booking views
  {
    id: 'provider-package-today',
    domain: 'provider',
    surface: 'provider',
    prompt: 'Show my package appointments today',
    expectedAction: 'list_package_appointments_today',
  },
  {
    id: 'provider-my-package-visits',
    domain: 'provider',
    surface: 'provider',
    prompt: 'List my package visits this week',
    expectedAction: 'list_my_package_visits',
  },
  {
    id: 'provider-mark-paid',
    domain: 'provider',
    surface: 'provider',
    prompt: 'Mark this appointment paid',
    expectedAction: 'mark_paid',
  },
];

export function aiCmdScenarioToEvalCase(
  scenario: AiCmdRescueScenario,
): AiCommandEvalCase {
  return {
    id: `ai-cmd-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en',
    surface: scenario.surface,
    expect: {
      rescuedAction: scenario.expectedAction,
      ...(scenario.paramsPartial
        ? { paramsPartial: scenario.paramsPartial }
        : {}),
    },
  };
}

export const AI_COMMAND_EVAL_AI_CMD_DOMAIN_CASES: AiCommandEvalCase[] =
  AI_CMD_RESCUE_SCENARIOS.map(aiCmdScenarioToEvalCase);

/** Group scenarios by domain for integration matrix tests. */
export function scenariosByDomain(domain: AiCmdDomain): AiCmdRescueScenario[] {
  return AI_CMD_RESCUE_SCENARIOS.filter((s) => s.domain === domain);
}

export function scenariosBySurface(
  surface: AiCmdSurface,
): AiCmdRescueScenario[] {
  return AI_CMD_RESCUE_SCENARIOS.filter((s) => s.surface === surface);
}
