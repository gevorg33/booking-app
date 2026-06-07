import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['src/components/**', 'happy-dom'],
      ['src/pages/**', 'happy-dom'],
      ['src/lib/deep-link.spec.ts', 'happy-dom'],
    ],
    include: [
      'src/lib/clinic-service.spec.ts',
      'src/lib/public-clinic-results.spec.ts',
      'src/lib/public-clinic-lab-booking-requests.spec.ts',
      'src/lib/clinic-lab-state.spec.ts',
      'src/lib/consumer-copy.spec.ts',
      'src/lib/deep-link.spec.ts',
      'src/lib/clinic-patient-alerts.spec.ts',
      'src/components/ConsumerMyResultsList.spec.tsx',
      'src/components/ConsumerMyLabBookingRequestsList.spec.tsx',
      'src/components/ConsumerPatientAlertsBanner.spec.tsx',
      'src/components/SalonTabs.spec.ts',
      'src/pages/LabRequestsPage.integration.spec.tsx',
      'src/pages/LabToBookPage.integration.spec.tsx',
      'src/pages/SalonHomePage.integration.spec.tsx',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/clinic-service.ts',
        'src/lib/deep-link.ts',
        'src/lib/public-clinic-results.ts',
        'src/lib/public-clinic-lab-booking-requests.ts',
        'src/lib/clinic-lab-state.ts',
        'src/lib/consumer-copy-catalog.ts',
        'src/lib/copy.ts',
        'src/pages/LabRequestsPage.tsx',
        'src/components/ConsumerMyResultsList.tsx',
        'src/components/ConsumerMyLabBookingRequestsList.tsx',
        'src/components/ConsumerPatientAlertsBanner.tsx',
        'src/lib/clinic-patient-alerts.ts',
      ],
      reportsDirectory: './coverage/sprint54',
      thresholds: {
        statements: 99,
        branches: 90,
        functions: 100,
        lines: 99,
      },
    },
  },
});
