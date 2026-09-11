import {
  EXECUTION_MODE_EXCEPTIONS,
  buildIntentSurfaceMap,
  buildMutatingIntentSet,
  buildSurfaceIntentListsFromSpecs,
} from './ai-command-registry.generate.js';
import {
  CATALOG_INTENTS,
  CATALOG_COMPOUND_EXTRA_STEP_INTENTS,
} from './ai-catalog.util.js';
import {
  DASHBOARD_CRM_MUTATE_INTENTS,
  DASHBOARD_CRM_READ_INTENTS,
} from './ai-customer-crm.util.js';
import {
  DASHBOARD_RESOURCE_MUTATE_INTENTS,
  DASHBOARD_RESOURCE_READ_INTENTS,
} from './ai-schedule-resources.util.js';
import {
  DASHBOARD_PAYMENTS_MUTATE_INTENTS,
  DASHBOARD_PAYMENTS_READ_INTENTS,
  CUSTOMER_PAYMENTS_INTENTS,
} from './ai-payments.util.js';
import {
  DASHBOARD_GIFT_FULFILLMENT_MUTATE_INTENTS,
  DASHBOARD_GIFT_FULFILLMENT_READ_INTENTS,
  PROVIDER_GIFT_FULFILLMENT_INTENTS,
} from './ai-gift-fulfillment.util.js';
import {
  DASHBOARD_INTEGRATIONS_MUTATE_INTENTS,
  DASHBOARD_INTEGRATIONS_READ_INTENTS,
} from './ai-integrations.util.js';
import {
  DASHBOARD_MARKETING_GROWTH_MUTATE_INTENTS,
  DASHBOARD_MARKETING_GROWTH_READ_INTENTS,
} from './ai-marketing-growth.util.js';
import {
  PROVIDER_PUSH_NOTIFICATIONS_MUTATE_INTENTS,
  PROVIDER_PUSH_NOTIFICATIONS_READ_INTENTS,
} from './ai-push-notifications.util.js';
import { SELF_SERVICE_BOOKING_INTENTS } from './ai-self-service-booking.util.js';
import { PUBLIC_MULTI_SERVICE_BOOKING_INTENTS } from './ai-multi-service-customer-public.util.js';
import { PROVIDER_BOOKING_INTENTS } from './ai-provider-booking.util.js';
import { CLINIC_TEST_ORDER_MUTATE_INTENTS } from './ai-clinic-test-order.util.js';
import { CONSUMER_CLINIC_TEST_RESULTS_INTENTS } from './ai-consumer-clinic-test-results.util.js';
import { NOTIFICATION_DATE_FORMAT_MUTATE_INTENTS } from './ai-notification-date-format.util.js';
import type {
  CommandRegistryEntry,
  CommandSurface,
  CompoundCommandRecipe,
} from './ai-command-registry.types.js';

/**
 * Intents routed through CommandOrchestrationService / plan builder — §164.
 *
 * Derived, not declared. This was a hand-listed set of 13 ids, and
 * `EXECUTION_MODE_EXCEPTIONS` is a hand-listed map of the same 13 ids to
 * `orchestration` — one fact written twice, in two files, with nothing keeping
 * them in step. Measured before collapsing them: the set, the exception keys and
 * `COMMAND_REGISTRY.filter(e => e.executionMode === 'orchestration')` are all the
 * same 13 ids in the same order.
 *
 * The generator's table is the surviving copy because it is the one the registry
 * is built from; this set is now a view of it.
 */
export const ORCHESTRATION_INTENT_IDS: ReadonlySet<string> = new Set(
  Object.keys(EXECUTION_MODE_EXCEPTIONS),
);

/**
 * `INTENT_BINDING_SEEDS` and `LEGACY_CORE_BINDINGS` were deleted in §163
 * (C1 / e2e-bug.379) — the last of the six hand-maintained lists.
 *
 * They were 1,500 lines binding intent ids to surfaces, handlers, api modules
 * and a `mutateIntents` list. Every one of those facts now lives on the
 * `CommandSpec`, and each derivation was measured against the committed values
 * before the swap: surfaces 388/153/221/137 exact, mutating 236/52/68 exact,
 * `resolveIntentSurfaces` 0 diffs across 705 intents.
 *
 * The finding worth keeping from `LEGACY_CORE_BINDINGS` is e2e-bug.386: ten
 * commands were bound to `public` alone, but no request has ever arrived on
 * `public` (customer 3,703 / dashboard 1,161 / provider 498 / public **zero**),
 * so `specsForActor` hid them from 794 executed traces. The fix is now carried
 * by the specs' own `surfaces`, which is why the derived customer list matches.
 */

// §163 (C1 / e2e-bug.379) — derived from `spec.surfaces`, not from the seeds.
// `buildSurfaceIntentListsFromSpecs` reproduces all four lists exactly
// (388/153/221/137, zero diff), verified before this swap and gated after it.
const SURFACE_INTENT_LISTS = buildSurfaceIntentListsFromSpecs();
const MUTATING_INTENTS = buildMutatingIntentSet();
const INTENT_SURFACES = buildIntentSurfaceMap();

/** Test hook — surfaces for an intent id no spec declares resolve to []. */
export function resolveIntentSurfaces(intentId: string): CommandSurface[] {
  return INTENT_SURFACES.get(intentId) ?? [];
}

/** Capability matrix intent lists — generated from registry bindings (ai-cmd-0.2). */
export const DASHBOARD_INTENTS =
  SURFACE_INTENT_LISTS.dashboard as readonly string[];
export const PROVIDER_INTENTS =
  SURFACE_INTENT_LISTS.provider as readonly string[];
export const CUSTOMER_INTENTS =
  SURFACE_INTENT_LISTS.customer as readonly string[];
export const PUBLIC_INTENTS = SURFACE_INTENT_LISTS.public as readonly string[];

/** Backward-compatible union for legacy `public` orchestration paths (ai-cmd-0.5 splits this). */
export const PUBLIC_ASSISTANT_INTENTS = [
  ...new Set([
    ...PUBLIC_INTENTS.filter((id) => id !== 'unknown'),
    ...CUSTOMER_INTENTS.filter((id) => id !== 'unknown'),
  ]),
  'unknown',
] as const;

export const DASHBOARD_MUTATING_INTENTS = DASHBOARD_INTENTS.filter((id) =>
  MUTATING_INTENTS.has(id),
);
export const PROVIDER_MUTATING_INTENTS = PROVIDER_INTENTS.filter((id) =>
  MUTATING_INTENTS.has(id),
);
export const CUSTOMER_MUTATING_INTENTS = CUSTOMER_INTENTS.filter((id) =>
  MUTATING_INTENTS.has(id),
);

/**
 * `buildCommandRegistry` was deleted in §162 (C1 / e2e-bug.379).
 *
 * `COMMAND_REGISTRY` is generated from `CommandSpec` by
 * `ai-command-registry.generate.ts`. This function built it from
 * `INTENT_BINDING_SEEDS` instead, and was the parallel list the spec port set
 * out to remove.
 *
 * Its four private helpers — `SURFACE_HANDLER_OVERRIDES`, `tiersForSurface`,
 * `resolveExecutionMode` and `isMutatingIntent` — went with it; each existed
 * only to fill a registry field, and each has an equivalent in the derive
 * modules. (Two share a name with exported functions in `ai-propose-only.util`
 * and `ai-capability.matrix`; those are different symbols and are untouched —
 * checked before deleting.)
 *
 * The **seeds themselves stay**, and not by oversight: `buildBindingMaps()` also
 * produces `GLOBAL_SURFACE_BY_INTENT`, from which `DASHBOARD_INTENTS`,
 * `PROVIDER_INTENTS`, `CUSTOMER_INTENTS` and `PUBLIC_INTENTS` are built — and
 * those are read in 78 places. They are the *next* list to generate, not this
 * one.
 */

export function buildCompoundCommandRecipes(): CompoundCommandRecipe[] {
  const dashboardSteps = DASHBOARD_INTENTS.filter((id) => id !== 'unknown');
  const customerSteps = CUSTOMER_INTENTS.filter((id) => id !== 'unknown');
  const publicSteps = PUBLIC_INTENTS.filter((id) => id !== 'unknown');
  const dashboardCrmSteps = [
    ...DASHBOARD_CRM_MUTATE_INTENTS,
    ...DASHBOARD_CRM_READ_INTENTS,
  ];

  return [
    {
      id: 'dashboard_operational_compound',
      surfaces: ['dashboard'],
      handler: 'AiCommandService.executeCommand',
      llmDecompose: true,
      decomposeUtil: 'IntentDecompositionService.decomposePrompt',
      maxSteps: 4,
      allowedStepIntentIds: dashboardSteps,
      examplePrompts: [
        'Cancel all appointments and then clear schedule for Gevorg',
        'Book facemassage on Gevorg tomorrow at 9; if not available then Mary at 9',
        'Apply week template and fill unused slots',
      ],
    },
    {
      id: 'dashboard_catalog_compound',
      surfaces: ['dashboard'],
      handler: 'AiCatalogService.handleCatalogCompound',
      decomposeUtil: 'decomposeCatalogCompoundPrompt',
      maxSteps: 4,
      // e2e-bug.448(b) / D3 item (4) — the compound may CONTAIN an
      // online-payment step even though the catalog service does not execute
      // one; the executor delegates it. Widened here at the recipe rather than
      // in `CATALOG_INTENTS`, which also defines
      // `DASHBOARD_CATALOG_DISPATCH_INTENTS` and would route the action to the
      // wrong service.
      allowedStepIntentIds: [
        ...CATALOG_INTENTS,
        ...CATALOG_COMPOUND_EXTRA_STEP_INTENTS,
      ],
      examplePrompts: [
        'Create Spa Day package and list packages',
        'Enable gift card presets and configure multi-service settings',
      ],
    },
    {
      id: 'dashboard_crm_compound',
      surfaces: ['dashboard'],
      handler: 'AiCustomerCrmService.handleCrmCompound',
      decomposeUtil: 'decomposeCrmCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: dashboardCrmSteps,
      examplePrompts: [
        'List subscriptions for Anna and tag customer as VIP',
        'Export customer data and send reengagement message',
      ],
    },
    {
      id: 'dashboard_schedule_resource_compound',
      surfaces: ['dashboard'],
      handler: 'AiScheduleResourcesService.handleScheduleResourceCompound',
      decomposeUtil: 'decomposeScheduleResourceCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: [
        ...DASHBOARD_RESOURCE_MUTATE_INTENTS,
        ...DASHBOARD_RESOURCE_READ_INTENTS,
      ],
      examplePrompts: [
        'List scheduling resources and explain resource conflict for room 2',
        'Create resource Massage room and assign resource hours',
      ],
    },
    {
      id: 'dashboard_package_multi_service_compound',
      surfaces: ['dashboard'],
      handler: 'AiCommandService.executeCommand',
      decomposeUtil: 'decomposeDashboardPackageMultiServiceCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: [
        'create_package_booking',
        'create_multi_service_booking',
        'check_package_line_availability',
        'check_multi_service_block_availability',
        'earliest_slot_all_services',
      ],
      examplePrompts: [
        'Check package line availability for Spa Day tomorrow and book for James at 2pm',
        'Add haircut and beard trim to cart, check block availability Tuesday, book for Maria at 10am',
      ],
    },
    {
      id: 'dashboard_payments_compound',
      surfaces: ['dashboard'],
      handler: 'AiPaymentsService.handlePaymentsCompound',
      decomposeUtil: 'decomposePaymentsCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: [
        ...DASHBOARD_PAYMENTS_MUTATE_INTENTS,
        ...DASHBOARD_PAYMENTS_READ_INTENTS,
      ],
      examplePrompts: [
        'Summarize unpaid bookings and export accounting',
        'Validate gift card and adjust gift card balance',
      ],
    },
    {
      id: 'dashboard_fulfillment_compound',
      surfaces: ['dashboard'],
      handler: 'AiGiftFulfillmentService.handleFulfillmentCompound',
      decomposeUtil: 'decomposeFulfillmentCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: [
        ...DASHBOARD_GIFT_FULFILLMENT_MUTATE_INTENTS,
        ...DASHBOARD_GIFT_FULFILLMENT_READ_INTENTS,
      ],
      examplePrompts: [
        'List gift card orders and print packing slip',
        'Filter awaiting creation and assign card creator',
      ],
    },
    {
      id: 'dashboard_integrations_compound',
      surfaces: ['dashboard'],
      handler: 'AiIntegrationsService.handleIntegrationsCompound',
      decomposeUtil: 'decomposeIntegrationsCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: [
        ...DASHBOARD_INTEGRATIONS_MUTATE_INTENTS,
        ...DASHBOARD_INTEGRATIONS_READ_INTENTS,
      ],
      examplePrompts: [
        'Configure Zendesk and sync customer to Zendesk',
        'Run accounting export and list integration health',
      ],
    },
    {
      id: 'dashboard_marketing_compound',
      surfaces: ['dashboard'],
      handler: 'AiMarketingGrowthService.handleMarketingGrowthCompound',
      decomposeUtil: 'decomposeMarketingGrowthCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: [
        ...DASHBOARD_MARKETING_GROWTH_MUTATE_INTENTS,
        ...DASHBOARD_MARKETING_GROWTH_READ_INTENTS,
      ],
      examplePrompts: [
        'Explain plan limits and suggest upgrade',
        'Trigger reengagement and list inactive customers',
      ],
    },
    {
      id: 'customer_booking_compound',
      surfaces: ['customer'],
      handler: 'AiSelfServiceBookingService.handleCustomerBookingCompound',
      decomposeUtil: 'decomposeCustomerBookingCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: SELF_SERVICE_BOOKING_INTENTS,
      examplePrompts: [
        'Book spa day package and pay cash at visit',
        'Add massage to cart and show cart total duration',
        'List my appointments and get manage link',
      ],
    },
    {
      id: 'customer_self_service_compound',
      surfaces: ['customer'],
      handler: 'AiSelfServiceBookingService.handleCustomerBookingCompound',
      decomposeUtil: 'decomposeCustomerBookingCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: customerSteps,
      examplePrompts: [
        'Discover packages and book package with cash at visit',
        'Check package availability and list my appointments',
        'Buy gift card and track gift card shipment',
      ],
    },
    // e2e-bug.534 — the recipe this golden pattern already referenced.
    //
    // `customer_book_with_gift_card_compound` exists as a golden pattern in
    // intent-decomposition.util (matches + buildSteps, working), and two
    // fixtures assert `compoundRecipeId: 'customer_book_with_gift_card_compound'`
    // — but no recipe by that id was ever declared here, so
    // `listCompoundRecipeIds()` did not contain it and the schema had no entry
    // for a compound the decomposer happily produces.
    //
    // Declared rather than repointed: the neighbouring
    // `customer_gift_card_checkout_compound` pattern shows a recipeId may point
    // at a *different* recipe, and `customer_gift_card_payments_compound` even
    // documents this prompt shape — but the two fixtures name this id directly,
    // so the intended design is that the recipe exists.
    //
    // Steps come from `decomposeBookWithGiftCardCompoundPrompt`: a
    // `book_package` or `book_nearest_slot` first, then `book_with_gift_card`.
    // Listed explicitly rather than spread from a broad intent set, so this
    // recipe permits exactly what its decomposer emits.
    {
      id: 'customer_book_with_gift_card_compound',
      surfaces: ['customer'],
      handler: 'AiSelfServiceBookingService.handleCustomerBookingCompound',
      decomposeUtil: 'decomposeBookWithGiftCardCompoundPrompt',
      maxSteps: 2,
      allowedStepIntentIds: [
        'book_package',
        'book_nearest_slot',
        'book_with_gift_card',
      ],
      examplePrompts: [
        'Book spa day package and pay with gift card GCM-SPA100',
        'Book nearest massage slot and pay with my gift card',
      ],
    },
    {
      id: 'customer_gift_card_payments_compound',
      surfaces: ['customer'],
      handler: 'AiPaymentsService.handlePaymentsCompound',
      decomposeUtil: 'decomposeGiftCardPaymentsCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: [
        ...CUSTOMER_PAYMENTS_INTENTS,
        'track_physical_gift_card_order',
      ],
      examplePrompts: [
        'Book nearest slot for massage and apply gift card GCM-ABCD1234 and choose payment method',
        'Buy physical gift card $100 and track my order',
      ],
    },
    {
      id: 'provider_booking_compound',
      surfaces: ['provider'],
      handler: 'AiProviderBookingService.handleProviderBookingCompound',
      decomposeUtil: 'decomposeProviderBookingCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: PROVIDER_BOOKING_INTENTS,
      examplePrompts: [
        'Show my package appointments today and mark booking paid',
        'List my package visits this week and list my multi-service groups',
      ],
    },
    {
      id: 'provider_push_compound',
      surfaces: ['provider'],
      handler: 'AiPushNotificationsService.handlePushNotificationsCompound',
      decomposeUtil: 'decomposePushNotificationsCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: [
        ...PROVIDER_PUSH_NOTIFICATIONS_MUTATE_INTENTS,
        ...PROVIDER_PUSH_NOTIFICATIONS_READ_INTENTS,
      ],
      examplePrompts: [
        'Explain last push and open booking from push',
        'Offline queue status and retry offline action',
      ],
    },
    {
      id: 'provider_fulfillment_compound',
      surfaces: ['provider'],
      handler: 'AiGiftFulfillmentService.handleFulfillmentCompound',
      decomposeUtil: 'decomposeFulfillmentCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: PROVIDER_GIFT_FULFILLMENT_INTENTS,
      examplePrompts: [
        'Gift card creation queue and start card preparation',
        'Delivery queue and mark out for delivery',
      ],
    },
    {
      id: 'onboard_new_provider',
      surfaces: ['dashboard'],
      handler: 'AiCommandService.executeCommand',
      decomposeUtil: 'decomposeProviderOnboardingCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: [
        'create_employee',
        'assign_employee_services',
        'onboard_provider_schedule',
        'configure_online_booking',
      ],
      examplePrompts: [
        'Onboard new stylist Anna end-to-end: create employee, assign haircut and color services, set up first week from weekday template, enable online booking',
        'Set up new therapist Maria from scratch — add to team, assign massage services, schedule first week from weekday template, turn on public booking',
        'Full provider setup for barber Jake: hire employee; assign beard trim services; onboard first week with weekday template; enable online booking page',
      ],
    },
    {
      id: 'setup_salon_checkout',
      surfaces: ['dashboard'],
      handler: 'AiCommandService.executeCommand',
      decomposeUtil: 'decomposeSetupSalonCheckoutCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: [
        'configure_stripe_connect',
        'configure_cash_payments',
        'configure_service_online_payment',
        'configure_online_booking',
      ],
      examplePrompts: [
        'Set up salon checkout end-to-end: connect Stripe for client payments, enable cash at venue, accept online payment on all services with 50% prepayment, enable online booking',
        'Full checkout setup for our spa — link Stripe Connect, turn on cash payments, require 50% online prepayment on every service, and enable the public booking page',
        'Configure salon checkout from scratch; connect Stripe; enable cash at checkout; accept online payment on all services with half deposit; turn on online booking',
      ],
    },
    {
      id: 'configure_services_payment_matrix',
      surfaces: ['dashboard'],
      handler: 'AiCommandService.executeCommand',
      decomposeUtil: 'decomposeConfigureServicesPaymentMatrixCompoundPrompt',
      maxSteps: 8,
      allowedStepIntentIds: [
        'update_service_prices',
        'configure_service_online_payment',
        'configure_cash_payments',
      ],
      examplePrompts: [
        'Configure services payment matrix — full prepayment for massage services and 50% deposit for hair services; enable cash at venue',
        'Raise massage prices 10% — services payment matrix: require full prepayment for massage services; accept 50% deposit for hair services; turn on cash payments',
        'Category payment matrix end-to-end: massage: full prepayment; hair: 50% deposit; facial: full prepayment; enable cash at checkout',
      ],
    },
    {
      id: 'cash_and_online_payment',
      surfaces: ['dashboard'],
      handler: 'AiCommandService.executeCommand',
      decomposeUtil: 'decomposeCashAndDeclineAllOnlinePaymentCompoundPrompt',
      maxSteps: 2,
      allowedStepIntentIds: [
        'configure_cash_payments',
        'configure_service_online_payment',
      ],
      examplePrompts: [
        'Enable cash and decline online payment for all services',
        'Turn on cash payments at checkout and decline online payment on public booking for all services',
        'Accept cash at venue and disable online prepayment for every service',
      ],
    },
    {
      id: 'decline_online_payment_category',
      surfaces: ['dashboard'],
      handler: 'AiCommandService.executeCommand',
      decomposeUtil: 'decomposeDeclineOnlinePaymentCategoryCompoundPrompt',
      maxSteps: 6,
      allowedStepIntentIds: [
        'configure_service_online_payment',
        'configure_cash_payments',
      ],
      examplePrompts: [
        'Decline online payment on public booking for dental services but accept 50% prepayment for massage services',
        'Turn off online payment for hair category and enable full prepayment for facial services',
        'Decline online payment for waxing services; require online payment on public booking for massage services with 50% deposit',
      ],
    },
    {
      id: 'onboard_salon_notifications',
      surfaces: ['dashboard'],
      handler: 'AiCommandService.executeCommand',
      decomposeUtil: 'decomposeOnboardSalonNotificationsCompoundPrompt',
      maxSteps: 3,
      allowedStepIntentIds: [
        'configure_notification_settings',
        'configure_whatsapp_integration',
        'test_push',
      ],
      examplePrompts: [
        'Onboard salon notifications end-to-end: configure notification settings with email and WhatsApp reminders, connect WhatsApp integration with platform default, and test push notifications',
        'Notification onboarding for our spa — enable email and 24h WhatsApp reminders, use platform default WhatsApp connection, send test push',
        'Set up salon notifications from scratch; turn on email appointment reminders; configure WhatsApp integration; test push',
      ],
    },
    {
      id: 'launch_consumer_app_growth',
      surfaces: ['dashboard'],
      handler: 'AiCommandService.executeCommand',
      decomposeUtil: 'decomposeLaunchConsumerAppGrowthCompoundPrompt',
      maxSteps: 3,
      allowedStepIntentIds: [
        'explain_tenant_app_install',
        'regenerate_tenant_app_install_qr',
        'configure_marketing_registration_email',
      ],
      examplePrompts: [
        'Launch consumer app growth end-to-end: explain our tenant app install QR, regenerate the growth QR code, and configure marketing registration email notifications',
        'Launch customer app growth for our spa — explain get-app link, refresh growth QR, enable marketing registration emails to team@salon.com',
        'Set up consumer app growth from scratch; explain app install landing page; regenerate tenant app install QR; configure marketing registration email',
      ],
    },
    {
      id: 'budget_discover_and_book',
      surfaces: ['dashboard'],
      handler: 'AiCommandService.executeCommand',
      decomposeUtil: 'decomposeBudgetDiscoverAndBookCompoundPrompt',
      maxSteps: 3,
      allowedStepIntentIds: [
        'list_services',
        'check_providers_for_service',
        'create_booking',
      ],
      examplePrompts: [
        "Budget discover and book end-to-end: show haircut options under $50, check who's free tomorrow evening, book the nearest slot",
        'Filter catalog for facials under $60, check who is free tomorrow, and book the soonest appointment',
        "Filter services under $50 for haircut; check who's free tomorrow; book nearest slot",
      ],
    },
    {
      id: 'rank_discover_and_book',
      surfaces: ['dashboard'],
      handler: 'AiCommandService.executeCommand',
      decomposeUtil: 'decomposeRankDiscoverAndBookCompoundPrompt',
      maxSteps: 3,
      allowedStepIntentIds: [
        'list_services',
        'check_providers_for_service',
        'create_booking',
      ],
      examplePrompts: [
        "Rank discover and book end-to-end: show premium facial options, check who's free tomorrow evening, book the nearest slot",
        'Filter catalog for cheapest massage, check who is free tomorrow, and book the soonest appointment',
        "Filter premium haircut services; check who's free tomorrow; book nearest slot",
      ],
    },
    {
      id: 'clinic_lab_day_close',
      surfaces: ['dashboard'],
      handler: 'AiCommandService.executeCommand',
      decomposeUtil: 'decomposeClinicLabDayCloseCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: [
        'list_test_orders',
        'enter_test_result',
        'release_test_result',
        'notify_patient_result_ready',
      ],
      examplePrompts: [
        'Lab day close end-to-end: list pending test orders for today, enter WBC 12.5 for order abc123, release results to Maria, notify her when results are ready',
        'Close lab day for today — show pending lab orders, record hemoglobin 13.1 for order ord-42, publish results to John, send result-ready notification',
        'Lab closeout for today; list pending lab orders; enter CBC 4.2 for order abc123; release results to Anna; notify her when results are ready',
      ],
    },
    {
      id: 'clinic_lab_review',
      surfaces: ['dashboard'],
      handler: 'AiCommandService.executeCommand',
      decomposeUtil: 'decomposeClinicLabReviewCompoundPrompt',
      maxSteps: 2,
      allowedStepIntentIds: [
        'list_abnormal_results',
        'explain_patient_results',
      ],
      examplePrompts: [
        'Lab review for Maria: list abnormal flagged measurements and explain her lab results',
        'List abnormal results for John and then explain his lab results',
        'Review flagged lab results for Anna; show abnormal measurements; explain what they mean',
      ],
    },
    {
      id: 'dashboard_clinic_compound',
      surfaces: ['dashboard'],
      handler: 'AiCommandService.executeCommand',
      decomposeUtil: 'decomposeDashboardClinicCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: [
        ...CLINIC_TEST_ORDER_MUTATE_INTENTS,
        ...NOTIFICATION_DATE_FORMAT_MUTATE_INTENTS,
      ],
      examplePrompts: [
        "Order lipid panel for Maria's visit and notify her when results are ready",
        'Place CBC for John and send result-ready email when available',
      ],
    },
    {
      id: 'customer_clinic_compound',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeCustomerClinicCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: [
        'book_nearest_slot',
        ...CONSUMER_CLINIC_TEST_RESULTS_INTENTS,
      ],
      examplePrompts: [
        'Book lipid panel and notify me when results are ready',
        'Schedule a CBC and explain when my results will be ready',
      ],
    },
    {
      id: 'public_clinic_compound',
      surfaces: ['public'],
      handler: 'PublicBookingAssistantService.executeCommand',
      decomposeUtil: 'decomposePublicClinicCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: [
        'book_appointment',
        ...CONSUMER_CLINIC_TEST_RESULTS_INTENTS,
      ],
      examplePrompts: [
        'Book lipid panel and tell me when results are ready on this page',
        'Schedule a CBC and explain when results will be ready',
      ],
    },
    {
      id: 'public_flexible_availability_list_budget_then_or_compound',
      surfaces: ['public'],
      handler: 'PublicBookingAssistantService.executeCommand',
      decomposeUtil:
        'decomposeFlexibleAvailabilityListBudgetThenOrCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: ['list_services', 'check_availability'],
      examplePrompts: [
        'Show haircuts under $50, then check tomorrow evening or Friday afternoon',
        'List services under $60, then who is free Saturday morning or Monday evening',
      ],
    },
    {
      id: 'customer_flexible_availability_list_budget_then_or_compound',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil:
        'decomposeFlexibleAvailabilityListBudgetThenOrCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: ['list_services', 'check_providers_for_service'],
      examplePrompts: [
        'Show haircuts under $50, then check tomorrow evening or Friday afternoon',
        'List services under $60, then who is free Saturday morning or Monday evening',
      ],
    },
    {
      id: 'public_flexible_availability_budget_compound',
      surfaces: ['public'],
      handler: 'PublicBookingAssistantService.executeCommand',
      decomposeUtil: 'decomposePublicFlexibleAvailabilityBudgetCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: ['check_availability', 'book_appointment'],
      examplePrompts: [
        'I want a haircut tomorrow evening or Friday afternoon, I have $50, book the soonest',
        "Who's free for a haircut tomorrow evening or Friday afternoon under $50, book the soonest",
        'Book lashes tomorrow evening or Saturday afternoon, whichever is sooner, I have $50',
      ],
    },
    {
      id: 'customer_flexible_availability_budget_compound',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil:
        'decomposeCustomerFlexibleAvailabilityBudgetCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: [
        'check_providers_for_service',
        'book_nearest_slot',
      ],
      examplePrompts: [
        'I want a haircut tomorrow evening or Friday afternoon, I have $50, book the soonest',
        "Who's free for a haircut tomorrow evening or Friday afternoon under $50, book the soonest",
      ],
    },
    {
      id: 'public_budget_service_discovery_compound',
      surfaces: ['public'],
      handler: 'PublicBookingAssistantService.executeCommand',
      decomposeUtil: 'decomposePublicBudgetServiceDiscoveryCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: [
        'list_services',
        'check_availability',
        'book_appointment',
      ],
      examplePrompts: [
        'Book a haircut under $50 tomorrow, nearest slot',
        "Who's free for a facial under $60 tomorrow evening, book the soonest",
      ],
    },
    {
      id: 'customer_budget_service_discovery_compound',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeCustomerBudgetServiceDiscoveryCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: [
        'list_services',
        'check_providers_for_service',
        'book_nearest_slot',
      ],
      examplePrompts: [
        'Book a haircut under $50 tomorrow, nearest slot',
        "Who's free for a facial under $60 tomorrow evening, book the soonest",
      ],
    },
    {
      id: 'discover_book_and_pay',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeCustomerDiscoverBookAndPayCompoundPrompt',
      llmDecompose: false,
      maxSteps: 4,
      allowedStepIntentIds: [
        'list_services',
        'check_providers_for_service',
        'book_nearest_slot',
        'pay_online',
        'choose_payment_method',
      ],
      examplePrompts: [
        'Book cheapest massage under $60 tomorrow and pay online',
        'Show facials under $50, check who is free, book soonest, pay with card',
      ],
    },
    {
      id: 'public_discover_book_and_pay',
      surfaces: ['public'],
      handler: 'PublicBookingAssistantService.executeCommand',
      decomposeUtil: 'decomposePublicDiscoverBookAndPayCompoundPrompt',
      llmDecompose: false,
      maxSteps: 4,
      allowedStepIntentIds: [
        'list_services',
        'check_availability',
        'book_appointment',
        'pay_online',
        'choose_payment_method',
      ],
      examplePrompts: [
        'Book cheapest massage under $60 tomorrow and pay online',
        'Show facials under $50, check availability, book soonest, pay with card',
      ],
    },
    {
      id: 'rebook_and_pay',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeRebookAndPayCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: [
        'rebook_last_appointment',
        'pay_online',
        'choose_payment_method',
      ],
      examplePrompts: [
        'Rebook my last visit and pay with card',
        'Book the same as last time and pay online',
      ],
    },
    {
      id: 'subscription_first_visit',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeSubscriptionFirstVisitCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: [
        'explain_my_subscription',
        'use_subscription_credit',
      ],
      examplePrompts: [
        "Use my membership for today's massage",
        "Book tomorrow's facial with my subscription credit",
      ],
    },
    {
      id: 'results_then_rebook',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeResultsThenRebookCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: [
        'explain_result_status',
        'rebook_last_appointment',
      ],
      examplePrompts: [
        'Results released — book follow-up like last time',
        'My lab results are ready; rebook my last appointment',
      ],
    },
    {
      id: 'cancel_package_rebook_single',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeCancelPackageRebookSingleCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: ['cancel_package_visit_self', 'book_nearest_slot'],
      examplePrompts: [
        'Skip package visit 2 and book a trim instead',
        'Cancel visit 2 of my package and book a haircut instead',
      ],
    },
    {
      id: 'cancel_and_rebook',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeCancelAndRebookCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: ['cancel_my_booking', 'book_nearest_slot'],
      examplePrompts: [
        'Cancel Friday and book the next available slot',
        "Cancel tomorrow's massage and book the soonest slot",
      ],
    },
    {
      id: 'gift_card_checkout',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeGiftCardCheckoutCompoundPrompt',
      llmDecompose: false,
      maxSteps: 3,
      allowedStepIntentIds: [
        'check_gift_card_balance',
        'apply_gift_card_code',
        'book_nearest_slot',
      ],
      examplePrompts: [
        'Use gift card GCM-ABCD1234 and book nearest haircut',
        'Check gift card GCM-TEST5678 balance and book nearest massage slot',
      ],
    },
    {
      id: 'provider_same_day_multi',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeProviderSameDayMultiCompoundPrompt',
      llmDecompose: false,
      maxSteps: 3,
      allowedStepIntentIds: [
        'pick_provider_for_service',
        'check_multi_service_availability',
        'book_multi_service',
      ],
      examplePrompts: [
        'Anna — massage and facial same afternoon',
        'Book with Maria — haircut and color same day',
      ],
    },
    {
      id: 'multi_service_day',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeMultiServiceDayCompoundPrompt',
      llmDecompose: false,
      maxSteps: 3,
      allowedStepIntentIds: [
        'add_services_to_cart',
        'check_multi_service_availability',
        'book_multi_service',
      ],
      examplePrompts: [
        'Massage and facial same afternoon — find a time',
        'Haircut and color same day — find a time and book',
      ],
    },
    {
      id: 'guest_book_and_manage',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeGuestBookAndManageCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: ['book_nearest_slot', 'get_manage_link'],
      examplePrompts: [
        'Book as guest and email me the manage link',
        'Book haircut without an account and send manage link to john@example.com',
      ],
    },
    {
      id: 'guest_manage_visit',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeGuestManageVisitCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: [
        'get_manage_link',
        'cancel_booking_with_token',
        'reschedule_booking_with_token',
      ],
      examplePrompts: [
        'Cancel my haircut for john@example.com, I lost the manage link',
        'Move my appointment to Friday 2pm, my email is jane@example.com',
      ],
    },
    {
      id: 'guest_pay_cash_manage',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeGuestPayCashManageCompoundPrompt',
      llmDecompose: false,
      maxSteps: 3,
      allowedStepIntentIds: [
        'book_nearest_slot',
        'pay_cash_at_visit',
        'get_manage_link',
      ],
      examplePrompts: [
        'Book as guest, pay at visit, email manage link',
        'Book without account, pay cash when I arrive, and send me the manage link',
      ],
    },
    {
      id: 'book_package_with_nearest_slot',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil:
        'decomposeCustomerBookPackageWithNearestSlotCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: ['discover_packages', 'book_package'],
      examplePrompts: [
        'Book the spa package earliest available',
        'Buy deluxe bundle soonest slot for me',
      ],
    },
    {
      id: 'public_book_package_with_nearest_slot',
      surfaces: ['public'],
      handler: 'PublicBookingAssistantService.executeCommand',
      decomposeUtil: 'decomposePublicBookPackageWithNearestSlotCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: ['discover_packages', 'book_package'],
      examplePrompts: [
        'Book the spa package earliest available',
        'Buy deluxe bundle soonest opening',
      ],
    },
    {
      id: 'book_lab_collection_nearest',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeCustomerBookLabCollectionNearestCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: [
        'list_my_lab_booking_requests',
        'book_lab_collection',
      ],
      examplePrompts: [
        'Book lab draw earliest slot',
        'Schedule my blood draw soonest opening',
      ],
    },
    {
      id: 'public_book_lab_collection_nearest',
      surfaces: ['public'],
      handler: 'PublicBookingAssistantService.executeCommand',
      decomposeUtil: 'decomposePublicBookLabCollectionNearestCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: [
        'list_my_lab_booking_requests',
        'book_lab_collection',
      ],
      examplePrompts: [
        'Book lab draw earliest slot',
        'Schedule my lab blood draw soonest opening',
      ],
    },
    {
      id: 'complete_intake_and_book',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeCustomerCompleteIntakeAndBookCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: ['complete_intake_and_book', 'book_nearest_slot'],
      examplePrompts: [
        'Fill intake and book blood draw',
        'Complete the health questionnaire and book my lab test',
      ],
    },
    {
      id: 'public_complete_intake_and_book',
      surfaces: ['public'],
      handler: 'PublicBookingAssistantService.executeCommand',
      decomposeUtil: 'decomposePublicCompleteIntakeAndBookCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: ['complete_intake_and_book', 'book_appointment'],
      examplePrompts: [
        'Fill intake and book blood draw',
        'Complete intake questionnaire and reserve lab appointment',
      ],
    },
    {
      id: 'intake_lab_book_pay',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeCustomerIntakeLabBookPayCompoundPrompt',
      llmDecompose: false,
      maxSteps: 3,
      allowedStepIntentIds: [
        'complete_intake_and_book',
        'book_nearest_slot',
        'pay_online',
        'pay_cash_at_visit',
        'choose_payment_method',
      ],
      examplePrompts: [
        'Complete health form, book earliest blood draw, pay deposit',
        'Fill intake and book blood draw, pay online',
        'fill my intake, book the soonest blood test slot, and pay cash at the visit',
      ],
    },
    {
      id: 'public_intake_lab_book_pay',
      surfaces: ['public'],
      handler: 'PublicBookingAssistantService.executeCommand',
      decomposeUtil: 'decomposePublicIntakeLabBookPayCompoundPrompt',
      llmDecompose: false,
      maxSteps: 3,
      allowedStepIntentIds: [
        'complete_intake_and_book',
        'book_appointment',
        'pay_online',
        'pay_cash_at_visit',
        'choose_payment_method',
      ],
      examplePrompts: [
        'Complete health questionnaire, schedule lab test, pay with card',
        'Fill health form; book earliest blood draw; pay with card',
      ],
    },
    {
      id: 'tour_group_checkout',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeCustomerTourGroupCheckoutCompoundPrompt',
      llmDecompose: false,
      maxSteps: 3,
      allowedStepIntentIds: [
        'explain_tour_booking',
        'diagnose_tour_capacity',
        'book_nearest_slot',
      ],
      examplePrompts: [
        // e2e-bug.105 — short nicknames resolve via fuzzy catalog match
        'Wine tour for 6 next Saturday — book if enough seats',
        'City tour for 8 on 15/08/2026 — book only if enough spots',
        'Private Wine Country Day for 6 next Saturday — book if enough seats',
      ],
    },
    {
      id: 'public_tour_group_checkout',
      surfaces: ['public'],
      handler: 'PublicBookingAssistantService.executeCommand',
      decomposeUtil: 'decomposePublicTourGroupCheckoutCompoundPrompt',
      llmDecompose: false,
      maxSteps: 3,
      allowedStepIntentIds: [
        'explain_tour_booking',
        'diagnose_tour_capacity',
        'book_appointment',
      ],
      examplePrompts: [
        'Wine tour for 6 next Saturday — book if enough seats',
        'Sunset hike for 5 guests — reserve when seats are available',
        'Full Day City Tour for 8 on 15/08/2026 — book only if enough spots',
      ],
    },
    {
      id: 'book_tour_nearest_departure',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeCustomerBookTourNearestDepartureCompoundPrompt',
      llmDecompose: false,
      maxSteps: 3,
      allowedStepIntentIds: [
        'explain_tour_booking',
        'explain_tour_day_slots',
        'book_nearest_slot',
      ],
      examplePrompts: [
        // e2e-bug.105 — nicknames + realistic catalog-style names
        'Book the wine tour earliest date for 2 people',
        'Reserve mountain trek soonest departure for 4 guests',
        'Book 3-Day Mountain Trek soonest departure for 4 guests',
      ],
    },
    {
      id: 'public_book_tour_nearest_departure',
      surfaces: ['public'],
      handler: 'PublicBookingAssistantService.executeCommand',
      decomposeUtil: 'decomposePublicBookTourNearestDepartureCompoundPrompt',
      llmDecompose: false,
      maxSteps: 3,
      allowedStepIntentIds: [
        'explain_tour_booking',
        'explain_tour_day_slots',
        'book_appointment',
      ],
      examplePrompts: [
        'Book the wine tour earliest date for 2 people',
        'Reserve mountain trek soonest departure for 4 people',
        'Book Private Wine Country Day earliest date for 2 people',
      ],
    },
    {
      id: 'public_service_rank_discovery_compound',
      surfaces: ['public'],
      handler: 'PublicBookingAssistantService.executeCommand',
      decomposeUtil: 'decomposePublicServiceRankDiscoveryCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: ['list_services', 'book_appointment'],
      examplePrompts: [
        'Book your most premium facial tomorrow, nearest slot',
        'Book the cheapest haircut tomorrow, soonest opening',
      ],
    },
    {
      id: 'customer_service_rank_discovery_compound',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeCustomerServiceRankDiscoveryCompoundPrompt',
      llmDecompose: false,
      maxSteps: 2,
      allowedStepIntentIds: ['list_services', 'book_nearest_slot'],
      examplePrompts: [
        'Book your most premium facial tomorrow, nearest slot',
        'Book the cheapest haircut tomorrow, soonest opening',
      ],
    },
    {
      id: 'public_assistant_compound',
      surfaces: ['public', 'customer'],
      handler: 'PublicBookingAssistantService.executeCommand',
      decomposeUtil: 'decomposePublicAssistantCompoundPrompt',
      llmDecompose: false,
      maxSteps: 4,
      allowedStepIntentIds: publicSteps,
      examplePrompts: [
        'List providers and check availability',
        'Discover packages and recommend specialists',
        'Book appointment and show business info',
        'Find services under $50 and list providers',
        'List providers and walk me through booking',
      ],
    },
    {
      id: 'public_multi_service_compound',
      surfaces: ['public'],
      handler: 'PublicBookingAssistantService.executeCommand',
      decomposeUtil: 'decomposePublicMultiServiceCompoundPrompt',
      llmDecompose: false,
      maxSteps: 4,
      allowedStepIntentIds: [...PUBLIC_MULTI_SERVICE_BOOKING_INTENTS],
      examplePrompts: [
        'Add massage and facial to cart and check multi-service availability',
        'Check availability for massage and facial and book multi-service together',
      ],
    },
  ];
}

export function collectCompoundStepIds(
  recipes: CompoundCommandRecipe[],
): Set<string> {
  const ids = new Set<string>();
  for (const recipe of recipes) {
    for (const id of recipe.allowedStepIntentIds) ids.add(id);
  }
  return ids;
}

/** Ensures capability matrix lists stay aligned with the registry (CI guard). */
export function validateRegistryAgainstCapabilityMatrix(
  entries: CommandRegistryEntry[],
): string[] {
  const registryIds = new Set(entries.map((e) => e.id));
  const errors: string[] = [];

  for (const id of DASHBOARD_INTENTS) {
    if (!registryIds.has(id))
      errors.push(`Missing dashboard intent in registry: ${id}`);
  }
  for (const id of PROVIDER_INTENTS) {
    if (!registryIds.has(id))
      errors.push(`Missing provider intent in registry: ${id}`);
  }
  for (const id of PUBLIC_INTENTS) {
    if (!registryIds.has(id))
      errors.push(`Missing public intent in registry: ${id}`);
  }
  for (const id of CUSTOMER_INTENTS) {
    if (!registryIds.has(id))
      errors.push(`Missing customer intent in registry: ${id}`);
  }

  return errors;
}
