import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    environmentMatchGlobs: [
      ['src/lib/**', 'node'],
      ['src/components/**', 'happy-dom'],
    ],
    include: [
      'src/lib/business-tax.spec.ts',
      'src/lib/business-tax.integration.spec.ts',
      'src/components/CheckoutTaxSummary.spec.tsx',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/lib/business-tax.ts', 'src/components/CheckoutTaxSummary.tsx'],
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
