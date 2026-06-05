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
      'src/lib/clinic-service.spec.ts',
      'src/lib/clinic-booking.integration.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/lib/clinic-service.ts'],
      reportsDirectory: './coverage/sprint31',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
