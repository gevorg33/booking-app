import {
  CLINIC_LAB_COLLECTION_SERVICE_SCENARIOS,
  type ClinicLabCollectionServiceScenario,
} from './clinic-lab-collection-service.fixtures.js';
import {
  collectLinkedCollectionServiceIds,
  mergeCollectionServiceCandidateIds,
} from './clinic-lab-collection-service.util.js';

describe('clinic-lab-collection-service.util', () => {
  it.each(CLINIC_LAB_COLLECTION_SERVICE_SCENARIOS)(
    'collects linked collection service ids for $id',
    (scenario: ClinicLabCollectionServiceScenario) => {
      expect(collectLinkedCollectionServiceIds(scenario.items)).toEqual(
        scenario.expectedServiceIds,
      );
    },
  );

  it('merges persisted collection service ids for pushed orders', () => {
    expect(mergeCollectionServiceCandidateIds(['svc-1'], 'svc-2')).toEqual([
      'svc-1',
      'svc-2',
    ]);
    expect(mergeCollectionServiceCandidateIds(['svc-1'], 'svc-1')).toEqual([
      'svc-1',
    ]);
    expect(mergeCollectionServiceCandidateIds([], null)).toEqual([]);
  });
});
