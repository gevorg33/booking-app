import {
  handleApplyTourPlaybookLogic,
  handleConfigureTourServiceLogic,
  handleExplainTourServicesLogic,
} from './ai-tour-service.logic.js';
import { makeService } from '../service/entities/service.test-fixture.js';
import { makeCustomer } from '../customer/entities/customer.test-fixture.js';
import { makeBooking } from '../booking/entities/booking.test-fixture.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';
import { addDaysToDateKey } from '../../common/utils/timezone.util.js';

describe('ai-tour-service.logic (ai-cmd-tour-1)', () => {
  const services = [
    makeService({
      id: 'svc-city',
      name: 'City Tour',
      metadata: {},
      durationMinutes: 480,
    }),
    makeService({
      id: 'svc-1',
      name: 'Full Day City Tour',
      metadata: {
        serviceType: 'tour',
        maxGroupSize: 12,
        coverImage: '/placeholders/tours/city-day.jpg',
      },
      durationMinutes: 480,
    }),
    makeService({
      id: 'svc-2',
      name: '3-Day Mountain Trek',
      metadata: {
        serviceType: 'tour',
        difficulty: 'challenging',
        maxGroupSize: 8,
      },
      durationMinutes: 4320,
    }),
    makeService({
      id: 'svc-3',
      name: 'Sunset Coastal Drive',
      metadata: {},
      durationMinutes: 300,
    }),
  ];

  const tourStartDate = addDaysToDateKey(getTodayDateKey(), 7, 'UTC');
  const tourEndDate = addDaysToDateKey(tourStartDate, 2, 'UTC');

  const bookingService = {
    // `findOne` is required by the deps interface because this object is
    // forwarded to the tour-booking-record and meeting-point logic, which call it.
    findOne: jest.fn(async () => makeBooking({ id: 'bk-1' })),
    findAll: jest.fn(async () => [
      makeBooking({
        id: 'bk-1',
        serviceId: 'svc-2',
        status: BookingStatus.CONFIRMED,
        startTime: new Date(`${tourStartDate}T08:00:00.000Z`),
        endTime: new Date(`${tourEndDate}T18:00:00.000Z`),
        metadata: {
          paxCount: 5,
          tourStartDate,
          tourEndDate,
        },
        service: makeService({
          name: '3-Day Mountain Trek',
          metadata: { serviceType: 'tour' },
        }),
        customer: makeCustomer({ name: 'Anna Guest' }),
      }),
    ]),
  };

  const serviceService = {
    findAll: jest.fn(async () => [...services]),
    update: jest.fn(async (id: string, dto: Record<string, unknown>) => {
      const base = services.find((item) => item.id === id)!;
      return {
        ...base,
        metadata: {
          ...(base.metadata ?? {}),
          ...(dto.serviceType ? { serviceType: dto.serviceType } : {}),
          ...(dto.maxGroupSize !== undefined
            ? { maxGroupSize: dto.maxGroupSize }
            : {}),
          ...(dto.difficulty ? { difficulty: dto.difficulty } : {}),
          ...(dto.meetingPoint ? { meetingPoint: dto.meetingPoint } : {}),
          ...(dto.durationDays !== undefined
            ? { durationDays: dto.durationDays }
            : {}),
          ...(dto.includedItems ? { includedItems: dto.includedItems } : {}),
          ...(dto.coverImage ? { coverImage: dto.coverImage } : {}),
        },
      };
    }),
  };

  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-tour',
      settings: { businessType: 'tour_operator' },
    })),
  };

  const onboardingService = {
    applyVerticalPlaybook: jest.fn(async () => ({
      playbookId: 'tour',
      categoriesCreated: 3,
      servicesCreated: 5,
      slotsCreated: 70,
      templatesApplied: ['Tour operating hours'],
      employeeName: 'Guide',
      status: 'configured',
    })),
  };

  const deps = () => ({ serviceService, bookingService });
  const playbookDeps = () => ({ businessRepo, onboardingService });

  beforeEach(() => {
    jest.clearAllMocks();
    serviceService.findAll.mockResolvedValue([...services]);
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-tour',
      settings: { businessType: 'tour_operator' },
    });
    onboardingService.applyVerticalPlaybook.mockResolvedValue({
      playbookId: 'tour',
      categoriesCreated: 3,
      servicesCreated: 5,
      slotsCreated: 70,
      templatesApplied: ['Tour operating hours'],
      employeeName: 'Guide',
      status: 'configured',
    });
  });

  it('marks City Tour as a tour with max 12 people', async () => {
    const result = await handleConfigureTourServiceLogic(
      deps(),
      'biz-1',
      {},
      'Mark City Tour as a tour with max 12 people',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('configure_tour_service');
    expect(serviceService.update).toHaveBeenCalledWith(
      'svc-city',
      expect.objectContaining({
        serviceType: 'tour',
        maxGroupSize: 12,
      }),
    );
  });

  it('sets difficulty to moderate for mountain trek', async () => {
    const result = await handleConfigureTourServiceLogic(
      deps(),
      'biz-1',
      {},
      'Set difficulty to moderate for the mountain trek',
    );

    expect(result.success).toBe(true);
    expect(serviceService.update).toHaveBeenCalledWith(
      'svc-2',
      expect.objectContaining({ difficulty: 'moderate' }),
    );
  });

  it('returns clarify when prompt cannot be parsed', async () => {
    const result = await handleConfigureTourServiceLogic(
      deps(),
      'biz-1',
      {},
      '',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('applies tour playbook for tour_operator business', async () => {
    const result = await handleApplyTourPlaybookLogic(
      playbookDeps(),
      'biz-tour',
      'user-1',
      {},
      'Apply tour playbook',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('apply_tour_playbook');
    expect(onboardingService.applyVerticalPlaybook).toHaveBeenCalledWith(
      'biz-tour',
      'user-1',
    );
    expect(result.summary).toContain('Tour playbook applied');
  });

  it('rejects apply tour playbook for non tour_operator business', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-salon',
      settings: { businessType: 'hair_salon' },
    });

    const result = await handleApplyTourPlaybookLogic(
      playbookDeps(),
      'biz-salon',
      'user-1',
      {},
      'Apply tour playbook',
    );

    expect(result.success).toBe(false);
    expect(onboardingService.applyVerticalPlaybook).not.toHaveBeenCalled();
    expect(result.summary).toContain('tour_operator');
  });

  it('requires signed-in user to apply tour playbook', async () => {
    const result = await handleApplyTourPlaybookLogic(
      playbookDeps(),
      'biz-tour',
      undefined,
      {},
      'Apply tour playbook',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(onboardingService.applyVerticalPlaybook).not.toHaveBeenCalled();
  });

  it('lists tour services and upcoming bookings', async () => {
    const result = await handleExplainTourServicesLogic(
      deps(),
      'biz-1',
      {},
      'List tour services with group sizes and cover images',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_tour_services');
    expect(result.details?.tourServices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '3-Day Mountain Trek',
          maxGroupSize: 8,
        }),
      ]),
    );
    expect(result.details?.upcomingBookings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          serviceName: '3-Day Mountain Trek',
          paxCount: 5,
          tourStartDate,
          tourEndDate,
        }),
      ]),
    );
  });
});
