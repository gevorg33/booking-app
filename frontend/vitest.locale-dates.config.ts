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
      'src/lib/app-locale.spec.ts',
      'src/lib/calendar-date.util.spec.ts',
      'src/lib/date-key-parse.util.spec.ts',
      'src/lib/locale-date-format.spec.ts',
      'src/lib/booking-day-options.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/app-locale.ts',
        'src/lib/calendar-date.util.ts',
        'src/lib/date-key-parse.util.ts',
        'src/lib/locale-date-format.ts',
        'src/lib/booking-day-options.ts',
      ],
      reportsDirectory: './coverage/locale-dates',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
