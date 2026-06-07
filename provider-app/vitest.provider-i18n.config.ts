import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../frontend/src'),
      '@shared-i18n': path.resolve(__dirname, '../frontend/src/i18n'),
      '@booking-lib': path.resolve(__dirname, '../frontend/src/lib'),
    },
  },
  test: {
    environment: 'happy-dom',
    fileParallelism: false,
    include: [
      'src/lib/provider-app.i18n.integration.spec.ts',
      'src/i18n/resolve-locale.spec.ts',
      'src/i18n/locale-storage.spec.ts',
      'src/lib/provider-ai-examples.spec.ts',
      'src/lib/operation-feedback.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/provider-app-i18n.ts',
        'src/lib/provider-ai-examples.ts',
        'src/i18n/resolve-locale.ts',
        'src/i18n/locale-storage.ts',
        'src/lib/operation-feedback.ts',
      ],
      reportsDirectory: './coverage/provider-i18n',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
        'src/lib/provider-app-i18n.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/lib/provider-ai-examples.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/i18n/resolve-locale.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/i18n/locale-storage.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/lib/operation-feedback.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
