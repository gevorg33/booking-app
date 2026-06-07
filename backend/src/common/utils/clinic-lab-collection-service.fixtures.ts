import type { ClinicOrderItemCollectionServiceLinkInput } from './clinic-lab-collection-service.util.js';

export interface ClinicLabCollectionServiceScenario {
  id: string;
  items: ClinicOrderItemCollectionServiceLinkInput[];
  expectedServiceIds: string[];
}

export const CLINIC_LAB_COLLECTION_SERVICE_SCENARIOS: ClinicLabCollectionServiceScenario[] =
  [
    {
      id: 'single-test-type-service',
      items: [
        {
          type: 'test_type',
          testType: { serviceId: 'svc-draw', isActive: true },
        },
      ],
      expectedServiceIds: ['svc-draw'],
    },
    {
      id: 'dedupes-test-type-services',
      items: [
        {
          type: 'test_type',
          testType: { serviceId: 'svc-draw', isActive: true },
        },
        {
          type: 'test_type',
          testType: { serviceId: 'svc-draw', isActive: true },
        },
      ],
      expectedServiceIds: ['svc-draw'],
    },
    {
      id: 'panel-member-services',
      items: [
        {
          type: 'test_panel',
          testPanel: {
            items: [
              { testType: { serviceId: 'svc-draw', isActive: true } },
              { testType: { serviceId: 'svc-urine', isActive: true } },
            ],
          },
        },
      ],
      expectedServiceIds: ['svc-draw', 'svc-urine'],
    },
    {
      id: 'skips-inactive-test-types',
      items: [
        {
          type: 'test_type',
          testType: { serviceId: 'svc-draw', isActive: false },
        },
        {
          type: 'test_panel',
          testPanel: {
            items: [{ testType: { serviceId: 'svc-urine', isActive: true } }],
          },
        },
      ],
      expectedServiceIds: ['svc-urine'],
    },
    {
      id: 'ignores-unlinked-items',
      items: [
        {
          type: 'test_type',
          testType: { serviceId: null, isActive: true },
        },
        {
          type: 'test_panel',
          testPanel: {
            items: [{ testType: { serviceId: null, isActive: true } }],
          },
        },
      ],
      expectedServiceIds: [],
    },
  ];
