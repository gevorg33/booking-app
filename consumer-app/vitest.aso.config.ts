import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'store-listings/store-listing.util.spec.ts',
      'store-listings/export-store-listings.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['store-listings/**/*.ts'],
      exclude: ['store-listings/**/*.spec.ts', 'store-listings/generated/**'],
      reportsDirectory: './coverage/aso',
      thresholds: {
        statements: 90,
        branches: 70,
        functions: 90,
        lines: 90,
      },
    },
  },
});
