/**
 * e2e-bug.229 — pay_online with a named service must keep checkout session
 * serviceId / employeeId / startTime (e2e-bug.88 execution residual).
 */
export type E2e229PayOnlineNamedServiceFixture = {
  id: string;
  prompt: string;
  surface: 'public' | 'customer';
  /** Expected when checkout page context is present. */
  expectSuccessWithSlot: boolean;
};

export const E2E229_PAY_ONLINE_NAMED_SERVICE_PROMPTS: readonly E2e229PayOnlineNamedServiceFixture[] =
  [
    {
      id: 'e2e229-pay-online-swedish-massage-booking',
      prompt: 'pay online for my Swedish massage booking',
      surface: 'public',
      expectSuccessWithSlot: true,
    },
    {
      id: 'e2e229-pay-online-now-upcoming-swedish-massage',
      prompt: 'pay online now for my upcoming Swedish massage appointment',
      surface: 'public',
      expectSuccessWithSlot: true,
    },
    {
      id: 'e2e229-pay-with-card-control',
      prompt: 'pay with card',
      surface: 'public',
      expectSuccessWithSlot: true,
    },
    {
      id: 'e2e229-want-pay-online-my-booking-control',
      prompt: 'I want to pay online for my booking',
      surface: 'public',
      expectSuccessWithSlot: true,
    },
    {
      id: 'e2e229-pay-online-swedish-customer',
      prompt: 'pay online for my Swedish massage booking',
      surface: 'customer',
      expectSuccessWithSlot: true,
    },
    {
      id: 'e2e229-pay-online-now-upcoming-customer',
      prompt: 'pay online now for my upcoming Swedish massage appointment',
      surface: 'customer',
      expectSuccessWithSlot: true,
    },
    {
      id: 'e2e229-bare-home-no-slot-clarify',
      prompt: 'pay online for my Swedish massage booking',
      surface: 'public',
      expectSuccessWithSlot: false,
    },
  ] as const;

export const E2E229_CHECKOUT_SLOT_CONTEXT = {
  serviceId: 'svc-swedish',
  employeeId: 'emp-anna',
  startTime: '2026-07-30T14:00:00.000Z',
  bookingStep: 'checkout',
} as const;
