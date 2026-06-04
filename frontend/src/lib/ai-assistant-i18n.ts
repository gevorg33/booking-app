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

/** Default example prompts shown in the command bar before the first message. */
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
    'top10CustomersPaid',
    'customerMostNoShows',
    'showAtRiskCustomers',
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

import { AI_DASHBOARD_SURFACE_KEYS } from './dashboard-surfaces.i18n';

export const AI_ASSISTANT_UI_KEYS = [
  'ai.thinking',
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
] as const;

/** Registry of every AI assistant empty-state / suggestion i18n key. */
export function allAiAssistantI18nKeys(): string[] {
  return [
    ...new Set([
      ...AI_ASSISTANT_UI_KEYS,
      ...AI_DASHBOARD_SURFACE_KEYS,
      ...allAiAssistantPromptKeys(),
    ]),
  ];
}
