import {
  allCommandBarGuidePromptKeys,
  buildCommandBarGuideExamples,
  buildContextualGuidePromptForRoute,
} from './ai-command-bar-guide.util';
import { onboardingPromptI18nKeys } from './ai-onboarding.util';
import { AI_DASHBOARD_SURFACE_KEYS } from './dashboard-surfaces.i18n';
import {
  pickAssistantExampleVars,
  type AssistantExampleTenantInput,
  type AssistantExampleVars,
} from './assistant-example-tenant.util';

export interface AiExampleTenantContext {
  employees: Array<{ id: string; name: string; serviceIds?: string[]; isActive?: boolean }>;
  services: Array<{
    id: string;
    name: string;
    isActive?: boolean;
    categoryName?: string | null;
  }>;
}

export type { AssistantExampleTenantInput, AssistantExampleVars };

export type AiTranslateFn = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

const PROMPT_TENANT_VAR_KEYS: Partial<Record<string, (keyof AssistantExampleVars)[]>> = {
  fillGapsProviderWeek: ['provider'],
  cancelBookingSlotProvider: ['provider'],
  bookNearestSlot: ['service', 'provider'],
  applyWeekdayTemplateProvider: ['provider'],
  showProviderScheduleTomorrow: ['provider'],
  availableSlotsTomorrow: ['provider'],
  unhideCancelledProviderToday: ['provider'],
  assignServicesProvider: ['serviceCategory', 'provider'],
  servicesProviderPerforms: ['provider'],
  whoCanDoServiceTomorrow: ['service'],
  whoCanDoService: ['service'],
  howMuchService: ['service'],
  addServicesBulk: ['service', 'service2'],
  bookServiceTomorrow: ['service'],
};

function resolveAssistantExampleFallbacks(t: AiTranslateFn): AssistantExampleVars {
  return {
    provider: t('ai.fallbackProvider'),
    service: t('ai.fallbackService'),
    service2: t('ai.fallbackService'),
    serviceCategory: t('ai.fallbackServiceCategory'),
  };
}

export function resolveAssistantExampleVarsFromTenant(
  ctx: AssistantExampleTenantInput | null | undefined,
  t: AiTranslateFn,
): AssistantExampleVars {
  return pickAssistantExampleVars(ctx, resolveAssistantExampleFallbacks(t));
}

function p(t: AiTranslateFn, key: string, vars?: Record<string, string | number>): string {
  return t(`ai.prompts.${key}`, vars);
}

function translatePromptKey(
  key: string,
  t: AiTranslateFn,
  vars: AssistantExampleVars,
): string {
  const fields = PROMPT_TENANT_VAR_KEYS[key];
  if (!fields?.length) return p(t, key);
  const subset: Record<string, string> = {};
  for (const field of fields) subset[field] = vars[field];
  return p(t, key, subset);
}

/** Default action example prompts shown in the command bar before the first message. */
export function buildAiCommandBarExamples(
  ctx: AiExampleTenantContext | null | undefined,
  t: AiTranslateFn,
): string[] {
  const vars = resolveAssistantExampleVarsFromTenant(ctx, t);

  return [
    p(t, 'weekdayTemplateAll'),
    p(t, 'blockLunchWeek'),
    translatePromptKey('fillGapsProviderWeek', t, vars),
    p(t, 'howManyToday'),
    p(t, 'weeklyTeamSchedule'),
    translatePromptKey('cancelBookingSlotProvider', t, vars),
    translatePromptKey('bookNearestSlot', t, vars),
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

export function getLocalizedPageSuggestions(
  route: string,
  t: AiTranslateFn,
  ctx?: AssistantExampleTenantInput | null,
): string[] {
  const keys = ROUTE_PROMPT_KEYS[route] ?? FALLBACK_PROMPT_KEYS;
  const vars = resolveAssistantExampleVarsFromTenant(ctx, t);
  return keys.map((key) => translatePromptKey(key, t, vars));
}

export type LocalizedAiPageSuggestionGroup = {
  id: string;
  label: string;
  items: string[];
};

export function getLocalizedAiPageSuggestionGroups(
  route: string,
  t: AiTranslateFn,
  ctx?: AssistantExampleTenantInput | null,
): LocalizedAiPageSuggestionGroup[] {
  const vars = resolveAssistantExampleVarsFromTenant(ctx, t);
  const grouped = ROUTE_GROUP_DEFS[route];
  if (grouped?.length) {
    return grouped.map((g) => ({
      id: g.id,
      label: t(`ai.groupLabels.${g.labelKey}`),
      items: g.itemKeys.map((key) => translatePromptKey(key, t, vars)),
    }));
  }
  const flat = getLocalizedPageSuggestions(route, t, ctx);
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
  'ai.fallbackServiceCategory',
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
