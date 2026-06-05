import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: [
      'src/lib/business-locale.spec.ts',
      'src/lib/business-locale.integration.spec.ts',
      'src/lib/server-public-locale.spec.ts',
      'src/lib/service-packages.locale.integration.spec.ts',
      'src/lib/service-packages.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/business-locale.ts',
        'src/lib/service-packages.ts',
      ],
      reportsDirectory: './coverage/sprint29',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
