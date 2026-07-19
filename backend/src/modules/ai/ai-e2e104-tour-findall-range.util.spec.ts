import { E2E104_TOUR_FINDALL_RANGE_SCENARIOS } from './ai-e2e104-tour-findall-range.fixtures.js';
import { handleDiagnoseTourCapacityLogic } from './ai-tour-capacity.logic.js';
import { TOUR_SERVICE_TYPE } from '../../common/utils/tour-service.util.js';

describe('e2e-bug.104 tour findAll date-range (no start_time SQL)', () => {
  it.each(
    E2E104_TOUR_FINDALL_RANGE_SCENARIOS.map((row) => [row.id, row] as const),
  )(
    'diagnose_tour_capacity calls findAll with same-day range for $id',
    async (_id, row) => {
      const findAll = jest.fn().mockResolvedValue([]);
      const cityTour = {
        id: 'svc-city',
        name: 'Full Day City Tour',
        price: 80,
        currency: 'EUR',
        durationMinutes: 480,
        metadata: {
          serviceType: TOUR_SERVICE_TYPE,
          maxGroupSize: 12,
          durationDays: 1,
        },
      };
      const mountainTrek = {
        id: 'svc-mountain',
        name: '3-Day Mountain Trek',
        price: 240,
        currency: 'EUR',
        durationMinutes: 4320,
        metadata: {
          serviceType: TOUR_SERVICE_TYPE,
          maxGroupSize: 8,
          durationDays: 3,
        },
      };

      const result = await handleDiagnoseTourCapacityLogic(
        {
          serviceService: {
            findAll: jest.fn().mockResolvedValue([cityTour, mountainTrek]),
          },
          bookingService: { findAll },
        },
        'biz-tour',
        {
          tourGroupCheckout: true,
          serviceName: row.prompt.toLowerCase().includes('mountain')
            ? 'mountain trek'
            : 'City tour',
          paxCount: 8,
          requestedPax: 8,
          date: row.dateKey,
          aspect: 'all',
        },
        row.prompt,
      );

      expect(result.action).toBe('diagnose_tour_capacity');
      expect(result.summary).not.toMatch(/start_time does not exist/i);
      expect(findAll).toHaveBeenCalledWith(
        'biz-tour',
        undefined,
        undefined,
        false,
        row.dateKey,
        row.dateKey,
      );
    },
  );
});
