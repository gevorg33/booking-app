import type { AppEventAnalyticsRow } from './app-adoption-analytics.util.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export const ACTIVATION_CONCIERGE_MILESTONE_SCENARIOS = [
  {
    id: 'before-24h',
    installAt: '2026-06-08T00:00:00.000Z',
    now: '2026-06-08T20:00:00.000Z',
    sent: [] as const,
    expect: null,
  },
  {
    id: 'at-24h',
    installAt: '2026-06-08T00:00:00.000Z',
    now: '2026-06-09T01:00:00.000Z',
    sent: [] as const,
    expect: '24h' as const,
  },
  {
    id: 'at-72h',
    installAt: '2026-06-08T00:00:00.000Z',
    now: '2026-06-11T01:00:00.000Z',
    sent: ['24h'] as const,
    expect: '72h' as const,
  },
  {
    id: '24h-already-sent',
    installAt: '2026-06-08T00:00:00.000Z',
    now: '2026-06-09T02:00:00.000Z',
    sent: ['24h'] as const,
    expect: null,
  },
] as const;

export function buildActivationConciergeEventRows(input: {
  anonId: string;
  installAt: string;
  serviceId?: string;
  slot?: string;
  date?: string;
  qualified?: boolean;
}): AppEventAnalyticsRow[] {
  const installAt = new Date(input.installAt);
  return [
    {
      anonId: input.anonId,
      event: 'app_installed',
      platform: 'ios',
      appSurface: 'consumer_app',
      locale: 'en',
      tenantSlug: 'salon-a',
      createdAt: installAt,
      props: {
        intentQualified: input.qualified ?? true,
        serviceId: input.serviceId,
      },
    },
    ...(input.serviceId
      ? [
          {
            anonId: input.anonId,
            event: 'booking_abandoned' as const,
            platform: 'ios' as const,
            appSurface: 'consumer_app' as const,
            locale: 'en',
            tenantSlug: 'salon-a',
            createdAt: new Date(installAt.getTime() + 2 * 60 * 60 * 1000),
            props: {
              serviceId: input.serviceId,
              abandonedStep: 'confirm',
              date: input.date,
              slot: input.slot,
            },
          },
        ]
      : []),
  ];
}

export const ACTIVATION_CONCIERGE_RESUME_SCENARIOS = [
  {
    id: 'from-abandonment',
    rows: buildActivationConciergeEventRows({
      anonId: 'anon-1',
      installAt: '2026-06-08T00:00:00.000Z',
      serviceId: 'svc-1',
      date: '2026-06-10',
      slot: '2026-06-10T14:00:00.000Z',
    }),
    anonId: 'anon-1',
    expectServiceId: 'svc-1',
    expectSlot: '2026-06-10T14:00:00.000Z',
  },
  {
    id: 'install-only',
    rows: buildActivationConciergeEventRows({
      anonId: 'anon-2',
      installAt: '2026-06-08T00:00:00.000Z',
    }),
    anonId: 'anon-2',
    expectServiceId: null,
    expectSlot: null,
  },
] as const;
