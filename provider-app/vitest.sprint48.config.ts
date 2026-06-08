import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@shared-i18n': path.resolve(__dirname, '../frontend/src/i18n'),
    },
  },
  test: {
    environment: 'happy-dom',
    include: [
      'src/lib/crash-reporting.util.spec.ts',
      'src/lib/app-startup.util.spec.ts',
      'src/lib/app-version-gate.util.spec.ts',
      'src/lib/app-version-gate-copy.util.spec.ts',
      'src/lib/mobile-a11y.util.spec.ts',
      'src/lib/mobile-adoption-surfaces.util.spec.ts',
    ],
  },
});
