export const AI_FEATURE_EXTRACTION_SCENARIOS = [
  {
    id: 'dashboard-nav-billing-seed',
    catalogId: 'dashboard.nav.billing',
    source: 'nav' as const,
    sourceRef: 'frontend/src/app/(dashboard)/layout.tsx#nav.billing',
  },
  {
    id: 'dashboard-route-onboarding-seed',
    catalogId: 'dashboard.route.onboarding',
    source: 'route' as const,
    sourceRef: 'frontend/src/app/(dashboard)/dashboard/onboarding/page.tsx',
  },
  {
    id: 'dashboard-permission-team-role-seed',
    catalogId: 'dashboard.permission.team_role_edit',
    source: 'permission' as const,
    sourceRef: 'frontend/src/components/employees/team-members-card.tsx#isOwner',
  },
  {
    id: 'provider-route-patient-chart-seed',
    catalogId: 'provider.route.patient_chart',
    source: 'route' as const,
    sourceRef: 'provider-app/src/App.tsx#/tabs/patients/:customerId',
  },
  {
    id: 'customer-route-manage-seed',
    catalogId: 'customer.route.manage',
    source: 'route' as const,
    sourceRef: 'consumer-app/src/App.tsx#/s/:slug/manage',
  },
  {
    id: 'public-flow-gift-cards-seed',
    catalogId: 'public.flow.gift_cards',
    source: 'route' as const,
    sourceRef: 'frontend/src/app/book/[slug]/gift-cards/page.tsx',
  },
] as const;

export const AI_FEATURE_EXTRACTION_REVIEWER_BACKLOG_SAMPLE = [
  'dashboard.route.calendar',
  'dashboard.route.patient_chart',
  'public.flow.any_first_available',
] as const;
