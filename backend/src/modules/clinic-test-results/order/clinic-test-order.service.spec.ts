import { BadRequestException } from '@nestjs/common';
import { BookingStatus } from '../../booking/entities/booking.entity.js';
import { ClinicTestOrderService } from './clinic-test-order.service.js';

describe('ClinicTestOrderService', () => {
  const bookingRepo = { findOne: jest.fn() };
  const businessRepo = { findOne: jest.fn() };
  const serviceRepo = { findOne: jest.fn() };
  const orderRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => ({
      ...v,
      id: v.id ?? 'order-1',
      createdAt: new Date(),
    })),
    createQueryBuilder: jest.fn(),
  };
  const orderItemRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => v),
  };
  const orderHistoryRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => v),
  };
  const testTypeRepo = { findOne: jest.fn() };
  const clinicLabPhiService = {
    encryptStatusHistoryNoteForStorage: jest.fn(async (_b, note) => note),
  };
  const clinicSpecimenService = {
    ensureSpecimenForOrder: jest.fn(async () => ({ id: 'spec-1' })),
  };
  const clinicTestResultService = {
    ensureResultForOrder: jest.fn(async () => ({ id: 'result-1' })),
  };

  const service = new ClinicTestOrderService(
    bookingRepo as any,
    businessRepo as any,
    serviceRepo as any,
    orderRepo as any,
    orderItemRepo as any,
    orderHistoryRepo as any,
    testTypeRepo as any,
    clinicLabPhiService as any,
    clinicSpecimenService as any,
    clinicTestResultService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'clinic' },
    });
  });

  it('auto-creates a lab order for confirmed lab_test bookings', async () => {
    bookingRepo.findOne.mockResolvedValue({
      id: 'booking-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      status: BookingStatus.CONFIRMED,
      service: {
        id: 'svc-1',
        name: 'CBC',
        metadata: { serviceType: 'lab_test', clinicTestTypeId: 'type-1' },
      },
    });
    orderRepo.findOne.mockResolvedValue(null);
    testTypeRepo.findOne.mockResolvedValue({
      id: 'type-1',
      title: 'Complete blood count',
      businessId: 'biz-1',
      isActive: true,
    });

    const order = await service.maybeCreateOrderForBooking('booking-1');

    expect(order?.displayNames).toBe('Complete blood count');
    expect(orderItemRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ testTypeId: 'type-1' }),
    );
    expect(orderHistoryRepo.save).toHaveBeenCalled();
    expect(clinicTestResultService.ensureResultForOrder).toHaveBeenCalled();
  });

  it('returns existing order without creating duplicates', async () => {
    bookingRepo.findOne.mockResolvedValue({
      id: 'booking-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      status: BookingStatus.CONFIRMED,
      service: {
        id: 'svc-1',
        name: 'CBC',
        metadata: { serviceType: 'lab_test' },
      },
    });
    orderRepo.findOne.mockResolvedValue({ id: 'order-existing' });

    const order = await service.maybeCreateOrderForBooking('booking-1');

    expect(order?.id).toBe('order-existing');
    expect(orderRepo.save).not.toHaveBeenCalled();
  });

  it('skips non-lab bookings', async () => {
    bookingRepo.findOne.mockResolvedValue({
      id: 'booking-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      status: BookingStatus.CONFIRMED,
      service: {
        id: 'svc-1',
        name: 'Consult',
        metadata: { serviceType: 'consultation' },
      },
    });

    await expect(
      service.maybeCreateOrderForBooking('booking-1'),
    ).resolves.toBeNull();
  });

  it('creates manual orders for confirmed clinic bookings', async () => {
    bookingRepo.findOne.mockResolvedValue({
      id: 'booking-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      status: BookingStatus.CONFIRMED,
      service: {
        id: 'svc-1',
        name: 'CBC',
        metadata: { serviceType: 'lab_test', clinicTestTypeId: 'type-1' },
      },
    });
    orderRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'order-1',
        businessId: 'biz-1',
        bookingId: 'booking-1',
        customerId: 'cust-1',
        employeeId: 'emp-1',
        status: 'NotCollected',
        displayNames: 'CBC',
        items: [{ testTypeId: 'type-1' }],
        createdAt: new Date(),
      });
    testTypeRepo.findOne.mockResolvedValue({
      id: 'type-1',
      title: 'CBC',
      businessId: 'biz-1',
      isActive: true,
    });
    orderRepo.save.mockImplementation(async (v) => ({
      ...v,
      id: 'order-1',
      createdAt: new Date(),
    }));

    const order = await service.createManualOrderForBooking(
      'biz-1',
      'booking-1',
    );
    expect(order.id).toBe('order-1');
  });

  it('lists orders for a booking', async () => {
    orderRepo.find.mockResolvedValue([
      {
        id: 'order-1',
        businessId: 'biz-1',
        bookingId: 'booking-1',
        customerId: 'cust-1',
        employeeId: 'emp-1',
        status: 'NotCollected',
        displayNames: 'CBC',
        items: [{ testTypeId: 'type-1' }],
        createdAt: new Date(),
      },
    ]);

    const orders = await service.listOrdersForBooking('biz-1', 'booking-1');
    expect(orders).toHaveLength(1);
    expect(orders[0].testTypeId).toBe('type-1');
  });

  it('rejects manual order for pending bookings', async () => {
    bookingRepo.findOne.mockResolvedValue({
      id: 'booking-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      serviceId: 'svc-1',
      status: BookingStatus.PENDING,
      service: {
        id: 'svc-1',
        name: 'CBC',
        metadata: { serviceType: 'lab_test' },
      },
    });
    orderRepo.findOne.mockResolvedValue(null);

    await expect(
      service.createManualOrderForBooking('biz-1', 'booking-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists lab queue rows with booking and department metadata', async () => {
    const getMany = jest.fn().mockResolvedValue([
      {
        id: 'order-1',
        status: 'NotCollected',
        displayNames: 'CBC',
        bookingId: 'booking-1',
        createdAt: new Date('2026-06-07T10:00:00.000Z'),
        booking: {
          startTime: new Date('2026-06-08T09:00:00.000Z'),
          customer: { name: 'Jane Doe' },
          employee: { name: 'Dr Smith' },
        },
        items: [
          {
            testType: {
              service: {
                category: { name: 'Laboratory' },
              },
            },
          },
        ],
      },
    ]);
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany,
    };
    orderRepo.createQueryBuilder.mockReturnValue(qb);

    const rows = await service.listLabQueue('biz-1', {
      status: 'NotCollected',
      department: 'Laboratory',
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].customerName).toBe('Jane Doe');
    expect(rows[0].department).toBe('Laboratory');
    expect(qb.andWhere).toHaveBeenCalled();
  });

  it('filters lab queue by employee, statuses, and booking time sort', async () => {
    const getMany = jest.fn().mockResolvedValue([]);
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany,
    };
    orderRepo.createQueryBuilder.mockReturnValue(qb);

    await service.listLabQueue('biz-1', {
      employeeId: 'emp-1',
      statuses: ['NotCollected', 'Collecting'],
      sort: 'bookingTimeAsc',
    });

    expect(qb.andWhere).toHaveBeenCalledWith(
      'booking.employeeId = :employeeId',
      {
        employeeId: 'emp-1',
      },
    );
    expect(qb.andWhere).toHaveBeenCalledWith('order.status IN (:...statuses)', {
      statuses: ['NotCollected', 'Collecting'],
    });
    expect(qb.orderBy).toHaveBeenCalledWith(
      'COALESCE(collectionBooking.startTime, booking.startTime)',
      'ASC',
      'NULLS LAST',
    );
    expect(qb.addOrderBy).toHaveBeenCalledWith('order.createdAt', 'ASC');
  });

  it('filters lab queue by awaiting patient booking and maps push/collection fields', async () => {
    const pushedAt = new Date('2026-06-22T10:00:00.000Z');
    const collectionStart = new Date('2026-06-25T14:00:00.000Z');
    const visitStart = new Date('2026-06-20T09:00:00.000Z');
    const getMany = jest.fn().mockResolvedValue([
      {
        id: 'order-awaiting',
        status: 'NotCollected',
        displayNames: 'CBC',
        bookingId: 'visit-1',
        collectionBookingId: null,
        bookingRequestPushedAt: pushedAt,
        createdAt: new Date('2026-06-07T10:00:00.000Z'),
        booking: {
          startTime: visitStart,
          customer: { name: 'Jane Doe' },
          employee: { name: 'Dr Smith' },
        },
        collectionBooking: null,
        items: [
          {
            testType: {
              service: {
                category: { name: 'Laboratory' },
              },
            },
          },
        ],
      },
      {
        id: 'order-linked',
        status: 'NotCollected',
        displayNames: 'Lipid panel',
        bookingId: 'visit-2',
        collectionBookingId: 'collection-1',
        bookingRequestPushedAt: pushedAt,
        createdAt: new Date('2026-06-08T10:00:00.000Z'),
        booking: {
          startTime: visitStart,
          customer: { name: 'Alex Kim' },
          employee: { name: 'Dr Lee' },
        },
        collectionBooking: {
          startTime: collectionStart,
          employee: { name: 'Lab Tech' },
        },
        items: [
          {
            testType: {
              service: {
                category: { name: 'Laboratory' },
              },
            },
          },
        ],
      },
    ]);
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany,
    };
    orderRepo.createQueryBuilder.mockReturnValue(qb);

    const rows = await service.listLabQueue('biz-1', {
      awaitingPatientBooking: true,
    });

    expect(qb.andWhere).toHaveBeenCalledWith(
      'order.bookingRequestPushedAt IS NOT NULL',
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'order.collectionBookingId IS NULL',
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'order.status NOT IN (:...excludedStatuses)',
      {
        excludedStatuses: ['Cancelled', 'Completed'],
      },
    );
    expect(rows[0].awaitingPatientBooking).toBe(true);
    expect(rows[0].bookingRequestPushedAt).toBe(pushedAt.toISOString());
    expect(rows[0].visitBookingId).toBe('visit-1');
    expect(rows[0].collectionBookingId).toBeNull();
    expect(rows[1].awaitingPatientBooking).toBe(false);
    expect(rows[1].collectionBookingId).toBe('collection-1');
    expect(rows[1].collectionBookingStartTime).toBe(
      collectionStart.toISOString(),
    );
    expect(rows[1].visitBookingStartTime).toBe(visitStart.toISOString());
  });
});
