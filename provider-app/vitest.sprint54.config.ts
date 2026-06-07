import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../frontend/src'),
      '@shared-i18n': path.resolve(__dirname, '../frontend/src/i18n'),
      '@booking-lib': path.resolve(__dirname, '../frontend/src/lib'),
    },
  },
  test: {
    environment: 'happy-dom',
    include: [
      'src/components/ProviderLabResultsList.spec.tsx',
      'src/components/ProviderClinicTasksList.spec.tsx',
      'src/components/ProviderClinicTasksList.i18n.integration.spec.tsx',
      'src/lib/provider-app.i18n.integration.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/components/ProviderLabResultsList.tsx',
        'src/components/ProviderClinicTasksList.tsx',
        'src/lib/provider-clinic-tasks.ts',
      ],
      reportsDirectory: './coverage/sprint54',
      thresholds: {
        statements: 95,
        branches: 85,
        functions: 100,
        lines: 95,
      },
    },
  },
});
