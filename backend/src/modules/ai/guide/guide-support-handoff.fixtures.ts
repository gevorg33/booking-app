import type {
  GuideSupportHandoffContext,
  GuideSupportSnapshot,
} from './guide-support-handoff.types.js';

export interface GuideSupportHandoffScenario {
  id: string;
  context: GuideSupportHandoffContext;
  topicId?: string;
}

export const GUIDE_SUPPORT_HANDOFF_SCENARIOS: readonly GuideSupportHandoffScenario[] =
  [
    {
      id: 'dashboard-schedule-en',
      context: {
        surface: 'dashboard',
        route: '/dashboard/schedule',
        topicId: 'dashboard.core.schedule',
        locale: 'en',
      },
    },
    {
      id: 'provider-today-hy',
      context: {
        surface: 'provider',
        route: '/provider/today',
        topicId: 'provider-today-calendar',
        locale: 'hy',
      },
    },
    {
      id: 'customer-packages-ru',
      context: {
        surface: 'customer',
        route: '/s/packages',
        topicId: 'consumer-packages-gift-cards',
        locale: 'ru',
      },
    },
    {
      id: 'public-checkout-en',
      context: {
        surface: 'public',
        route: '/book/checkout',
        topicId: 'public-checkout',
        locale: 'en',
      },
    },
    {
      id: 'dashboard-no-route',
      context: {
        surface: 'dashboard',
        locale: 'en',
      },
    },
  ] as const;

export const GUIDE_SUPPORT_SNAPSHOT_PII_KEYS = [
  'prompt',
  'email',
  'phone',
  'customerName',
  'requesterName',
  'requesterEmail',
] as const;

export const INVALID_GUIDE_SUPPORT_SNAPSHOTS: readonly Record<
  string,
  unknown
>[] = [
  { surface: 'dashboard' },
  { surface: 'unknown', locale: 'en' },
  { locale: 'en' },
  {
    surface: 'dashboard',
    locale: 'en',
    prompt: 'Help Anna book tomorrow',
  },
];

export function expectedSnapshotForScenario(
  scenario: GuideSupportHandoffScenario,
): GuideSupportSnapshot {
  return {
    surface: scenario.context.surface,
    ...(scenario.context.route ? { route: scenario.context.route } : {}),
    ...((scenario.context.topicId ?? scenario.topicId)
      ? { topicId: scenario.context.topicId ?? scenario.topicId }
      : {}),
    locale: scenario.context.locale,
  };
}
