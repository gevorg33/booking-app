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
      'src/lib/ai-available-providers.util.spec.ts',
      'src/lib/ai-command-bar.util.spec.ts',
      'src/lib/ai-guide-reply.util.spec.ts',
      'src/components/ai-available-providers-panel.integration.spec.tsx',
      'src/components/ai-guide-steps-panel.integration.spec.tsx',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/ai-available-providers.util.ts',
        'src/components/ai-available-providers-panel.tsx',
      ],
      reportsDirectory: './coverage/ai-providers',
      thresholds: {
        statements: 100,
        branches: 95,
        functions: 100,
        lines: 100,
        'src/lib/ai-available-providers.util.ts': {
          statements: 100,
          branches: 95,
          functions: 100,
          lines: 100,
        },
        'src/components/ai-available-providers-panel.tsx': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
