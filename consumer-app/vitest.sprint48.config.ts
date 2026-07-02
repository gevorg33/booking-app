import { defineConfig } from 'vitest/config';

/** adopt-5 — mobile adoption performance, reliability, offline, network, a11y gates. */
export default defineConfig({
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['src/components/**', 'happy-dom'],
      ['src/lib/mobile-a11y.util.spec.ts', 'happy-dom'],
      ['src/lib/mobile-adoption-surfaces.util.spec.ts', 'happy-dom'],
      ['src/lib/consumer-api-offline.util.spec.ts', 'happy-dom'],
      ['src/lib/offline-queue.spec.ts', 'happy-dom'],
    ],
    include: [
      'src/lib/consumer-network-ux.util.spec.ts',
      'src/lib/consumer-offline-mutation.util.spec.ts',
      'src/lib/consumer-offline-response.util.spec.ts',
      'src/lib/consumer-api-offline.util.spec.ts',
      'src/lib/offline-queue.spec.ts',
      'src/lib/mobile-a11y.util.spec.ts',
      'src/lib/mobile-adoption-surfaces.util.spec.ts',
    ],
  },
});
