import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: [
      'src/lib/business-currency.spec.ts',
      'src/lib/business-currency.integration.spec.ts',
      'src/lib/business-currency.scenario.integration.spec.ts',
      'src/lib/business-currency.provider.integration.spec.ts',
      'src/lib/booking-payment-summary.spec.ts',
      'src/lib/booking-payment-summary.currency.integration.spec.ts',
      'src/lib/booking-types.currency.spec.ts',
      'src/lib/booking-types.currency.integration.spec.ts',
      'src/lib/use-business-currency.spec.tsx',
      'src/lib/use-business-currency.integration.spec.tsx',
      'src/services/auth-store.currency.integration.spec.ts',
      'src/components/BookingPaymentBreakdown.integration.spec.tsx',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/business-currency.ts',
        'src/lib/use-business-currency.ts',
        'src/lib/booking-payment-summary.ts',
        'src/components/BookingPaymentBreakdown.tsx',
      ],
      reportsDirectory: './coverage/sprint28',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
