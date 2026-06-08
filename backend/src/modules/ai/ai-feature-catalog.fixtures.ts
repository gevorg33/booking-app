import type { AccessTier } from './access-control.matrix.js';
import type { CommandApiModule, CommandSurface } from './ai-command-registry.types.js';
import type { AiFeatureActionKind, AiFeatureCatalogEntry } from './ai-feature-catalog.types.js';

type UiFeatureSeed = {
  id: string;
  surface: CommandSurface;
  module: CommandApiModule | string;
  actionKind: AiFeatureActionKind;
  minTier: AccessTier;
  label: string;
  intentIds?: readonly string[];
  uiPath?: string;
  navRef?: string;
  confirmed?: boolean;
  extractionSource?: AiFeatureCatalogEntry['extractionSource'];
  aiExempt?: boolean;
  aiExemptReason?: string;
};

function uiFeature(seed: UiFeatureSeed): AiFeatureCatalogEntry {
  return {
    id: seed.id,
    surface: seed.surface,
    module: seed.module,
    actionKind: seed.actionKind,
    minTier: seed.minTier,
    label: seed.label,
    intentIds: seed.intentIds ?? [],
    uiPath: seed.uiPath,
    navRef: seed.navRef,
    extractionSource: seed.extractionSource ?? 'manual',
    confirmed: seed.confirmed ?? true,
    aiExempt: seed.aiExempt,
    aiExemptReason: seed.aiExemptReason,
  };
}

/** parity-1.1 — dashboard nav + page shells (frontend layout.tsx). */
export const DASHBOARD_UI_FEATURES: readonly AiFeatureCatalogEntry[] = [
  uiFeature({ id: 'dashboard.nav.overview', surface: 'dashboard', module: 'ai-command', actionKind: 'read', minTier: 'staff', label: 'Dashboard overview', uiPath: '/dashboard', navRef: 'nav.dashboard', intentIds: ['summarize_day', 'list_bookings'] }),
  uiFeature({ id: 'dashboard.nav.bookings', surface: 'dashboard', module: 'booking', actionKind: 'read', minTier: 'staff', label: 'Bookings calendar', uiPath: '/dashboard/bookings', navRef: 'nav.bookings', intentIds: ['list_bookings', 'show_appointments'] }),
  uiFeature({ id: 'dashboard.nav.schedule', surface: 'dashboard', module: 'schedule', actionKind: 'mutate', minTier: 'manager', label: 'Staff schedule editor', uiPath: '/dashboard/schedule', navRef: 'nav.schedule', intentIds: ['apply_schedule', 'block_schedule', 'list_templates'] }),
  uiFeature({ id: 'dashboard.nav.appointments', surface: 'dashboard', module: 'booking', actionKind: 'read', minTier: 'staff', label: 'Appointments list', uiPath: '/dashboard/appointments', navRef: 'nav.appointments', intentIds: ['show_appointments', 'list_bookings'] }),
  uiFeature({ id: 'dashboard.nav.services', surface: 'dashboard', module: 'catalog', actionKind: 'mutate', minTier: 'manager', label: 'Services catalog', uiPath: '/dashboard/services', navRef: 'nav.services', intentIds: ['list_services', 'create_service'] }),
  uiFeature({ id: 'dashboard.nav.lab_queue', surface: 'dashboard', module: 'clinic-test-results', actionKind: 'read', minTier: 'staff', label: 'Lab order queue', uiPath: '/dashboard/lab-queue', navRef: 'nav.labQueue', intentIds: ['list_test_orders'] }),
  uiFeature({ id: 'dashboard.nav.lab_specimens', surface: 'dashboard', module: 'clinic-test-results', actionKind: 'mutate', minTier: 'staff', label: 'Lab specimen collection', uiPath: '/dashboard/lab-specimens/collection', navRef: 'nav.labSpecimens', intentIds: ['create_test_order'] }),
  uiFeature({ id: 'dashboard.nav.employees', surface: 'dashboard', module: 'schedule-resources', actionKind: 'read', minTier: 'manager', label: 'Employees directory', uiPath: '/dashboard/employees', navRef: 'nav.employees', intentIds: ['list_employees'] }),
  uiFeature({ id: 'dashboard.nav.customers', surface: 'dashboard', module: 'customer-crm', actionKind: 'read', minTier: 'staff', label: 'Customers CRM', uiPath: '/dashboard/customers', navRef: 'nav.customers', intentIds: ['lookup_customer'] }),
  uiFeature({ id: 'dashboard.nav.reviews', surface: 'dashboard', module: 'marketing-growth', actionKind: 'read', minTier: 'manager', label: 'Reviews inbox', uiPath: '/dashboard/reviews', navRef: 'nav.reviews', intentIds: ['list_reviews'] }),
  uiFeature({ id: 'dashboard.nav.monetization', surface: 'dashboard', module: 'marketing-growth', actionKind: 'read', minTier: 'owner', label: 'Monetization hub', uiPath: '/dashboard/monetization', navRef: 'nav.monetization', intentIds: ['explain_plan_limits'] }),
  uiFeature({ id: 'dashboard.nav.reports', surface: 'dashboard', module: 'retail-finance', actionKind: 'read', minTier: 'manager', label: 'Reports & analytics', uiPath: '/dashboard/reports', navRef: 'nav.reports', intentIds: ['summarize_utilization', 'revenue_forecast'] }),
  uiFeature({ id: 'dashboard.nav.operations', surface: 'dashboard', module: 'retail-finance', actionKind: 'read', minTier: 'manager', label: 'Operations dashboard', uiPath: '/dashboard/operations', navRef: 'nav.operations', intentIds: ['list_products', 'adjust_inventory'] }),
  uiFeature({ id: 'dashboard.nav.business', surface: 'dashboard', module: 'ai-command', actionKind: 'mutate', minTier: 'owner', label: 'Business profile', uiPath: '/dashboard/business', navRef: 'nav.businessProfile', intentIds: ['explain_business_currency', 'configure_business_currency', 'explain_business_languages', 'configure_business_languages', 'explain_business_tax'] }),
  uiFeature({ id: 'dashboard.nav.integrations', surface: 'dashboard', module: 'integrations', actionKind: 'mutate', minTier: 'owner', label: 'CRM & integrations', uiPath: '/dashboard/integrations', navRef: 'nav.crmIntegrations', intentIds: ['list_integration_health', 'configure_zendesk'] }),
  uiFeature({ id: 'dashboard.nav.billing', surface: 'dashboard', module: 'billing', actionKind: 'read', minTier: 'owner', label: 'Subscription billing portal', uiPath: '/dashboard/billing', navRef: 'nav.billing', intentIds: ['explain_plan_limits', 'toggle_annual_billing', 'suggest_upgrade'], confirmed: true }),
  uiFeature({ id: 'dashboard.nav.ai_ops', surface: 'dashboard', module: 'ai-command', actionKind: 'read', minTier: 'manager', label: 'AI operations dashboard', uiPath: '/dashboard/ai-ops', navRef: 'nav.aiOps', intentIds: ['fill_unused_slots', 'summarize_automation_performance'] }),
  uiFeature({ id: 'dashboard.nav.adoption', surface: 'dashboard', module: 'marketing-growth', actionKind: 'read', minTier: 'owner', label: 'Adoption analytics dashboard', uiPath: '/dashboard/adoption', navRef: 'nav.adoption', intentIds: ['summarize_new_registrations'], confirmed: true }),
  uiFeature({ id: 'dashboard.nav.settings', surface: 'dashboard', module: 'ai-command', actionKind: 'mutate', minTier: 'owner', label: 'Tenant settings', uiPath: '/dashboard/settings', navRef: 'nav.settings', intentIds: ['configure_business_languages', 'configure_business_currency', 'explain_business_languages', 'explain_business_currency'] }),
  uiFeature({ id: 'dashboard.nav.guide', surface: 'dashboard', module: 'ai-command', actionKind: 'read', minTier: 'staff', label: 'Product guide', uiPath: '/dashboard/guide', navRef: 'nav.guide', intentIds: ['summarize_day'] }),
];

/** parity-1.1 — dashboard quick actions + bulk/page controls. */
export const DASHBOARD_PAGE_UI_FEATURES: readonly AiFeatureCatalogEntry[] = [
  uiFeature({ id: 'dashboard.action.new_booking', surface: 'dashboard', module: 'booking', actionKind: 'mutate', minTier: 'staff', label: 'New booking', uiPath: '/dashboard/bookings', intentIds: ['create_booking'] }),
  uiFeature({ id: 'dashboard.action.manage_schedule', surface: 'dashboard', module: 'schedule', actionKind: 'mutate', minTier: 'manager', label: 'Manage schedule', uiPath: '/dashboard/schedule', intentIds: ['apply_schedule'] }),
  uiFeature({ id: 'dashboard.action.add_employee', surface: 'dashboard', module: 'schedule-resources', actionKind: 'mutate', minTier: 'manager', label: 'Add employee', uiPath: '/dashboard/employees', intentIds: ['onboard_provider_schedule'], confirmed: true }),
  uiFeature({ id: 'dashboard.action.bulk_cancel', surface: 'dashboard', module: 'booking', actionKind: 'mutate', minTier: 'manager', label: 'Bulk cancel appointments', uiPath: '/dashboard/bookings', intentIds: ['cancel_bookings', 'bulk_smart_cancel'] }),
  uiFeature({ id: 'dashboard.action.bulk_reschedule', surface: 'dashboard', module: 'booking', actionKind: 'mutate', minTier: 'manager', label: 'Bulk reschedule appointments', uiPath: '/dashboard/bookings', intentIds: ['reschedule_booking', 'update_bookings'] }),
  uiFeature({ id: 'dashboard.action.assigned_bookings', surface: 'dashboard', module: 'booking', actionKind: 'read', minTier: 'staff', label: 'My assigned bookings', uiPath: '/dashboard/bookings', intentIds: ['list_bookings'] }),
  uiFeature({ id: 'dashboard.action.view_own_schedule', surface: 'dashboard', module: 'schedule', actionKind: 'read', minTier: 'staff', label: 'View my schedule', uiPath: '/dashboard/schedule', intentIds: ['show_appointments', 'check_availability'] }),
  uiFeature({ id: 'dashboard.action.check_in_assigned', surface: 'dashboard', module: 'booking', actionKind: 'mutate', minTier: 'staff', label: 'Check in assigned booking', uiPath: '/dashboard/appointments', intentIds: ['update_bookings'] }),
  uiFeature({ id: 'dashboard.action.update_assigned_notes', surface: 'dashboard', module: 'booking', actionKind: 'mutate', minTier: 'staff', label: 'Update notes on assigned booking', uiPath: '/dashboard/appointments', intentIds: ['update_bookings'] }),
  uiFeature({ id: 'dashboard.action.block_own_break', surface: 'dashboard', module: 'schedule', actionKind: 'mutate', minTier: 'staff', label: 'Block break on my schedule', uiPath: '/dashboard/schedule', intentIds: ['block_schedule'] }),
  uiFeature({ id: 'dashboard.action.export_customers', surface: 'dashboard', module: 'customer-crm', actionKind: 'read', minTier: 'manager', label: 'Export customer data', uiPath: '/dashboard/customers', intentIds: ['export_customer_data'] }),
  uiFeature({ id: 'dashboard.settings.notification_prefs', surface: 'dashboard', module: 'push-notifications', actionKind: 'mutate', minTier: 'owner', label: 'Notification preferences toggle', uiPath: '/dashboard/settings', intentIds: ['configure_push_recipients', 'toggle_business_email_on_customer_change'] }),
  uiFeature({ id: 'dashboard.settings.business_languages', surface: 'dashboard', module: 'ai-command', actionKind: 'mutate', minTier: 'owner', label: 'Business languages form', uiPath: '/dashboard/settings', intentIds: ['configure_business_languages'] }),
  uiFeature({ id: 'dashboard.settings.hipaa_baa', surface: 'dashboard', module: 'ai-command', actionKind: 'mutate', minTier: 'owner', label: 'Accept HIPAA BAA', uiPath: '/dashboard/settings', intentIds: ['accept_hipaa_baa'] }),
  uiFeature({ id: 'dashboard.permission.team_role_edit', surface: 'dashboard', module: 'schedule-resources', actionKind: 'mutate', minTier: 'owner', label: 'Edit team member roles', uiPath: '/dashboard/employees', intentIds: ['update_team_member_role'], confirmed: true, extractionSource: 'permission' }),
];

/** parity-1.3 — dashboard routes outside sidebar nav (extraction-derived, pending reviewer). */
export const DASHBOARD_ROUTE_UI_FEATURES: readonly AiFeatureCatalogEntry[] = [
  uiFeature({ id: 'dashboard.route.onboarding', surface: 'dashboard', module: 'ai-command', actionKind: 'mutate', minTier: 'owner', label: 'Onboarding wizard', uiPath: '/dashboard/onboarding', intentIds: ['apply_clinic_playbook', 'apply_tour_playbook'], confirmed: true, extractionSource: 'route' }),
  uiFeature({ id: 'dashboard.route.calendar', surface: 'dashboard', module: 'booking', actionKind: 'read', minTier: 'staff', label: 'Calendar view', uiPath: '/dashboard/calendar', intentIds: ['list_bookings', 'show_appointments'], confirmed: false, extractionSource: 'route' }),
  uiFeature({ id: 'dashboard.route.patient_chart', surface: 'dashboard', module: 'patient-clinical-profiles', actionKind: 'read', minTier: 'staff', label: 'Patient chart summary', uiPath: '/dashboard/patient-chart/:customerId', intentIds: ['explain_patient_chart'], confirmed: false, extractionSource: 'route' }),
  uiFeature({ id: 'dashboard.route.lab_specimens_tracking', surface: 'dashboard', module: 'clinic-test-results', actionKind: 'read', minTier: 'staff', label: 'Lab specimen tracking', uiPath: '/dashboard/lab-specimens/tracking', intentIds: ['list_test_orders'], confirmed: false, extractionSource: 'route' }),
];

/** parity-1.1 — provider app tabs + booking actions (provider-app App.tsx). */
export const PROVIDER_UI_FEATURES: readonly AiFeatureCatalogEntry[] = [
  uiFeature({ id: 'provider.nav.today', surface: 'provider', module: 'provider-mobile', actionKind: 'read', minTier: 'staff', label: 'Today appointments', uiPath: '/tabs/today', navRef: 'provider.navToday', intentIds: ['list_bookings', 'summarize_day'] }),
  uiFeature({ id: 'provider.nav.schedule', surface: 'provider', module: 'schedule', actionKind: 'read', minTier: 'staff', label: 'My schedule', uiPath: '/tabs/schedule', navRef: 'provider.navSchedule', intentIds: ['show_appointments', 'check_availability'] }),
  uiFeature({ id: 'provider.nav.profile', surface: 'provider', module: 'provider-mobile', actionKind: 'read', minTier: 'staff', label: 'Provider profile & settings', uiPath: '/tabs/profile', navRef: 'provider.navProfile', intentIds: ['explain_last_push'] }),
  uiFeature({ id: 'provider.nav.gift_cards', surface: 'provider', module: 'gift-fulfillment', actionKind: 'mutate', minTier: 'staff', label: 'Gift card fulfillment queues', uiPath: '/tabs/gift-cards', navRef: 'provider.navGiftCards', intentIds: ['gift_card_creation_queue', 'start_card_preparation'] }),
  uiFeature({ id: 'provider.nav.lab_collection', surface: 'provider', module: 'clinic-test-results', actionKind: 'mutate', minTier: 'staff', label: 'Lab specimen collection', uiPath: '/tabs/lab-collection', navRef: 'provider.navLabCollection', intentIds: ['list_my_collection_queue', 'mark_specimen_collected'] }),
  uiFeature({ id: 'provider.nav.lab_results', surface: 'provider', module: 'clinic-test-results', actionKind: 'read', minTier: 'staff', label: 'Lab results inbox', uiPath: '/tabs/lab-results', navRef: 'provider.navLabResults', intentIds: ['enter_test_result', 'release_test_result'] }),
  uiFeature({ id: 'provider.nav.clinic_tasks', surface: 'provider', module: 'clinic-test-results', actionKind: 'mutate', minTier: 'staff', label: 'Clinic tasks queue', uiPath: '/tabs/clinic-tasks', navRef: 'provider.navClinicTasks', intentIds: ['list_patient_pending_lab_requests'] }),
  uiFeature({ id: 'provider.nav.patients', surface: 'provider', module: 'patient-clinical-profiles', actionKind: 'read', minTier: 'staff', label: 'Patient lookup', uiPath: '/tabs/patients', navRef: 'provider.navPatients', intentIds: ['explain_patient_chart'] }),
  uiFeature({ id: 'provider.action.list_assigned', surface: 'provider', module: 'provider-mobile', actionKind: 'read', minTier: 'staff', label: 'My assigned bookings today', uiPath: '/tabs/today', intentIds: ['list_bookings'] }),
  uiFeature({ id: 'provider.action.check_in', surface: 'provider', module: 'provider-mobile', actionKind: 'mutate', minTier: 'staff', label: 'Check in appointment', uiPath: '/tabs/today', intentIds: ['update_bookings'] }),
  uiFeature({ id: 'provider.action.update_notes', surface: 'provider', module: 'provider-mobile', actionKind: 'mutate', minTier: 'staff', label: 'Update appointment notes', uiPath: '/tabs/today', intentIds: ['update_bookings'] }),
  uiFeature({ id: 'provider.action.whos_next', surface: 'provider', module: 'provider-mobile', actionKind: 'read', minTier: 'staff', label: "Who's next appointment", uiPath: '/tabs/today', intentIds: ['show_appointments'] }),
  uiFeature({ id: 'provider.action.lunch_break', surface: 'provider', module: 'schedule', actionKind: 'mutate', minTier: 'staff', label: 'Block lunch or break', uiPath: '/tabs/schedule', intentIds: ['block_schedule'] }),
  uiFeature({ id: 'provider.action.mark_paid', surface: 'provider', module: 'payments', actionKind: 'mutate', minTier: 'staff', label: 'Mark booking paid', uiPath: '/tabs/today', intentIds: ['mark_paid'] }),
  uiFeature({ id: 'provider.action.cancel_booking', surface: 'provider', module: 'booking', actionKind: 'mutate', minTier: 'staff', label: 'Cancel assigned booking', uiPath: '/tabs/today', intentIds: ['cancel_bookings'] }),
  uiFeature({ id: 'provider.action.reschedule_booking', surface: 'provider', module: 'booking', actionKind: 'mutate', minTier: 'staff', label: 'Reschedule assigned booking', uiPath: '/tabs/today', intentIds: ['reschedule_booking'] }),
  uiFeature({ id: 'provider.action.block_schedule', surface: 'provider', module: 'schedule', actionKind: 'mutate', minTier: 'staff', label: 'Block my schedule', uiPath: '/tabs/schedule', intentIds: ['block_schedule'] }),
  uiFeature({ id: 'provider.action.offline_queue', surface: 'provider', module: 'provider-mobile', actionKind: 'read', minTier: 'staff', label: 'Offline action queue status', uiPath: '/tabs/profile', intentIds: ['offline_queue_status'] }),
  uiFeature({ id: 'provider.auth.login', surface: 'provider', module: 'provider-mobile', actionKind: 'read', minTier: 'staff', label: 'Staff login', uiPath: '/login', intentIds: [], extractionSource: 'route', aiExempt: true, aiExemptReason: 'auth_shell' }),
  uiFeature({ id: 'provider.auth.accept_invite', surface: 'provider', module: 'provider-mobile', actionKind: 'mutate', minTier: 'staff', label: 'Accept staff invite', uiPath: '/accept-invite', intentIds: [], extractionSource: 'route', aiExempt: true, aiExemptReason: 'auth_shell' }),
  uiFeature({ id: 'provider.route.patient_chart', surface: 'provider', module: 'patient-clinical-profiles', actionKind: 'read', minTier: 'staff', label: 'Patient chart detail', uiPath: '/tabs/patients/:customerId', intentIds: ['explain_patient_chart'], confirmed: false, extractionSource: 'route' }),
];

/** parity-1.1 — consumer/customer app tabs + self-service (consumer-app SalonTabs.tsx). */
export const CUSTOMER_UI_FEATURES: readonly AiFeatureCatalogEntry[] = [
  uiFeature({ id: 'customer.nav.home', surface: 'customer', module: 'self-service-booking', actionKind: 'read', minTier: 'client', label: 'Salon home', uiPath: '/s/:slug', navRef: 'customer.home', intentIds: ['list_my_appointments'] }),
  uiFeature({ id: 'customer.nav.book', surface: 'customer', module: 'self-service-booking', actionKind: 'mutate', minTier: 'client', label: 'Book a service', uiPath: '/s/:slug/services', navRef: 'customer.book', intentIds: ['book_package', 'book_with_cash'] }),
  uiFeature({ id: 'customer.nav.account', surface: 'customer', module: 'customer-crm', actionKind: 'read', minTier: 'client', label: 'Account & profile', uiPath: '/s/:slug/account', navRef: 'customer.account', intentIds: ['my_profile'] }),
  uiFeature({ id: 'customer.nav.results', surface: 'customer', module: 'clinic-test-results', actionKind: 'read', minTier: 'client', label: 'My lab results', uiPath: '/s/:slug/results', navRef: 'customer.results', intentIds: ['list_my_test_results'] }),
  uiFeature({ id: 'customer.nav.lab_to_book', surface: 'customer', module: 'clinic-test-results', actionKind: 'mutate', minTier: 'client', label: 'Lab tests to book', uiPath: '/s/:slug/lab-to-book', navRef: 'customer.labToBook', intentIds: ['book_lab_collection'] }),
  uiFeature({ id: 'customer.nav.lab_requests', surface: 'customer', module: 'clinic-test-results', actionKind: 'read', minTier: 'client', label: 'Pending lab booking requests', uiPath: '/s/:slug/lab-requests', navRef: 'customer.labRequests', intentIds: ['list_my_lab_booking_requests'] }),
  uiFeature({ id: 'customer.action.cancel_booking', surface: 'customer', module: 'self-service-booking', actionKind: 'mutate', minTier: 'client', label: 'Cancel my booking', uiPath: '/s/:slug/manage', intentIds: ['cancel_my_booking'], extractionSource: 'permission' }),
  uiFeature({ id: 'customer.action.reschedule_booking', surface: 'customer', module: 'self-service-booking', actionKind: 'mutate', minTier: 'client', label: 'Reschedule my booking', uiPath: '/s/:slug/manage', intentIds: ['reschedule_my_booking'], extractionSource: 'permission' }),
  uiFeature({ id: 'customer.action.notification_prefs', surface: 'customer', module: 'push-notifications', actionKind: 'mutate', minTier: 'client', label: 'Notification preference toggles', uiPath: '/s/:slug/account', intentIds: ['manage_notification_preferences'], extractionSource: 'permission' }),
  uiFeature({ id: 'customer.action.rewards', surface: 'customer', module: 'marketing-growth', actionKind: 'read', minTier: 'client', label: 'Loyalty rewards balance', uiPath: '/s/:slug/account', intentIds: ['loyalty_points_balance'], extractionSource: 'permission' }),
  uiFeature({ id: 'customer.action.manage_link', surface: 'customer', module: 'self-service-booking', actionKind: 'read', minTier: 'client', label: 'Booking manage link', uiPath: '/s/:slug/manage', intentIds: ['get_manage_link'], extractionSource: 'permission' }),
  uiFeature({ id: 'customer.action.subscriptions', surface: 'customer', module: 'customer-crm', actionKind: 'read', minTier: 'client', label: 'My subscriptions & usage', uiPath: '/s/:slug/account', intentIds: ['my_subscriptions', 'subscription_usage'], extractionSource: 'permission' }),
  uiFeature({ id: 'customer.action.gift_cards', surface: 'customer', module: 'customer-crm', actionKind: 'read', minTier: 'client', label: 'My gift cards', uiPath: '/s/:slug/account', intentIds: ['my_gift_cards', 'gift_card_balance'], extractionSource: 'permission' }),
  uiFeature({ id: 'customer.action.payment_checkout', surface: 'customer', module: 'payments', actionKind: 'mutate', minTier: 'client', label: 'Checkout payment method', uiPath: '/s/:slug/checkout', intentIds: ['choose_payment_method', 'pay_online', 'pay_cash_at_visit', 'apply_gift_card_code'], extractionSource: 'permission' }),
  uiFeature({ id: 'customer.action.discover_packages', surface: 'customer', module: 'customer-crm', actionKind: 'read', minTier: 'client', label: 'Browse packages & plans', uiPath: '/s/:slug/services', intentIds: ['discover_packages', 'discover_subscription_plans', 'discover_gift_card_products'], extractionSource: 'permission' }),
  uiFeature({ id: 'customer.auth.login', surface: 'customer', module: 'public-booking', actionKind: 'read', minTier: 'client', label: 'Customer sign-in', uiPath: '/s/:slug/login', intentIds: [], extractionSource: 'route', aiExempt: true, aiExemptReason: 'auth_shell' }),
  uiFeature({ id: 'customer.route.manage', surface: 'customer', module: 'self-service-booking', actionKind: 'mutate', minTier: 'client', label: 'Manage my booking', uiPath: '/s/:slug/manage', intentIds: ['cancel_my_booking', 'reschedule_my_booking'], extractionSource: 'route' }),
  uiFeature({ id: 'customer.route.book_service', surface: 'customer', module: 'self-service-booking', actionKind: 'mutate', minTier: 'client', label: 'Book specific service', uiPath: '/s/:slug/book/:serviceId', intentIds: ['book_package', 'book_with_cash'], confirmed: false, extractionSource: 'route' }),
];

/** parity-1.1 — public booking web flow (frontend /book/[slug]). */
export const PUBLIC_UI_FEATURES: readonly AiFeatureCatalogEntry[] = [
  uiFeature({ id: 'public.nav.home', surface: 'public', module: 'public-booking', actionKind: 'read', minTier: 'client', label: 'Public booking home', uiPath: '/book/:slug', navRef: 'public.home', intentIds: ['list_providers', 'business_info'] }),
  uiFeature({ id: 'public.flow.select_service', surface: 'public', module: 'public-booking', actionKind: 'read', minTier: 'client', label: 'Select service', uiPath: '/book/:slug/services', intentIds: ['list_services'] }),
  uiFeature({ id: 'public.flow.select_provider', surface: 'public', module: 'public-booking', actionKind: 'read', minTier: 'client', label: 'Select provider', uiPath: '/book/:slug/professionals', intentIds: ['list_providers'] }),
  uiFeature({ id: 'public.flow.check_availability', surface: 'public', module: 'public-booking', actionKind: 'read', minTier: 'client', label: 'Check availability', uiPath: '/book/:slug/availability', intentIds: ['check_availability'] }),
  uiFeature({ id: 'public.flow.checkout', surface: 'public', module: 'public-booking', actionKind: 'mutate', minTier: 'client', label: 'Checkout & pay', uiPath: '/book/:slug/checkout', intentIds: ['book_appointment'] }),
  uiFeature({ id: 'public.flow.manage_booking', surface: 'public', module: 'public-booking', actionKind: 'read', minTier: 'client', label: 'Manage booking (cancel/reschedule)', uiPath: '/book/:slug/manage', intentIds: ['booking_help'] }),
  uiFeature({ id: 'public.flow.package_booking', surface: 'public', module: 'public-booking', actionKind: 'mutate', minTier: 'client', label: 'Book a package', uiPath: '/book/:slug/packages', intentIds: ['book_appointment'] }),
  uiFeature({ id: 'public.flow.multi_service', surface: 'public', module: 'public-booking', actionKind: 'mutate', minTier: 'client', label: 'Multi-service booking cart', uiPath: '/book/:slug/multi', intentIds: ['book_appointment'] }),
  uiFeature({ id: 'public.auth.login', surface: 'public', module: 'public-booking', actionKind: 'read', minTier: 'client', label: 'Public customer login', uiPath: '/book/:slug/login', intentIds: [], aiExempt: true, aiExemptReason: 'auth_shell' }),
  uiFeature({ id: 'public.settings.cookie_consent', surface: 'public', module: 'public-booking', actionKind: 'mutate', minTier: 'client', label: 'Cookie consent banner', uiPath: '/book/:slug', intentIds: ['explain_data_rights'], extractionSource: 'permission' }),
  uiFeature({ id: 'public.flow.any_first_available', surface: 'public', module: 'public-booking', actionKind: 'mutate', minTier: 'client', label: 'First available booking', uiPath: '/book/:slug/any', intentIds: ['book_appointment'], confirmed: false, extractionSource: 'route' }),
  uiFeature({ id: 'public.flow.package_checkout', surface: 'public', module: 'public-booking', actionKind: 'mutate', minTier: 'client', label: 'Package checkout', uiPath: '/book/:slug/packages/:packageId/checkout', intentIds: ['book_appointment'], confirmed: true, extractionSource: 'route' }),
  uiFeature({ id: 'public.flow.multi_confirm', surface: 'public', module: 'public-booking', actionKind: 'mutate', minTier: 'client', label: 'Multi-service confirm', uiPath: '/book/:slug/multi/confirm', intentIds: ['book_appointment'], confirmed: true, extractionSource: 'route' }),
  uiFeature({ id: 'public.flow.gift_cards', surface: 'public', module: 'public-booking', actionKind: 'mutate', minTier: 'client', label: 'Gift card purchase', uiPath: '/book/:slug/gift-cards', intentIds: ['buy_gift_card', 'buy_gift_card_physical'], confirmed: true, extractionSource: 'route' }),
  uiFeature({ id: 'public.flow.gift_checkout', surface: 'public', module: 'public-booking', actionKind: 'mutate', minTier: 'client', label: 'Gift card checkout', uiPath: '/book/:slug/gift-cards/checkout', intentIds: ['buy_gift_card', 'buy_gift_card_physical'], confirmed: true, extractionSource: 'route' }),
  uiFeature({ id: 'public.flow.review', surface: 'public', module: 'public-booking', actionKind: 'mutate', minTier: 'client', label: 'Leave a review', uiPath: '/book/:slug/review', intentIds: ['submit_review'], confirmed: true, extractionSource: 'route' }),
  uiFeature({ id: 'public.flow.profile', surface: 'public', module: 'public-booking', actionKind: 'read', minTier: 'client', label: 'Provider public profile', uiPath: '/book/:slug/profile', intentIds: ['list_providers'], confirmed: true, extractionSource: 'route' }),
  uiFeature({ id: 'public.flow.account', surface: 'public', module: 'public-booking', actionKind: 'read', minTier: 'client', label: 'Public customer account hub', uiPath: '/book/:slug/account', intentIds: ['my_profile', 'my_appointments'], confirmed: true, extractionSource: 'route' }),
  uiFeature({ id: 'public.account.profile', surface: 'public', module: 'customer-crm', actionKind: 'read', minTier: 'client', label: 'Account profile details', uiPath: '/book/:slug/account', intentIds: ['my_profile'], extractionSource: 'permission' }),
  uiFeature({ id: 'public.account.subscriptions', surface: 'public', module: 'customer-crm', actionKind: 'read', minTier: 'client', label: 'Account subscriptions', uiPath: '/book/:slug/account', intentIds: ['my_subscriptions', 'subscription_usage'], extractionSource: 'permission' }),
  uiFeature({ id: 'public.account.gift_cards', surface: 'public', module: 'customer-crm', actionKind: 'read', minTier: 'client', label: 'Account gift cards', uiPath: '/book/:slug/account', intentIds: ['my_gift_cards', 'gift_card_balance'], extractionSource: 'permission' }),
  uiFeature({ id: 'public.account.loyalty', surface: 'public', module: 'marketing-growth', actionKind: 'read', minTier: 'client', label: 'Account loyalty balance', uiPath: '/book/:slug/account', intentIds: ['loyalty_points_balance'], extractionSource: 'permission' }),
  uiFeature({ id: 'public.action.discover_packages', surface: 'public', module: 'customer-crm', actionKind: 'read', minTier: 'client', label: 'Browse packages & gift products', uiPath: '/book/:slug/packages', intentIds: ['discover_packages', 'discover_subscription_plans', 'discover_gift_card_products'], extractionSource: 'permission' }),
];

/** parity-1.1 — single source of truth: every enumerated UI action across four surfaces. */
export const AI_UI_FEATURE_CATALOG: readonly AiFeatureCatalogEntry[] = [
  ...DASHBOARD_UI_FEATURES,
  ...DASHBOARD_PAGE_UI_FEATURES,
  ...DASHBOARD_ROUTE_UI_FEATURES,
  ...PROVIDER_UI_FEATURES,
  ...CUSTOMER_UI_FEATURES,
  ...PUBLIC_UI_FEATURES,
];

export const AI_UI_FEATURE_CATALOG_MIN_COUNTS = {
  dashboard: 24,
  provider: 11,
  customer: 16,
  public: 19,
} as const;

export const AI_UI_FEATURE_CATALOG_UNCONFIRMED_IDS = AI_UI_FEATURE_CATALOG.filter(
  (entry) => !entry.confirmed,
).map((entry) => entry.id);
