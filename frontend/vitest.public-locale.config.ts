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
      'src/lib/public-locale-cookie.spec.ts',
      'src/lib/business-public-profile-locales.spec.ts',
      'src/lib/business-profile-locales.integration.spec.ts',
      'src/lib/locale-cookie.spec.ts',
      'src/lib/server-public-locale.spec.ts',
      'src/lib/server-locale.spec.ts',
      'src/i18n/I18nProvider.spec.tsx',
      'src/components/public-booking/public-locale-bootstrap.spec.tsx',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/public-locale-cookie.ts',
        'src/lib/business-public-profile-locales.ts',
        'src/lib/locale-cookie.ts',
        'src/lib/server-public-locale.ts',
        'src/lib/server-locale.ts',
        'src/i18n/I18nProvider.tsx',
        'src/components/public-booking/public-locale-bootstrap.tsx',
      ],
      reportsDirectory: './coverage/public-locale',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
        'src/lib/business-public-profile-locales.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
