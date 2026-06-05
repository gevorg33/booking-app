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
    setupFiles: ['./vitest.react-act-setup.ts'],
    fileParallelism: false,
    include: [
      'src/lib/ai-assistant.i18n.integration.spec.ts',
      'src/lib/ai-notification-center.spec.ts',
      'src/lib/use-ai-events.util.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/ai-notification-center.ts',
        'src/lib/use-ai-events.util.ts',
      ],
      reportsDirectory: './coverage/sprint17',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
