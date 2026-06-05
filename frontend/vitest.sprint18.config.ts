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
      'src/lib/ai-onboarding.util.spec.ts',
      'src/lib/ai-page-panel.util.spec.ts',
      'src/lib/ai-command-bar-examples.util.spec.ts',
      'src/lib/ai-orchestration.sprint18.spec.ts',
      'src/components/ai-page-panel.integration.spec.tsx',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/ai-onboarding.util.ts',
        'src/lib/ai-assistant-i18n.ts',
        'src/lib/ai-page-panel.util.ts',
        'src/lib/ai-command-bar-examples.util.ts',
        'src/components/ai-page-panel.tsx',
      ],
      reportsDirectory: './coverage/sprint18',
      thresholds: {
        './src/lib/ai-onboarding.util.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/lib/ai-assistant-i18n.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/lib/ai-page-panel.util.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/lib/ai-command-bar-examples.util.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/components/ai-page-panel.tsx': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
