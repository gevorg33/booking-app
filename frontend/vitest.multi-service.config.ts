import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/lib/multi-service-booking.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/multi-service-booking.ts'],
      thresholds: {
        statements: 99,
        branches: 85,
        functions: 99,
        lines: 99,
      },
    },
  },
});
