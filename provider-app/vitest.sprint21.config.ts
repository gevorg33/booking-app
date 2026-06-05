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
      'src/lib/offline-queue.spec.ts',
      'src/lib/provider-offline-mutation.util.spec.ts',
      'src/lib/provider-offline-response.util.spec.ts',
      'src/lib/provider-booking-optimistic.util.spec.ts',
      'src/lib/provider-ai-suggestions-cache.util.spec.ts',
      'src/lib/provider-ai-suggestions-query.util.spec.ts',
      'src/lib/provider-api-offline.util.spec.ts',
      'src/lib/provider-ai-assistant-offline.util.spec.ts',
      'src/lib/use-online-status.spec.tsx',
      'src/components/ProviderOfflineBanner.integration.spec.tsx',
      'src/components/ProviderAiSuggestions.integration.spec.tsx',
      'src/components/ProviderAiAssistant.offline.integration.spec.tsx',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/offline-queue.ts',
        'src/lib/provider-offline-mutation.util.ts',
        'src/lib/provider-offline-response.util.ts',
        'src/lib/provider-booking-optimistic.util.ts',
        'src/lib/provider-ai-suggestions-cache.util.ts',
        'src/lib/provider-ai-suggestions-query.util.ts',
        'src/lib/provider-api-offline.util.ts',
        'src/lib/provider-ai-assistant-offline.util.ts',
        'src/lib/use-online-status.ts',
        'src/components/ProviderOfflineBanner.tsx',
        'src/components/ProviderAiSuggestions.tsx',
      ],
      reportsDirectory: './coverage/sprint21',
      thresholds: {
        './src/lib/offline-queue.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/lib/provider-offline-mutation.util.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/lib/provider-offline-response.util.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/lib/provider-booking-optimistic.util.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/lib/provider-ai-suggestions-cache.util.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/lib/provider-ai-suggestions-query.util.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/lib/provider-api-offline.util.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/lib/use-online-status.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/components/ProviderOfflineBanner.tsx': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/components/ProviderAiSuggestions.tsx': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/lib/provider-ai-assistant-offline.util.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
