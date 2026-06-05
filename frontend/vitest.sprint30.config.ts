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
      'src/lib/tour-service.spec.ts',
      'src/lib/tour-booking.integration.spec.ts',
      'src/lib/tour-booking-16-18.integration.spec.ts',
      'src/lib/tour-calendar.spec.ts',
      'src/lib/tour-calendar.integration.spec.ts',
      'src/lib/tour-calendar-110.integration.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/lib/tour-service.ts', 'src/lib/tour-calendar.ts'],
      reportsDirectory: './coverage/sprint30',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
