import { TOUR_SERVICE_TYPE } from '../../common/utils/tour-service.util.js';
import { E2E105_TOUR_COMPOUND_REGISTRY_SCENARIOS } from './ai-e2e105-tour-compound-registry.fixtures.js';
import { handleExplainTourBookingLogic } from './ai-tour-booking.logic.js';
import { parseExplainTourBookingFromPrompt } from './ai-tour-booking.util.js';
import { parseExplainTourDaySlotsFromPrompt } from './ai-tour-day-slots.util.js';
import {
  buildBookTourNearestDepartureCompoundParams,
  decomposeCustomerBookTourNearestDepartureCompoundPrompt,
  isBookTourNearestDepartureCompoundPrompt,
} from './ai-book-tour-nearest-departure.util.js';
import {
  buildTourGroupCheckoutCompoundParams,
  decomposeCustomerTourGroupCheckoutCompoundPrompt,
  isTourGroupCheckoutCompoundPrompt,
} from './ai-tour-group-checkout-compound.util.js';

describe('e2e-bug.105 tour compound registry examples', () => {
  const catalog = [
    {
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
    },
    {
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
    },
    {
      id: 'svc-wine',
      name: 'Private Wine Country Day',
      price: 150,
      currency: 'EUR',
      durationMinutes: 480,
      metadata: {
        serviceType: TOUR_SERVICE_TYPE,
        maxGroupSize: 10,
        durationDays: 1,
      },
    },
  ];

  it.each(
    E2E105_TOUR_COMPOUND_REGISTRY_SCENARIOS.filter(
      (row) => row.recipe === 'book_tour_nearest_departure',
    ).map((row) => [row.id, row] as const),
  )(
    'nearest-departure registry prompt parses compound explain steps ($id)',
    (_id, row) => {
      expect(isBookTourNearestDepartureCompoundPrompt(row.prompt)).toBe(true);
      const params = buildBookTourNearestDepartureCompoundParams(row.prompt);
      expect(params.serviceName).toBeTruthy();
      expect(params.bookingFirstAvailable).toBe(true);
      expect(params.paxCount).toBe(row.paxCount);

      const explain = parseExplainTourBookingFromPrompt(row.prompt, {
        ...params,
        aspect: 'all',
      });
      expect(explain).not.toBeNull();
      expect(explain?.serviceName).toBeTruthy();

      const daySlots = parseExplainTourDaySlotsFromPrompt(row.prompt, {
        ...params,
        aspect: 'remainingSpots',
      });
      expect(daySlots).not.toBeNull();
      expect(daySlots?.serviceName).toBeTruthy();

      const steps = decomposeCustomerBookTourNearestDepartureCompoundPrompt(
        row.prompt,
      );
      expect(steps.map((step) => step.action)).toEqual([
        'explain_tour_booking',
        'explain_tour_day_slots',
        'book_nearest_slot',
      ]);
    },
  );

  it.each(
    E2E105_TOUR_COMPOUND_REGISTRY_SCENARIOS.filter(
      (row) => row.recipe === 'tour_group_checkout',
    ).map((row) => [row.id, row] as const),
  )(
    'group-checkout registry prompt keeps compound service context ($id)',
    (_id, row) => {
      expect(isTourGroupCheckoutCompoundPrompt(row.prompt)).toBe(true);
      const params = buildTourGroupCheckoutCompoundParams(row.prompt);
      expect(params.tourGroupCheckout).toBe(true);
      expect(params.serviceName).toBeTruthy();
      expect(params.paxCount).toBe(row.paxCount);

      const explain = parseExplainTourBookingFromPrompt(row.prompt, {
        ...params,
        aspect: 'groupSize',
      });
      expect(explain).not.toBeNull();

      const steps = decomposeCustomerTourGroupCheckoutCompoundPrompt(
        row.prompt,
      );
      expect(steps.map((step) => step.action)).toEqual([
        'explain_tour_booking',
        'diagnose_tour_capacity',
        'book_nearest_slot',
      ]);
    },
  );

  it.each(
    E2E105_TOUR_COMPOUND_REGISTRY_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )(
    'explain_tour_booking resolves nickname against realistic catalog ($id)',
    async (_id, row) => {
      const serviceService = {
        findAll: jest.fn(async () => catalog),
      };
      const result = await handleExplainTourBookingLogic(
        { serviceService },
        'biz-tour',
        {
          serviceName: row.serviceNickname,
          aspect: 'all',
          bookingFirstAvailable: row.recipe === 'book_tour_nearest_departure',
          tourGroupCheckout: row.recipe === 'tour_group_checkout',
        },
        row.prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_tour_booking');
      expect(result.details?.serviceName).toBe(row.catalogName);
      expect(result.summary).not.toMatch(
        /Ask about a tour on the booking page/i,
      );
      expect(result.summary).not.toMatch(/Could not find a catalog service/i);
    },
  );
});
