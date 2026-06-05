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
      'src/lib/ai-clarify.util.spec.ts',
      'src/lib/ai-command-bar.util.spec.ts',
      'src/lib/orchestrix-events.spec.ts',
      'src/lib/orchestrix-events.integration.spec.ts',
      'src/lib/ai-notification-center.spec.ts',
      'src/components/ai-clarify-form.integration.spec.tsx',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/ai-assistant-i18n.ts',
        'src/lib/ai-clarify.util.ts',
        'src/lib/ai-command-bar.util.ts',
        'src/lib/orchestrix-events.ts',
      ],
      reportsDirectory: './coverage/sprint16',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
