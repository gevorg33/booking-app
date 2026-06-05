import type { AccessTier } from './access-control.matrix.js';
import {
  isDashboardIntentAllowed,
  isProviderIntentAllowed,
  isCustomerIntentAllowed,
} from './access-control.matrix.js';
import { SCHEDULING_INTENTS } from './ai-scheduling.util.js';
import { OPERATIONS_INTENTS } from './ai-operations.util.js';
import {
  BOOKING_DEPTH_INTENTS,
  BOOKING_DEPTH_MUTATE_INTENTS,
} from './ai-booking-depth.util.js';
import { CATALOG_INTENTS, CATALOG_MUTATE_INTENTS } from './ai-catalog.util.js';
import {
  DASHBOARD_CRM_MUTATE_INTENTS,
  DASHBOARD_CRM_READ_INTENTS,
  CUSTOMER_ACCOUNT_MUTATE_INTENTS,
  CUSTOMER_ACCOUNT_READ_INTENTS,
  DISCOVERY_INTENTS,
} from './ai-customer-crm.util.js';
import {
  DASHBOARD_RESOURCE_MUTATE_INTENTS,
  DASHBOARD_RESOURCE_READ_INTENTS,
  PROVIDER_RESOURCE_INTENTS,
  CUSTOMER_AVAILABILITY_INTENTS,
} from './ai-schedule-resources.util.js';
import {
  DASHBOARD_PAYMENTS_MUTATE_INTENTS,
  DASHBOARD_PAYMENTS_READ_INTENTS,
  PROVIDER_PAYMENTS_INTENTS,
  CUSTOMER_PAYMENTS_INTENTS,
} from './ai-payments.util.js';
import {
  DASHBOARD_GIFT_FULFILLMENT_MUTATE_INTENTS,
  DASHBOARD_GIFT_FULFILLMENT_READ_INTENTS,
  PROVIDER_GIFT_FULFILLMENT_INTENTS,
  CUSTOMER_GIFT_FULFILLMENT_INTENTS,
} from './ai-gift-fulfillment.util.js';
import {
  DASHBOARD_INTEGRATIONS_MUTATE_INTENTS,
  DASHBOARD_INTEGRATIONS_READ_INTENTS,
  CUSTOMER_INTEGRATIONS_INTENTS,
} from './ai-integrations.util.js';
import {
  RETAIL_FINANCE_INTENTS,
  DASHBOARD_RETAIL_FINANCE_MUTATE_INTENTS,
  PROVIDER_RETAIL_FINANCE_INTENTS,
} from './ai-retail-finance.util.js';
import {
  DASHBOARD_MARKETING_GROWTH_MUTATE_INTENTS,
  DASHBOARD_MARKETING_GROWTH_READ_INTENTS,
  CUSTOMER_MARKETING_GROWTH_INTENTS,
} from './ai-marketing-growth.util.js';
import {
  DASHBOARD_PUSH_NOTIFICATIONS_MUTATE_INTENTS,
  DASHBOARD_PUSH_NOTIFICATIONS_READ_INTENTS,
  PROVIDER_PUSH_NOTIFICATIONS_MUTATE_INTENTS,
  PROVIDER_PUSH_NOTIFICATIONS_READ_INTENTS,
  CUSTOMER_PUSH_NOTIFICATIONS_INTENTS,
} from './ai-push-notifications.util.js';
import {
  SELF_SERVICE_BOOKING_INTENTS,
  SELF_SERVICE_BOOKING_MUTATE_INTENTS,
} from './ai-self-service-booking.util.js';
import {
  PROVIDER_BOOKING_INTENTS,
  PROVIDER_BOOKING_MUTATE_INTENTS,
} from './ai-provider-booking.util.js';
import type {
  CommandApiModule,
  CommandExecutionMode,
  CommandRegistryEntry,
  CommandSurface,
  CompoundCommandRecipe,
} from './ai-command-registry.types.js';

const ALL_TIERS: AccessTier[] = ['client', 'staff', 'manager', 'owner'];

/** Shared intent ids whose handler differs by surface. */
const SHARED_PROVIDER_OPERATIONAL_INTENTS = [
  'cancel_bookings',
  'update_bookings',
  'list_bookings',
  'show_appointments',
  'summarize_day',
  'reschedule_booking',
  'fill_unused_slots',
  'check_availability',
  'block_schedule',
  'summarize_utilization',
  'mark_no_shows',
  'payment_sweep',
] as const;

/** Provider-mobile intents that are not also on the dashboard surface. */
const PROVIDER_EXCLUSIVE_INTENTS = [
  'coordinate_waitlist_offer',
  'my_resource_assignments',
  'block_resource_unavailable',
  'explain_payment_status',
  'collect_cash_confirm',
  'gift_card_creation_queue',
  'start_card_preparation',
  'mark_card_ready',
  'delivery_queue',
  'accept_delivery',
  'mark_out_for_delivery',
  'capture_delivery_proof',
  'notify_delay',
  'mark_delivered',
  'suggest_retail_upsell',
  'add_retail_to_my_booking',
  'explain_last_push',
  'open_booking_from_push',
  'offline_queue_status',
  'retry_offline_action',
  'dismiss_push',
  'end_of_day_summary',
  'new_booking_push_actions',
  'list_package_appointments_today',
  'list_my_package_visits',
  'list_my_multi_service_groups',
] as const;

/** Anonymous public-booking assistant (pre-login). */
const PUBLIC_ANONYMOUS_INTENTS = [
  'list_providers',
  'list_services',
  'check_availability',
  'recommend_specialists',
  'book_appointment',
  'business_info',
  'booking_help',
] as const;

const SURFACE_HANDLER_OVERRIDES: Record<
  string,
  Partial<Record<CommandSurface, string>>
> = {
  mark_paid: {
    dashboard: 'AiBookingDepthService',
    provider: 'AiProviderBookingService',
  },
  ...Object.fromEntries(
    SHARED_PROVIDER_OPERATIONAL_INTENTS.map((id) => [
      id,
      { dashboard: 'AiCommandService', provider: 'ProviderAiCommandService' },
    ]),
  ),
};

/** Intents routed through CommandOrchestrationService / plan builder (not single-handler mutate). */
export const ORCHESTRATION_INTENT_IDS = new Set<string>([
  'optimize_schedule',
  'day_replan',
  'sick_day_replan',
  'rebalance_capacity',
  'resolve_conflicts',
  'reassign_cancelled',
  'setup_week_schedule',
  'fill_slot_from_waitlist',
  'bulk_smart_cancel',
  'no_show_recovery',
  'coordinate_waitlist_offer',
  'holiday_mode',
  'onboard_provider_schedule',
]);

interface IntentBindingSeed {
  intents: readonly string[];
  surfaces: CommandSurface[];
  apiModule: CommandApiModule;
  handler: string;
  sprint: string;
  mutateIntents?: readonly string[];
}

const INTENT_BINDING_SEEDS: IntentBindingSeed[] = [
  {
    intents: SCHEDULING_INTENTS,
    surfaces: ['dashboard'],
    apiModule: 'schedule',
    handler: 'AiSchedulingService',
    sprint: 'scheduling',
    mutateIntents: SCHEDULING_INTENTS,
  },
  {
    intents: OPERATIONS_INTENTS,
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiOperationsService',
    sprint: 'operations',
    mutateIntents: OPERATIONS_INTENTS,
  },
  {
    intents: BOOKING_DEPTH_INTENTS,
    surfaces: ['dashboard'],
    apiModule: 'booking',
    handler: 'AiBookingDepthService',
    sprint: 'bookingDepth',
    mutateIntents: BOOKING_DEPTH_MUTATE_INTENTS,
  },
  {
    intents: CATALOG_INTENTS,
    surfaces: ['dashboard'],
    apiModule: 'catalog',
    handler: 'AiCatalogService',
    sprint: 'catalog',
    mutateIntents: CATALOG_MUTATE_INTENTS,
  },
  {
    intents: [...DASHBOARD_CRM_MUTATE_INTENTS, ...DASHBOARD_CRM_READ_INTENTS],
    surfaces: ['dashboard'],
    apiModule: 'customer-crm',
    handler: 'AiCustomerCrmService',
    sprint: 'customerCrm',
    mutateIntents: DASHBOARD_CRM_MUTATE_INTENTS,
  },
  {
    intents: [
      ...CUSTOMER_ACCOUNT_MUTATE_INTENTS,
      ...CUSTOMER_ACCOUNT_READ_INTENTS,
      ...DISCOVERY_INTENTS,
    ],
    surfaces: ['customer', 'public'],
    apiModule: 'customer-crm',
    handler: 'AiCustomerCrmService',
    sprint: 'customerCrm',
    mutateIntents: CUSTOMER_ACCOUNT_MUTATE_INTENTS,
  },
  {
    intents: [
      ...DASHBOARD_RESOURCE_MUTATE_INTENTS,
      ...DASHBOARD_RESOURCE_READ_INTENTS,
    ],
    surfaces: ['dashboard'],
    apiModule: 'schedule-resources',
    handler: 'AiScheduleResourcesService',
    sprint: 'scheduleResources',
    mutateIntents: DASHBOARD_RESOURCE_MUTATE_INTENTS,
  },
  {
    intents: PROVIDER_RESOURCE_INTENTS,
    surfaces: ['provider'],
    apiModule: 'schedule-resources',
    handler: 'AiScheduleResourcesService',
    sprint: 'scheduleResources',
  },
  {
    intents: CUSTOMER_AVAILABILITY_INTENTS,
    surfaces: ['customer', 'public'],
    apiModule: 'schedule-resources',
    handler: 'AiScheduleResourcesService',
    sprint: 'scheduleResources',
  },
  {
    intents: [
      ...DASHBOARD_PAYMENTS_MUTATE_INTENTS,
      ...DASHBOARD_PAYMENTS_READ_INTENTS,
    ],
    surfaces: ['dashboard'],
    apiModule: 'payments',
    handler: 'AiPaymentsService',
    sprint: 'payments',
    mutateIntents: DASHBOARD_PAYMENTS_MUTATE_INTENTS,
  },
  {
    intents: PROVIDER_PAYMENTS_INTENTS,
    surfaces: ['provider'],
    apiModule: 'payments',
    handler: 'AiPaymentsService',
    sprint: 'payments',
    mutateIntents: PROVIDER_PAYMENTS_INTENTS,
  },
  {
    intents: CUSTOMER_PAYMENTS_INTENTS,
    surfaces: ['customer'],
    apiModule: 'payments',
    handler: 'AiPaymentsService',
    sprint: 'payments',
    mutateIntents: [
      'book_nearest_slot',
      'apply_gift_card_code',
      'buy_gift_card',
      'buy_gift_card_physical',
      'choose_payment_method',
      'pay_online',
      'pay_cash_at_visit',
      'purchase_subscription_checkout',
    ],
  },
  {
    intents: [
      ...DASHBOARD_GIFT_FULFILLMENT_MUTATE_INTENTS,
      ...DASHBOARD_GIFT_FULFILLMENT_READ_INTENTS,
    ],
    surfaces: ['dashboard'],
    apiModule: 'gift-fulfillment',
    handler: 'AiGiftFulfillmentService',
    sprint: 'giftFulfillment',
    mutateIntents: DASHBOARD_GIFT_FULFILLMENT_MUTATE_INTENTS,
  },
  {
    intents: PROVIDER_GIFT_FULFILLMENT_INTENTS,
    surfaces: ['provider'],
    apiModule: 'gift-fulfillment',
    handler: 'AiGiftFulfillmentService',
    sprint: 'giftFulfillment',
    mutateIntents: PROVIDER_GIFT_FULFILLMENT_INTENTS,
  },
  {
    intents: CUSTOMER_GIFT_FULFILLMENT_INTENTS,
    surfaces: ['customer'],
    apiModule: 'gift-fulfillment',
    handler: 'AiGiftFulfillmentService',
    sprint: 'giftFulfillment',
    mutateIntents: ['enter_shipping_address'],
  },
  {
    intents: [
      ...DASHBOARD_INTEGRATIONS_MUTATE_INTENTS,
      ...DASHBOARD_INTEGRATIONS_READ_INTENTS,
    ],
    surfaces: ['dashboard'],
    apiModule: 'integrations',
    handler: 'AiIntegrationsService',
    sprint: 'integrations',
    mutateIntents: DASHBOARD_INTEGRATIONS_MUTATE_INTENTS,
  },
  {
    intents: CUSTOMER_INTEGRATIONS_INTENTS,
    surfaces: ['customer'],
    apiModule: 'integrations',
    handler: 'AiIntegrationsService',
    sprint: 'integrations',
  },
  {
    intents: RETAIL_FINANCE_INTENTS,
    surfaces: ['dashboard', 'provider'],
    apiModule: 'retail-finance',
    handler: 'AiRetailFinanceService',
    sprint: 'retailFinance',
    mutateIntents: [
      ...DASHBOARD_RETAIL_FINANCE_MUTATE_INTENTS,
      ...PROVIDER_RETAIL_FINANCE_INTENTS,
    ],
  },
  {
    intents: [
      ...DASHBOARD_MARKETING_GROWTH_MUTATE_INTENTS,
      ...DASHBOARD_MARKETING_GROWTH_READ_INTENTS,
    ],
    surfaces: ['dashboard'],
    apiModule: 'marketing-growth',
    handler: 'AiMarketingGrowthService',
    sprint: 'marketingGrowth',
    mutateIntents: DASHBOARD_MARKETING_GROWTH_MUTATE_INTENTS,
  },
  {
    intents: CUSTOMER_MARKETING_GROWTH_INTENTS,
    surfaces: ['customer', 'public'],
    apiModule: 'marketing-growth',
    handler: 'AiMarketingGrowthService',
    sprint: 'marketingGrowth',
  },
  {
    intents: [
      ...DASHBOARD_PUSH_NOTIFICATIONS_MUTATE_INTENTS,
      ...DASHBOARD_PUSH_NOTIFICATIONS_READ_INTENTS,
    ],
    surfaces: ['dashboard'],
    apiModule: 'push-notifications',
    handler: 'AiPushNotificationsService',
    sprint: 'pushNotifications',
    mutateIntents: DASHBOARD_PUSH_NOTIFICATIONS_MUTATE_INTENTS,
  },
  {
    intents: [
      ...PROVIDER_PUSH_NOTIFICATIONS_MUTATE_INTENTS,
      ...PROVIDER_PUSH_NOTIFICATIONS_READ_INTENTS,
    ],
    surfaces: ['provider'],
    apiModule: 'push-notifications',
    handler: 'AiPushNotificationsService',
    sprint: 'pushNotifications',
    mutateIntents: PROVIDER_PUSH_NOTIFICATIONS_MUTATE_INTENTS,
  },
  {
    intents: CUSTOMER_PUSH_NOTIFICATIONS_INTENTS,
    surfaces: ['customer'],
    apiModule: 'push-notifications',
    handler: 'AiPushNotificationsService',
    sprint: 'pushNotifications',
    mutateIntents: CUSTOMER_PUSH_NOTIFICATIONS_INTENTS,
  },
  {
    intents: SELF_SERVICE_BOOKING_INTENTS,
    surfaces: ['customer'],
    apiModule: 'public-booking',
    handler: 'AiSelfServiceBookingService',
    sprint: 'selfServiceBooking',
    mutateIntents: SELF_SERVICE_BOOKING_MUTATE_INTENTS,
  },
  {
    intents: PROVIDER_BOOKING_INTENTS,
    surfaces: ['provider'],
    apiModule: 'provider-mobile',
    handler: 'AiProviderBookingService',
    sprint: 'providerBooking',
    mutateIntents: PROVIDER_BOOKING_MUTATE_INTENTS,
  },
  {
    intents: PROVIDER_PAYMENTS_INTENTS,
    surfaces: ['provider'],
    apiModule: 'payments',
    handler: 'AiPaymentsService',
    sprint: 'payments',
    mutateIntents: PROVIDER_PAYMENTS_INTENTS,
  },
];

/** Core dashboard / provider intents implemented in AiCommandService (pre-sprint modules). */
const LEGACY_CORE_BINDINGS: Array<{
  intents: readonly string[];
  surfaces: CommandSurface[];
  apiModule: CommandApiModule;
  handler: string;
  mutateIntents: readonly string[];
}> = [
  {
    intents: [
      'create_booking',
      'create_service',
      'create_services',
      'cancel_bookings',
      'bulk_smart_cancel',
      'hide_appointments_from_calendar',
      'unhide_appointments_from_calendar',
      'fill_slot_from_waitlist',
      'reschedule_booking',
      'fill_unused_slots',
      'apply_schedule',
      'block_schedule',
      'clear_schedule',
      'create_direct_schedule',
      'create_schedule_template',
      'assign_employee_services',
      'optimize_schedule',
      'setup_week_schedule',
      'swap_schedules',
      'rebalance_capacity',
      'holiday_mode',
      'onboard_provider_schedule',
      'resolve_conflicts',
      'reassign_cancelled',
      'mark_no_shows',
      'payment_sweep',
      'update_bookings',
      'day_replan',
      'import_services_from_menu',
      'update_service_prices',
      'staff_service_matrix',
    ],
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiCommandService',
    mutateIntents: [
      'create_booking',
      'create_service',
      'create_services',
      'cancel_bookings',
      'bulk_smart_cancel',
      'hide_appointments_from_calendar',
      'unhide_appointments_from_calendar',
      'fill_slot_from_waitlist',
      'reschedule_booking',
      'fill_unused_slots',
      'apply_schedule',
      'block_schedule',
      'clear_schedule',
      'create_direct_schedule',
      'create_schedule_template',
      'assign_employee_services',
      'optimize_schedule',
      'setup_week_schedule',
      'swap_schedules',
      'rebalance_capacity',
      'holiday_mode',
      'onboard_provider_schedule',
      'resolve_conflicts',
      'reassign_cancelled',
      'mark_no_shows',
      'payment_sweep',
      'update_bookings',
      'day_replan',
      'import_services_from_menu',
      'update_service_prices',
      'staff_service_matrix',
    ],
  },
  {
    intents: [
      'list_bookings',
      'show_appointments',
      'check_availability',
      'summarize_day',
      'summarize_bookings',
      'analyze_appointments',
      'analyze_services',
      'summarize_staff',
      'lookup_customer',
      'summarize_waitlist',
      'lookup_service_assignment',
      'list_services',
      'list_employees',
      'list_templates',
      'list_schedule_gaps',
      'summarize_utilization',
      'summarize_customers',
      'check_schedule_compliance',
      'revenue_forecast',
    ],
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiCommandService',
    mutateIntents: [],
  },
  {
    intents: [...SHARED_PROVIDER_OPERATIONAL_INTENTS, 'mark_paid'],
    surfaces: ['dashboard', 'provider'],
    apiModule: 'ai-command',
    handler: 'AiCommandService',
    mutateIntents: [
      'cancel_bookings',
      'update_bookings',
      'reschedule_booking',
      'fill_unused_slots',
      'block_schedule',
      'mark_no_shows',
      'payment_sweep',
      'mark_paid',
    ],
  },
  {
    intents: PROVIDER_EXCLUSIVE_INTENTS,
    surfaces: ['provider'],
    apiModule: 'provider-mobile',
    handler: 'ProviderAiCommandService',
    mutateIntents: [
      'add_retail_to_my_booking',
      'retry_offline_action',
      'dismiss_push',
      'start_card_preparation',
      'mark_card_ready',
      'accept_delivery',
      'mark_out_for_delivery',
      'capture_delivery_proof',
      'notify_delay',
      'mark_delivered',
      'collect_cash_confirm',
    ],
  },
  {
    intents: PUBLIC_ANONYMOUS_INTENTS,
    surfaces: ['public'],
    apiModule: 'public-booking',
    handler: 'PublicBookingAssistantService',
    mutateIntents: ['book_appointment'],
  },
];

function tiersForSurface(
  surface: CommandSurface,
  intentId: string,
): AccessTier[] {
  if (intentId === 'unknown') return ALL_TIERS;
  if (surface === 'dashboard') {
    return ALL_TIERS.filter((tier) => isDashboardIntentAllowed(tier, intentId));
  }
  if (surface === 'provider') {
    return ALL_TIERS.filter((tier) => isProviderIntentAllowed(tier, intentId));
  }
  if (surface === 'customer') {
    return ALL_TIERS.filter((tier) => isCustomerIntentAllowed(tier, intentId));
  }
  return ['client'];
}

function resolveExecutionMode(
  intentId: string,
  mutating: boolean,
): CommandExecutionMode {
  if (intentId === 'unknown') return 'read_only';
  if (ORCHESTRATION_INTENT_IDS.has(intentId)) return 'orchestration';
  if (!mutating) return 'read_only';
  return 'simple_mutate';
}

function isMutatingIntent(intentId: string, mutateSet: Set<string>): boolean {
  if (intentId === 'unknown') return false;
  return mutateSet.has(intentId);
}

type BindingSource = IntentBindingSeed | (typeof LEGACY_CORE_BINDINGS)[number];

function buildBindingMaps(): {
  bindingByIntent: Map<string, BindingSource>;
  mutateSet: Set<string>;
  surfaceByIntent: Map<string, Set<CommandSurface>>;
} {
  const bindingByIntent = new Map<string, BindingSource>();
  const mutateSet = new Set<string>();
  const surfaceByIntent = new Map<string, Set<CommandSurface>>();

  const register = (binding: BindingSource, intents: readonly string[]) => {
    for (const id of intents) {
      bindingByIntent.set(id, binding);
      const surfaces = surfaceByIntent.get(id) ?? new Set<CommandSurface>();
      for (const surface of binding.surfaces) surfaces.add(surface);
      surfaceByIntent.set(id, surfaces);
    }
    for (const id of binding.mutateIntents ?? []) mutateSet.add(id);
  };

  for (const legacy of LEGACY_CORE_BINDINGS) register(legacy, legacy.intents);
  for (const seed of INTENT_BINDING_SEEDS) register(seed, seed.intents);

  const allSurfaces: CommandSurface[] = [
    'dashboard',
    'provider',
    'customer',
    'public',
  ];
  surfaceByIntent.set('unknown', new Set(allSurfaces));

  return { bindingByIntent, mutateSet, surfaceByIntent };
}

function surfacesForIntent(
  intentId: string,
  surfaceByIntent: Map<string, Set<CommandSurface>>,
): CommandSurface[] {
  return [...(surfaceByIntent.get(intentId) ?? [])];
}

/** Test hook — surfaces for an intent id not present in bindings resolve to []. */
export function resolveIntentSurfaces(intentId: string): CommandSurface[] {
  return surfacesForIntent(intentId, buildBindingMaps().surfaceByIntent);
}

function collectAllIntentIds(
  surfaceByIntent: Map<string, Set<CommandSurface>>,
): string[] {
  return [...surfaceByIntent.keys()];
}

function sortedSurfaceIntents(
  surfaceByIntent: Map<string, Set<CommandSurface>>,
  surface: CommandSurface,
): string[] {
  const ids: string[] = [];
  for (const [intentId, surfaces] of surfaceByIntent) {
    if (surfaces.has(surface)) ids.push(intentId);
  }
  ids.sort((a, b) => a.localeCompare(b));
  return ids;
}

function buildSurfaceIntentLists(
  surfaceByIntent: Map<string, Set<CommandSurface>>,
) {
  return {
    dashboard: sortedSurfaceIntents(surfaceByIntent, 'dashboard'),
    provider: sortedSurfaceIntents(surfaceByIntent, 'provider'),
    customer: sortedSurfaceIntents(surfaceByIntent, 'customer'),
    public: sortedSurfaceIntents(surfaceByIntent, 'public'),
  };
}

const {
  mutateSet: GLOBAL_MUTATE_SET,
  surfaceByIntent: GLOBAL_SURFACE_BY_INTENT,
} = buildBindingMaps();
const SURFACE_INTENT_LISTS = buildSurfaceIntentLists(GLOBAL_SURFACE_BY_INTENT);

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
  GLOBAL_MUTATE_SET.has(id),
);
export const PROVIDER_MUTATING_INTENTS = PROVIDER_INTENTS.filter((id) =>
  GLOBAL_MUTATE_SET.has(id),
);
export const CUSTOMER_MUTATING_INTENTS = CUSTOMER_INTENTS.filter((id) =>
  GLOBAL_MUTATE_SET.has(id),
);

export function buildCommandRegistry(
  compoundStepIds: ReadonlySet<string>,
): CommandRegistryEntry[] {
  const { bindingByIntent, mutateSet, surfaceByIntent } = buildBindingMaps();
  const entries: CommandRegistryEntry[] = [];

  for (const id of collectAllIntentIds(surfaceByIntent)) {
    const surfaces = surfacesForIntent(id, surfaceByIntent);
    const binding = bindingByIntent.get(id);
    const mutating = isMutatingIntent(id, mutateSet);
    const tiers = [
      ...new Set(surfaces.flatMap((surface) => tiersForSurface(surface, id))),
    ] as AccessTier[];

    const surfaceHandlers = SURFACE_HANDLER_OVERRIDES[id];
    const defaultHandler =
      surfaceHandlers?.dashboard ??
      surfaceHandlers?.provider ??
      surfaceHandlers?.customer ??
      surfaceHandlers?.public ??
      binding?.handler ??
      'AiCommandService';

    entries.push({
      id,
      surfaces,
      tiers,
      mutating,
      executionMode: resolveExecutionMode(id, mutating),
      apiModule: binding?.apiModule ?? 'ai-command',
      handler: defaultHandler,
      surfaceHandlers,
      compoundStep: compoundStepIds.has(id),
      sprint:
        'sprint' in (binding ?? {})
          ? (binding as IntentBindingSeed).sprint
          : undefined,
      label: id.replace(/_/g, ' '),
    });
  }

  return entries.sort((a, b) => a.id.localeCompare(b.id));
}

export function buildCompoundCommandRecipes(): CompoundCommandRecipe[] {
  const dashboardSteps = DASHBOARD_INTENTS.filter((id) => id !== 'unknown');
  const customerSteps = CUSTOMER_INTENTS.filter((id) => id !== 'unknown');
  const publicSteps = PUBLIC_INTENTS.filter((id) => id !== 'unknown');
  const providerSteps = PROVIDER_INTENTS.filter((id) => id !== 'unknown');
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
      sprint: 'core',
    },
    {
      id: 'dashboard_catalog_compound',
      surfaces: ['dashboard'],
      handler: 'AiCatalogService.handleCatalogCompound',
      decomposeUtil: 'decomposeCatalogCompoundPrompt',
      maxSteps: 4,
      allowedStepIntentIds: CATALOG_INTENTS,
      examplePrompts: [
        'Create Spa Day package and list packages',
        'Enable gift card presets and configure multi-service settings',
      ],
      sprint: 'catalog',
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
      sprint: 'customerCrm',
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
      sprint: 'scheduleResources',
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
      sprint: 'payments',
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
      sprint: 'giftFulfillment',
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
      sprint: 'integrations',
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
      sprint: 'marketingGrowth',
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
      sprint: 'selfServiceBooking',
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
      sprint: 'selfServiceBooking',
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
      sprint: 'providerBooking',
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
      sprint: 'pushNotifications',
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
      sprint: 'giftFulfillment',
    },
    {
      id: 'public_assistant_compound',
      surfaces: ['public'],
      handler: 'PublicBookingAssistantService.executeCommand',
      llmDecompose: false,
      maxSteps: 4,
      allowedStepIntentIds: publicSteps,
      examplePrompts: [
        'List providers and check availability',
        'Discover packages and recommend specialists',
        'Book appointment and show business info',
      ],
      sprint: 'platform',
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
