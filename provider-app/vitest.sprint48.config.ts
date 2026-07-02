import path from 'node:path';
import { defineConfig } from 'vitest/config';

/** adopt-5 — mobile adoption performance, reliability, version gate, a11y gates. */
export default defineConfig({
  resolve: {
    alias: {
      '@shared-i18n': path.resolve(__dirname, '../frontend/src/i18n'),
    },
  },
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['src/components/**', 'happy-dom'],
      ['src/lib/mobile-a11y.util.spec.ts', 'happy-dom'],
      ['src/lib/mobile-adoption-surfaces.util.spec.ts', 'happy-dom'],
      ['src/lib/provider-a11y.integration.spec.ts', 'happy-dom'],
    ],
    include: [
      'src/lib/app-version-gate-copy.util.spec.ts',
      'src/lib/mobile-a11y.util.spec.ts',
      'src/lib/mobile-adoption-surfaces.util.spec.ts',
      'src/lib/provider-a11y.integration.spec.ts',
    ],
  },
});
