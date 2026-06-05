import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@shared-i18n': path.resolve(__dirname, '../frontend/src/i18n'),
    },
  },
  test: {
    environment: 'happy-dom',
    environmentMatchGlobs: [
      ['src/lib/**', 'node'],
      ['src/components/**', 'happy-dom'],
    ],
    include: [
      'src/lib/booking-payment-summary.spec.ts',
      'src/components/BookingPaymentBreakdown.integration.spec.tsx',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/booking-payment-summary.ts',
        'src/components/BookingPaymentBreakdown.tsx',
      ],
      reportsDirectory: './coverage/sprint36',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
