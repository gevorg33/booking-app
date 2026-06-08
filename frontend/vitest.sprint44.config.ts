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
      'src/lib/app-analytics.spec.ts',
      'src/lib/app-analytics-context.util.spec.ts',
      'src/lib/adoption-funnel-display.util.spec.ts',
      'src/lib/adoption-retention-display.util.spec.ts',
      'src/lib/adoption-activation-display.util.spec.ts',
      'src/lib/adoption-dashboard-display.util.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/app-analytics.ts',
        'src/lib/app-analytics-context.util.ts',
        'src/lib/adoption-funnel-display.util.ts',
        'src/lib/adoption-retention-display.util.ts',
        'src/lib/adoption-activation-display.util.ts',
        'src/lib/adoption-dashboard-display.util.ts',
      ],
      reportsDirectory: './coverage/sprint44',
      thresholds: {
        statements: 90,
        branches: 70,
        functions: 90,
        lines: 90,
      },
    },
  },
});
