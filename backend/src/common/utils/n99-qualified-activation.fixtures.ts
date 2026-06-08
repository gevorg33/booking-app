import type {
  AppAdoptionEventName,
  AppAdoptionPlatform,
  AppAdoptionSurface,
} from '../../modules/analytics/entities/app-event.entity.js';

/** n99-3 — intent-qualified install → first booking within 7d targets near 99%. */
export const N99_QUALIFIED_ACTIVATION_WINDOW_DAYS = 7;
export const N99_QUALIFIED_ACTIVATION_TARGET = 0.99;
export const N99_QUALIFIED_ACTIVATION_EVAL_FLOOR = 0.9;
export const N99_QUALIFIED_LOCALE_SPREAD_MAX = 0.03;
export const N99_QUALIFIED_MIN_SAMPLE = 20;
export const N99_QUALIFIED_MIN_PER_LOCALE = 5;
export const N99_QUALIFIED_PRIMARY_LOCALES = ['en', 'hy', 'ru'] as const;

/** Deferred deep-link / salon-intent sources (adopt-2.4). Cold ad/unknown excluded. */
export const N99_INTENT_QUALIFIED_INSTALL_SOURCES = new Set([
  'web_banner',
  'qr',
  'referral',
  'link',
]);

export const N99_COLD_INSTALL_SOURCES = new Set(['ad', 'unknown']);

export interface N99QualifiedActivationFixtureRow {
  id: string;
  anonId: string;
  event: AppAdoptionEventName;
  platform: AppAdoptionPlatform;
  appSurface: AppAdoptionSurface;
  locale: string;
  tenantSlug?: string;
  createdAt: string;
  props?: Record<string, unknown>;
}

function dayOffset(baseIso: string, days: number, hours = 0): string {
  const date = new Date(baseIso);
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(date.getUTCHours() + hours);
  return date.toISOString();
}

function qualifiedInstallRow(input: {
  id: string;
  anonId: string;
  locale: string;
  tenantSlug: string;
  serviceId?: string;
  installSource?: string;
  intentQualified?: boolean;
  createdAt: string;
}): N99QualifiedActivationFixtureRow {
  return {
    id: input.id,
    anonId: input.anonId,
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: input.locale,
    tenantSlug: input.tenantSlug,
    createdAt: input.createdAt,
    props: {
      ...(input.serviceId ? { serviceId: input.serviceId } : {}),
      ...(input.installSource ? { installSource: input.installSource } : {}),
      ...(input.intentQualified ? { intentQualified: true } : {}),
    },
  };
}

function bookingRow(input: {
  id: string;
  anonId: string;
  locale: string;
  tenantSlug: string;
  createdAt: string;
}): N99QualifiedActivationFixtureRow {
  return {
    id: input.id,
    anonId: input.anonId,
    event: 'completed_booking',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: input.locale,
    tenantSlug: input.tenantSlug,
    createdAt: input.createdAt,
  };
}

const BASE = '2026-06-01T10:00:00.000Z';

/** 99/100 intent-qualified installs activate within 7d; EN/HY/RU balanced. */
export function buildN99QualifiedActivationNear99FixtureRows(): N99QualifiedActivationFixtureRow[] {
  const rows: N99QualifiedActivationFixtureRow[] = [];
  const locales = ['en', 'hy', 'ru'] as const;

  for (let index = 0; index < 100; index += 1) {
    const locale = locales[index % locales.length];
    const anonId = `anon-qualified-${index}`;
    const tenantSlug = `salon-${locale}`;
    rows.push(
      qualifiedInstallRow({
        id: `q-install-${index}`,
        anonId,
        locale,
        tenantSlug,
        serviceId: `svc-${index % 5}`,
        installSource: index % 4 === 0 ? 'qr' : 'link',
        intentQualified: true,
        createdAt: dayOffset(BASE, index % 3),
      }),
    );
    if (index !== 42) {
      rows.push(
        bookingRow({
          id: `q-book-${index}`,
          anonId,
          locale,
          tenantSlug,
          createdAt: dayOffset(BASE, (index % 3) + 1, 2),
        }),
      );
    }
  }

  return rows;
}

/** Cold ad installs tracked separately — lower activation bar. */
export function buildN99ColdActivationFixtureRows(): N99QualifiedActivationFixtureRow[] {
  const rows: N99QualifiedActivationFixtureRow[] = [];
  for (let index = 0; index < 10; index += 1) {
    const anonId = `anon-cold-${index}`;
    rows.push(
      qualifiedInstallRow({
        id: `c-install-${index}`,
        anonId,
        locale: 'en',
        tenantSlug: 'salon-ad',
        installSource: 'ad',
        createdAt: dayOffset(BASE, 0, index),
      }),
      {
        id: `c-open-${index}`,
        anonId,
        event: 'app_opened',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        tenantSlug: 'salon-ad',
        createdAt: dayOffset(BASE, 0, index + 1),
      },
    );
    if (index < 2) {
      rows.push(
        {
          id: `c-signin-${index}`,
          anonId,
          event: 'signed_in',
          platform: 'ios',
          appSurface: 'consumer_app',
          locale: 'en',
          tenantSlug: 'salon-ad',
          createdAt: dayOffset(BASE, 1, index),
        },
        bookingRow({
          id: `c-book-${index}`,
          anonId,
          locale: 'en',
          tenantSlug: 'salon-ad',
          createdAt: dayOffset(BASE, 2, index),
        }),
      );
    }
  }
  return rows;
}

export const N99_QUALIFIED_INSTALL_SCENARIOS = [
  {
    id: 'intent-qualified-prop',
    install: { tenantSlug: 'salon-a', props: { intentQualified: true } },
    expectQualified: true,
  },
  {
    id: 'salon-plus-service',
    install: { tenantSlug: 'salon-a', props: { serviceId: 'svc-1', installSource: 'ad' } },
    expectQualified: true,
  },
  {
    id: 'salon-qr',
    install: { tenantSlug: 'salon-a', props: { installSource: 'qr' } },
    expectQualified: true,
  },
  {
    id: 'cold-ad-no-service',
    install: { tenantSlug: 'salon-a', props: { installSource: 'ad' } },
    expectQualified: false,
  },
  {
    id: 'cold-unknown',
    install: { tenantSlug: null, props: { installSource: 'unknown' } },
    expectQualified: false,
  },
  {
    id: 'no-slug',
    install: { tenantSlug: null, props: {} },
    expectQualified: false,
  },
] as const;

export const N99_QUALIFIED_ACTIVATION_GATE_SCENARIOS = [
  {
    id: 'near-99-met',
    rows: buildN99QualifiedActivationNear99FixtureRows(),
    expectMet: true,
    expectRate: 0.99,
  },
  {
    id: 'below-floor',
    input: {
      qualifiedActivationRate: 0.88,
      sampleSize: 120,
      localeSpread: 0.02,
      insufficientLocales: [] as string[],
    },
    expectMet: false,
  },
  {
    id: 'locale-spread-wide',
    input: {
      qualifiedActivationRate: 0.995,
      sampleSize: 120,
      localeSpread: 0.05,
      insufficientLocales: [] as string[],
    },
    expectMet: false,
  },
  {
    id: 'insufficient-sample',
    input: {
      qualifiedActivationRate: 1,
      sampleSize: 10,
      localeSpread: 0,
      insufficientLocales: ['hy'],
    },
    expectMet: false,
  },
] as const;

export const N99_LOCALE_COHORT_SCENARIOS = [
  {
    id: 'balanced-en-hy-ru',
    rows: buildN99QualifiedActivationNear99FixtureRows(),
    expectMaxSpread: 0.03,
    expectInsufficient: undefined as string[] | undefined,
  },
  {
    id: 'hy-under-sampled',
    rows: buildN99QualifiedActivationNear99FixtureRows().filter((row) => row.locale !== 'hy'),
    expectSpread: undefined as number | undefined,
    expectInsufficient: ['hy'],
  },
] as const;
