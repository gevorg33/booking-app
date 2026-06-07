import { BookingStatus } from '../booking/entities/booking.entity.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';
import { addDaysToDateKey } from '../../common/utils/timezone.util.js';
import { handleListUpcomingTourDeparturesLogic } from './ai-upcoming-tour-departures.logic.js';

describe('ai-upcoming-tour-departures.logic (ai-cmd-tour-8)', () => {
  const departureDate = addDaysToDateKey(getTodayDateKey(), 10);
  const departureDate2 = addDaysToDateKey(departureDate, 3);

  const mountainTrek = {
    id: 'svc-mountain',
    name: '3-Day Mountain Trek',
    metadata: { serviceType: 'tour', maxGroupSize: 8 },
  };

  const cityTour = {
    id: 'svc-city',
    name: 'City Tour',
    metadata: { serviceType: 'tour', maxGroupSize: 12 },
  };

  const bookingService = {
    findAll: jest.fn(async () => [
      {
        id: 'bk-1',
        serviceId: 'svc-mountain',
        status: BookingStatus.CONFIRMED,
        startTime: new Date(`${departureDate}T08:00:00.000Z`),
        endTime: new Date(
          `${addDaysToDateKey(departureDate, 2)}T18:00:00.000Z`,
        ),
        metadata: { paxCount: 3, tourStartDate: departureDate },
        service: mountainTrek,
        customer: { name: 'Alice' },
      },
      {
        id: 'bk-2',
        serviceId: 'svc-mountain',
        status: BookingStatus.CONFIRMED,
        startTime: new Date(`${departureDate}T08:00:00.000Z`),
        endTime: new Date(
          `${addDaysToDateKey(departureDate, 2)}T18:00:00.000Z`,
        ),
        metadata: { paxCount: 2, tourStartDate: departureDate },
        service: mountainTrek,
        customer: { name: 'Bob' },
      },
      {
        id: 'bk-3',
        serviceId: 'svc-city',
        status: BookingStatus.CONFIRMED,
        startTime: new Date(`${departureDate2}T09:00:00.000Z`),
        endTime: new Date(`${departureDate2}T17:00:00.000Z`),
        metadata: { paxCount: 4, tourStartDate: departureDate2 },
        service: cityTour,
        customer: { name: 'Carol' },
      },
      {
        id: 'bk-pending',
        serviceId: 'svc-city',
        status: BookingStatus.PENDING,
        startTime: new Date(`${departureDate2}T09:00:00.000Z`),
        endTime: new Date(`${departureDate2}T17:00:00.000Z`),
        metadata: { paxCount: 5, tourStartDate: departureDate2 },
        service: cityTour,
        customer: { name: 'Dan' },
      },
    ]),
  };

  const serviceService = {
    findAll: jest.fn(async () => [mountainTrek, cityTour]),
  };

  const deps = () => ({ serviceService, bookingService });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aggregates confirmed departures with booked pax and remaining capacity', async () => {
    const result = await handleListUpcomingTourDeparturesLogic(
      deps(),
      'biz-1',
      {},
      'List upcoming tour departures with pax and remaining capacity',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('list_upcoming_tour_departures');
    expect(result.summary).toContain('5 pax booked');
    expect(result.summary).toContain('3 remaining');
    expect(result.details?.departureCount).toBe(2);
    expect(result.details?.departures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          serviceName: '3-Day Mountain Trek',
          bookedPax: 5,
          remainingCapacity: 3,
          bookingCount: 2,
        }),
        expect.objectContaining({
          serviceName: 'City Tour',
          bookedPax: 4,
          remainingCapacity: 8,
          bookingCount: 1,
        }),
      ]),
    );
  });

  it('filters by service name', async () => {
    const result = await handleListUpcomingTourDeparturesLogic(
      deps(),
      'biz-1',
      {},
      'Summarize mountain trek departures with remaining capacity',
    );

    expect(result.success).toBe(true);
    expect(result.details?.departureCount).toBe(1);
    expect(result.details?.departures?.[0]).toMatchObject({
      serviceName: '3-Day Mountain Trek',
      bookedPax: 5,
      remainingCapacity: 3,
    });
  });

  it('excludes non-confirmed bookings from aggregation', async () => {
    const result = await handleListUpcomingTourDeparturesLogic(
      deps(),
      'biz-1',
      {},
      'Summarize confirmed tour departures by departure date',
    );

    const cityDeparture = (
      result.details?.departures as Array<{
        serviceName: string;
        bookedPax: number;
      }>
    )?.find((item) => item.serviceName === 'City Tour');
    expect(cityDeparture?.bookedPax).toBe(4);
  });
});
