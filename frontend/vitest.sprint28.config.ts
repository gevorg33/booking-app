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
      'src/lib/business-currency.spec.ts',
      'src/lib/business-currency.integration.spec.ts',
      'src/lib/business-currency.display.integration.spec.ts',
      'src/lib/business-currency.stripe.integration.spec.ts',
      'src/lib/reports-currency.integration.spec.ts',
      'src/lib/business-currency.dashboard.integration.spec.ts',
      'src/lib/public-currency.spec.ts',
      'src/lib/public-currency.integration.spec.ts',
      'src/hooks/use-business-currency.spec.tsx',
      'src/hooks/use-business-currency.integration.spec.tsx',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/business-currency.ts',
        'src/lib/public-currency.ts',
        'src/hooks/use-business-currency.ts',
      ],
      reportsDirectory: './coverage/sprint28',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
