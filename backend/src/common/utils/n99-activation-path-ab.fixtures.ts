import type { AppAdoptionFixtureRow } from './app-adoption-analytics.fixtures.js';

export const N99_ACTIVATION_PATH_AB_MIN_SAMPLE = 20;

export const N99_ACTIVATION_PATH_AB_DIMENSIONS = [
  'signInPlacement',
  'slotPreselection',
  'paymentTiming',
] as const;

export type N99ActivationPathAbDimension =
  (typeof N99_ACTIVATION_PATH_AB_DIMENSIONS)[number];

export const N99_SIGN_IN_PLACEMENT_VARIANTS = ['post_booking', 'pre_confirm'] as const;
export type N99SignInPlacementVariant = (typeof N99_SIGN_IN_PLACEMENT_VARIANTS)[number];

export const N99_SLOT_PRESELECTION_VARIANTS = ['nearest_auto', 'manual_pick'] as const;
export type N99SlotPreselectionVariant = (typeof N99_SLOT_PRESELECTION_VARIANTS)[number];

export const N99_PAYMENT_TIMING_VARIANTS = ['pay_at_venue_default', 'online_first'] as const;
export type N99PaymentTimingVariant = (typeof N99_PAYMENT_TIMING_VARIANTS)[number];

export type N99ActivationPathVariants = {
  signInPlacement: N99SignInPlacementVariant;
  slotPreselection: N99SlotPreselectionVariant;
  paymentTiming: N99PaymentTimingVariant;
};

export const N99_ACTIVATION_PATH_AB_DEFAULT_PROMOTED: N99ActivationPathVariants = {
  signInPlacement: 'post_booking',
  slotPreselection: 'nearest_auto',
  paymentTiming: 'pay_at_venue_default',
};

export const N99_ACTIVATION_PATH_AB_VARIANTS_BY_DIMENSION: Record<
  N99ActivationPathAbDimension,
  readonly string[]
> = {
  signInPlacement: N99_SIGN_IN_PLACEMENT_VARIANTS,
  slotPreselection: N99_SLOT_PRESELECTION_VARIANTS,
  paymentTiming: N99_PAYMENT_TIMING_VARIANTS,
};

/** Qualified-install rows: pre_confirm wins sign-in; manual_pick loses slot; online_first wins payment. */
export const N99_ACTIVATION_PATH_AB_FIXTURE_ROWS: AppAdoptionFixtureRow[] = [
  {
    id: 'ab-signin-post-1-install',
    anonId: 'ab-signin-post-1',
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-01T10:00:00.000Z',
    props: {
      intentQualified: true,
      signInPlacement: 'post_booking',
      slotPreselection: 'nearest_auto',
      paymentTiming: 'pay_at_venue_default',
    },
  },
  {
    id: 'ab-signin-post-1-book',
    anonId: 'ab-signin-post-1',
    event: 'completed_booking',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-02T10:00:00.000Z',
    props: { signInPlacement: 'post_booking' },
  },
  {
    id: 'ab-signin-post-2-install',
    anonId: 'ab-signin-post-2',
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-01T11:00:00.000Z',
    props: {
      intentQualified: true,
      signInPlacement: 'post_booking',
    },
  },
  {
    id: 'ab-signin-pre-1-install',
    anonId: 'ab-signin-pre-1',
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-01T10:00:00.000Z',
    props: {
      intentQualified: true,
      signInPlacement: 'pre_confirm',
    },
  },
  {
    id: 'ab-signin-pre-1-book',
    anonId: 'ab-signin-pre-1',
    event: 'completed_booking',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-02T10:00:00.000Z',
    props: { signInPlacement: 'pre_confirm' },
  },
  {
    id: 'ab-signin-pre-2-install',
    anonId: 'ab-signin-pre-2',
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-01T11:00:00.000Z',
    props: {
      intentQualified: true,
      signInPlacement: 'pre_confirm',
    },
  },
  {
    id: 'ab-signin-pre-2-book',
    anonId: 'ab-signin-pre-2',
    event: 'completed_booking',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-02T11:00:00.000Z',
    props: { signInPlacement: 'pre_confirm' },
  },
  {
    id: 'ab-slot-auto-1-install',
    anonId: 'ab-slot-auto-1',
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-01T10:00:00.000Z',
    props: {
      intentQualified: true,
      slotPreselection: 'nearest_auto',
    },
  },
  {
    id: 'ab-slot-auto-1-book',
    anonId: 'ab-slot-auto-1',
    event: 'completed_booking',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-02T10:00:00.000Z',
    props: { slotPreselection: 'nearest_auto' },
  },
  {
    id: 'ab-slot-auto-2-install',
    anonId: 'ab-slot-auto-2',
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-01T11:00:00.000Z',
    props: {
      intentQualified: true,
      slotPreselection: 'nearest_auto',
    },
  },
  {
    id: 'ab-slot-auto-2-book',
    anonId: 'ab-slot-auto-2',
    event: 'completed_booking',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-02T11:00:00.000Z',
    props: { slotPreselection: 'nearest_auto' },
  },
  {
    id: 'ab-slot-manual-1-install',
    anonId: 'ab-slot-manual-1',
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-01T10:00:00.000Z',
    props: {
      intentQualified: true,
      slotPreselection: 'manual_pick',
    },
  },
  {
    id: 'ab-slot-manual-2-install',
    anonId: 'ab-slot-manual-2',
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-01T11:00:00.000Z',
    props: {
      intentQualified: true,
      slotPreselection: 'manual_pick',
    },
  },
  {
    id: 'ab-pay-venue-1-install',
    anonId: 'ab-pay-venue-1',
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-01T10:00:00.000Z',
    props: {
      intentQualified: true,
      paymentTiming: 'pay_at_venue_default',
    },
  },
  {
    id: 'ab-pay-venue-1-book',
    anonId: 'ab-pay-venue-1',
    event: 'completed_booking',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-02T10:00:00.000Z',
    props: { paymentTiming: 'pay_at_venue_default' },
  },
  {
    id: 'ab-pay-venue-2-install',
    anonId: 'ab-pay-venue-2',
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-01T11:00:00.000Z',
    props: {
      intentQualified: true,
      paymentTiming: 'pay_at_venue_default',
    },
  },
  {
    id: 'ab-pay-online-1-install',
    anonId: 'ab-pay-online-1',
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-01T10:00:00.000Z',
    props: {
      intentQualified: true,
      paymentTiming: 'online_first',
    },
  },
  {
    id: 'ab-pay-online-1-book',
    anonId: 'ab-pay-online-1',
    event: 'completed_booking',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-02T10:00:00.000Z',
    props: { paymentTiming: 'online_first' },
  },
  {
    id: 'ab-pay-online-2-install',
    anonId: 'ab-pay-online-2',
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-01T11:00:00.000Z',
    props: {
      intentQualified: true,
      paymentTiming: 'online_first',
    },
  },
  {
    id: 'ab-pay-online-2-book',
    anonId: 'ab-pay-online-2',
    event: 'completed_booking',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    tenantSlug: 'salon-a',
    createdAt: '2026-06-02T11:00:00.000Z',
    props: { paymentTiming: 'online_first' },
  },
];

export const N99_ACTIVATION_PATH_AB_PROMOTION_EXPECTATIONS = {
  signInPlacement: 'pre_confirm',
  slotPreselection: 'nearest_auto',
  paymentTiming: 'online_first',
} as const satisfies Partial<N99ActivationPathVariants>;
