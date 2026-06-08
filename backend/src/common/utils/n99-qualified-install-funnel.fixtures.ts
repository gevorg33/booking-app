import type { AppEventAnalyticsRow } from './app-adoption-analytics.util.js';
import type { N99QualifiedInstallFunnelStepId } from './n99-qualified-install-funnel.util.js';

/** n99-3.6 — dead-end audit drop threshold (1%). */
export const N99_DEAD_END_DROP_THRESHOLD = 0.01;

export const N99_QUALIFIED_FUNNEL_FIX_SUGGESTIONS: Record<
  N99QualifiedInstallFunnelStepId,
  string
> = {
  qualified_install:
    'Ensure deferred deep links mark intentQualified and tenant slug on app_installed.',
  first_open:
    'Review analytics consent timing, cold-start crashes, and first-open routing.',
  salon_viewed:
    'Review deferred deep-link restore and salon landing (deep-link, useFirstRunLanding).',
  booking_started:
    'Fire started_booking when BookPage mounts; reduce taps to enter booking.',
  slot_step:
    'Review nearest-slot preselection and slot picker UX on BookPage.',
  confirm_step:
    'Instrument confirm step on slot ready; keep payment-optional fallback (n99-3.3).',
  booking_completed:
    'Review checkout errors, pay-at-venue fallback, and booking confirmation flow.',
};

function row(input: Partial<AppEventAnalyticsRow> & Pick<AppEventAnalyticsRow, 'anonId' | 'event' | 'createdAt'>): AppEventAnalyticsRow {
  return {
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    props: null,
    ...input,
  };
}

/** Full qualified-install path — all step drops ≤ 1%. */
export function buildN99QualifiedFunnelHealthyRows(anonId = 'anon-healthy'): AppEventAnalyticsRow[] {
  const base = '2026-06-08T10:00:00.000Z';
  return [
    row({
      anonId,
      event: 'app_installed',
      createdAt: new Date(base),
      tenantSlug: 'salon-a',
      props: { intentQualified: true, serviceId: 'svc-1' },
    }),
    row({ anonId, event: 'app_opened', createdAt: new Date('2026-06-08T10:01:00.000Z') }),
    row({ anonId, event: 'viewed_salon', createdAt: new Date('2026-06-08T10:02:00.000Z') }),
    row({
      anonId,
      event: 'started_booking',
      createdAt: new Date('2026-06-08T10:03:00.000Z'),
      props: { serviceId: 'svc-1' },
    }),
    row({
      anonId,
      event: 'onboarding_step_viewed',
      createdAt: new Date('2026-06-08T10:04:00.000Z'),
      props: { onboardingStep: 'slot', serviceId: 'svc-1' },
    }),
    row({
      anonId,
      event: 'onboarding_step_viewed',
      createdAt: new Date('2026-06-08T10:05:00.000Z'),
      props: { onboardingStep: 'confirm', serviceId: 'svc-1' },
    }),
    row({
      anonId,
      event: 'completed_booking',
      createdAt: new Date('2026-06-08T10:10:00.000Z'),
      props: { bookingId: 'bk-1', serviceId: 'svc-1' },
    }),
  ];
}

/** Drops at confirm_step (>1%) — should open a fix ticket. */
export function buildN99QualifiedFunnelConfirmDeadEndRows(): AppEventAnalyticsRow[] {
  const healthy = buildN99QualifiedFunnelHealthyRows('anon-ok');
  const stuck: AppEventAnalyticsRow[] = [
    row({
      anonId: 'anon-stuck-confirm',
      event: 'app_installed',
      createdAt: new Date('2026-06-08T11:00:00.000Z'),
      props: { intentQualified: true, serviceId: 'svc-1' },
    }),
    row({ anonId: 'anon-stuck-confirm', event: 'app_opened', createdAt: new Date('2026-06-08T11:01:00.000Z') }),
    row({ anonId: 'anon-stuck-confirm', event: 'viewed_salon', createdAt: new Date('2026-06-08T11:02:00.000Z') }),
    row({
      anonId: 'anon-stuck-confirm',
      event: 'started_booking',
      createdAt: new Date('2026-06-08T11:03:00.000Z'),
      props: { serviceId: 'svc-1' },
    }),
    row({
      anonId: 'anon-stuck-confirm',
      event: 'onboarding_step_viewed',
      createdAt: new Date('2026-06-08T11:04:00.000Z'),
      props: { onboardingStep: 'slot', serviceId: 'svc-1' },
    }),
  ];
  return [...healthy, ...stuck];
}

export const N99_QUALIFIED_FUNNEL_AUDIT_SCENARIOS = [
  {
    id: 'healthy-no-tickets',
    rows: buildN99QualifiedFunnelHealthyRows(),
    expectPassed: true,
    expectTicketSteps: [] as N99QualifiedInstallFunnelStepId[],
  },
  {
    id: 'confirm-dead-end',
    rows: buildN99QualifiedFunnelConfirmDeadEndRows(),
    expectPassed: false,
    expectTicketSteps: ['confirm_step'] as N99QualifiedInstallFunnelStepId[],
  },
] as const;

export const N99_QUALIFIED_FUNNEL_INSTRUMENTATION_FILES = [
  'consumer-app/src/lib/qualified-install-funnel.util.ts',
  'consumer-app/src/pages/BookPage.tsx',
] as const;
