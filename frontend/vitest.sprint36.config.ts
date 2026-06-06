import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: [
      'src/lib/business-tax.spec.ts',
      'src/lib/business-tax.integration.spec.ts',
      'src/lib/booking-payment-summary.spec.ts',
      'src/lib/booking-types-tax.integration.spec.ts',
      'src/lib/tax-revenue-reports.integration.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/lib/business-tax.ts', 'src/lib/booking-payment-summary.ts'],
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
