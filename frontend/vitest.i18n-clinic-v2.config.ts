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
    include: ['src/lib/clinic-i18n.integration.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/clinic-i18n.ts'],
      reportsDirectory: './coverage/i18n-clinic-v2',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
