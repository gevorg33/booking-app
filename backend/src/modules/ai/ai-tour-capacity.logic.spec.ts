import { BookingStatus } from '../booking/entities/booking.entity.js';
import { handleDiagnoseTourCapacityLogic } from './ai-tour-capacity.logic.js';

describe('ai-tour-capacity.logic (ai-cmd-tour-9)', () => {
  const mountainTrek = {
    id: 'svc-mountain',
    name: '3-Day Mountain Trek',
    metadata: { serviceType: 'tour', maxGroupSize: 8 },
  };

  const bookingService = {
    findAll: jest.fn(async () => [
      {
        id: 'bk-1',
        serviceId: 'svc-mountain',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-08-15T08:00:00.000Z'),
        endTime: new Date('2026-08-18T08:00:00.000Z'),
        metadata: { paxCount: 6, tourStartDate: '2026-08-15' },
      },
    ]),
  };

  const serviceService = {
    findAll: jest.fn(async () => [mountainTrek]),
  };

  const deps = () => ({ serviceService, bookingService });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('diagnoses insufficient spots when requested pax exceeds remaining capacity', async () => {
    const result = await handleDiagnoseTourCapacityLogic(
      deps(),
      'biz-1',
      {},
      'Why did checkout reject 4 people for the mountain trek on 15/08/2026?',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('diagnose_tour_capacity');
    expect(result.summary).toContain('Only 2 spots remaining');
    expect(result.summary).toContain('checkout rejects 4 pax');
    expect(result.details).toMatchObject({
      requestedPax: 4,
      clampedPax: 4,
      bookedPax: 6,
      remainingSpots: 2,
      rejectionReason: 'insufficientSpots',
    });
  });

  it('diagnoses fully booked date', async () => {
    bookingService.findAll.mockResolvedValueOnce([
      {
        id: 'bk-full',
        serviceId: 'svc-mountain',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-08-15T08:00:00.000Z'),
        endTime: new Date('2026-08-18T08:00:00.000Z'),
        metadata: { paxCount: 8, tourStartDate: '2026-08-15' },
      },
    ]);

    const result = await handleDiagnoseTourCapacityLogic(
      deps(),
      'biz-1',
      {
        serviceName: '3-Day Mountain Trek',
        date: '2026-08-15',
        requestedPax: 1,
      },
      "This tour date is fully booked — why can't I checkout?",
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('fully booked');
    expect(result.details?.rejectionReason).toBe('fullyBooked');
  });

  it('diagnoses pax clamp when requested above max group', async () => {
    bookingService.findAll.mockResolvedValueOnce([]);

    const result = await handleDiagnoseTourCapacityLogic(
      deps(),
      'biz-1',
      {},
      "Checkout won't accept 10 pax for City Tour — why?",
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Could not find');
  });

  it('explains clamp for over-max pax when service resolves', async () => {
    bookingService.findAll.mockResolvedValueOnce([]);

    const result = await handleDiagnoseTourCapacityLogic(
      deps(),
      'biz-1',
      { serviceName: '3-Day Mountain Trek', requestedPax: 10 },
      "Checkout won't accept 10 pax — why?",
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('clamps pax from 10 to 8');
    expect(result.details?.clampedPax).toBe(8);
  });
});
