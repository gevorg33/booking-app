import type { AccessTier } from './access-control.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type {
  AiFeatureActionKind,
  AiFeatureExtractionSource,
} from './ai-feature-catalog.types.js';

/** Single row mirrored from nav config, route table, or permission guard in a UI codebase. */
export interface AiFeatureExtractionSeed {
  id: string;
  catalogId: string;
  surface: CommandSurface;
  source: AiFeatureExtractionSource;
  /** File + anchor the seed was derived from (reviewer audit trail). */
  sourceRef: string;
  uiPath: string;
  navRef?: string;
  label: string;
  module: string;
  actionKind: AiFeatureActionKind;
  minTier: AccessTier;
  /** Feature flag / role guard — still extracted so reviewers do not miss conditional screens. */
  optionalGuard?: string;
}

type SeedInput = Omit<AiFeatureExtractionSeed, 'id'> & { id?: string };

function seed(input: SeedInput): AiFeatureExtractionSeed {
  return {
    id: input.id ?? `${input.surface}.${input.source}.${input.catalogId.split('.').slice(1).join('.')}`,
    catalogId: input.catalogId,
    surface: input.surface,
    source: input.source,
    sourceRef: input.sourceRef,
    uiPath: input.uiPath,
    navRef: input.navRef,
    label: input.label,
    module: input.module,
    actionKind: input.actionKind,
    minTier: input.minTier,
    optionalGuard: input.optionalGuard,
  };
}

/** frontend/src/app/(dashboard)/layout.tsx — sidebar navItems. */
export const DASHBOARD_NAV_EXTRACTION_SEEDS: readonly AiFeatureExtractionSeed[] = [
  seed({ catalogId: 'dashboard.nav.overview', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.dashboard', uiPath: '/dashboard', navRef: 'nav.dashboard', label: 'Dashboard overview', module: 'ai-command', actionKind: 'read', minTier: 'staff' }),
  seed({ catalogId: 'dashboard.nav.bookings', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.bookings', uiPath: '/dashboard/bookings', navRef: 'nav.bookings', label: 'Bookings calendar', module: 'booking', actionKind: 'read', minTier: 'staff' }),
  seed({ catalogId: 'dashboard.nav.schedule', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.schedule', uiPath: '/dashboard/schedule', navRef: 'nav.schedule', label: 'Staff schedule editor', module: 'schedule', actionKind: 'mutate', minTier: 'manager' }),
  seed({ catalogId: 'dashboard.nav.appointments', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.appointments', uiPath: '/dashboard/appointments', navRef: 'nav.appointments', label: 'Appointments list', module: 'booking', actionKind: 'read', minTier: 'staff' }),
  seed({ catalogId: 'dashboard.nav.services', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.services', uiPath: '/dashboard/services', navRef: 'nav.services', label: 'Services catalog', module: 'catalog', actionKind: 'mutate', minTier: 'manager' }),
  seed({ catalogId: 'dashboard.nav.lab_queue', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.labQueue', uiPath: '/dashboard/lab-queue', navRef: 'nav.labQueue', label: 'Lab order queue', module: 'clinic-test-results', actionKind: 'read', minTier: 'staff', optionalGuard: 'clinicVertical' }),
  seed({ catalogId: 'dashboard.nav.lab_specimens', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.labSpecimens', uiPath: '/dashboard/lab-specimens/collection', navRef: 'nav.labSpecimens', label: 'Lab specimen collection', module: 'clinic-test-results', actionKind: 'mutate', minTier: 'staff', optionalGuard: 'clinicVertical' }),
  seed({ catalogId: 'dashboard.nav.employees', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.employees', uiPath: '/dashboard/employees', navRef: 'nav.employees', label: 'Employees directory', module: 'schedule-resources', actionKind: 'mutate', minTier: 'manager' }),
  seed({ catalogId: 'dashboard.nav.customers', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.customers', uiPath: '/dashboard/customers', navRef: 'nav.customers', label: 'Customers CRM', module: 'customer-crm', actionKind: 'read', minTier: 'staff' }),
  seed({ catalogId: 'dashboard.nav.reviews', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.reviews', uiPath: '/dashboard/reviews', navRef: 'nav.reviews', label: 'Reviews inbox', module: 'marketing-growth', actionKind: 'read', minTier: 'manager' }),
  seed({ catalogId: 'dashboard.nav.monetization', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.monetization', uiPath: '/dashboard/monetization', navRef: 'nav.monetization', label: 'Monetization hub', module: 'marketing-growth', actionKind: 'read', minTier: 'owner' }),
  seed({ catalogId: 'dashboard.nav.reports', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.reports', uiPath: '/dashboard/reports', navRef: 'nav.reports', label: 'Reports & analytics', module: 'retail-finance', actionKind: 'read', minTier: 'manager' }),
  seed({ catalogId: 'dashboard.nav.operations', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.operations', uiPath: '/dashboard/operations', navRef: 'nav.operations', label: 'Operations dashboard', module: 'retail-finance', actionKind: 'read', minTier: 'manager' }),
  seed({ catalogId: 'dashboard.nav.business', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.businessProfile', uiPath: '/dashboard/business', navRef: 'nav.businessProfile', label: 'Business profile', module: 'ai-command', actionKind: 'mutate', minTier: 'owner' }),
  seed({ catalogId: 'dashboard.nav.integrations', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.crmIntegrations', uiPath: '/dashboard/integrations', navRef: 'nav.crmIntegrations', label: 'CRM & integrations', module: 'integrations', actionKind: 'mutate', minTier: 'owner' }),
  seed({ catalogId: 'dashboard.nav.billing', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.billing', uiPath: '/dashboard/billing', navRef: 'nav.billing', label: 'Subscription billing portal', module: 'billing', actionKind: 'read', minTier: 'owner' }),
  seed({ catalogId: 'dashboard.nav.ai_ops', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.aiOps', uiPath: '/dashboard/ai-ops', navRef: 'nav.aiOps', label: 'AI operations dashboard', module: 'ai-command', actionKind: 'read', minTier: 'manager' }),
  seed({ catalogId: 'dashboard.nav.adoption', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.adoption', uiPath: '/dashboard/adoption', navRef: 'nav.adoption', label: 'Adoption analytics dashboard', module: 'marketing-growth', actionKind: 'read', minTier: 'owner' }),
  seed({ catalogId: 'dashboard.nav.settings', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.settings', uiPath: '/dashboard/settings', navRef: 'nav.settings', label: 'Tenant settings', module: 'ai-command', actionKind: 'mutate', minTier: 'owner' }),
  seed({ catalogId: 'dashboard.nav.guide', surface: 'dashboard', source: 'nav', sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.guide', uiPath: '/dashboard/guide', navRef: 'nav.guide', label: 'Product guide', module: 'ai-command', actionKind: 'read', minTier: 'staff' }),
];

/** Dashboard routes outside sidebar nav — frontend dashboard page routes. */
export const DASHBOARD_ROUTE_EXTRACTION_SEEDS: readonly AiFeatureExtractionSeed[] = [
  seed({ catalogId: 'dashboard.route.onboarding', surface: 'dashboard', source: 'route', sourceRef: 'frontend/src/app/(dashboard)/dashboard/onboarding/page.tsx', uiPath: '/dashboard/onboarding', label: 'Onboarding wizard', module: 'ai-command', actionKind: 'mutate', minTier: 'owner' }),
  seed({ catalogId: 'dashboard.route.calendar', surface: 'dashboard', source: 'route', sourceRef: 'frontend/src/app/(dashboard)/dashboard/calendar/page.tsx', uiPath: '/dashboard/calendar', label: 'Calendar view', module: 'booking', actionKind: 'read', minTier: 'staff' }),
  seed({ catalogId: 'dashboard.route.patient_chart', surface: 'dashboard', source: 'route', sourceRef: 'frontend/src/app/(dashboard)/dashboard/patient-chart/[customerId]/page.tsx', uiPath: '/dashboard/patient-chart/:customerId', label: 'Patient chart summary', module: 'patient-clinical-profiles', actionKind: 'read', minTier: 'staff', optionalGuard: 'clinicVertical' }),
  seed({ catalogId: 'dashboard.route.lab_specimens_tracking', surface: 'dashboard', source: 'route', sourceRef: 'frontend/src/app/(dashboard)/dashboard/lab-specimens/tracking/page.tsx', uiPath: '/dashboard/lab-specimens/tracking', label: 'Lab specimen tracking', module: 'clinic-test-results', actionKind: 'read', minTier: 'staff', optionalGuard: 'clinicVertical' }),
];

/** Dashboard permission guards — membershipRole / isOwner checks. */
export const DASHBOARD_PERMISSION_EXTRACTION_SEEDS: readonly AiFeatureExtractionSeed[] = [
  seed({ catalogId: 'dashboard.action.new_booking', surface: 'dashboard', source: 'permission', sourceRef: 'frontend/src/app/(dashboard)/dashboard/bookings/page.tsx#newBooking', uiPath: '/dashboard/bookings', label: 'New booking', module: 'booking', actionKind: 'mutate', minTier: 'staff' }),
  seed({ catalogId: 'dashboard.action.add_employee', surface: 'dashboard', source: 'permission', sourceRef: 'frontend/src/app/(dashboard)/dashboard/employees/page.tsx#addEmployee', uiPath: '/dashboard/employees', label: 'Add employee', module: 'schedule-resources', actionKind: 'mutate', minTier: 'manager' }),
  seed({ catalogId: 'dashboard.permission.team_role_edit', surface: 'dashboard', source: 'permission', sourceRef: 'frontend/src/components/employees/team-members-card.tsx#isOwner', uiPath: '/dashboard/employees', label: 'Edit team member roles', module: 'schedule-resources', actionKind: 'mutate', minTier: 'owner' }),
  seed({ catalogId: 'dashboard.settings.hipaa_baa', surface: 'dashboard', source: 'permission', sourceRef: 'frontend/src/components/settings/business-compliance-settings.tsx#isOwner', uiPath: '/dashboard/settings', label: 'Accept HIPAA BAA', module: 'ai-command', actionKind: 'mutate', minTier: 'owner' }),
];

/** provider-app/src/App.tsx — IonTabBar + IonRouterOutlet routes. */
export const PROVIDER_NAV_EXTRACTION_SEEDS: readonly AiFeatureExtractionSeed[] = [
  seed({ catalogId: 'provider.nav.today', surface: 'provider', source: 'nav', sourceRef: 'provider-app/src/App.tsx#provider.navToday', uiPath: '/tabs/today', navRef: 'provider.navToday', label: 'Today appointments', module: 'provider-mobile', actionKind: 'read', minTier: 'staff' }),
  seed({ catalogId: 'provider.nav.lab_collection', surface: 'provider', source: 'nav', sourceRef: 'provider-app/src/App.tsx#provider.navLabCollection', uiPath: '/tabs/lab-collection', navRef: 'provider.navLabCollection', label: 'Lab specimen collection', module: 'clinic-test-results', actionKind: 'mutate', minTier: 'staff', optionalGuard: 'showLabCollection' }),
  seed({ catalogId: 'provider.nav.lab_results', surface: 'provider', source: 'nav', sourceRef: 'provider-app/src/App.tsx#provider.navLabResults', uiPath: '/tabs/lab-results', navRef: 'provider.navLabResults', label: 'Lab results inbox', module: 'clinic-test-results', actionKind: 'read', minTier: 'staff', optionalGuard: 'showLabCollection' }),
  seed({ catalogId: 'provider.nav.clinic_tasks', surface: 'provider', source: 'nav', sourceRef: 'provider-app/src/App.tsx#provider.navClinicTasks', uiPath: '/tabs/clinic-tasks', navRef: 'provider.navClinicTasks', label: 'Clinic tasks queue', module: 'clinic-test-results', actionKind: 'mutate', minTier: 'staff', optionalGuard: 'showLabCollection' }),
  seed({ catalogId: 'provider.nav.patients', surface: 'provider', source: 'nav', sourceRef: 'provider-app/src/App.tsx#provider.navPatients', uiPath: '/tabs/patients', navRef: 'provider.navPatients', label: 'Patient lookup', module: 'patient-clinical-profiles', actionKind: 'read', minTier: 'staff', optionalGuard: 'showLabCollection' }),
  seed({ catalogId: 'provider.nav.gift_cards', surface: 'provider', source: 'nav', sourceRef: 'provider-app/src/App.tsx#provider.navGiftCards', uiPath: '/tabs/gift-cards', navRef: 'provider.navGiftCards', label: 'Gift card fulfillment queues', module: 'gift-fulfillment', actionKind: 'mutate', minTier: 'staff' }),
  seed({ catalogId: 'provider.nav.schedule', surface: 'provider', source: 'nav', sourceRef: 'provider-app/src/App.tsx#provider.navSchedule', uiPath: '/tabs/schedule', navRef: 'provider.navSchedule', label: 'My schedule', module: 'schedule', actionKind: 'read', minTier: 'staff' }),
  seed({ catalogId: 'provider.nav.profile', surface: 'provider', source: 'nav', sourceRef: 'provider-app/src/App.tsx#provider.navProfile', uiPath: '/tabs/profile', navRef: 'provider.navProfile', label: 'Provider profile & settings', module: 'provider-mobile', actionKind: 'read', minTier: 'staff' }),
];

export const PROVIDER_ROUTE_EXTRACTION_SEEDS: readonly AiFeatureExtractionSeed[] = [
  seed({ catalogId: 'provider.route.patient_chart', surface: 'provider', source: 'route', sourceRef: 'provider-app/src/App.tsx#/tabs/patients/:customerId', uiPath: '/tabs/patients/:customerId', label: 'Patient chart detail', module: 'patient-clinical-profiles', actionKind: 'read', minTier: 'staff', optionalGuard: 'showLabCollection' }),
  seed({ catalogId: 'provider.auth.login', surface: 'provider', source: 'route', sourceRef: 'provider-app/src/App.tsx#/login', uiPath: '/login', label: 'Staff login', module: 'provider-mobile', actionKind: 'read', minTier: 'staff' }),
  seed({ catalogId: 'provider.auth.accept_invite', surface: 'provider', source: 'route', sourceRef: 'provider-app/src/App.tsx#/accept-invite', uiPath: '/accept-invite', label: 'Accept staff invite', module: 'provider-mobile', actionKind: 'mutate', minTier: 'staff' }),
];

/** frontend/src/lib/provider-access.ts — canAccessProviderApp guard. */
export const PROVIDER_PERMISSION_EXTRACTION_SEEDS: readonly AiFeatureExtractionSeed[] = [
  seed({ catalogId: 'provider.action.mark_paid', surface: 'provider', source: 'permission', sourceRef: 'provider-app/src/pages/TodayPage.tsx#markPaid', uiPath: '/tabs/today', label: 'Mark booking paid', module: 'payments', actionKind: 'mutate', minTier: 'staff' }),
  seed({ catalogId: 'provider.action.cancel_booking', surface: 'provider', source: 'permission', sourceRef: 'provider-app/src/pages/TodayPage.tsx#cancelBooking', uiPath: '/tabs/today', label: 'Cancel assigned booking', module: 'booking', actionKind: 'mutate', minTier: 'staff' }),
];

/** consumer-app/src/components/SalonTabs.tsx — IonTabBar + routes. */
export const CUSTOMER_NAV_EXTRACTION_SEEDS: readonly AiFeatureExtractionSeed[] = [
  seed({ catalogId: 'customer.nav.home', surface: 'customer', source: 'nav', sourceRef: 'consumer-app/src/components/SalonTabs.tsx#home', uiPath: '/s/:slug', navRef: 'customer.home', label: 'Salon home', module: 'self-service-booking', actionKind: 'read', minTier: 'client' }),
  seed({ catalogId: 'customer.nav.book', surface: 'customer', source: 'nav', sourceRef: 'consumer-app/src/components/SalonTabs.tsx#book', uiPath: '/s/:slug/services', navRef: 'customer.book', label: 'Book a service', module: 'self-service-booking', actionKind: 'mutate', minTier: 'client' }),
  seed({ catalogId: 'customer.nav.lab_to_book', surface: 'customer', source: 'nav', sourceRef: 'consumer-app/src/components/SalonTabs.tsx#lab-to-book', uiPath: '/s/:slug/lab-to-book', navRef: 'customer.labToBook', label: 'Lab tests to book', module: 'clinic-test-results', actionKind: 'mutate', minTier: 'client', optionalGuard: 'showResultsTab' }),
  seed({ catalogId: 'customer.nav.results', surface: 'customer', source: 'nav', sourceRef: 'consumer-app/src/components/SalonTabs.tsx#results', uiPath: '/s/:slug/results', navRef: 'customer.results', label: 'My lab results', module: 'clinic-test-results', actionKind: 'read', minTier: 'client', optionalGuard: 'showResultsTab' }),
  seed({ catalogId: 'customer.nav.lab_requests', surface: 'customer', source: 'nav', sourceRef: 'consumer-app/src/components/SalonTabs.tsx#lab-requests', uiPath: '/s/:slug/lab-requests', navRef: 'customer.labRequests', label: 'Pending lab booking requests', module: 'clinic-test-results', actionKind: 'read', minTier: 'client', optionalGuard: 'showResultsTab' }),
  seed({ catalogId: 'customer.nav.account', surface: 'customer', source: 'nav', sourceRef: 'consumer-app/src/components/SalonTabs.tsx#account', uiPath: '/s/:slug/account', navRef: 'customer.account', label: 'Account & profile', module: 'customer-crm', actionKind: 'read', minTier: 'client' }),
];

/** consumer-app/src/App.tsx — routes outside SalonTabs shell. */
export const CUSTOMER_ROUTE_EXTRACTION_SEEDS: readonly AiFeatureExtractionSeed[] = [
  seed({ catalogId: 'customer.route.manage', surface: 'customer', source: 'route', sourceRef: 'consumer-app/src/App.tsx#/s/:slug/manage', uiPath: '/s/:slug/manage', label: 'Manage my booking', module: 'self-service-booking', actionKind: 'mutate', minTier: 'client' }),
  seed({ catalogId: 'customer.route.book_service', surface: 'customer', source: 'route', sourceRef: 'consumer-app/src/App.tsx#/s/:slug/book/:serviceId', uiPath: '/s/:slug/book/:serviceId', label: 'Book specific service', module: 'self-service-booking', actionKind: 'mutate', minTier: 'client' }),
  seed({ catalogId: 'customer.auth.login', surface: 'customer', source: 'route', sourceRef: 'consumer-app/src/App.tsx#/s/:slug/login', uiPath: '/s/:slug/login', label: 'Customer sign-in', module: 'public-booking', actionKind: 'read', minTier: 'client' }),
];

/** frontend/src/app/book/[slug] — public booking web flow pages. */
export const PUBLIC_ROUTE_EXTRACTION_SEEDS: readonly AiFeatureExtractionSeed[] = [
  seed({ catalogId: 'public.nav.home', surface: 'public', source: 'route', sourceRef: 'frontend/src/app/book/[slug]/page.tsx', uiPath: '/book/:slug', navRef: 'public.home', label: 'Public booking home', module: 'public-booking', actionKind: 'read', minTier: 'client' }),
  seed({ catalogId: 'public.flow.select_service', surface: 'public', source: 'route', sourceRef: 'frontend/src/app/book/[slug]/services/page.tsx', uiPath: '/book/:slug/services', label: 'Select service', module: 'public-booking', actionKind: 'read', minTier: 'client' }),
  seed({ catalogId: 'public.flow.select_provider', surface: 'public', source: 'route', sourceRef: 'frontend/src/app/book/[slug]/professionals/page.tsx', uiPath: '/book/:slug/professionals', label: 'Select provider', module: 'public-booking', actionKind: 'read', minTier: 'client' }),
  seed({ catalogId: 'public.flow.check_availability', surface: 'public', source: 'route', sourceRef: 'frontend/src/app/book/[slug]/any/availability/page.tsx', uiPath: '/book/:slug/availability', label: 'Check availability', module: 'public-booking', actionKind: 'read', minTier: 'client' }),
  seed({ catalogId: 'public.flow.any_first_available', surface: 'public', source: 'route', sourceRef: 'frontend/src/app/book/[slug]/any/page.tsx', uiPath: '/book/:slug/any', label: 'First available booking', module: 'public-booking', actionKind: 'mutate', minTier: 'client' }),
  seed({ catalogId: 'public.flow.checkout', surface: 'public', source: 'route', sourceRef: 'frontend/src/app/book/[slug]/checkout/page.tsx', uiPath: '/book/:slug/checkout', label: 'Checkout & pay', module: 'public-booking', actionKind: 'mutate', minTier: 'client' }),
  seed({ catalogId: 'public.flow.manage_booking', surface: 'public', source: 'route', sourceRef: 'frontend/src/app/book/[slug]/manage/page.tsx', uiPath: '/book/:slug/manage', label: 'Manage booking (cancel/reschedule)', module: 'public-booking', actionKind: 'mutate', minTier: 'client' }),
  seed({ catalogId: 'public.flow.package_booking', surface: 'public', source: 'route', sourceRef: 'frontend/src/app/book/[slug]/packages/[packageId]/page.tsx', uiPath: '/book/:slug/packages', label: 'Book a package', module: 'public-booking', actionKind: 'mutate', minTier: 'client' }),
  seed({ catalogId: 'public.flow.package_checkout', surface: 'public', source: 'route', sourceRef: 'frontend/src/app/book/[slug]/packages/[packageId]/checkout/page.tsx', uiPath: '/book/:slug/packages/:packageId/checkout', label: 'Package checkout', module: 'public-booking', actionKind: 'mutate', minTier: 'client' }),
  seed({ catalogId: 'public.flow.multi_service', surface: 'public', source: 'route', sourceRef: 'frontend/src/app/book/[slug]/multi/availability/page.tsx', uiPath: '/book/:slug/multi', label: 'Multi-service booking cart', module: 'public-booking', actionKind: 'mutate', minTier: 'client' }),
  seed({ catalogId: 'public.flow.multi_confirm', surface: 'public', source: 'route', sourceRef: 'frontend/src/app/book/[slug]/multi/confirm/page.tsx', uiPath: '/book/:slug/multi/confirm', label: 'Multi-service confirm', module: 'public-booking', actionKind: 'mutate', minTier: 'client' }),
  seed({ catalogId: 'public.flow.gift_cards', surface: 'public', source: 'route', sourceRef: 'frontend/src/app/book/[slug]/gift-cards/page.tsx', uiPath: '/book/:slug/gift-cards', label: 'Gift card purchase', module: 'public-booking', actionKind: 'mutate', minTier: 'client' }),
  seed({ catalogId: 'public.flow.gift_checkout', surface: 'public', source: 'route', sourceRef: 'frontend/src/app/book/[slug]/gift-cards/checkout/page.tsx', uiPath: '/book/:slug/gift-cards/checkout', label: 'Gift card checkout', module: 'public-booking', actionKind: 'mutate', minTier: 'client' }),
  seed({ catalogId: 'public.flow.review', surface: 'public', source: 'route', sourceRef: 'frontend/src/app/book/[slug]/review/page.tsx', uiPath: '/book/:slug/review', label: 'Leave a review', module: 'public-booking', actionKind: 'mutate', minTier: 'client' }),
  seed({ catalogId: 'public.flow.profile', surface: 'public', source: 'route', sourceRef: 'frontend/src/app/book/[slug]/profile/page.tsx', uiPath: '/book/:slug/profile', label: 'Provider public profile', module: 'public-booking', actionKind: 'read', minTier: 'client' }),
  seed({ catalogId: 'public.flow.account', surface: 'public', source: 'route', sourceRef: 'frontend/src/app/book/[slug]/account/page.tsx', uiPath: '/book/:slug/account', label: 'Public customer account', module: 'public-booking', actionKind: 'read', minTier: 'client' }),
  seed({ catalogId: 'public.settings.cookie_consent', surface: 'public', source: 'permission', sourceRef: 'frontend/src/app/book/[slug]/layout.tsx#CookieConsentBanner', uiPath: '/book/:slug', label: 'Cookie consent banner', module: 'public-booking', actionKind: 'mutate', minTier: 'client' }),
];

/** consumer-app — account/manage page actions (not separate routes). */
export const CUSTOMER_PERMISSION_EXTRACTION_SEEDS: readonly AiFeatureExtractionSeed[] = [
  seed({ catalogId: 'customer.action.cancel_booking', surface: 'customer', source: 'permission', sourceRef: 'consumer-app/src/pages/ManageBookingPage.tsx#cancel', uiPath: '/s/:slug/manage', label: 'Cancel my booking', module: 'self-service-booking', actionKind: 'mutate', minTier: 'client' }),
  seed({ catalogId: 'customer.action.reschedule_booking', surface: 'customer', source: 'permission', sourceRef: 'consumer-app/src/pages/ManageBookingPage.tsx#reschedule', uiPath: '/s/:slug/manage', label: 'Reschedule my booking', module: 'self-service-booking', actionKind: 'mutate', minTier: 'client' }),
  seed({ catalogId: 'customer.action.notification_prefs', surface: 'customer', source: 'permission', sourceRef: 'consumer-app/src/pages/AccountPage.tsx#notificationPrefs', uiPath: '/s/:slug/account', label: 'Notification preference toggles', module: 'push-notifications', actionKind: 'mutate', minTier: 'client' }),
  seed({ catalogId: 'customer.action.rewards', surface: 'customer', source: 'permission', sourceRef: 'consumer-app/src/pages/AccountPage.tsx#rewards', uiPath: '/s/:slug/account', label: 'Loyalty rewards balance', module: 'marketing-growth', actionKind: 'read', minTier: 'client' }),
];

/** provider-app — in-tab actions beyond nav shells. */
export const PROVIDER_PAGE_EXTRACTION_SEEDS: readonly AiFeatureExtractionSeed[] = [
  seed({ catalogId: 'provider.action.reschedule_booking', surface: 'provider', source: 'permission', sourceRef: 'provider-app/src/pages/TodayPage.tsx#reschedule', uiPath: '/tabs/today', label: 'Reschedule assigned booking', module: 'booking', actionKind: 'mutate', minTier: 'staff' }),
  seed({ catalogId: 'provider.action.block_schedule', surface: 'provider', source: 'permission', sourceRef: 'provider-app/src/pages/SchedulePage.tsx#blockSchedule', uiPath: '/tabs/schedule', label: 'Block my schedule', module: 'schedule', actionKind: 'mutate', minTier: 'staff' }),
  seed({ catalogId: 'provider.action.offline_queue', surface: 'provider', source: 'permission', sourceRef: 'provider-app/src/pages/ProfilePage.tsx#offlineQueue', uiPath: '/tabs/profile', label: 'Offline action queue status', module: 'provider-mobile', actionKind: 'read', minTier: 'staff' }),
];

/** dashboard page/bulk actions extracted from page components. */
export const DASHBOARD_PAGE_EXTRACTION_SEEDS: readonly AiFeatureExtractionSeed[] = [
  seed({ catalogId: 'dashboard.action.manage_schedule', surface: 'dashboard', source: 'permission', sourceRef: 'frontend/src/app/(dashboard)/dashboard/schedule/page.tsx#manageSchedule', uiPath: '/dashboard/schedule', label: 'Manage schedule', module: 'schedule', actionKind: 'mutate', minTier: 'manager' }),
  seed({ catalogId: 'dashboard.action.bulk_cancel', surface: 'dashboard', source: 'permission', sourceRef: 'frontend/src/app/(dashboard)/dashboard/bookings/page.tsx#bulkCancel', uiPath: '/dashboard/bookings', label: 'Bulk cancel appointments', module: 'booking', actionKind: 'mutate', minTier: 'manager' }),
  seed({ catalogId: 'dashboard.action.bulk_reschedule', surface: 'dashboard', source: 'permission', sourceRef: 'frontend/src/app/(dashboard)/dashboard/bookings/page.tsx#bulkReschedule', uiPath: '/dashboard/bookings', label: 'Bulk reschedule appointments', module: 'booking', actionKind: 'mutate', minTier: 'manager' }),
  seed({ catalogId: 'dashboard.action.export_customers', surface: 'dashboard', source: 'permission', sourceRef: 'frontend/src/app/(dashboard)/dashboard/customers/page.tsx#export', uiPath: '/dashboard/customers', label: 'Export customer data', module: 'customer-crm', actionKind: 'read', minTier: 'manager' }),
  seed({ catalogId: 'dashboard.settings.notification_prefs', surface: 'dashboard', source: 'permission', sourceRef: 'frontend/src/app/(dashboard)/dashboard/settings/page.tsx#notificationPrefs', uiPath: '/dashboard/settings', label: 'Notification preferences toggle', module: 'push-notifications', actionKind: 'mutate', minTier: 'owner' }),
  seed({ catalogId: 'dashboard.settings.business_languages', surface: 'dashboard', source: 'permission', sourceRef: 'frontend/src/app/(dashboard)/dashboard/settings/page.tsx#languages', uiPath: '/dashboard/settings', label: 'Business languages form', module: 'ai-command', actionKind: 'mutate', minTier: 'owner' }),
];

/** All UI extraction seeds — update when nav/routes/permission guards change in app codebases. */
export const AI_FEATURE_EXTRACTION_SEEDS: readonly AiFeatureExtractionSeed[] = [
  ...DASHBOARD_NAV_EXTRACTION_SEEDS,
  ...DASHBOARD_ROUTE_EXTRACTION_SEEDS,
  ...DASHBOARD_PERMISSION_EXTRACTION_SEEDS,
  ...DASHBOARD_PAGE_EXTRACTION_SEEDS,
  ...PROVIDER_NAV_EXTRACTION_SEEDS,
  ...PROVIDER_ROUTE_EXTRACTION_SEEDS,
  ...PROVIDER_PERMISSION_EXTRACTION_SEEDS,
  ...PROVIDER_PAGE_EXTRACTION_SEEDS,
  ...CUSTOMER_NAV_EXTRACTION_SEEDS,
  ...CUSTOMER_ROUTE_EXTRACTION_SEEDS,
  ...CUSTOMER_PERMISSION_EXTRACTION_SEEDS,
  ...PUBLIC_ROUTE_EXTRACTION_SEEDS,
];

export const AI_FEATURE_EXTRACTION_SEED_COUNTS = {
  dashboard:
    DASHBOARD_NAV_EXTRACTION_SEEDS.length +
    DASHBOARD_ROUTE_EXTRACTION_SEEDS.length +
    DASHBOARD_PERMISSION_EXTRACTION_SEEDS.length +
    DASHBOARD_PAGE_EXTRACTION_SEEDS.length,
  provider:
    PROVIDER_NAV_EXTRACTION_SEEDS.length +
    PROVIDER_ROUTE_EXTRACTION_SEEDS.length +
    PROVIDER_PERMISSION_EXTRACTION_SEEDS.length +
    PROVIDER_PAGE_EXTRACTION_SEEDS.length,
  customer:
    CUSTOMER_NAV_EXTRACTION_SEEDS.length +
    CUSTOMER_ROUTE_EXTRACTION_SEEDS.length +
    CUSTOMER_PERMISSION_EXTRACTION_SEEDS.length,
  public: PUBLIC_ROUTE_EXTRACTION_SEEDS.length,
} as const;
