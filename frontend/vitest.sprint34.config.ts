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
    environmentMatchGlobs: [
      ['src/lib/**', 'node'],
      ['src/components/**', 'happy-dom'],
    ],
    include: [
      'src/lib/business-date-format.spec.ts',
      'src/lib/business-date-format.integration.spec.ts',
      'src/lib/business-date-format-dashboard.integration.spec.ts',
      'src/lib/business-date-format-16.integration.spec.ts',
      'src/lib/business-date-format-17.integration.spec.ts',
      'src/lib/business-date-input.integration.spec.ts',
      'src/components/ui/date-picker-17.integration.spec.tsx',
      'src/components/business-date-format-bootstrap.integration.spec.tsx',
      'src/lib/store.date-format.spec.ts',
      'src/lib/date-format.spec.ts',
      'src/lib/date-format.dashboard.integration.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/lib/business-date-format.ts', 'src/lib/date-format.ts'],
      reportsDirectory: './coverage/sprint34',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
