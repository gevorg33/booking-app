import {
  LEARNED_CADENCE_INTERVAL_SCENARIOS,
  LEARNED_CADENCE_RESOLVE_SCENARIOS,
} from './customer-rebooking-cadence.fixtures.js';
import {
  buildLearnedCadenceMetadataUpdate,
  computeMedianRebookingIntervalDays,
  mergeLearnedCadenceByServiceMetadata,
  readCustomerLearnedCadenceDays,
  readCustomerServiceLearnedCadenceDays,
  resolveCustomerRebookingCadenceDays,
} from './customer-rebooking-cadence.util.js';

describe('customer-rebooking-cadence.util', () => {
  it.each(LEARNED_CADENCE_INTERVAL_SCENARIOS)(
    'computes median interval ($id)',
    ({ intervals, expectedDays }) => {
      const median = computeMedianRebookingIntervalDays(
        intervals.map((row) => ({
          completedAt: new Date(row.completedAt),
          previousCompletedAt: new Date(row.previousCompletedAt),
        })),
      );
      expect(median).toBe(expectedDays);
    },
  );

  it.each(LEARNED_CADENCE_RESOLVE_SCENARIOS)(
    'resolves cadence days ($id)',
    ({
      serviceCadenceDays,
      defaultCadenceDays,
      learnedFromHistory,
      metadataByService,
      serviceId,
      expectedDays,
    }) => {
      const days = resolveCustomerRebookingCadenceDays({
        service: { metadata: { rebookingCadenceDays: serviceCadenceDays } },
        settings: { defaultRebookingCadenceDays: defaultCadenceDays },
        customerMetadata: metadataByService
          ? { learnedRebookingCadenceByService: metadataByService }
          : undefined,
        serviceId,
        learnedFromHistory,
      });
      expect(days).toBe(expectedDays);
    },
  );

  it('reads learned cadence from customer metadata', () => {
    expect(readCustomerLearnedCadenceDays(buildLearnedCadenceMetadataUpdate(28))).toBe(
      28,
    );
  });

  it('reads per-service learned cadence before flat fallback', () => {
    const metadata = mergeLearnedCadenceByServiceMetadata(
      buildLearnedCadenceMetadataUpdate(45),
      'svc-color',
      63,
    );
    expect(readCustomerServiceLearnedCadenceDays(metadata, 'svc-color')).toBe(63);
    expect(readCustomerServiceLearnedCadenceDays(metadata, 'svc-other')).toBe(45);
  });
});
