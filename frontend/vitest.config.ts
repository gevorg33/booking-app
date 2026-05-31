import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/lib/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/subscription-plans.ts',
        'src/lib/subscription-pricing.ts',
        'src/lib/service-packages.ts',
        'src/lib/service-package-pricing.ts',
      ],
      thresholds: {
        statements: 98,
        branches: 95,
        functions: 98,
        lines: 98,
      },
    },
  },
});
