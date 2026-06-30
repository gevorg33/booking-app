import type { AiTranslateFn } from '@/lib/ai-assistant-i18n';

/** Mirrors backend `DASHBOARD_ROUTE_PRIMARY_TOPIC` (ai-guide-1.2.1). */
export const DASHBOARD_ROUTE_PRIMARY_TOPIC: Readonly<Record<string, string>> = {
  '/dashboard': 'dashboard.ai.dashboard',
  '/dashboard/schedule': 'dashboard.core.schedule',
  '/dashboard/calendar': 'dashboard.core.calendar',
  '/dashboard/bookings': 'dashboard.core.calendar',
  '/dashboard/appointments': 'dashboard.core.calendar',
  '/dashboard/customers': 'dashboard.operations.workflow',
  '/dashboard/employees': 'dashboard.core.employees',
  '/dashboard/services': 'dashboard.core.employees',
  '/dashboard/reports': 'dashboard.operations.pl',
  '/dashboard/onboarding': 'dashboard.ai.getting-started',
  '/dashboard/operations': 'dashboard.operations.overview',
  '/dashboard/ai-ops': 'dashboard.ai.ops',
  '/dashboard/reviews': 'dashboard.operations.problems',
  '/dashboard/settings': 'dashboard.ai.getting-started',
  '/dashboard/guide': 'dashboard.ai.overview',
};

const FALLBACK_GUIDE_PROMPT_KEYS = [
  'whatCanIDoHere',
  'howDoIUseCommandBar',
  'whereIsProductGuide',
] as const;

/** Guide-shaped prompts per dashboard route (ai-guide-1.3.1). */
export const ROUTE_GUIDE_PROMPT_KEYS: Readonly<Record<string, readonly string[]>> = {
  '/dashboard': [...FALLBACK_GUIDE_PROMPT_KEYS],
  '/dashboard/schedule': [
    'whatCanIDoHere',
    'howDoISetupWeeklySchedule',
    'walkThroughScheduleTemplates',
  ],
  '/dashboard/calendar': [
    'whatCanIDoHere',
    'howDoICheckAvailability',
    'explainCalendarConflicts',
  ],
  '/dashboard/bookings': [
    'whatCanIDoHere',
    'howDoIBookAppointment',
    'explainBookingsList',
  ],
  '/dashboard/appointments': [
    'whatCanIDoHere',
    'howDoIFilterAppointments',
    'explainAppointmentsPage',
  ],
  '/dashboard/customers': [
    'whatCanIDoHere',
    'howDoIFindCustomers',
    'explainCustomerSegments',
  ],
  '/dashboard/employees': [
    'whatCanIDoHere',
    'howDoIAddStaff',
    'explainProviderServices',
  ],
  '/dashboard/services': [
    'whatCanIDoHere',
    'howDoIAddService',
    'explainServiceCatalog',
  ],
  '/dashboard/reports': [
    'whatCanIDoHere',
    'howDoIReadReports',
    'explainUtilizationReport',
  ],
  '/dashboard/operations': [
    'whatCanIDoHere',
    'howDoIManageInventory',
    'explainOperationsOverview',
  ],
  '/dashboard/ai-ops': [
    'whatCanIDoHere',
    'explainCommandBar',
    'explainApprovalFlow',
  ],
  '/dashboard/reviews': [
    'whatCanIDoHere',
    'howDoIRespondReviews',
    'explainReviewsPage',
  ],
  '/dashboard/settings': [
    'whatCanIDoHere',
    'howDoIConfigureBusiness',
    'explainGettingStarted',
  ],
  '/dashboard/guide': [
    'whatCanIDoHere',
    'explainGuideCenter',
    'howDoIFindTopic',
  ],
  '/dashboard/onboarding': [
    'whatCanIDoHere',
    'howDoICompleteSetup',
    'walkThroughOnboarding',
  ],
};

/** Playbook metadata per route — mirrors backend corpus topicId + title i18n (ai-guide-1.3.2). */
export type RouteGuidePlaybook = {
  topicId: string;
  pageTitleKey: string;
  contextualTaskKey: string;
};

export const ROUTE_GUIDE_PLAYBOOK: Readonly<Record<string, RouteGuidePlaybook>> = {
  '/dashboard': {
    topicId: 'dashboard.ai.dashboard',
    pageTitleKey: 'guide.ai.dashboardTitle',
    contextualTaskKey: 'useDashboardAiFeatures',
  },
  '/dashboard/schedule': {
    topicId: 'dashboard.core.schedule',
    pageTitleKey: 'guide.core.scheduleTitle',
    contextualTaskKey: 'setupWeeklySchedule',
  },
  '/dashboard/calendar': {
    topicId: 'dashboard.core.calendar',
    pageTitleKey: 'guide.core.calendarTitle',
    contextualTaskKey: 'checkProviderAvailability',
  },
  '/dashboard/bookings': {
    topicId: 'dashboard.core.calendar',
    pageTitleKey: 'nav.bookings',
    contextualTaskKey: 'bookAppointment',
  },
  '/dashboard/appointments': {
    topicId: 'dashboard.core.calendar',
    pageTitleKey: 'nav.appointments',
    contextualTaskKey: 'filterTodaysAppointments',
  },
  '/dashboard/customers': {
    topicId: 'dashboard.operations.workflow',
    pageTitleKey: 'nav.customers',
    contextualTaskKey: 'segmentCustomers',
  },
  '/dashboard/employees': {
    topicId: 'dashboard.core.employees',
    pageTitleKey: 'guide.core.employeesTitle',
    contextualTaskKey: 'addStaffAndServices',
  },
  '/dashboard/services': {
    topicId: 'dashboard.core.employees',
    pageTitleKey: 'nav.services',
    contextualTaskKey: 'manageServiceCatalog',
  },
  '/dashboard/reports': {
    topicId: 'dashboard.operations.pl',
    pageTitleKey: 'nav.reports',
    contextualTaskKey: 'readUtilizationReports',
  },
  '/dashboard/onboarding': {
    topicId: 'dashboard.ai.getting-started',
    pageTitleKey: 'guide.ai.gettingStartedTitle',
    contextualTaskKey: 'completeBusinessSetup',
  },
  '/dashboard/operations': {
    topicId: 'dashboard.operations.overview',
    pageTitleKey: 'guide.operations.overviewTitle',
    contextualTaskKey: 'manageInventory',
  },
  '/dashboard/ai-ops': {
    topicId: 'dashboard.ai.ops',
    pageTitleKey: 'guide.ai.aiOpsTitle',
    contextualTaskKey: 'reviewAiAgentTasks',
  },
  '/dashboard/reviews': {
    topicId: 'dashboard.operations.problems',
    pageTitleKey: 'nav.reviews',
    contextualTaskKey: 'respondToReviews',
  },
  '/dashboard/settings': {
    topicId: 'dashboard.ai.getting-started',
    pageTitleKey: 'nav.settings',
    contextualTaskKey: 'configureBusinessSettings',
  },
  '/dashboard/guide': {
    topicId: 'dashboard.ai.overview',
    pageTitleKey: 'guide.ai.overviewTitle',
    contextualTaskKey: 'findHelpTopic',
  },
};

const FALLBACK_GUIDE_PLAYBOOK: RouteGuidePlaybook = ROUTE_GUIDE_PLAYBOOK['/dashboard'];

/** Dashboard routes that expose AI page context hints — keep in sync with `AI_ROUTE_CONTEXT_HINTS`. */
export const DASHBOARD_COMMAND_BAR_NAV_ROUTES = [
  '/dashboard',
  '/dashboard/schedule',
  '/dashboard/calendar',
  '/dashboard/bookings',
  '/dashboard/appointments',
  '/dashboard/customers',
  '/dashboard/employees',
  '/dashboard/services',
  '/dashboard/reports',
  '/dashboard/onboarding',
  '/dashboard/ai-ops',
  '/dashboard/reviews',
] as const;

/** Routes intentionally without dedicated guide prompt chips (fallback keys apply). */
export const DASHBOARD_COMMAND_BAR_NO_GUIDE_ROUTES: readonly string[] = [];

export function assertCommandBarGuideRouteCoverage(): void {
  for (const route of DASHBOARD_COMMAND_BAR_NAV_ROUTES) {
    if (DASHBOARD_COMMAND_BAR_NO_GUIDE_ROUTES.includes(route)) continue;
    const keys = ROUTE_GUIDE_PROMPT_KEYS[route];
    if (!keys?.length) {
      throw new Error(`Missing command-bar guide prompts for route: ${route}`);
    }
    if (!ROUTE_GUIDE_PLAYBOOK[route]) {
      throw new Error(`Missing command-bar guide playbook for route: ${route}`);
    }
    if (DASHBOARD_ROUTE_PRIMARY_TOPIC[route] !== ROUTE_GUIDE_PLAYBOOK[route].topicId) {
      throw new Error(
        `Playbook topicId drift for ${route}: expected ${DASHBOARD_ROUTE_PRIMARY_TOPIC[route]}`,
      );
    }
  }
}

const ROUTE_LOOKUP = [
  ...Object.keys(ROUTE_GUIDE_PROMPT_KEYS),
  ...Object.keys(DASHBOARD_ROUTE_PRIMARY_TOPIC),
].sort((a, b) => b.length - a.length);

export function resolveCommandBarRoute(pathname: string | null | undefined): string {
  if (!pathname?.startsWith('/dashboard')) return '/dashboard';
  if (ROUTE_GUIDE_PROMPT_KEYS[pathname]) return pathname;
  for (const route of ROUTE_LOOKUP) {
    if (pathname === route || pathname.startsWith(`${route}/`)) return route;
  }
  return '/dashboard';
}

function guidePrompt(
  t: AiTranslateFn,
  key: string,
  vars?: Record<string, string | number>,
): string {
  return t(`ai.guidePrompts.${key}`, vars);
}

export function resolveRouteGuidePlaybook(route: string): RouteGuidePlaybook {
  return ROUTE_GUIDE_PLAYBOOK[route] ?? FALLBACK_GUIDE_PLAYBOOK;
}

/** Contextual playbook prompt — "How do I {task} on this page?" (ai-guide-1.3.2). */
export function buildContextualGuidePromptForRoute(route: string, t: AiTranslateFn): string {
  const playbook = resolveRouteGuidePlaybook(route);
  const task = t(`ai.guidePlaybookTasks.${playbook.contextualTaskKey}`);
  return guidePrompt(t, 'howDoIOnThisPage', { task });
}

export function buildCommandBarGuideExamples(route: string, t: AiTranslateFn): string[] {
  const keys = ROUTE_GUIDE_PROMPT_KEYS[route] ?? FALLBACK_GUIDE_PROMPT_KEYS;
  const contextual = buildContextualGuidePromptForRoute(route, t);
  const primary = guidePrompt(t, keys[0] ?? 'whatCanIDoHere');
  const tertiaryKey = keys[2] ?? keys[1] ?? 'whereIsProductGuide';
  const tertiary = guidePrompt(t, tertiaryKey);
  return [primary, contextual, tertiary];
}

export function mixCommandBarFirstOpenExamples(input: {
  route: string;
  guideExamples: string[];
  actionExamples: string[];
  guideMode: boolean;
  maxTotal?: number;
}): string[] {
  const maxTotal = input.maxTotal ?? 7;
  if (input.guideMode) {
    return input.guideExamples.slice(0, maxTotal);
  }
  const guideCount = Math.min(3, input.guideExamples.length);
  const actionCount = Math.min(maxTotal - guideCount, input.actionExamples.length);
  return [
    ...input.guideExamples.slice(0, guideCount),
    ...input.actionExamples.slice(0, actionCount),
  ];
}

export function allCommandBarGuidePromptKeys(): string[] {
  const keys = new Set<string>();
  Object.values(ROUTE_GUIDE_PROMPT_KEYS)
    .flat()
    .forEach((key) => keys.add(`ai.guidePrompts.${key}`));
  FALLBACK_GUIDE_PROMPT_KEYS.forEach((key) => keys.add(`ai.guidePrompts.${key}`));
  keys.add('ai.guidePrompts.howDoIOnThisPage');
  Object.values(ROUTE_GUIDE_PLAYBOOK).forEach((playbook) => {
    keys.add(`ai.guidePlaybookTasks.${playbook.contextualTaskKey}`);
    keys.add(playbook.pageTitleKey);
  });
  return [...keys];
}

export function allCommandBarGuidePlaybookTaskKeys(): string[] {
  return [
    ...new Set(
      Object.values(ROUTE_GUIDE_PLAYBOOK).map(
        (playbook) => `ai.guidePlaybookTasks.${playbook.contextualTaskKey}`,
      ),
    ),
  ];
}
