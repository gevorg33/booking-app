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
      ],
      thresholds: {
        statements: 95,
        branches: 85,
        functions: 95,
        lines: 95,
      },
    },
  },
});
