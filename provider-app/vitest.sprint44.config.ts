import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@shared-i18n': path.resolve(__dirname, '../frontend/src/i18n'),
    },
  },
  test: {
    environment: 'node',
    include: [
      'src/lib/app-analytics.spec.ts',
      'src/lib/app-analytics.integration.spec.ts',
      'src/lib/app-analytics-context.util.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/lib/app-analytics.ts', 'src/lib/app-analytics-context.util.ts'],
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
