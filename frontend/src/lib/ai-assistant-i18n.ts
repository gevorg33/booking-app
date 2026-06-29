import {
  allCommandBarGuidePromptKeys,
  buildCommandBarGuideExamples,
  buildContextualGuidePromptForRoute,
} from './ai-command-bar-guide.util';
import { onboardingPromptI18nKeys } from './ai-onboarding.util';
import { AI_DASHBOARD_SURFACE_KEYS } from './dashboard-surfaces.i18n';

export interface AiExampleTenantContext {
  employees: Array<{ id: string; name: string; serviceIds?: string[]; isActive?: boolean }>;
  services: Array<{ id: string; name: string; isActive?: boolean }>;
}

export type AiTranslateFn = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

function pickExampleEmployee(ctx: AiExampleTenantContext) {
  return ctx.employees.find((e) => e.isActive !== false && e.name?.trim()) ?? null;
}

function pickExampleService(ctx: AiExampleTenantContext, employee: { serviceIds?: string[] } | null) {
  const services = ctx.services.filter((s) => s.isActive !== false && s.name?.trim());
  if (employee?.serviceIds?.length) {
    const assigned = services.find((s) => employee.serviceIds!.includes(s.id));
    if (assigned) return assigned;
  }
  return services[0] ?? null;
}

function p(t: AiTranslateFn, key: string, vars?: Record<string, string | number>): string {
  return t(`ai.prompts.${key}`, vars);
}

/** Default action example prompts shown in the command bar before the first message. */
export function buildAiCommandBarExamples(
  ctx: AiExampleTenantContext | null | undefined,
  t: AiTranslateFn,
): string[] {
  const employee = ctx ? pickExampleEmployee(ctx) : null;
  const service = ctx ? pickExampleService(ctx, employee) : null;
  const provider = employee?.name?.trim() || t('ai.fallbackProvider');
  const serviceName = service?.name?.trim() || t('ai.fallbackService');

  return [
    p(t, 'weekdayTemplateAll'),
    p(t, 'blockLunchWeek'),
    p(t, 'fillGapsProviderWeek', { provider }),
    p(t, 'howManyToday'),
    p(t, 'weeklyTeamSchedule'),
    p(t, 'cancelBookingSlotProvider', { provider }),
    p(t, 'bookNearestSlot', { service: serviceName, provider }),
  ];
}

/** Playbook-backed guide chips for the command bar empty state (ai-guide-1.3.2). */
export function buildAiCommandBarGuideExamples(route: string, t: AiTranslateFn): string[] {
  return buildCommandBarGuideExamples(route, t);
}

export { buildContextualGuidePromptForRoute };

const ROUTE_PROMPT_KEYS: Record<string, string[]> = {
  '/dashboard': [
    'howManyToday',
    'summarizeUtilizationWeek',
    'top10CustomersPaid',
    'whatsComingUpToday',
    'resolveConflictsWeek',
  ],
  '/dashboard/schedule': [
    'applyWeekdayTemplateProvider',
    'listScheduleTemplates',
    'blockLunchAllProviders',
    'fillGapsToday',
    'setupWeekScheduleTeam',
    'openSlotsThisWeek',
  ],
  '/dashboard/calendar': [
    'showProviderScheduleTomorrow',
    'availableSlotsTomorrow',
    'fillGapsAllProvidersWeek',
    'resolveConflictsWeek',
    'conflictsThisWeek',
  ],
  '/dashboard/bookings': [
    'howManyToday',
    'mostExpensiveToday',
    'showAllAppointmentsToday',
    'showCancelledToday',
    'hideCancelledToday',
    'unhideCancelledProviderToday',
    'restoreHiddenWeek',
    'bookServiceTomorrow',
    'cancelAllTomorrow',
    'changeServiceAppointment',
  ],
  '/dashboard/appointments': [
    'howManyToday',
    'longestAppointmentToday',
    'showCancelledToday',
    'noShowsToday',
    'summarizeTodayAllProviders',
    'busiestProviderToday',
  ],
  '/dashboard/customers': [
    'findNoShowsCustomers',
    'reengageInactiveCustomers',
    'customerMostNoShows',
    'showAtRiskCustomers',
    'top10CustomersPaid',
    'showNewCustomers',
    'vipCustomers',
    'customersCancelMost',
    'waitlistCount',
    'showWaitlistCustomers',
  ],
  '/dashboard/employees': [
    'assignServicesProvider',
    'summarizeUtilizationWeek',
    'busiestProviderToday',
    'topProvidersRevenueWeek',
    'listTeamMembers',
    'servicesProviderPerforms',
    'whoCanDoServiceTomorrow',
  ],
  '/dashboard/services': [
    'whatServicesOffered',
    'popularServiceMonth',
    'howMuchService',
    'addServicesBulk',
    'whoCanDoService',
  ],
  '/dashboard/reports': [
    'explainUtilizationDrop',
    'summarizeUtilizationWeek',
    'howManyAppointmentsWeek',
    'revenueMonth',
    'topServicesRevenueMonth',
    'top10CustomersPaid',
  ],
  '/dashboard/operations': ['howManyToday', 'revenueWeek', 'summarizeUtilizationWeek'],
  '/dashboard/ai-ops': [
    'optimizeNextWeek',
    'fillEmptySlotsWeek',
    'mostScheduleGaps',
    'resolveConflictsWeek',
    'reassignCancelledWeek',
  ],
  '/dashboard/reviews': ['customerMostNoShows', 'showAtRiskCustomers', 'top10CustomersPaid'],
  '/dashboard/guide': ['howManyToday', 'summarizeUtilizationWeek', 'top10CustomersPaid'],
};

const ROUTE_GROUP_DEFS: Record<
  string,
  Array<{ id: string; labelKey: string; itemKeys: string[] }>
> = {
  '/dashboard/bookings': [
    {
      id: 'overview',
      labelKey: 'bookingsOverview',
      itemKeys: ['howManyToday', 'mostExpensiveToday', 'showAllAppointmentsToday'],
    },
    {
      id: 'cancelled',
      labelKey: 'bookingsCancelled',
      itemKeys: [
        'showCancelledToday',
        'hideCancelledToday',
        'unhideCancelledProviderToday',
        'restoreHiddenWeek',
      ],
    },
    {
      id: 'actions',
      labelKey: 'bookingsActions',
      itemKeys: ['bookServiceTomorrow', 'cancelAllTomorrow', 'changeServiceAppointment'],
    },
  ],
  '/dashboard/calendar': [
    {
      id: 'availability',
      labelKey: 'calendarAvailability',
      itemKeys: [
        'showProviderScheduleTomorrow',
        'availableSlotsTomorrow',
        'openSlotsThisWeek',
      ],
    },
    {
      id: 'optimize',
      labelKey: 'calendarOptimize',
      itemKeys: ['fillGapsAllProvidersWeek', 'resolveConflictsWeek', 'conflictsThisWeek'],
    },
  ],
  '/dashboard/schedule': [
    {
      id: 'templates',
      labelKey: 'scheduleTemplates',
      itemKeys: ['applyWeekdayTemplateProvider', 'listScheduleTemplates', 'setupWeekScheduleTeam'],
    },
    {
      id: 'blocks',
      labelKey: 'scheduleBlocks',
      itemKeys: ['blockLunchAllProviders', 'fillGapsToday', 'openSlotsThisWeek'],
    },
  ],
  '/dashboard/customers': [
    {
      id: 'retention',
      labelKey: 'customersRetention',
      itemKeys: [
        'findNoShowsCustomers',
        'reengageInactiveCustomers',
        'customerMostNoShows',
        'showAtRiskCustomers',
      ],
    },
    {
      id: 'segments',
      labelKey: 'customersSegments',
      itemKeys: [
        'top10CustomersPaid',
        'showNewCustomers',
        'vipCustomers',
        'customersCancelMost',
        'waitlistCount',
        'showWaitlistCustomers',
      ],
    },
  ],
  '/dashboard/reports': [
    {
      id: 'insights',
      labelKey: 'reportsInsights',
      itemKeys: [
        'explainUtilizationDrop',
        'summarizeUtilizationWeek',
        'howManyAppointmentsWeek',
        'revenueMonth',
      ],
    },
    {
      id: 'rankings',
      labelKey: 'reportsRankings',
      itemKeys: ['topServicesRevenueMonth', 'top10CustomersPaid', 'busiestProviderToday'],
    },
  ],
};

const FALLBACK_PROMPT_KEYS = [
  'howManyToday',
  'mostExpensiveToday',
  'showCancelledToday',
  'whatsComingUpToday',
];

export function getLocalizedPageSuggestions(route: string, t: AiTranslateFn): string[] {
  const keys = ROUTE_PROMPT_KEYS[route] ?? FALLBACK_PROMPT_KEYS;
  return keys.map((key) => p(t, key));
}

export type LocalizedAiPageSuggestionGroup = {
  id: string;
  label: string;
  items: string[];
};

export function getLocalizedAiPageSuggestionGroups(
  route: string,
  t: AiTranslateFn,
): LocalizedAiPageSuggestionGroup[] {
  const grouped = ROUTE_GROUP_DEFS[route];
  if (grouped?.length) {
    return grouped.map((g) => ({
      id: g.id,
      label: t(`ai.groupLabels.${g.labelKey}`),
      items: g.itemKeys.map((key) => p(t, key)),
    }));
  }
  const flat = getLocalizedPageSuggestions(route, t);
  return [{ id: 'commands', label: t('ai.quickCommands'), items: flat }];
}

export { getOnboardingPageSuggestionGroups, getOnboardingCommandBarExamples } from './ai-onboarding.util';
export type { OnboardingAiStep } from './ai-onboarding.util';

export function allAiAssistantPromptKeys(): string[] {
  const keys = new Set<string>();
  Object.values(ROUTE_PROMPT_KEYS).flat().forEach((k) => keys.add(`ai.prompts.${k}`));
  Object.values(ROUTE_GROUP_DEFS).forEach((groups) =>
    groups.forEach((g) => {
      keys.add(`ai.groupLabels.${g.labelKey}`);
      g.itemKeys.forEach((k) => keys.add(`ai.prompts.${k}`));
    }),
  );
  [
    'weekdayTemplateAll',
    'blockLunchWeek',
    'fillGapsProviderWeek',
    'howManyToday',
    'weeklyTeamSchedule',
    'cancelBookingSlotProvider',
    'bookNearestSlot',
  ].forEach((k) => keys.add(`ai.prompts.${k}`));
  return [...keys];
}

export const AI_ASSISTANT_UI_KEYS = [
  'ai.commandPlaceholder',
  'ai.thinking',
  'ai.clarifySubmit',
  'ai.assistantClarifyTry',
  'ai.suggestionRun',
  'ai.suggestionEdit',
  'ai.undoPromptBanner',
  'ai.undoNow',
  'ai.assistantTitle',
  'ai.emptyHint',
  'ai.inputPlaceholderExample',
  'ai.fallbackProvider',
  'ai.fallbackService',
  'ai.showDetails',
  'ai.hideDetails',
  'ai.confirmExecute',
  'ai.approveExecutePlan',
  'ai.executing',
  'ai.needsInfo',
  'ai.escToClose',
  'ai.closeAssistant',
  'ai.panelTitle',
  'ai.quickCommands',
  'ai.runWithAi',
  'ai.opportunitiesTitle',
  'ai.opportunitiesOnPage',
  'ai.examples',
  'ai.guideExamples',
  'ai.helpChip',
  'ai.helpChipHint',
  'ai.undoLatest',
  'ai.undoLatestHint',
  'ai.undoLatestNone',
  'ai.undoLatestConfirm',
  'ai.undoing',
  'ai.undoSuccess',
  'ai.undoFailed',
  'ai.riskLevelLabel',
  'ai.wizardTitle',
  'ai.wizardStepOf',
  'ai.wizardNext',
  'ai.wizardApproveAll',
  'ai.macrosTitle',
  'ai.macrosEmpty',
  'ai.macroAddHint',
  'ai.macroNamePlaceholder',
  'ai.macroPromptPlaceholder',
  'ai.macroSave',
  'ai.macroDelete',
  'ai.weeklyReportTitle',
  'ai.weeklyReportLoading',
  'ai.weeklyReportRefresh',
  'ai.weeklyReportFallback',
  'ai.weeklyReportActionGaps',
  'ai.notificationsTitle',
  'ai.notificationsEmpty',
  'ai.notificationTapResolve',
] as const;

/** Registry of every AI assistant empty-state / suggestion i18n key. */
export function allAiAssistantI18nKeys(): string[] {
  return [
    ...new Set([
      ...AI_ASSISTANT_UI_KEYS,
      ...AI_DASHBOARD_SURFACE_KEYS,
      ...allAiAssistantPromptKeys(),
      ...allCommandBarGuidePromptKeys(),
      ...onboardingPromptI18nKeys(),
      'reports.aiInsightsTitle',
    ]),
  ];
}
