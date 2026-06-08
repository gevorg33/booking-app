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
      'src/lib/deferred-install-link.util.spec.ts',
      'src/lib/consumer-app-banner.util.spec.ts',
      'src/lib/consumer-app-platform.spec.ts',
      'src/lib/tenant-app-install.util.spec.ts',
      'src/lib/consumer-app-link.util.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/deferred-install-link.util.ts',
        'src/lib/consumer-app-banner.util.ts',
        'src/lib/consumer-app-platform.ts',
        'src/lib/tenant-app-install.util.ts',
        'src/lib/consumer-app-link.util.ts',
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
