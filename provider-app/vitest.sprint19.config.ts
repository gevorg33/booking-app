import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../frontend/src'),
      '@shared-i18n': path.resolve(__dirname, '../frontend/src/i18n'),
    },
  },
  test: {
    environment: 'happy-dom',
    fileParallelism: false,
    include: [
      'src/lib/provider-ai-quick-chips.spec.ts',
      'src/lib/provider-ai-shell.util.spec.ts',
      'src/lib/provider-ai-examples.spec.ts',
      'src/lib/provider-app.i18n.integration.spec.ts',
      'src/components/ProviderAiShell.integration.spec.tsx',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/provider-ai-quick-chips.ts',
        'src/lib/provider-ai-shell.util.ts',
        'src/components/ProviderAiShell.tsx',
      ],
      reportsDirectory: './coverage/sprint19',
      thresholds: {
        './src/lib/provider-ai-quick-chips.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/lib/provider-ai-shell.util.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/components/ProviderAiShell.tsx': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
