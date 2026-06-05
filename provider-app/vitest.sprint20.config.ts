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
      'src/lib/provider-push-deep-link.util.spec.ts',
      'src/lib/provider-push-foreground.util.spec.ts',
      'src/lib/provider-native-push.util.spec.ts',
      'src/lib/provider-voice-input.util.spec.ts',
      'src/lib/use-speech-recognition.spec.tsx',
      'src/lib/use-provider-voice-input.spec.tsx',
      'src/components/ProviderPushBridge.integration.spec.tsx',
      'src/components/ProviderAiVoiceButton.integration.spec.tsx',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/provider-push-deep-link.util.ts',
        'src/lib/provider-push-foreground.util.ts',
        'src/lib/provider-native-push.util.ts',
        'src/lib/provider-voice-input.util.ts',
        'src/lib/use-speech-recognition.ts',
        'src/lib/use-provider-voice-input.ts',
        'src/components/ProviderPushBridge.tsx',
        'src/components/ProviderAiVoiceButton.tsx',
      ],
      reportsDirectory: './coverage/sprint20',
      thresholds: {
        './src/lib/provider-push-deep-link.util.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/lib/provider-push-foreground.util.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/lib/provider-native-push.util.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/lib/provider-voice-input.util.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/lib/use-speech-recognition.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/lib/use-provider-voice-input.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/components/ProviderPushBridge.tsx': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        './src/components/ProviderAiVoiceButton.tsx': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
