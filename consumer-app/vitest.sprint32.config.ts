import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/lib/product-recommendation.spec.ts',
      'src/lib/product-recommendation.integration.spec.ts',
      'src/lib/checkout-recommendations.spec.ts',
      'src/lib/checkout-recommendations-16.integration.spec.ts',
      'src/lib/product-recommendation-analytics.spec.ts',
      'src/lib/product-recommendation-analytics.integration.spec.ts',
      'src/lib/product-recommendation-analytics-18.integration.spec.ts',
      'src/lib/resolve-public-image-url.spec.ts',
      'src/services/api-base.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/product-recommendation.ts',
        'src/lib/checkout-recommendations.ts',
        'src/lib/product-recommendation-analytics.ts',
        'src/lib/resolve-public-image-url.ts',
        'src/services/api-base.ts',
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
