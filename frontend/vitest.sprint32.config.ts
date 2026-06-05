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
      'src/lib/product-recommendation.spec.ts',
      'src/lib/product-recommendation.integration.spec.ts',
      'src/lib/product-recommendation-analytics.spec.ts',
      'src/lib/product-recommendation-analytics.integration.spec.ts',
      'src/lib/product-recommendation-analytics-18.integration.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/product-recommendation.ts',
        'src/lib/product-recommendation-analytics.ts',
      ],
      reportsDirectory: './coverage/sprint32',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
