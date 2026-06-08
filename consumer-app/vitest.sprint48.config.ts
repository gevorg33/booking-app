import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: [
      'src/lib/crash-reporting.util.spec.ts',
      'src/lib/app-startup.util.spec.ts',
      'src/lib/app-version-gate.util.spec.ts',
      'src/lib/offline-queue.spec.ts',
      'src/lib/consumer-offline-mutation.util.spec.ts',
      'src/lib/consumer-api-offline.util.spec.ts',
      'src/lib/cached-tenant-data.util.spec.ts',
      'src/lib/consumer-offline-response.util.spec.ts',
      'src/lib/consumer-network-ux.util.spec.ts',
      'src/lib/operation-feedback.util.spec.ts',
      'src/lib/mobile-a11y.util.spec.ts',
      'src/lib/mobile-adoption-surfaces.util.spec.ts',
      'src/lib/consumer-referral.util.spec.ts',
      'src/lib/consumer-growth-loops.util.spec.ts',
      'src/lib/deferred-install-link.util.spec.ts',
      'src/lib/store-review-prompt.util.spec.ts',
      'src/lib/consumer-rebook.util.spec.ts',
    ],
  },
});
