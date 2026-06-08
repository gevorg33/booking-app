export const ACTIVATION_PATH_AB_ASSIGNMENT_SCENARIOS = [
  {
    id: 'anon-a-sign-in-post',
    anonId: 'device-alpha-001',
    expect: {
      signInPlacement: 'post_booking',
      slotPreselection: 'nearest_auto',
      paymentTiming: 'pay_at_venue_default',
    },
  },
  {
    id: 'anon-b-sign-in-pre',
    anonId: 'device-bravo-002',
    expect: {
      signInPlacement: 'pre_confirm',
      slotPreselection: 'manual_pick',
      paymentTiming: 'online_first',
    },
  },
] as const;

export const ACTIVATION_PATH_AB_PROMOTION_SCENARIOS = [
  {
    id: 'promoted-overrides-assignment',
    anonId: 'device-alpha-001',
    promoted: {
      signInPlacement: 'pre_confirm' as const,
      slotPreselection: 'nearest_auto' as const,
      paymentTiming: 'online_first' as const,
    },
    expect: {
      signInPlacement: 'pre_confirm',
      slotPreselection: 'nearest_auto',
      paymentTiming: 'online_first',
    },
  },
] as const;

export const ACTIVATION_PATH_AB_BEHAVIOR_SCENARIOS = [
  {
    id: 'nearest-auto-attempts-slot',
    slotPreselection: 'nearest_auto' as const,
    nearestAttempted: false,
    slot: '',
    expectAttempt: true,
  },
  {
    id: 'manual-pick-skips-auto',
    slotPreselection: 'manual_pick' as const,
    nearestAttempted: false,
    slot: '',
    expectAttempt: false,
  },
  {
    id: 'post-booking-sign-in',
    signInPlacement: 'post_booking' as const,
    wasGuestAtBooking: true,
    hasExistingSession: false,
    hasOneTapProvider: true,
    expectPostBooking: true,
    expectPreConfirm: false,
  },
  {
    id: 'pre-confirm-sign-in',
    signInPlacement: 'pre_confirm' as const,
    wasGuestAtBooking: true,
    hasExistingSession: false,
    hasOneTapProvider: true,
    dismissed: false,
    expectPostBooking: false,
    expectPreConfirm: true,
  },
  {
    id: 'pay-at-venue-default',
    paymentTiming: 'pay_at_venue_default' as const,
    isActivationPath: true,
    cashAvailable: true,
    expectPreferPayAtVenue: true,
    expectMethod: 'cash' as const,
  },
  {
    id: 'online-first',
    paymentTiming: 'online_first' as const,
    isActivationPath: true,
    cashAvailable: true,
    currentMethod: 'online' as const,
    expectPreferPayAtVenue: false,
    expectMethod: 'online' as const,
  },
] as const;
