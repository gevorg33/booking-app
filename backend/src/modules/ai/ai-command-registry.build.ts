import type { AccessTier } from './access-control.matrix.js';
import {
  isDashboardIntentAllowed,
  isProviderIntentAllowed,
  isCustomerIntentAllowed,
} from './access-control.matrix.js';
import { SCHEDULING_INTENTS } from './ai-scheduling.util.js';
import {
  OPERATIONS_INTENTS,
  OPERATIONS_STAFF_INTENTS,
} from './ai-operations.util.js';
import {
  WAITLIST_DASHBOARD_READ_INTENTS,
  WAITLIST_DASHBOARD_MUTATE_INTENTS,
} from './ai-waitlist-dashboard.util.js';
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
  DASHBOARD_AGENT_OPS_INTENTS,
  DASHBOARD_AGENT_OPS_MUTATE_INTENTS,
} from './ai-agent-ops.util.js';
import {
  DASHBOARD_BUSINESS_PROFILE_INTENTS,
  DASHBOARD_BUSINESS_PROFILE_MUTATE_INTENTS,
} from './ai-business-profile.util.js';
import {
  DASHBOARD_ONBOARDING_INTENTS,
  DASHBOARD_ONBOARDING_MUTATE_INTENTS,
} from './ai-onboarding.util.js';
import { DASHBOARD_CLINIC_PRE_VISIT_INTAKE_MUTATE_INTENTS } from './ai-clinic-pre-visit-intake.util.js';
import { DASHBOARD_CLINIC_QUESTIONNAIRE_MUTATE_INTENTS } from './ai-clinic-questionnaire.util.js';
import { DASHBOARD_LOCATIONS_MUTATE_INTENTS } from './ai-locations.util.js';
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
import { PUBLIC_MULTI_SERVICE_BOOKING_INTENTS } from './ai-multi-service-customer-public.util.js';
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
  REFERRAL_STAFF_TEMPLATES_INTENTS,
  REFERRAL_STAFF_TEMPLATES_MUTATE_INTENTS,
} from './ai-referral-staff-templates.util.js';
import {
  EXTERNAL_DOCTORS_INTENTS,
  EXTERNAL_DOCTORS_MUTATE_INTENTS,
} from './ai-external-doctors.util.js';
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
import { DASHBOARD_CLINIC_TEST_CATALOG_MUTATE_INTENTS } from './ai-clinic-test-catalog.util.js';
import { CLINIC_PATIENT_CHART_INTENTS } from './ai-clinic-patient-chart.util.js';
import {
  PATIENT_CLINICAL_MUTATIONS_INTENTS,
  PATIENT_CLINICAL_MUTATIONS_MUTATE_INTENTS,
} from './ai-patient-clinical-mutations.util.js';
import { APP_GUIDE_INTENTS } from './ai-product-guide.util.js';
import { PROVIDER_PRODUCT_GUIDE_INTENTS } from './ai-provider-product-guide.util.js';
import {
  META_PRODUCT_GUIDE_INTENTS,
  PROVIDER_META_GUIDE_INTENTS,
} from './ai-meta-product-guide.fixtures.js';
import {
  CUSTOMER_PUBLIC_EMPTY_STATE_GUIDE_INTENTS,
  DASHBOARD_EMPTY_STATE_GUIDE_INTENTS,
  PROVIDER_EMPTY_STATE_GUIDE_INTENTS,
} from './ai-product-guide-empty-state.fixtures.js';
import { CONSUMER_CLINIC_TEST_RESULTS_INTENTS } from './ai-consumer-clinic-test-results.util.js';
import {
  PROVIDER_CLINIC_COLLECTION_INTENTS,
  PROVIDER_CLINIC_COLLECTION_MUTATE_INTENTS,
} from './ai-provider-clinic-collection.util.js';
import {
  PROVIDER_CLINIC_TASKS_AND_RESULTS_INTENTS,
  PROVIDER_CLINIC_TASKS_AND_RESULTS_MUTATE_INTENTS,
} from './ai-provider-clinic-tasks-and-results.util.js';
import { CLINIC_BOOKING_INTENTS } from './ai-clinic-booking.util.js';
import { EXPLAIN_LAB_PREP_INTENTS } from './ai-explain-lab-prep.util.js';
import { TRACK_LAB_ORDER_STATUS_INTENTS } from './ai-track-lab-order-status.util.js';
import { LIST_MY_DOCUMENTS_INTENTS } from './ai-list-my-documents.util.js';
import { EXPLAIN_ABNORMAL_RESULT_FLAG_INTENTS } from './ai-explain-abnormal-result-flag.util.js';
import { NOTIFY_WHEN_RESULTS_READY_INTENTS } from './ai-notify-when-results-ready.util.js';
import {
  CONSUMER_CLINIC_LAB_BOOKING_INTENTS,
  CONSUMER_CLINIC_LAB_BOOKING_MUTATE_INTENTS,
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
  'explain_provider_context',
  'list_upcoming_bookings',
  'get_schedule_summary',
  'update_provider_profile',
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
  'list_client_staff_notes',
  'explain_client_intake',
  'list_package_appointments_today',
  'list_my_package_visits',
  'list_my_multi_service_groups',
  'team_whos_next',
  'my_stats',
  'team_floor_status',
  'check_in_client',
  'mark_running_late',
  'mark_ready_now',
  'suggest_cancel_note',
  'request_client_review',
  'list_reassign_options',
  'reassign_booking_same_day',
  'voice_summarize_next_client',
] as const;

/** Anonymous public-booking assistant (pre-login). */
const PUBLIC_ANONYMOUS_INTENTS = [
  'list_providers',
  'list_services',
  'find_services_under_budget',
  'find_evening_weekend_slots',
  'explain_salon_profile',
  'check_availability',
  'recommend_specialists',
  'book_appointment',
  'business_info',
  'list_public_promotions',
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
  'explain_tour_meeting_point',
  'explain_checkout_recommendations',
  'explain_clinic_booking',
  'explain_lab_prep',
  'explain_clinic_booking_fields',
  'explain_public_intake_form',
  'complete_intake_and_book',
  'create_intake_draft',
  'get_intake_flow_status',
  'start_pre_visit_intake',
  'submit_intake_answers',
  'explain_guest_checkout_fields',
  'explain_why_sign_in',
  'sign_in_with_google',
  'sign_in_with_apple',
  'sign_in_with_phone',
  'fix_checkout_validation_error',
  'confirm_my_booking_details',
  'add_booking_to_calendar',
  'book_another_service',
  'explain_preparation_notes',
  'join_waitlist',
  'check_waitlist_status',
  'get_directions_to_salon',
  'explain_data_rights',
  'explain_provider_availability',
] as const;

const SURFACE_HANDLER_OVERRIDES: Record<
  string,
  Partial<Record<CommandSurface, string>>
> = {
  mark_paid: {
    dashboard: 'AiBookingDepthService',
    provider: 'AiProviderBookingService',
  },
  list_my_package_visits: {
    customer: 'AiSelfServiceBookingService',
    provider: 'AiProviderBookingService',
  },
  set_retail_sales_lines: {
    dashboard: 'AiRetailFinanceService',
    provider: 'AiProviderExp3Service',
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
    intents: [...DASHBOARD_CLINIC_TEST_CATALOG_MUTATE_INTENTS],
    surfaces: ['dashboard'],
    apiModule: 'clinic-test-results',
    handler: 'AiClinicTestCatalogService',
    sprint: 'clinicTestResults',
    mutateIntents: [...DASHBOARD_CLINIC_TEST_CATALOG_MUTATE_INTENTS],
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
    intents: [...PATIENT_CLINICAL_MUTATIONS_INTENTS],
    surfaces: ['dashboard'],
    apiModule: 'patient-clinical-profiles',
    handler: 'AiPatientClinicalMutationsService',
    sprint: 'clinicPatientChart',
    mutateIntents: [...PATIENT_CLINICAL_MUTATIONS_MUTATE_INTENTS],
  },
  {
    intents: [...APP_GUIDE_INTENTS],
    surfaces: ['dashboard', 'customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiProductGuideService',
    sprint: 'productGuide',
    mutateIntents: [],
  },
  {
    intents: [...PROVIDER_PRODUCT_GUIDE_INTENTS],
    surfaces: ['provider'],
    apiModule: 'provider-mobile',
    handler: 'AiProductGuideService',
    sprint: 'productGuide',
    mutateIntents: [],
  },
  {
    intents: [...META_PRODUCT_GUIDE_INTENTS],
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiProductGuideService',
    sprint: 'productGuide',
    mutateIntents: [],
  },
  {
    intents: [...PROVIDER_META_GUIDE_INTENTS],
    surfaces: ['provider'],
    apiModule: 'provider-mobile',
    handler: 'AiProductGuideService',
    sprint: 'productGuide',
    mutateIntents: [],
  },
  {
    intents: [...DASHBOARD_EMPTY_STATE_GUIDE_INTENTS],
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiProductGuideEmptyStateService',
    sprint: 'productGuide',
    mutateIntents: [],
  },
  {
    intents: [...PROVIDER_EMPTY_STATE_GUIDE_INTENTS],
    surfaces: ['provider'],
    apiModule: 'provider-mobile',
    handler: 'AiProductGuideEmptyStateService',
    sprint: 'productGuide',
    mutateIntents: [],
  },
  {
    intents: [...CUSTOMER_PUBLIC_EMPTY_STATE_GUIDE_INTENTS],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiProductGuideEmptyStateService',
    sprint: 'productGuide',
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
    intents: [...TRACK_LAB_ORDER_STATUS_INTENTS],
    surfaces: ['customer'],
    apiModule: 'clinic-test-results',
    handler: 'AiConsumerClinicTestResultsService',
    sprint: 'consumerClinicTestResults',
    mutateIntents: [],
  },
  {
    intents: [...LIST_MY_DOCUMENTS_INTENTS],
    surfaces: ['customer'],
    apiModule: 'clinic-test-results',
    handler: 'AiConsumerClinicTestResultsService',
    sprint: 'consumerClinicTestResults',
    mutateIntents: [],
  },
  {
    intents: [...EXPLAIN_ABNORMAL_RESULT_FLAG_INTENTS],
    surfaces: ['customer'],
    apiModule: 'clinic-test-results',
    handler: 'AiConsumerClinicTestResultsService',
    sprint: 'consumerClinicTestResults',
    mutateIntents: [],
  },
  {
    intents: [...NOTIFY_WHEN_RESULTS_READY_INTENTS],
    surfaces: ['customer'],
    apiModule: 'clinic-test-results',
    handler: 'AiConsumerClinicTestResultsService',
    sprint: 'consumerClinicTestResults',
    mutateIntents: [],
  },
  {
    intents: ['open_clinic_document'],
    surfaces: ['customer'],
    apiModule: 'clinic-test-results',
    handler: 'AiConsumerClinicTestResultsService',
    sprint: 'consumerClinicTestResults',
    mutateIntents: [],
  },
  {
    intents: ['dismiss_patient_alert'],
    surfaces: ['customer'],
    apiModule: 'clinic-test-results',
    handler: 'AiConsumerClinicTestResultsService',
    sprint: 'consumerClinicTestResults',
    mutateIntents: ['dismiss_patient_alert'],
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
    mutateIntents: [...CONSUMER_CLINIC_LAB_BOOKING_MUTATE_INTENTS],
  },
  {
    intents: [...CLINIC_BOOKING_INTENTS, ...EXPLAIN_LAB_PREP_INTENTS],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiClinicBookingService',
    sprint: 'clinicBooking',
    mutateIntents: [],
  },
  {
    intents: [
      'explain_guest_checkout_fields',
      'explain_why_sign_in',
      'fix_checkout_validation_error',
      'sign_in_with_google',
      'sign_in_with_apple',
      'sign_in_with_phone',
    ],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiGuestCheckoutFieldsService',
    sprint: 'guestCheckout',
    mutateIntents: [
      'sign_in_with_google',
      'sign_in_with_apple',
      'sign_in_with_phone',
    ],
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
    intents: REFERRAL_STAFF_TEMPLATES_INTENTS,
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiReferralStaffTemplatesService',
    sprint: 'dashboardAuditFollowUp',
    mutateIntents: REFERRAL_STAFF_TEMPLATES_MUTATE_INTENTS,
  },
  {
    intents: EXTERNAL_DOCTORS_INTENTS,
    surfaces: ['dashboard'],
    apiModule: 'ai-command',
    handler: 'AiExternalDoctorsService',
    sprint: 'dashboardAuditFollowUp',
    mutateIntents: EXTERNAL_DOCTORS_MUTATE_INTENTS,
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
      'explain_tour_booking_record',
      'explain_tour_meeting_point',
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
    intents: ['dismiss_recommendations'],
    surfaces: ['customer'],
    apiModule: 'ai-command',
    handler: 'AiRecommendationProductService',
    sprint: 'recommendationProduct',
    mutateIntents: ['dismiss_recommendations'],
  },
  {
    intents: ['resume_pending_payment'],
    surfaces: ['customer'],
    apiModule: 'ai-command',
    handler: 'AiResumePendingPaymentService',
    sprint: 'pendingCheckout',
    mutateIntents: [],
  },
  {
    intents: [
      'explain_my_notifications',
      'manage_notification_preferences',
      'enable_push_notifications',
      'explain_push_permission',
      'register_customer_push',
      'explain_push_registration_status',
      'explain_offline_mode',
      'explain_app_update_required',
      'explain_analytics_consent',
      'explain_home_screen_widget',
      'explain_patient_alert',
      'refer_a_friend',
      'claim_referral_code',
      'share_salon_link',
      'share_my_booking',
      'claim_share_reward',
      'explain_rewards_wallet',
      'rebook_last_appointment',
      'find_my_saved_salons',
      'switch_salon_tenant',
    ],
    surfaces: ['customer'],
    apiModule: 'consumer-adoption',
    handler: 'AiConsumerAdoptionService',
    sprint: 'consumerAdoption',
    mutateIntents: [
      'manage_notification_preferences',
      'enable_push_notifications',
      'register_customer_push',
      'claim_referral_code',
      'claim_share_reward',
    ],
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
    intents: ['pay_at_venue_fallback'],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiPayAtVenueFallbackService',
    sprint: 'consumerCheckoutFailure',
    mutateIntents: ['pay_at_venue_fallback'],
  },
  {
    intents: ['resume_booking_draft'],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiResumeBookingDraftService',
    sprint: 'consumerCheckoutFailure',
    mutateIntents: [],
  },
  {
    intents: ['explain_slot_no_longer_available'],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiExplainSlotNoLongerAvailableService',
    sprint: 'consumerCheckoutFailure',
    mutateIntents: [],
  },
  {
    intents: ['explain_multi_service_payment_return'],
    surfaces: ['customer'],
    apiModule: 'ai-command',
    handler: 'AiExplainMultiServicePaymentReturnService',
    sprint: 'consumerCheckoutFailure',
    mutateIntents: [],
  },
  {
    intents: ['retry_failed_network_action'],
    surfaces: ['customer'],
    apiModule: 'ai-command',
    handler: 'AiRetryFailedNetworkActionService',
    sprint: 'consumerCheckoutFailure',
    mutateIntents: [],
  },
  {
    intents: ['explain_voice_input'],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiExplainVoiceInputService',
    sprint: 'voiceAccessibility',
    mutateIntents: [],
  },
  {
    intents: ['speak_assistant_reply'],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiSpeakAssistantReplyService',
    sprint: 'voiceAccessibility',
    mutateIntents: ['speak_assistant_reply'],
  },
  {
    intents: ['give_ai_feedback'],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiGiveAiFeedbackService',
    sprint: 'voiceAccessibility',
    mutateIntents: ['give_ai_feedback'],
  },
  {
    intents: ['explain_deposit_forfeiture'],
    surfaces: ['customer', 'public'],
    apiModule: 'public-booking',
    handler: 'AiSelfServiceBookingService',
    sprint: 'selfServiceBooking',
    mutateIntents: [],
  },
  {
    intents: ['explain_rtl_layout'],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiExplainRtlLayoutService',
    sprint: 'voiceAccessibility',
    mutateIntents: [],
  },
  {
    intents: ['diagnose_stripe_checkout_failure'],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiDiagnoseStripeCheckoutFailureService',
    sprint: 'consumerCheckoutFailure',
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
    intents: [
      'summarize_client',
      'show_client_history',
      'add_client_note',
      'list_client_staff_notes',
      'explain_client_intake',
    ],
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
      'mark_ready_now',
      'suggest_cancel_note',
      'request_client_review',
      'list_reassign_options',
      'reassign_booking_same_day',
    ],
    surfaces: ['provider'],
    apiModule: 'provider-exp-2',
    handler: 'AiProviderExp2Service',
    sprint: 'providerExp2',
    mutateIntents: [
      'check_in_client',
      'mark_running_late',
      'mark_ready_now',
      'request_client_review',
      'reassign_booking_same_day',
    ],
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
    intents: [...DASHBOARD_AGENT_OPS_INTENTS],
    surfaces: ['dashboard'],
    apiModule: 'agent-ops',
    handler: 'AiAgentOpsService',
    sprint: 'agentOps',
    mutateIntents: [...DASHBOARD_AGENT_OPS_MUTATE_INTENTS],
  },
  {
    intents: [...DASHBOARD_BUSINESS_PROFILE_INTENTS],
    surfaces: ['dashboard'],
    apiModule: 'business-profile',
    handler: 'AiBusinessProfileService',
    sprint: 'businessProfile',
    mutateIntents: [...DASHBOARD_BUSINESS_PROFILE_MUTATE_INTENTS],
  },
  {
    intents: [...DASHBOARD_ONBOARDING_INTENTS],
    surfaces: ['dashboard'],
    apiModule: 'onboarding',
    handler: 'AiOnboardingService',
    sprint: 'onboarding',
    mutateIntents: [...DASHBOARD_ONBOARDING_MUTATE_INTENTS],
  },
  {
    intents: [...DASHBOARD_CLINIC_PRE_VISIT_INTAKE_MUTATE_INTENTS],
    surfaces: ['dashboard'],
    apiModule: 'clinic-pre-visit-intake',
    handler: 'AiClinicPreVisitIntakeService',
    sprint: 'clinicPreVisitIntake',
    mutateIntents: [...DASHBOARD_CLINIC_PRE_VISIT_INTAKE_MUTATE_INTENTS],
  },
  {
    intents: [...DASHBOARD_CLINIC_QUESTIONNAIRE_MUTATE_INTENTS],
    surfaces: ['dashboard'],
    apiModule: 'clinic-questionnaires',
    handler: 'AiClinicQuestionnaireService',
    sprint: 'clinicPreVisitIntake',
    mutateIntents: [...DASHBOARD_CLINIC_QUESTIONNAIRE_MUTATE_INTENTS],
  },
  {
    intents: [...DASHBOARD_LOCATIONS_MUTATE_INTENTS],
    surfaces: ['dashboard'],
    apiModule: 'locations',
    handler: 'AiLocationsService',
    sprint: 'operations',
    mutateIntents: [...DASHBOARD_LOCATIONS_MUTATE_INTENTS],
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
      'buy_gift_card_for_someone',
      'choose_payment_method',
      'pay_online',
      'pay_cash_at_visit',
      'purchase_subscription_checkout',
      'confirm_stripe_payment',
    ],
  },
  {
    intents: ['explain_checkout_total'],
    surfaces: ['customer', 'public'],
    apiModule: 'payments',
    handler: 'AiPaymentsService',
    sprint: 'payments',
  },
  {
    intents: ['explain_amount_due_now'],
    surfaces: ['customer', 'public'],
    apiModule: 'payments',
    handler: 'AiPaymentsService',
    sprint: 'payments',
  },
  {
    intents: ['explain_service_price'],
    surfaces: ['customer', 'public'],
    apiModule: 'payments',
    handler: 'AiPaymentsService',
    sprint: 'payments',
  },
  {
    intents: ['explain_payment_options_for_service'],
    surfaces: ['customer', 'public'],
    apiModule: 'payments',
    handler: 'AiPaymentsService',
    sprint: 'payments',
  },
  {
    intents: ['find_soonest_appointment'],
    surfaces: ['customer', 'public'],
    apiModule: 'payments',
    handler: 'AiPaymentsService',
    sprint: 'payments',
  },
  {
    intents: ['compare_services'],
    surfaces: ['customer', 'public'],
    apiModule: 'payments',
    handler: 'AiPaymentsService',
    sprint: 'payments',
  },
  {
    intents: ['explain_package_savings'],
    surfaces: ['customer', 'public'],
    apiModule: 'public-booking',
    handler: 'AiSelfServiceBookingService',
    sprint: 'selfServiceBooking',
  },
  {
    intents: ['explain_subscription_vs_one_time'],
    surfaces: ['customer', 'public'],
    apiModule: 'public-booking',
    handler: 'AiSelfServiceBookingService',
    sprint: 'selfServiceBooking',
  },
  {
    intents: ['filter_services_no_prepayment'],
    surfaces: ['customer', 'public'],
    apiModule: 'payments',
    handler: 'AiPaymentsService',
    sprint: 'payments',
  },
  {
    intents: ['explain_provider_availability'],
    surfaces: ['customer', 'public'],
    apiModule: 'public-booking',
    handler: 'PublicBookingAssistantService',
    sprint: 'businessProfile',
  },
  {
    intents: [
      'explain_business_hours_and_location',
      'get_directions_to_salon',
      'explain_salon_profile',
    ],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiBusinessHoursLocationService',
    sprint: 'businessProfile',
  },
  {
    intents: [
      'explain_provider_specialty',
      'explain_professional_profile',
      'explain_any_provider_option',
      'pick_provider_for_service',
      'switch_provider_same_time',
      'list_provider_reviews',
      'submit_provider_review',
    ],
    surfaces: ['customer', 'public'],
    apiModule: 'ai-command',
    handler: 'AiProviderSpecialtyService',
    sprint: 'businessProfile',
    mutateIntents: [
      'pick_provider_for_service',
      'switch_provider_same_time',
      'submit_provider_review',
    ],
  },
  {
    intents: ['submit_review_with_token'],
    surfaces: ['customer'],
    apiModule: 'ai-command',
    handler: 'AiProviderSpecialtyService',
    sprint: 'businessProfile',
    mutateIntents: ['submit_review_with_token'],
  },
  {
    intents: ['explain_why_stripe_required'],
    surfaces: ['customer', 'public'],
    apiModule: 'payments',
    handler: 'AiPaymentsService',
    sprint: 'payments',
  },
  {
    intents: ['choose_payment_method', 'pay_cash_at_visit', 'pay_online'],
    surfaces: ['public'],
    apiModule: 'payments',
    handler: 'AiPaymentsService',
    sprint: 'payments',
    mutateIntents: ['choose_payment_method', 'pay_cash_at_visit', 'pay_online'],
  },
  {
    intents: [
      'get_booking_quote',
      'get_package_quote',
      'get_multi_service_quote',
      'confirm_stripe_payment',
    ],
    surfaces: ['public'],
    apiModule: 'payments',
    handler: 'AiPaymentsService',
    sprint: 'payments',
    mutateIntents: ['confirm_stripe_payment'],
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
    surfaces: ['dashboard', 'provider'],
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
    // ai-cmd-provider-6.14 — split from a single dashboard+provider row: the 9
    // dashboard-only retail admin intents (catalog/inventory/expenses/P&L/payouts)
    // have no ProviderAiCommandService dispatch and don't belong on the provider
    // surface; only PROVIDER_RETAIL_FINANCE_INTENTS below are shared with provider.
    intents: RETAIL_FINANCE_INTENTS,
    surfaces: ['dashboard'],
    apiModule: 'retail-finance',
    handler: 'AiRetailFinanceService',
    sprint: 'retailFinance',
    // suggest_retail_upsell is READ-only (product suggestions) — only
    // add_retail_to_my_booking from PROVIDER_RETAIL_FINANCE_INTENTS mutates.
    mutateIntents: [
      ...DASHBOARD_RETAIL_FINANCE_MUTATE_INTENTS,
      'add_retail_to_my_booking',
    ],
  },
  {
    intents: [...PROVIDER_RETAIL_FINANCE_INTENTS],
    surfaces: ['provider'],
    apiModule: 'retail-finance',
    handler: 'AiRetailFinanceService',
    sprint: 'retailFinance',
    mutateIntents: ['add_retail_to_my_booking'],
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
    mutateIntents: ['apply_promo_code_checkout', 'apply_loyalty_at_checkout'],
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
    intents: ['join_waitlist', 'check_waitlist_status'],
    surfaces: ['public'],
    apiModule: 'public-booking',
    handler: 'AiSelfServiceBookingService',
    sprint: 'selfServiceBooking',
    mutateIntents: ['join_waitlist'],
  },
  {
    intents: PUBLIC_MULTI_SERVICE_BOOKING_INTENTS,
    surfaces: ['public'],
    apiModule: 'public-booking',
    handler: 'AiSelfServiceBookingService',
    sprint: 'selfServiceBooking',
    mutateIntents: ['book_multi_service', 'add_services_to_cart'],
  },
  {
    intents: ['suggest_package_block'],
    surfaces: ['public'],
    apiModule: 'public-booking',
    handler: 'AiSelfServiceBookingService',
    sprint: 'selfServiceBooking',
    mutateIntents: [],
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
    intents: PROVIDER_CLINIC_TASKS_AND_RESULTS_INTENTS.filter(
      (id) => id !== 'list_booking_lab_summaries',
    ),
    surfaces: ['provider'],
    apiModule: 'clinic-test-results',
    handler: 'AiProviderClinicTasksAndResultsService',
    sprint: 'providerClinicTasksAndResults',
    mutateIntents: [...PROVIDER_CLINIC_TASKS_AND_RESULTS_MUTATE_INTENTS],
  },
  {
    intents: ['list_booking_lab_summaries'],
    surfaces: ['provider', 'dashboard'],
    apiModule: 'clinic-test-results',
    handler: 'AiProviderClinicTasksAndResultsService',
    sprint: 'dashboardAuditFollowUp',
    mutateIntents: [],
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
      'update_schedule_template',
      'delete_schedule_templates',
      'duplicate_schedule_template',
      'delete_schedule_block',
      'apply_and_fill',
      'assign_employee_services',
      'unassign_employee_services',
      'transfer_employee_services',
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
      ...OPERATIONS_STAFF_INTENTS,
      ...WAITLIST_DASHBOARD_MUTATE_INTENTS,
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
      'update_schedule_template',
      'delete_schedule_templates',
      'duplicate_schedule_template',
      'delete_schedule_block',
      'apply_and_fill',
      'assign_employee_services',
      'unassign_employee_services',
      'transfer_employee_services',
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
      ...OPERATIONS_STAFF_INTENTS,
      ...WAITLIST_DASHBOARD_MUTATE_INTENTS,
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
      ...WAITLIST_DASHBOARD_READ_INTENTS,
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
      'update_provider_profile',
    ],
  },
  {
    intents: PUBLIC_ANONYMOUS_INTENTS,
    surfaces: ['public'],
    apiModule: 'public-booking',
    handler: 'PublicBookingAssistantService',
    mutateIntents: [
      'book_appointment',
      'create_intake_draft',
      'start_pre_visit_intake',
      'submit_intake_answers',
      'sign_in_with_google',
      'sign_in_with_apple',
      'sign_in_with_phone',
    ],
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
      sprint: 'staffOnboarding',
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
      sprint: 'salonCheckout',
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
      sprint: 'servicesPaymentMatrix',
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
      sprint: 'cashAndOnlinePayment',
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
      sprint: 'declineOnlinePaymentCategory',
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
      sprint: 'salonNotifications',
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
      sprint: 'consumerAppGrowth',
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
      sprint: 'budgetDiscoverAndBook',
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
      sprint: 'rankDiscoverAndBook',
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
      sprint: 'clinicLabDayClose',
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
      sprint: 'clinicTestResults',
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
      sprint: 'avail',
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
      sprint: 'avail',
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
      sprint: 'budget',
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
      sprint: 'budget',
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
      sprint: 'selfServiceBooking',
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
      sprint: 'selfServiceBooking',
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
      sprint: 'selfServiceBooking',
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
      sprint: 'selfServiceBooking',
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
      sprint: 'selfServiceBooking',
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
      sprint: 'payments',
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
      sprint: 'selfServiceBooking',
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
      sprint: 'selfServiceBooking',
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
      sprint: 'guestCheckout',
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
      sprint: 'guestCheckout',
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
      sprint: 'guestCheckout',
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
      sprint: 'selfServiceBooking',
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
      sprint: 'selfServiceBooking',
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
      sprint: 'consumerClinicLabBooking',
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
      sprint: 'consumerClinicLabBooking',
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
      sprint: 'consumerClinicIntake',
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
      sprint: 'consumerClinicIntake',
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
        'choose_payment_method',
      ],
      examplePrompts: [
        'Complete health form, book earliest blood draw, pay deposit',
        'Fill intake and book blood draw, pay online',
      ],
      sprint: 'consumerClinicIntake',
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
        'choose_payment_method',
      ],
      examplePrompts: [
        'Complete health questionnaire, schedule lab test, pay with card',
        'Fill health form; book earliest blood draw; pay with card',
      ],
      sprint: 'consumerClinicIntake',
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
        'Wine tour for 6 next Saturday — book if enough seats',
        'City tour for 8 on 15/08/2026 — book only if enough spots',
      ],
      sprint: 'tourConsumer',
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
      ],
      sprint: 'tourConsumer',
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
        'Book the wine tour earliest date for 2 people',
        'Reserve mountain trek soonest departure for 4 guests',
      ],
      sprint: 'tourConsumer',
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
      ],
      sprint: 'tourConsumer',
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
      sprint: 'selfServiceBooking',
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
