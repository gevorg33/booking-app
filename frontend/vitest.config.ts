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
    environmentMatchGlobs: [
      ['**/locale-cookie.spec.ts', 'happy-dom'],
      ['**/public-locale-cookie.spec.ts', 'happy-dom'],
      ['**/operation-feedback.spec.ts', 'happy-dom'],
    ],
    include: ['src/lib/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/subscription-plans.ts',
        'src/lib/subscription-pricing.ts',
        'src/lib/service-packages.ts',
        'src/lib/service-package-pricing.ts',
        'src/lib/multi-service-booking.ts',
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
