import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/lib/business-date-format.spec.ts',
      'src/lib/date-format.spec.ts',
      'src/stores/tenant-store.date-format.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/lib/business-date-format.ts'],
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
