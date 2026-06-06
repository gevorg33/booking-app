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
      'src/lib/business-compliance.spec.ts',
      'src/lib/business-compliance.integration.spec.ts',
      'src/lib/compliance-workflow.spec.ts',
      'src/lib/compliance-workflow.integration.spec.ts',
      'src/lib/hipaa-session-timeout.spec.ts',
      'src/lib/cookie-consent.spec.ts',
      'src/lib/cookie-consent.integration.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/business-compliance.ts',
        'src/lib/compliance-workflow.ts',
        'src/lib/hipaa-session-timeout.ts',
        'src/lib/cookie-consent.ts',
      ],
      reportsDirectory: './coverage/sprint37',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
