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
import {
  BUSINESS_CURRENCY_INTENTS,
  BUSINESS_CURRENCY_MUTATE_INTENTS,
} from './ai-business-currency.util.js';
import {
  RECOMMENDATION_PRODUCT_INTENTS,
  RECOMMENDATION_PRODUCT_MUTATE_INTENTS,
} from './ai-recommendation-product.util.js';
import {
  BUSINESS_LANGUAGES_INTENTS,
  BUSINESS_LANGUAGES_MUTATE_INTENTS,
} from './ai-business-languages.util.js';
import {
  BUSINESS_DATE_FORMAT_INTENTS,
  BUSINESS_DATE_FORMAT_MUTATE_INTENTS,
} from './ai-business-date-format.util.js';
import {
  BUSINESS_TAX_INTENTS,
  BUSINESS_TAX_MUTATE_INTENTS,
} from './ai-business-tax.util.js';
import {
  BUSINESS_COMPLIANCE_INTENTS,
  BUSINESS_COMPLIANCE_MUTATE_INTENTS,
} from './ai-business-compliance.util.js';
import {
  CLINIC_TEST_ORDER_INTENTS,
  CLINIC_TEST_ORDER_MUTATE_INTENTS,
} from './ai-clinic-test-order.util.js';
import {
  CLINIC_TEST_RESULT_INTENTS,
  CLINIC_TEST_RESULT_MUTATE_INTENTS,
} from './ai-clinic-test-result.util.js';
import { CLINIC_PATIENT_CHART_INTENTS } from './ai-clinic-patient-chart.util.js';
import { CONSUMER_CLINIC_TEST_RESULTS_INTENTS } from './ai-consumer-clinic-test-results.util.js';
import {
  PROVIDER_CLINIC_COLLECTION_INTENTS,
  PROVIDER_CLINIC_COLLECTION_MUTATE_INTENTS,
} from './ai-provider-clinic-collection.util.js';
import { CLINIC_BOOKING_INTENTS } from './ai-clinic-booking.util.js';
import {
  CONSUMER_CLINIC_LAB_BOOKING_INTENTS,
  DASHBOARD_CLINIC_LAB_BOOKING_INTENTS,
  DASHBOARD_CLINIC_LAB_BOOKING_MUTATE_INTENTS,
  PROVIDER_CLINIC_LAB_BOOKING_INTENTS,
} from './ai-clinic-lab-booking.util.js';
import { NOTIFICATION_DATE_FORMAT_MUTATE_INTENTS } from './ai-notification-date-format.util.js';
import { DATA_RIGHTS_INTENTS } from './ai-data-rights.util.js';
import {
  DASHBOARD_TIME_OFF_INTENTS,
  DASHBOARD_TIME_OFF_MUTATE_INTENTS,
  PROVIDER_TIME_OFF_INTENTS,
  PROVIDER_TIME_OFF_MUTATE_INTENTS,
} from './ai-provider-time-off.util.js';
import { PROVIDER_OPEN_SHIFTS_INTENTS } from './ai-provider-open-shifts.util.js';
import {
  PROVIDER_EXP_3_INTENTS,
  PROVIDER_EXP_3_MUTATE_INTENTS,
} from './ai-provider-exp-3.util.js';
import {
  CLINIC_SERVICE_INTENTS,
  CLINIC_SERVICE_MUTATE_INTENTS,
} from './ai-clinic-service.util.js';
import {
  TOUR_SERVICE_INTENTS,
  TOUR_SERVICE_MUTATE_INTENTS,
} from './ai-tour-service.util.js';
import {
  PACKAGE_LOCALIZED_NAMES_INTENTS,
  PACKAGE_LOCALIZED_NAMES_MUTATE_INTENTS,
} from './ai-package-localized-names.util.js';
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
  'explain_provider_payment_currency',
  'explain_appointment_tax',
  'explain_provider_date_display',
  'configure_provider_push_date_format',
  'explain_provider_session_timeout',
  'list_my_collection_queue',
  'mark_specimen_collected',
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
  'confirm_booking_from_push',
  'suggest_reschedule_from_push',
  'explain_push_setup',
  'enable_push_notifications',
  'summarize_my_appointments',
  'summarize_my_revenue',
  'summarize_client',
  'show_client_history',
  'add_client_note',
  'list_package_appointments_today',
  'list_my_package_visits',
  'list_my_multi_service_groups',
  'team_whos_next',
  'my_stats',
  'team_floor_status',
  'check_in_client',
  'mark_running_late',
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
  'explain_checkout_currency',
  'explain_checkout_tax',
  'explain_stripe_checkout_currency',
  'explain_package_currency',
  'explain_booking_languages',
  'explain_booking_date_format',
  'explain_package_display_name',
  'explain_tour_booking',
  'explain_tour_day_slots',
  'diagnose_tour_capacity',
  'explain_checkout_recommendations',
  'explain_clinic_booking',
  'explain_data_rights',
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
    intents: BUSINESS_CURRENCY_INTENTS,
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiBusinessCurrencyService',
    sprint: 'businessCurrency',
    mutateIntents: BUSINESS_CURRENCY_MUTATE_INTENTS,
  },
  {
    intents: BUSINESS_TAX_INTENTS,
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiBusinessTaxService',
    sprint: 'businessTax',
    mutateIntents: BUSINESS_TAX_MUTATE_INTENTS,
  },
  {
    intents: BUSINESS_COMPLIANCE_INTENTS,
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiBusinessComplianceService',
    sprint: 'businessCompliance',
    mutateIntents: BUSINESS_COMPLIANCE_MUTATE_INTENTS,
  },
  {
    intents: [...CLINIC_TEST_ORDER_INTENTS],
    surfaces: ['dashboard'],
    apiModule: 'clinic-test-results',
    handler: 'AiClinicTestOrderService',
    sprint: 'clinicTestOrders',
    mutateIntents: [...CLINIC_TEST_ORDER_MUTATE_INTENTS],
  },
  {
    intents: [...CLINIC_TEST_RESULT_INTENTS],
    surfaces: ['dashboard'],
    apiModule: 'clinic-test-results',
    handler: 'AiClinicTestResultService',
    sprint: 'clinicTestResults',
    mutateIntents: [...CLINIC_TEST_RESULT_MUTATE_INTENTS],
  },
  {
    intents: [...CLINIC_PATIENT_CHART_INTENTS],
    surfaces: ['dashboard'],
    apiModule: 'patient-clinical-profiles',
    handler: 'AiClinicPatientChartService',
    sprint: 'clinicPatientChart',
    mutateIntents: [],
  },
  {
    intents: [...CONSUMER_CLINIC_TEST_RESULTS_INTENTS],
    surfaces: ['customer', 'public'],
    apiModule: 'clinic-test-results',
    handler: 'AiConsumerClinicTestResultsService',
    sprint: 'consumerClinicTestResults',
    mutateIntents: [],
  },
  {
    intents: [...DASHBOARD_CLINIC_LAB_BOOKING_INTENTS],
    surfaces: ['dashboard'],
    apiModule: 'clinic-test-results',
    handler: 'AiClinicLabBookingService',
    sprint: 'clinicLabBooking',
    mutateIntents: [...DASHBOARD_CLINIC_LAB_BOOKING_MUTATE_INTENTS],
  },
  {
    intents: [...CONSUMER_CLINIC_LAB_BOOKING_INTENTS],
    surfaces: ['customer', 'public'],
    apiModule: 'clinic-test-results',
    handler: 'AiClinicLabBookingService',
    sprint: 'clinicLabBooking',
    mutateIntents: [],
  },
  {
    intents: [...CLINIC_BOOKING_INTENTS],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiClinicBookingService',
    sprint: 'clinicBooking',
    mutateIntents: [],
  },
  {
    intents: [...PROVIDER_CLINIC_LAB_BOOKING_INTENTS],
    surfaces: ['provider'],
    apiModule: 'clinic-test-results',
    handler: 'AiClinicLabBookingService',
    sprint: 'clinicLabBooking',
    mutateIntents: [],
  },
  {
    intents: BUSINESS_LANGUAGES_INTENTS,
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiBusinessLanguagesService',
    sprint: 'businessLanguages',
    mutateIntents: BUSINESS_LANGUAGES_MUTATE_INTENTS,
  },
  {
    intents: BUSINESS_DATE_FORMAT_INTENTS,
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiBusinessDateFormatService',
    sprint: 'businessDateFormat',
    mutateIntents: BUSINESS_DATE_FORMAT_MUTATE_INTENTS,
  },
  {
    intents: PACKAGE_LOCALIZED_NAMES_INTENTS,
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiPackageLocalizedNamesService',
    sprint: 'packageLocalizedNames',
    mutateIntents: PACKAGE_LOCALIZED_NAMES_MUTATE_INTENTS,
  },
  {
    intents: CLINIC_SERVICE_INTENTS,
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiClinicServiceService',
    sprint: 'clinicService',
    mutateIntents: CLINIC_SERVICE_MUTATE_INTENTS,
  },
  {
    intents: TOUR_SERVICE_INTENTS,
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiTourServiceService',
    sprint: 'tourService',
    mutateIntents: TOUR_SERVICE_MUTATE_INTENTS,
  },
  {
    intents: RECOMMENDATION_PRODUCT_INTENTS,
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiRecommendationProductService',
    sprint: 'recommendationProduct',
    mutateIntents: RECOMMENDATION_PRODUCT_MUTATE_INTENTS,
  },
  {
    intents: ['explain_package_display_name'],
    surfaces: ['dashboard', 'public'],
    apiModule: 'ai-command',
    handler: 'AiPackageLocalizedNamesService',
    sprint: 'packageLocalizedNames',
    mutateIntents: [],
  },
  {
    intents: ['explain_checkout_currency'],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiBusinessCurrencyService',
    sprint: 'businessCurrency',
    mutateIntents: [],
  },
  {
    intents: ['explain_checkout_tax'],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiBusinessTaxService',
    sprint: 'businessTax',
    mutateIntents: [],
  },
  {
    intents: DATA_RIGHTS_INTENTS,
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiBusinessComplianceService',
    sprint: 'businessCompliance',
    mutateIntents: [],
  },
  {
    intents: [
      'explain_tour_booking',
      'explain_tour_day_slots',
      'diagnose_tour_capacity',
    ],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiTourServiceService',
    sprint: 'tourService',
    mutateIntents: [],
  },
  {
    intents: ['explain_checkout_recommendations'],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiRecommendationProductService',
    sprint: 'recommendationProduct',
    mutateIntents: [],
  },
  {
    intents: ['explain_consumer_checkout_success'],
    surfaces: ['customer'],
    apiModule: 'ai-command',
    handler: 'AiRecommendationProductService',
    sprint: 'recommendationProduct',
    mutateIntents: [],
  },
  {
    intents: [
      'explain_my_notifications',
      'manage_notification_preferences',
      'refer_a_friend',
      'share_salon_link',
      'share_my_booking',
      'rebook_last_appointment',
      'find_my_saved_salons',
    ],
    surfaces: ['customer'],
    apiModule: 'consumer-adoption',
    handler: 'AiConsumerAdoptionService',
    sprint: 'consumerAdoption',
    mutateIntents: ['manage_notification_preferences'],
  },
  {
    intents: ['explain_consumer_checkout_tax'],
    surfaces: ['customer'],
    apiModule: 'ai-command',
    handler: 'AiBusinessTaxService',
    sprint: 'businessTax',
    mutateIntents: [],
  },
  {
    intents: ['explain_stripe_checkout_currency'],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiBusinessCurrencyService',
    sprint: 'businessCurrency',
    mutateIntents: [],
  },
  {
    intents: ['explain_booking_languages'],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiBusinessLanguagesService',
    sprint: 'businessLanguages',
    mutateIntents: [],
  },
  {
    intents: ['explain_booking_date_format'],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiBusinessDateFormatService',
    sprint: 'businessDateFormat',
    mutateIntents: [],
  },
  {
    intents: ['explain_tenant_currency'],
    surfaces: ['customer'],
    apiModule: 'ai-command',
    handler: 'AiBusinessCurrencyService',
    sprint: 'businessCurrency',
    mutateIntents: [],
  },
  {
    intents: ['explain_notification_currency'],
    surfaces: ['customer'],
    apiModule: 'ai-command',
    handler: 'AiBusinessCurrencyService',
    sprint: 'businessCurrency',
    mutateIntents: [],
  },
  {
    intents: ['explain_stripe_currency_warning'],
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiBusinessCurrencyService',
    sprint: 'businessCurrency',
    mutateIntents: [],
  },
  {
    intents: ['diagnose_stripe_checkout_failure'],
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiBusinessCurrencyService',
    sprint: 'businessCurrency',
    mutateIntents: [],
  },
  {
    intents: ['explain_reports_currency'],
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiBusinessCurrencyService',
    sprint: 'businessCurrency',
    mutateIntents: [],
  },
  {
    intents: ['summarize_revenue_kpis'],
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiBusinessCurrencyService',
    sprint: 'businessCurrency',
    mutateIntents: [],
  },
  {
    intents: ['explain_package_currency'],
    surfaces: ['public'],
    apiModule: 'ai-command',
    handler: 'AiBusinessCurrencyService',
    sprint: 'businessCurrency',
    mutateIntents: [],
  },
  {
    intents: ['explain_provider_payment_currency'],
    surfaces: ['provider'],
    apiModule: 'ai-command',
    handler: 'AiBusinessCurrencyService',
    sprint: 'businessCurrency',
    mutateIntents: [],
  },
  {
    intents: [
      'explain_provider_date_display',
      'configure_provider_push_date_format',
    ],
    surfaces: ['provider'],
    apiModule: 'ai-command',
    handler: 'AiBusinessDateFormatService',
    sprint: 'businessDateFormat',
    mutateIntents: ['configure_provider_push_date_format'],
  },
  {
    intents: ['explain_provider_session_timeout'],
    surfaces: ['provider'],
    apiModule: 'ai-command',
    handler: 'AiBusinessComplianceService',
    sprint: 'businessCompliance',
    mutateIntents: [],
  },
  {
    intents: ['explain_push_setup', 'enable_push_notifications'],
    surfaces: ['provider'],
    apiModule: 'provider-push-setup',
    handler: 'AiProviderPushSetupService',
    sprint: 'providerPushSetup',
    mutateIntents: ['enable_push_notifications'],
  },
  {
    intents: ['summarize_my_appointments', 'summarize_my_revenue'],
    surfaces: ['provider'],
    apiModule: 'provider-earnings',
    handler: 'AiProviderEarningsService',
    sprint: 'providerEarnings',
    mutateIntents: [],
  },
  {
    intents: ['summarize_client', 'show_client_history', 'add_client_note'],
    surfaces: ['provider'],
    apiModule: 'provider-client-context',
    handler: 'AiProviderClientContextService',
    sprint: 'providerClientContext',
    mutateIntents: ['add_client_note'],
  },
  {
    intents: [
      'my_stats',
      'team_floor_status',
      'check_in_client',
      'mark_running_late',
    ],
    surfaces: ['provider'],
    apiModule: 'provider-exp-2',
    handler: 'AiProviderExp2Service',
    sprint: 'providerExp2',
    mutateIntents: ['check_in_client', 'mark_running_late'],
  },
  {
    intents: [...DASHBOARD_TIME_OFF_INTENTS],
    surfaces: ['dashboard'],
    apiModule: 'provider-time-off',
    handler: 'AiProviderTimeOffService',
    sprint: 'providerExp7',
    mutateIntents: [...DASHBOARD_TIME_OFF_MUTATE_INTENTS],
  },
  {
    intents: [...PROVIDER_TIME_OFF_INTENTS],
    surfaces: ['provider'],
    apiModule: 'provider-time-off',
    handler: 'AiProviderTimeOffService',
    sprint: 'providerExp7',
    mutateIntents: [...PROVIDER_TIME_OFF_MUTATE_INTENTS],
  },
  {
    intents: [...PROVIDER_OPEN_SHIFTS_INTENTS],
    surfaces: ['provider'],
    apiModule: 'provider-open-shifts',
    handler: 'AiProviderOpenShiftsService',
    sprint: 'providerExp7',
    mutateIntents: [],
  },
  {
    intents: [...PROVIDER_EXP_3_INTENTS],
    surfaces: ['provider'],
    apiModule: 'provider-exp-3',
    handler: 'AiProviderExp3Service',
    sprint: 'providerExp5',
    mutateIntents: [...PROVIDER_EXP_3_MUTATE_INTENTS],
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
    intents: [...PROVIDER_CLINIC_COLLECTION_INTENTS],
    surfaces: ['provider'],
    apiModule: 'clinic-test-results',
    handler: 'AiProviderClinicCollectionService',
    sprint: 'providerClinicCollection',
    mutateIntents: [...PROVIDER_CLINIC_COLLECTION_MUTATE_INTENTS],
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
      'confirm_booking_from_push',
      'suggest_reschedule_from_push',
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
      sprint: 'bookingDepth',
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
      sprint: 'payments',
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
      sprint: 'clinicTestOrders',
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
      sprint: 'clinicTestOrders',
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
      sprint: 'clinicTestOrders',
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
      sprint: 'avail',
    },
    {
      id: 'customer_flexible_availability_budget_compound',
      surfaces: ['customer'],
      handler: 'CustomerAiCommandService.executeCommand',
      decomposeUtil: 'decomposeCustomerFlexibleAvailabilityBudgetCompoundPrompt',
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
      sprint: 'avail',
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
      sprint: 'budget',
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
      sprint: 'budget',
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
      sprint: 'rank',
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
      sprint: 'rank',
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
