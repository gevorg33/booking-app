import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/lib/guest-booking.util.spec.ts',
      'src/lib/booking-draft.util.spec.ts',
      'src/lib/guided-booking-flow.util.spec.ts',
      'src/lib/activation-instrumentation.util.spec.ts',
      'src/lib/push-opt-in-priming.util.spec.ts',
      'src/lib/onboarding-variant.util.spec.ts',
      'src/lib/activation-onboarding.util.spec.ts',
      'src/lib/phone-auth.util.spec.ts',
      'src/lib/checkout-autofill.util.spec.ts',
      'src/lib/checkout-payment.util.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/guest-booking.util.ts',
        'src/lib/booking-draft.util.ts',
        'src/lib/guided-booking-flow.util.ts',
        'src/lib/activation-instrumentation.util.ts',
        'src/lib/push-opt-in-priming.util.ts',
        'src/lib/onboarding-variant.util.ts',
        'src/lib/activation-onboarding.util.ts',
        'src/lib/phone-auth.util.ts',
        'src/lib/checkout-autofill.util.ts',
        'src/lib/checkout-payment.util.ts',
      ],
      reportsDirectory: './coverage/sprint46',
      thresholds: {
        statements: 90,
        branches: 70,
        functions: 90,
        lines: 90,
      },
    },
  },
});
