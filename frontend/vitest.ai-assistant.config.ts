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
    include: ['src/lib/ai-assistant.i18n.integration.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/ai-assistant-i18n.ts'],
      reportsDirectory: './coverage/ai-assistant',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
        'src/lib/ai-assistant-i18n.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
