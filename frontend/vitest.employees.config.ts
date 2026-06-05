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
      'src/lib/employee-access-role.util.spec.ts',
      'src/lib/employee-types.spec.ts',
      'src/components/employees/employee-form-modal.integration.spec.tsx',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/employee-access-role.util.ts',
        'src/lib/employee-types.ts',
      ],
      reportsDirectory: './coverage/employees',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
        'src/lib/employee-access-role.util.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/lib/employee-types.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
