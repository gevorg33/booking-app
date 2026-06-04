import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'happy-dom',
    fileParallelism: false,
    include: [
      'src/lib/operation-feedback.spec.ts',
      'src/lib/toasts-errors.i18n.integration.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/lib/operation-feedback.ts', 'src/lib/toasts-errors.i18n.ts'],
      reportsDirectory: './coverage/toasts-errors',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
        'src/lib/operation-feedback.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/lib/toasts-errors.i18n.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
