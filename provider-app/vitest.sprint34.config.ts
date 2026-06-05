import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@shared-i18n': path.resolve(__dirname, '../frontend/src/i18n'),
    },
  },
  test: {
    environment: 'happy-dom',
    environmentMatchGlobs: [
      ['src/lib/**', 'node'],
      ['src/components/**', 'happy-dom'],
    ],
    include: [
      'src/lib/business-date-format.spec.ts',
      'src/lib/date-format.business.spec.ts',
      'src/lib/date-format-17.integration.spec.ts',
      'src/lib/date-format.util.spec.ts',
      'src/lib/auth-store.date-format.spec.ts',
      'src/components/date-picker-17.integration.spec.tsx',
      'src/components/BusinessDateFormatBootstrap.integration.spec.tsx',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/lib/business-date-format.ts', 'src/lib/date-format.ts'],
      reportsDirectory: './coverage/sprint34',
      thresholds: {
        statements: 100,
        branches: 94,
        functions: 100,
        lines: 100,
        'src/lib/business-date-format.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
