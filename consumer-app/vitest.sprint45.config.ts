import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/lib/deferred-install-link.util.spec.ts',
      'src/lib/store-review-prompt.util.spec.ts',
      'src/lib/deep-link.spec.ts',
      'src/lib/customer-auth.spec.ts',
      'src/lib/recent-salons.spec.ts',
      'src/lib/consumer-universal-link.util.spec.ts',
      'src/lib/tenant-locale.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/deferred-install-link.util.ts',
        'src/lib/store-review-prompt.util.ts',
        'src/lib/deep-link.ts',
        'src/lib/deep-link-launch.util.ts',
        'src/lib/customer-auth.ts',
        'src/lib/recent-salons.ts',
        'src/lib/consumer-universal-link.util.ts',
        'src/lib/tenant-locale.ts',
      ],
      reportsDirectory: './coverage/sprint45',
      thresholds: {
        statements: 90,
        branches: 70,
        functions: 90,
        lines: 90,
      },
    },
  },
});
