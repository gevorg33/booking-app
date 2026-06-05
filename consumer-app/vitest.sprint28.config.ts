import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/lib/business-currency.spec.ts',
      'src/lib/business-currency.integration.spec.ts',
      'src/stores/tenant-store.currency.integration.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/lib/business-currency.ts'],
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
