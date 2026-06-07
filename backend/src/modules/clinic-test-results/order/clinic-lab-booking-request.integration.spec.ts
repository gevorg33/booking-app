import { mergePatientChartAlerts } from '../../../common/utils/clinic-patient-alert.util.js';
import { EventType } from '../../../events/event-types.js';
import { BookingStatus } from '../../booking/entities/booking.entity.js';
import { ClinicLabBookingListener } from '../listeners/clinic-lab-booking.listener.js';
import { ClinicTestOrderBookingRequestService } from './clinic-test-order-booking-request.service.js';
import { ClinicTestOrderService } from './clinic-test-order.service.js';

type OrderRecord = {
  id: string;
  businessId: string;
  customerId: string;
  bookingId: string | null;
  employeeId: string | null;
  displayNames: string | null;
  status: string;
  collectionBookingId?: string | null;
  collectionServiceId?: string | null;
  bookingRequestToken?: string | null;
  bookingRequestPushedAt?: Date | null;
  bookingRequestPushedByEmployeeId?: string | null;
  createdAt: Date;
  items?: Array<{
    orderId: string;
    type: string;
    testTypeId?: string | null;
    testPanelId?: string | null;
  }>;
};

type BookingRecord = {
  id: string;
  businessId: string;
  customerId: string;
  employeeId: string | null;
  serviceId: string;
  status: BookingStatus;
  metadata?: Record<string, unknown>;
  service?: { id: string; name: string; metadata: Record<string, unknown> };
};

function matchesWhere(
  entity: Record<string, unknown>,
  where: Record<string, unknown>,
): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (
      value &&
      typeof value === 'object' &&
      '_type' in value &&
      (value as { _type: string })._type === 'in'
    ) {
      const allowed = (value as { _value: unknown[] })._value;
      return allowed.includes(entity[key]);
    }
    return entity[key] === value;
  });
}

function createInMemoryClinicLabStores() {
  const business = {
    id: 'biz-1',
    slug: 'acme-clinic',
    settings: { businessType: 'clinic' },
  };
  const consultationService = {
    id: 'svc-consult',
    businessId: business.id,
    name: 'GP consultation',
    isActive: true,
    metadata: { serviceType: 'consultation' },
  };
  const collectionService = {
    id: 'svc-lab-draw',
    businessId: business.id,
    name: 'Lab blood draw',
    isActive: true,
    metadata: { serviceType: 'lab_test', clinicTestTypeId: 'type-cbc' },
  };
  const walkInCollectionService = {
    id: 'svc-walk-in',
    businessId: business.id,
    name: 'Walk-in draw',
    isActive: true,
    metadata: { serviceType: 'lab_test' },
  };
  const testTypeById = {
    'type-cbc': {
      id: 'type-cbc',
      title: 'Complete blood count',
      businessId: business.id,
      isActive: true,
      serviceId: collectionService.id,
    },
    'type-lipid': {
      id: 'type-lipid',
      title: 'Lipid panel',
      businessId: business.id,
      isActive: true,
      serviceId: collectionService.id,
    },
    'type-unlinked': {
      id: 'type-unlinked',
      title: 'Unlinked test',
      businessId: business.id,
      isActive: true,
      serviceId: null,
    },
  };
  const visitBooking: BookingRecord = {
    id: 'visit-booking-1',
    businessId: business.id,
    customerId: 'cust-1',
    employeeId: 'emp-1',
    serviceId: consultationService.id,
    status: BookingStatus.CONFIRMED,
    service: consultationService,
  };

  const orders: OrderRecord[] = [];
  const bookings = new Map<string, BookingRecord>([
    [visitBooking.id, visitBooking],
  ]);
  let orderSeq = 0;
  let bookingSeq = 0;

  const orderRepo = {
    create: jest.fn((value: Partial<OrderRecord>) => value),
    save: jest.fn(async (value: Partial<OrderRecord>) => {
      const existingIdx = value.id
        ? orders.findIndex((order) => order.id === value.id)
        : -1;
      const existing = existingIdx >= 0 ? orders[existingIdx] : null;
      const saved: OrderRecord = {
        id: value.id ?? `order-${++orderSeq}`,
        businessId: value.businessId ?? existing?.businessId ?? business.id,
        customerId: value.customerId ?? existing?.customerId ?? 'cust-1',
        bookingId:
          value.bookingId !== undefined
            ? value.bookingId
            : (existing?.bookingId ?? null),
        employeeId:
          value.employeeId !== undefined
            ? value.employeeId
            : (existing?.employeeId ?? null),
        displayNames:
          value.displayNames !== undefined
            ? value.displayNames
            : (existing?.displayNames ?? null),
        status: value.status ?? existing?.status ?? 'NotCollected',
        collectionBookingId:
          value.collectionBookingId !== undefined
            ? value.collectionBookingId
            : (existing?.collectionBookingId ?? null),
        collectionServiceId:
          value.collectionServiceId !== undefined
            ? value.collectionServiceId
            : (existing?.collectionServiceId ?? null),
        bookingRequestToken:
          value.bookingRequestToken !== undefined
            ? value.bookingRequestToken
            : (existing?.bookingRequestToken ?? null),
        bookingRequestPushedAt:
          value.bookingRequestPushedAt !== undefined
            ? value.bookingRequestPushedAt
            : (existing?.bookingRequestPushedAt ?? null),
        bookingRequestPushedByEmployeeId:
          value.bookingRequestPushedByEmployeeId !== undefined
            ? value.bookingRequestPushedByEmployeeId
            : (existing?.bookingRequestPushedByEmployeeId ?? null),
        createdAt:
          value.createdAt ??
          existing?.createdAt ??
          new Date('2026-06-07T10:00:00.000Z'),
        items: value.items ?? existing?.items,
      };
      if (existingIdx >= 0) {
        orders[existingIdx] = saved;
        return orders[existingIdx];
      }
      orders.push(saved);
      return saved;
    }),
    findOne: jest.fn(
      async ({
        where,
        relations,
      }: {
        where: Record<string, unknown>;
        relations?: { items?: boolean | Record<string, unknown> };
      }) => {
        const found = orders.find((order) =>
          matchesWhere(order as Record<string, unknown>, where),
        );
        if (!found) return null;
        if (relations?.items) {
          const hydratedItems = (found.items ?? []).map((item) => {
            if (item.type === 'test_type' && item.testTypeId) {
              return {
                ...item,
                testType:
                  testTypeById[item.testTypeId as keyof typeof testTypeById] ??
                  null,
              };
            }
            return { ...item, testType: null, testPanel: { items: [] } };
          });
          return { ...found, items: hydratedItems };
        }
        return { ...found };
      },
    ),
    find: jest.fn(
      async ({
        where,
        order,
      }: {
        where: Record<string, unknown>;
        order?: Record<string, string>;
      }) => {
        let results = orders.filter((entry) =>
          matchesWhere(entry as Record<string, unknown>, where),
        );
        if (order?.bookingRequestPushedAt === 'DESC') {
          results = [...results].sort(
            (a, b) =>
              (b.bookingRequestPushedAt?.getTime() ?? 0) -
              (a.bookingRequestPushedAt?.getTime() ?? 0),
          );
        }
        return results.map((entry) => ({ ...entry }));
      },
    ),
  };

  const orderItemRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (items: Array<Record<string, unknown>>) => {
      const normalized = Array.isArray(items) ? items : [items];
      for (const item of normalized) {
        const order = orders.find((entry) => entry.id === item.orderId);
        if (!order) continue;
        order.items = [
          ...(order.items ?? []),
          item as OrderRecord['items'][number],
        ];
      }
      return normalized;
    }),
  };

  const orderHistoryRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };

  const bookingRepo = {
    findOne: jest.fn(
      async ({
        where,
        relations,
      }: {
        where: { id?: string };
        relations?: { service?: boolean };
      }) => {
        const booking = bookings.get(where.id ?? '');
        if (!booking) return null;
        if (relations?.service) {
          const service =
            booking.serviceId === collectionService.id
              ? collectionService
              : consultationService;
          return { ...booking, service };
        }
        return { ...booking };
      },
    ),
  };

  const businessRepo = {
    findOne: jest.fn(async ({ where }: { where: { id: string } }) =>
      where.id === business.id ? business : null,
    ),
  };

  const allServices = [
    consultationService,
    collectionService,
    walkInCollectionService,
  ];

  const serviceRepo = {
    find: jest.fn(
      async ({
        where,
      }: {
        where: {
          businessId?: string;
          isActive?: boolean;
          id?: string | { _type: string; _value: string[] };
        };
      }) => {
        let results = allServices.filter(
          (service) => service.businessId === business.id,
        );
        if (where.isActive !== undefined) {
          results = results.filter(
            (service) => service.isActive === where.isActive,
          );
        }
        if (
          where.id &&
          typeof where.id === 'object' &&
          '_type' in where.id &&
          where.id._type === 'in'
        ) {
          results = results.filter((service) =>
            where.id._value.includes(service.id),
          );
        } else if (typeof where.id === 'string') {
          results = results.filter((service) => service.id === where.id);
        }
        return results;
      },
    ),
    findOne: jest.fn(
      async ({
        where,
      }: {
        where: { id?: string; businessId?: string; isActive?: boolean };
      }) => {
        return (
          allServices.find((service) =>
            matchesWhere(service as Record<string, unknown>, where),
          ) ?? null
        );
      },
    ),
  };

  const testTypeRepo = {
    findOne: jest.fn(
      async ({
        where,
      }: {
        where: { id?: string; businessId?: string; isActive?: boolean };
      }) => {
        const match = Object.values(testTypeById).find((testType) =>
          matchesWhere(testType as Record<string, unknown>, where),
        );
        return match ?? null;
      },
    ),
  };

  const clinicLabPhiService = {
    encryptStatusHistoryNoteForStorage: jest.fn(
      async (_business, note: string) => note,
    ),
  };

  const clinicSpecimenService = {
    ensureSpecimenForOrder: jest.fn(async () => ({ id: 'specimen-1' })),
  };

  const clinicTestResultService = {
    ensureResultForOrder: jest.fn(async () => ({ id: 'result-1' })),
  };

  const notificationsService = {
    sendClinicLabBookingRequest: jest.fn(async () => undefined),
  };

  const configService = {
    get: jest.fn((key: string) =>
      key === 'FRONTEND_URL' ? 'https://app.example.com' : undefined,
    ),
  };

  const clinicTaskAutoService = {
    resolveLabBookingRequestCallbackTask: jest.fn(async () => undefined),
  };

  const clinicTestOrderService = new ClinicTestOrderService(
    bookingRepo as never,
    businessRepo as never,
    serviceRepo as never,
    orderRepo as never,
    orderItemRepo as never,
    orderHistoryRepo as never,
    testTypeRepo as never,
    clinicLabPhiService as never,
    clinicSpecimenService as never,
    clinicTestResultService as never,
  );

  function addBooking(booking: Omit<BookingRecord, 'id'> & { id?: string }) {
    const record: BookingRecord = {
      id: booking.id ?? `booking-${++bookingSeq}`,
      ...booking,
    };
    bookings.set(record.id, record);
    return record;
  }

  const bookingService = {
    create: jest.fn(
      async (
        businessId: string,
        dto: {
          employeeId: string;
          serviceId: string;
          customerId: string;
          startTime: string;
          metadata?: Record<string, unknown>;
        },
      ) =>
        addBooking({
          businessId,
          customerId: dto.customerId,
          employeeId: dto.employeeId,
          serviceId: dto.serviceId,
          status: BookingStatus.CONFIRMED,
          metadata: dto.metadata,
          service: collectionService,
        }),
    ),
  };

  const clinicTestOrderBookingRequestService =
    new ClinicTestOrderBookingRequestService(
      orderRepo as never,
      orderHistoryRepo as never,
      bookingRepo as never,
      businessRepo as never,
      serviceRepo as never,
      clinicLabPhiService as never,
      notificationsService as never,
      configService as never,
      bookingService as never,
      clinicTaskAutoService as never,
    );

  const maybeCreateOrderForBooking = jest.spyOn(
    clinicTestOrderService,
    'maybeCreateOrderForBooking',
  );

  const listener = new ClinicLabBookingListener(
    clinicTestOrderService,
    clinicTestOrderBookingRequestService,
    bookingRepo as never,
  );

  return {
    business,
    visitBooking,
    collectionService,
    orders,
    bookings,
    bookingRepo,
    orderRepo,
    clinicTestOrderService,
    clinicTestOrderBookingRequestService,
    listener,
    maybeCreateOrderForBooking,
    notificationsService,
    clinicTaskAutoService,
    bookingService,
    addBooking,
  };
}

describe('Clinic lab booking request flow (integration)', () => {
  it('derives supported collection services from linked order line items', async () => {
    const ctx = createInMemoryClinicLabStores();

    const catalogOrder =
      await ctx.clinicTestOrderService.createCatalogOrderForBooking(
        ctx.business.id,
        ctx.visitBooking.id,
        [{ type: 'test_type', testTypeId: 'type-cbc', label: 'CBC' }],
      );

    const actions =
      await ctx.clinicTestOrderBookingRequestService.getOrderBookingActions(
        ctx.business.id,
        catalogOrder.id,
      );

    expect(actions.supportedCollectionServices).toEqual([
      { id: ctx.collectionService.id, name: 'Lab blood draw' },
    ]);
    expect(
      actions.supportedCollectionServices.some(
        (service) => service.id === 'svc-walk-in',
      ),
    ).toBe(false);
  });

  it('rejects push when collection service is not linked to order line items', async () => {
    const ctx = createInMemoryClinicLabStores();

    const catalogOrder =
      await ctx.clinicTestOrderService.createCatalogOrderForBooking(
        ctx.business.id,
        ctx.visitBooking.id,
        [{ type: 'test_type', testTypeId: 'type-cbc', label: 'CBC' }],
      );

    await expect(
      ctx.clinicTestOrderBookingRequestService.pushBookingRequestToPatient(
        ctx.business.id,
        catalogOrder.id,
        'svc-walk-in',
        'emp-1',
      ),
    ).rejects.toThrow('Collection service is not supported for this lab order');
  });

  it('staff catalog order → push → patient checkout with token → collectionBookingId set, no duplicate order', async () => {
    const ctx = createInMemoryClinicLabStores();

    const catalogOrder =
      await ctx.clinicTestOrderService.createCatalogOrderForBooking(
        ctx.business.id,
        ctx.visitBooking.id,
        [
          {
            type: 'test_type',
            testTypeId: 'type-cbc',
            label: 'CBC',
          },
          {
            type: 'test_type',
            testTypeId: 'type-lipid',
            label: 'Lipid panel',
          },
        ],
      );

    expect(catalogOrder.bookingId).toBe(ctx.visitBooking.id);
    expect(ctx.orders).toHaveLength(1);

    const pushed =
      await ctx.clinicTestOrderBookingRequestService.pushBookingRequestToPatient(
        ctx.business.id,
        catalogOrder.id,
        ctx.collectionService.id,
        'emp-1',
      );

    expect(pushed.collectionServiceId).toBe(ctx.collectionService.id);
    expect(pushed.bookingRequestPushedAt).not.toBeNull();
    expect(pushed.collectionBookingId).toBeNull();
    expect(
      ctx.notificationsService.sendClinicLabBookingRequest,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: catalogOrder.id,
        customerId: 'cust-1',
        collectionServiceName: 'Lab blood draw',
      }),
    );

    const storedOrder = ctx.orders[0];
    const token = storedOrder.bookingRequestToken;
    expect(token).toBeTruthy();

    const alertsAfterPush = mergePatientChartAlerts({
      results: [],
      intakes: [],
      labBookingRequests: [
        {
          id: storedOrder.id,
          bookingId: storedOrder.bookingId,
          displayNames: storedOrder.displayNames,
          collectionServiceName: ctx.collectionService.name,
          status: storedOrder.status,
          bookingRequestPushedAt: storedOrder.bookingRequestPushedAt ?? null,
          collectionBookingId: storedOrder.collectionBookingId ?? null,
        },
      ],
      dismissals: [],
    });
    expect(alertsAfterPush.alerts).toHaveLength(1);
    expect(alertsAfterPush.alerts[0]?.type).toBe('LabBookingRequestPending');

    const pending =
      await ctx.clinicTestOrderBookingRequestService.listPendingBookingRequestsForCustomer(
        ctx.business.id,
        'cust-1',
      );
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      orderId: catalogOrder.id,
      collectionServiceId: ctx.collectionService.id,
      token,
      collectionBookingId: null,
    });

    const resolved =
      await ctx.clinicTestOrderBookingRequestService.resolveBookingRequestByToken(
        ctx.business.id,
        token!,
        'cust-1',
      );
    expect(resolved?.orderId).toBe(catalogOrder.id);

    const collectionBooking = ctx.addBooking({
      businessId: ctx.business.id,
      customerId: 'cust-1',
      employeeId: 'emp-2',
      serviceId: ctx.collectionService.id,
      status: BookingStatus.CONFIRMED,
      metadata: { clinicOrderToken: token },
      service: ctx.collectionService,
    });

    await ctx.listener.handleBookingCreated({
      aggregateId: collectionBooking.id,
      eventType: EventType.BOOKING_CREATED,
    } as never);

    expect(ctx.orders).toHaveLength(1);
    expect(ctx.orders[0].collectionBookingId).toBe(collectionBooking.id);
    expect(ctx.orders[0].bookingId).toBe(ctx.visitBooking.id);
    expect(ctx.maybeCreateOrderForBooking).not.toHaveBeenCalled();
    expect(
      ctx.clinicTaskAutoService.resolveLabBookingRequestCallbackTask,
    ).toHaveBeenCalledWith(ctx.business.id, catalogOrder.id);

    const actions =
      await ctx.clinicTestOrderBookingRequestService.getOrderBookingActions(
        ctx.business.id,
        catalogOrder.id,
      );
    expect(actions.collectionBookingId).toBe(collectionBooking.id);

    const pendingAfter =
      await ctx.clinicTestOrderBookingRequestService.listPendingBookingRequestsForCustomer(
        ctx.business.id,
        'cust-1',
      );
    expect(pendingAfter).toHaveLength(0);

    const alertsAfterBooking = mergePatientChartAlerts({
      results: [],
      intakes: [],
      labBookingRequests: [
        {
          id: ctx.orders[0].id,
          bookingId: ctx.orders[0].bookingId,
          displayNames: ctx.orders[0].displayNames,
          collectionServiceName: ctx.collectionService.name,
          status: ctx.orders[0].status,
          bookingRequestPushedAt: ctx.orders[0].bookingRequestPushedAt ?? null,
          collectionBookingId: ctx.orders[0].collectionBookingId ?? null,
        },
      ],
      dismissals: [],
    });
    expect(alertsAfterBooking.alerts).toHaveLength(0);
  });

  it('staff books collection for existing order without patient self-book', async () => {
    const ctx = createInMemoryClinicLabStores();

    const catalogOrder =
      await ctx.clinicTestOrderService.createCatalogOrderForBooking(
        ctx.business.id,
        ctx.visitBooking.id,
        [{ type: 'test_type', testTypeId: 'type-cbc', label: 'CBC' }],
      );

    const actions =
      await ctx.clinicTestOrderBookingRequestService.bookCollectionForOrder(
        ctx.business.id,
        catalogOrder.id,
        ctx.collectionService.id,
        'emp-2',
        '2026-06-10T09:00:00.000Z',
        'emp-1',
        'user-1',
      );

    expect(ctx.bookingService.create).toHaveBeenCalledWith(
      ctx.business.id,
      expect.objectContaining({
        employeeId: 'emp-2',
        serviceId: ctx.collectionService.id,
        customerId: 'cust-1',
        startTime: '2026-06-10T09:00:00.000Z',
        metadata: { clinicStaffOrderId: catalogOrder.id },
      }),
      'user-1',
    );
    expect(actions.collectionBookingId).toBeTruthy();
    expect(ctx.orders[0].collectionBookingId).toBe(actions.collectionBookingId);
    expect(ctx.orders[0].collectionServiceId).toBe(ctx.collectionService.id);
    expect(
      ctx.clinicTaskAutoService.resolveLabBookingRequestCallbackTask,
    ).toHaveBeenCalledWith(ctx.business.id, catalogOrder.id);

    const collectionBooking = [...ctx.bookings.values()].find(
      (booking) => booking.id === actions.collectionBookingId,
    );
    expect(collectionBooking?.metadata).toEqual({
      clinicStaffOrderId: catalogOrder.id,
    });

    await ctx.listener.handleBookingCreated({
      aggregateId: actions.collectionBookingId!,
      eventType: EventType.BOOKING_CREATED,
    } as never);

    expect(ctx.maybeCreateOrderForBooking).not.toHaveBeenCalled();
    expect(ctx.orders).toHaveLength(1);
  });

  it('auto-creates a lab order when collection booking has no clinic order token', async () => {
    const ctx = createInMemoryClinicLabStores();

    const collectionBooking = ctx.addBooking({
      businessId: ctx.business.id,
      customerId: 'cust-1',
      employeeId: 'emp-2',
      serviceId: ctx.collectionService.id,
      status: BookingStatus.CONFIRMED,
      metadata: {},
      service: ctx.collectionService,
    });

    await ctx.listener.handleBookingCreated({
      aggregateId: collectionBooking.id,
      eventType: EventType.BOOKING_CREATED,
    } as never);

    expect(ctx.maybeCreateOrderForBooking).toHaveBeenCalledWith(
      collectionBooking.id,
    );
    expect(ctx.orders).toHaveLength(1);
    expect(ctx.orders[0].bookingId).toBe(collectionBooking.id);
    expect(ctx.orders[0].collectionBookingId).toBeNull();
  });
});
