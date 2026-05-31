import { BookingStatus, PaymentStatus } from './entities/booking.entity.js';
import { SlotStatus } from '../schedule/entities/scheduling-slot.entity.js';
import { BookingService } from './booking.service.js';

describe('BookingService same-visit multi-service create', () => {
  const bookingRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const slotRepo = {
    createQueryBuilder: jest.fn(),
  };
  const schedulingPeriodRepo = { find: jest.fn() };
  const serviceRepo = {
    findOne: jest.fn(),
  };
  const customerRepo = {
    findOne: jest.fn(),
  };
  const businessRepo = {
    findOne: jest.fn(),
  };
  const employeeRepo = { findOne: jest.fn() };
  const multiServiceGroupRepo = { findOne: jest.fn() };
  const schedulingEngine = {} as any;
  const eventStore = { publish: jest.fn() };
  const loyaltyAwardService = {} as any;
  const resourcesService = {
    getRequiredResourceIds: jest.fn().mockResolvedValue([]),
  };
  const subscriptionsService = {} as any;

  const savedBooking = {
    id: 'booking-1',
    businessId: 'biz-1',
    employeeId: 'emp-1',
    serviceId: 'svc-2',
    startTime: new Date('2026-06-02T10:50:00.000Z'),
    endTime: new Date('2026-06-02T11:50:00.000Z'),
    status: BookingStatus.CONFIRMED,
    paymentStatus: PaymentStatus.NOT_APPLICABLE,
  };

  let service: BookingService;
  let validateBookingWindow: jest.SpyInstance;
  let findSlotsInWindow: jest.SpyInstance;
  let transactionMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    transactionMock = jest.fn(async (cb) =>
      cb({
        createQueryBuilder: () => ({
          setLock: () => ({
            where: () => ({
              andWhere: () => ({
                andWhere: () => ({
                  andWhere: () => ({
                    andWhere: () => ({
                      andWhere: () => ({
                        getMany: jest.fn().mockResolvedValue([]),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
        create: (_entity: unknown, data: unknown) => data,
        save: async (_entity: unknown, data: Record<string, unknown>) => ({
          ...savedBooking,
          ...data,
        }),
      }),
    );

    service = new BookingService(
      bookingRepo as any,
      slotRepo as any,
      schedulingPeriodRepo as any,
      serviceRepo as any,
      customerRepo as any,
      businessRepo as any,
      employeeRepo as any,
      multiServiceGroupRepo as any,
      schedulingEngine,
      eventStore as any,
      { transaction: transactionMock } as any,
      loyaltyAwardService,
      resourcesService as any,
      subscriptionsService,
    );

    validateBookingWindow = jest
      .spyOn(service as any, 'validateBookingWindow')
      .mockRejectedValue(
        new Error(
          'The service provider does not offer this service for the entire requested time window.',
        ),
      );
    jest.spyOn(service as any, 'validateEmployeeCanPerformService').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'reconcileStuckSlotsInWindow').mockResolvedValue(undefined);
    findSlotsInWindow = jest.spyOn(service as any, 'findSlotsInWindow').mockResolvedValue([
      {
        id: 'slot-1',
        appointmentCount: 0,
        maxAppointmentCount: 1,
        status: SlotStatus.AVAILABLE,
      },
    ]);
    jest.spyOn(service, 'findOne').mockResolvedValue(savedBooking as any);

    serviceRepo.findOne.mockResolvedValue({
      id: 'svc-2',
      durationMinutes: 60,
      bufferMinutes: 0,
      prepaymentMode: 'none',
    });
    businessRepo.findOne.mockResolvedValue({ timezone: 'UTC' });
    customerRepo.findOne.mockResolvedValue({ id: 'cust-1' });
    bookingRepo.findOne.mockResolvedValue(null);
  });

  it('skips per-segment schedule validation for same-visit multi-service segments', async () => {
    await service.create(
      'biz-1',
      {
        employeeId: 'emp-1',
        serviceId: 'svc-2',
        customerId: 'cust-1',
        startTime: '2026-06-02T10:50:00.000Z',
        multiServiceGroupId: 'group-1',
      },
      undefined,
      { sameVisitMultiService: true },
    );

    expect(validateBookingWindow).not.toHaveBeenCalled();
    expect(findSlotsInWindow).toHaveBeenCalledWith(
      'biz-1',
      'emp-1',
      expect.any(Date),
      expect.any(Date),
      undefined,
    );
    expect(transactionMock).toHaveBeenCalled();
  });

  it('validates each segment when sameVisitMultiService is false', async () => {
    validateBookingWindow.mockResolvedValue(undefined);

    await service.create(
      'biz-1',
      {
        employeeId: 'emp-1',
        serviceId: 'svc-2',
        customerId: 'cust-1',
        startTime: '2026-06-02T10:50:00.000Z',
      },
      undefined,
      { sameVisitMultiService: false },
    );

    expect(validateBookingWindow).toHaveBeenCalledTimes(1);
    expect(findSlotsInWindow).toHaveBeenCalledWith(
      'biz-1',
      'emp-1',
      expect.any(Date),
      expect.any(Date),
      'svc-2',
    );
  });

  it('fails the second segment when per-segment validation is enforced', async () => {
    await expect(
      service.create(
        'biz-1',
        {
          employeeId: 'emp-1',
          serviceId: 'svc-2',
          customerId: 'cust-1',
          startTime: '2026-06-02T10:50:00.000Z',
          multiServiceGroupId: 'group-1',
        },
        undefined,
        { sameVisitMultiService: false },
      ),
    ).rejects.toThrow('does not offer this service');
  });
});
