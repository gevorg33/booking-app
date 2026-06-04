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
    fileParallelism: false,
    include: [
      'src/lib/booking-detail-panel.util.spec.ts',
      'src/lib/block-schedule.util.spec.ts',
      'src/lib/appointment-modal.i18n.integration.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/booking-detail-panel.util.ts',
        'src/lib/block-schedule.util.ts',
      ],
      reportsDirectory: './coverage/appointment-modal',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
        'src/lib/booking-detail-panel.util.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/lib/block-schedule.util.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
