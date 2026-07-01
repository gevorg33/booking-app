import {
  handleAddServicesToCartLogic,
  handleBookMultiServiceLogic,
  handleBookPackageLogic,
  handleBookWithCashLogic,
  handleCancelMyBookingLogic,
  handleCancelPackageVisitSelfLogic,
  handleChangeProviderOnRescheduleLogic,
  handleCheckMultiServiceAvailabilityLogic,
  handleCheckPackageAvailabilityLogic,
  handleCustomerBookingCompoundLogic,
  handleExplainCancelPolicyLogic,
  handleGetManageLinkLogic,
  handleListMyAppointmentsLogic,
  handleListMyPackageVisitsLogic,
  handleRemoveServiceFromCartLogic,
  handleRescheduleMyBookingLogic,
  handleReschedulePackageVisitSelfLogic,
  handleSelectSubscriptionPlanLogic,
  handleShowCartTotalDurationLogic,
  handleUseSubscriptionCreditLogic,
  mergeCustomerBookingCompoundContext,
  type SelfServiceBookingLogicDeps,
} from './ai-self-service-booking.logic.js';
import { handleBookWithGiftCardLogic } from './ai-book-with-gift-card.logic.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

function buildDeps(
  overrides: Partial<SelfServiceBookingLogicDeps> = {},
): SelfServiceBookingLogicDeps {
  const business = {
    id: 'biz-1',
    slug: 'salon',
    settings: {
      publicBooking: {
        acceptCashPayments: true,
        customerSelfService: {
          allowCancel: true,
          allowReschedule: true,
          minimumNoticeHours: 24,
          maxReschedulesPerBooking: 3,
          allowProviderChangeOnReschedule: true,
        },
      },
    },
  };
  const services = [
    {
      id: 'svc-1',
      name: 'Massage',
      durationMinutes: 60,
      bufferMinutes: 0,
      price: 80,
      isActive: true,
    },
    {
      id: 'svc-2',
      name: 'Facial',
      durationMinutes: 45,
      bufferMinutes: 0,
      price: 60,
      isActive: true,
    },
  ];
  const booking = {
    id: 'book-1',
    businessId: 'biz-1',
    customerId: 'cust-1',
    status: BookingStatus.CONFIRMED,
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    metadata: {},
    service: services[0],
    employee: { name: 'Maria' },
  };

  return {
    publicBookingService: {
      suggestPackageLineSlots: jest.fn(async () => ({
        lines: [{ serviceId: 'svc-1' }],
      })),
      suggestPackageBlock: jest.fn(async () => ({
        startTime: '2026-06-10T10:00:00.000Z',
        dateKey: '2026-06-10',
        employeeId: 'emp-1',
        employeeName: 'Maria',
      })),
      suggestMultiServiceBlock: jest.fn(async () => ({
        startTime: '2026-06-03T11:00:00Z',
        employeeName: 'Maria',
      })),
      getMultiServiceBlockDaySlots: jest.fn(async () => ({
        slots: [{ startTime: '2026-06-03T11:00:00Z' }],
      })),
    } as any,
    publicCustomerBookingService: {
      cancelBooking: jest.fn(async () => ({
        booking: { ...booking, status: BookingStatus.CANCELLED },
      })),
      rescheduleBooking: jest.fn(async () => ({
        booking: { ...booking, startTime: new Date('2026-06-11T10:00:00Z') },
        previousStartTime: booking.startTime.toISOString(),
      })),
      cancelPackageVisit: jest.fn(async () => ({ bookings: [booking] })),
      reschedulePackageVisit: jest.fn(async () => ({
        bookings: [booking],
        previousStartTime: booking.startTime.toISOString(),
      })),
    } as any,
    publicCustomerAuthService: {
      listBookings: jest.fn(async () => ({
        bookings: [
          {
            id: 'book-1',
            startTime: '2026-08-10T10:00:00Z',
            status: BookingStatus.CONFIRMED,
            serviceName: 'Massage',
            employeeName: 'Maria',
            packagePurchaseId: 'purchase-1',
            packageName: 'Spa Day',
            canCancel: true,
            canReschedule: true,
          },
        ],
      })),
    } as any,
    packagesService: {
      listPublicPackages: jest.fn(async () => [
        { id: 'pkg-1', name: 'Spa Day' },
      ]),
    } as any,
    subscriptionsService: {
      listPlans: jest.fn(async () => [{ id: 'plan-1', name: 'Monthly Gold' }]),
      listCustomerSubscriptions: jest.fn(async () => [
        {
          id: 'sub-1',
          status: 'active',
          appointmentsRemaining: 2,
          plan: { name: 'Monthly Gold' },
        },
      ]),
    } as any,
    multiServiceBookingsService: {
      resolveSettingsFromBusiness: jest.fn(() => ({
        maxServiceCount: 5,
        turnoverBufferMinutes: 5,
        schedulingMode: 'same_visit',
      })),
    } as any,
    bookingRepo: {
      findOne: jest.fn(async () => booking),
      find: jest.fn(async () => [booking]),
      save: jest.fn(async (b) => ({
        ...b,
        metadata: { ...b.metadata, manageToken: 'tok' },
      })),
    } as any,
    businessRepo: {
      findOne: jest.fn(async () => business),
    } as any,
    serviceRepo: {
      find: jest.fn(async () => services),
    } as any,
    configService: {
      get: jest.fn((key: string) =>
        key === 'FRONTEND_URL' ? 'https://app.test' : undefined,
      ),
    } as any,
    ...overrides,
  };
}

describe('ai-self-service-booking.logic', () => {
  let deps: SelfServiceBookingLogicDeps;

  beforeEach(() => {
    deps = buildDeps();
  });

  it('covers booking and availability success and failure paths', async () => {
    expect((await handleBookPackageLogic(deps, 'biz-1', {})).action).toBe(
      'book_package',
    );
    const bookNamed = await handleBookPackageLogic(deps, 'biz-1', {
      packageName: 'Spa Day',
    });
    expect(bookNamed.success).toBe(true);
    expect(bookNamed.details?.navigate).toEqual({
      path: 'packages',
      query: { packageId: 'pkg-1' },
    });
    const nearest = await handleBookPackageLogic(deps, 'biz-1', {
      packageName: 'Spa Day',
      bookingFirstAvailable: true,
    });
    expect(nearest.success).toBe(true);
    expect(nearest.details?.blockStartTime).toBe('2026-06-10T10:00:00.000Z');
    expect(
      (
        await handleBookPackageLogic(deps, 'biz-1', {
          packageName: 'Spa Day',
          date: '03/06/2026',
        })
      ).success,
    ).toBe(true);
    (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
    expect(
      (
        await handleBookPackageLogic(deps, 'missing', {
          packageName: 'Spa Day',
        })
      ).success,
    ).toBe(false);

    expect((await handleBookMultiServiceLogic(deps, 'biz-1', {})).success).toBe(
      false,
    );
    expect(
      (
        await handleBookMultiServiceLogic(deps, 'biz-1', {
          serviceNames: ['Massage'],
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleBookMultiServiceLogic(deps, 'biz-1', {
          serviceNames: ['Massage'],
          blockStartTime: '2026-06-03T11:00:00Z',
        })
      ).success,
    ).toBe(true);

    expect(
      (await handleCheckPackageAvailabilityLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
    expect(
      (
        await handleCheckPackageAvailabilityLogic(deps, 'biz-1', {
          packageName: 'Spa Day',
        })
      ).success,
    ).toBe(true);
    (
      deps.publicBookingService.suggestPackageLineSlots as jest.Mock
    ).mockRejectedValueOnce(new Error('no slots'));
    expect(
      (
        await handleCheckPackageAvailabilityLogic(deps, 'biz-1', {
          packageName: 'Spa Day',
        })
      ).success,
    ).toBe(false);

    expect(
      (await handleCheckMultiServiceAvailabilityLogic(deps, 'biz-1', {}))
        .success,
    ).toBe(false);
    expect(
      (
        await handleCheckMultiServiceAvailabilityLogic(deps, 'biz-1', {
          serviceNames: ['Massage', 'Facial'],
          date: '2026-06-03',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleCheckMultiServiceAvailabilityLogic(deps, 'biz-1', {
          serviceNames: ['Massage'],
        })
      ).success,
    ).toBe(true);
    (
      deps.publicBookingService.suggestMultiServiceBlock as jest.Mock
    ).mockRejectedValueOnce(new Error('none'));
    expect(
      (
        await handleCheckMultiServiceAvailabilityLogic(deps, 'biz-1', {
          serviceNames: ['Massage'],
        })
      ).success,
    ).toBe(false);

    (
      deps.packagesService.listPublicPackages as jest.Mock
    ).mockResolvedValueOnce([]);
    expect(
      (await handleBookPackageLogic(deps, 'biz-1', { packageName: 'Missing' }))
        .success,
    ).toBe(false);
    (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
    expect(
      (
        await handleCheckPackageAvailabilityLogic(deps, 'missing', {
          packageName: 'Spa Day',
        })
      ).success,
    ).toBe(false);
    (
      deps.packagesService.listPublicPackages as jest.Mock
    ).mockResolvedValueOnce([{ id: 'pkg-9', name: 'Other' }]);
    expect(
      (
        await handleBookPackageLogic(deps, 'biz-1', {
          packageId: 'pkg-missing',
        })
      ).success,
    ).toBe(false);
    expect(
      (
        await handleCheckMultiServiceAvailabilityLogic(deps, 'biz-1', {
          serviceIds: ['svc-1'],
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleAddServicesToCartLogic(deps, 'biz-1', {
          cartServiceIds: ['svc-1'],
          serviceNames: ['Facial'],
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleSelectSubscriptionPlanLogic(deps, 'biz-1', {
          planName: 'Monthly Gold',
        })
      ).success,
    ).toBe(true);
    (deps.subscriptionsService.listPlans as jest.Mock).mockResolvedValueOnce(
      [],
    );
    expect(
      (await handleSelectSubscriptionPlanLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
  });

  it('covers subscription and self-service flows', async () => {
    expect(
      (await handleSelectSubscriptionPlanLogic(deps, 'biz-1', {})).success,
    ).toBe(true);
    expect(
      (
        await handleSelectSubscriptionPlanLogic(deps, 'biz-1', {
          planName: 'Missing',
        })
      ).success,
    ).toBe(false);

    expect(
      (await handleUseSubscriptionCreditLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
    expect(
      (
        await handleUseSubscriptionCreditLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
        })
      ).success,
    ).toBe(true);
    (
      deps.subscriptionsService.listCustomerSubscriptions as jest.Mock
    ).mockResolvedValueOnce([]);
    expect(
      (
        await handleUseSubscriptionCreditLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
        })
      ).success,
    ).toBe(false);
    (
      deps.subscriptionsService.listCustomerSubscriptions as jest.Mock
    ).mockResolvedValueOnce([
      {
        id: 'sub-1',
        status: 'active',
        appointmentsRemaining: 2,
        plan: { name: 'X' },
      },
    ]);
    expect(
      (
        await handleUseSubscriptionCreditLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
          subscriptionId: 'missing-sub',
        })
      ).success,
    ).toBe(false);

    expect(
      (await handleListMyAppointmentsLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
    expect(
      (
        await handleListMyAppointmentsLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
        })
      ).success,
    ).toBe(true);

    expect((await handleCancelMyBookingLogic(deps, 'biz-1', {})).success).toBe(
      false,
    );
    expect(
      (
        await handleCancelMyBookingLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
          bookingId: 'book-1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleCancelMyBookingLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
          bookingId: 'book-1',
        })
      ).summary,
    ).toContain('no need to call the salon');
    (deps.bookingRepo.find as jest.Mock).mockResolvedValueOnce([]);
    expect(
      (
        await handleCancelMyBookingLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
        })
      ).success,
    ).toBe(false);
    (deps.bookingRepo.find as jest.Mock).mockResolvedValueOnce([
      {
        id: 'book-1',
        businessId: 'biz-1',
        customerId: 'cust-1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        service: { name: 'Massage' },
        employee: { name: 'Maria' },
      },
      {
        id: 'book-2',
        businessId: 'biz-1',
        customerId: 'cust-1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        service: { name: 'Facial' },
        employee: { name: 'Alex' },
      },
    ]);
    const ambiguous = await handleCancelMyBookingLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
    });
    expect(ambiguous.success).toBe(false);
    expect(ambiguous.summary).toContain('several upcoming appointments');
    (
      deps.publicCustomerBookingService.cancelBooking as jest.Mock
    ).mockRejectedValueOnce(new Error('denied'));
    expect(
      (
        await handleCancelMyBookingLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
          bookingId: 'book-1',
        })
      ).success,
    ).toBe(false);
    (
      deps.publicCustomerBookingService.cancelBooking as jest.Mock
    ).mockRejectedValueOnce(new Error('denied'));
    expect(
      (
        await handleCancelMyBookingLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
          bookingId: 'book-1',
        })
      ).details,
    ).toHaveProperty('bookingId', 'book-1');

    expect(
      (
        await handleRescheduleMyBookingLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleRescheduleMyBookingLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
        })
      ).summary,
    ).toContain('no need to call the salon');
    (deps.bookingRepo.find as jest.Mock).mockResolvedValueOnce([
      {
        id: 'book-1',
        businessId: 'biz-1',
        customerId: 'cust-1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        service: { name: 'Massage' },
        employee: { name: 'Maria' },
      },
      {
        id: 'book-2',
        businessId: 'biz-1',
        customerId: 'cust-1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        service: { name: 'Facial' },
        employee: { name: 'Alex' },
      },
    ]);
    const rescheduleAmbiguous = await handleRescheduleMyBookingLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
    );
    expect(rescheduleAmbiguous.success).toBe(false);
    expect(rescheduleAmbiguous.summary).toContain(
      'several upcoming appointments',
    );
    (deps.bookingRepo.find as jest.Mock).mockResolvedValueOnce([]);
    expect(
      (
        await handleRescheduleMyBookingLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
        })
      ).success,
    ).toBe(false);
    expect(
      (
        await handleRescheduleMyBookingLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
          bookingId: 'book-1',
          startTime: '2026-06-11T10:00:00Z',
        })
      ).success,
    ).toBe(true);
    (
      deps.publicCustomerBookingService.rescheduleBooking as jest.Mock
    ).mockRejectedValueOnce(new Error('fail'));
    expect(
      (
        await handleRescheduleMyBookingLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
          bookingId: 'book-1',
          startTime: '2026-06-11T10:00:00Z',
        })
      ).success,
    ).toBe(false);
  });

  it('covers package visit, manage link, and policy flows', async () => {
    expect(
      (await handleReschedulePackageVisitSelfLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
    (
      deps.publicCustomerAuthService.listBookings as jest.Mock
    ).mockResolvedValueOnce({ bookings: [] });
    expect(
      (
        await handleCancelPackageVisitSelfLogic(
          deps,
          'biz-1',
          {
            sessionCustomerId: 'cust-1',
          },
          'Cancel my package visit',
        )
      ).success,
    ).toBe(false);
    expect(
      (
        await handleCancelPackageVisitSelfLogic(
          deps,
          'biz-1',
          {
            sessionCustomerId: 'cust-1',
            bookingId: 'book-1',
          },
          'Cancel my package visit',
        )
      ).success,
    ).toBe(true);
    (
      deps.publicCustomerBookingService.cancelPackageVisit as jest.Mock
    ).mockRejectedValueOnce(new Error('no'));
    expect(
      (
        await handleCancelPackageVisitSelfLogic(
          deps,
          'biz-1',
          {
            sessionCustomerId: 'cust-1',
            bookingId: 'book-1',
          },
          'Cancel my package visit',
        )
      ).success,
    ).toBe(false);

    (deps.bookingRepo.find as jest.Mock).mockResolvedValueOnce([]);
    expect(
      (
        await handleReschedulePackageVisitSelfLogic(
          deps,
          'biz-1',
          { sessionCustomerId: 'cust-1' },
          'Reschedule my package visit',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleReschedulePackageVisitSelfLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
          bookingId: 'book-1',
        })
      ).success,
    ).toBe(true);
    (
      deps.publicCustomerBookingService.reschedulePackageVisit as jest.Mock
    ).mockRejectedValueOnce(new Error('x'));
    expect(
      (
        await handleReschedulePackageVisitSelfLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
          bookingId: 'book-1',
          lines: [
            {
              bookingId: 'book-1',
              startTime: '2026-06-11T10:00:00Z',
            },
          ],
        })
      ).success,
    ).toBe(false);

    expect((await handleGetManageLinkLogic(deps, 'biz-1', {})).success).toBe(
      false,
    );
    expect(
      (
        await handleGetManageLinkLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
          bookingId: 'book-1',
        })
      ).success,
    ).toBe(true);

    expect(
      (await handleExplainCancelPolicyLogic(deps, 'biz-1', {})).success,
    ).toBe(true);
    expect(
      (
        await handleExplainCancelPolicyLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
          bookingId: 'book-1',
        })
      ).success,
    ).toBe(true);
    (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
    expect(
      (await handleExplainCancelPolicyLogic(deps, 'missing', {})).success,
    ).toBe(false);
  });

  it('covers payment, cart, and provider change flows', async () => {
    expect((await handleBookWithCashLogic(deps, 'biz-1', {})).success).toBe(
      true,
    );
    (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce({
      id: 'biz-1',
      settings: { publicBooking: { acceptCashPayments: false } },
    });
    expect((await handleBookWithCashLogic(deps, 'biz-1', {})).success).toBe(
      false,
    );

    expect((await handleBookWithGiftCardLogic(deps, 'biz-1', {})).success).toBe(
      false,
    );
    expect(
      (
        await handleBookWithGiftCardLogic(deps, 'biz-1', {
          giftCardCode: 'GIFT1',
        })
      ).success,
    ).toBe(true);

    expect(
      (await handleChangeProviderOnRescheduleLogic(deps, 'biz-1', {})).success,
    ).toBe(true);
    expect(
      (
        await handleChangeProviderOnRescheduleLogic(deps, 'biz-1', {
          employeeName: 'Maria',
        })
      ).success,
    ).toBe(true);
    (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce({
      id: 'biz-1',
      settings: {
        publicBooking: {
          customerSelfService: { allowProviderChangeOnReschedule: false },
        },
      },
    });
    expect(
      (await handleChangeProviderOnRescheduleLogic(deps, 'biz-1', {})).success,
    ).toBe(false);

    expect(
      (await handleAddServicesToCartLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
    const add = await handleAddServicesToCartLogic(deps, 'biz-1', {
      serviceNames: ['Massage'],
    });
    expect(add.success).toBe(true);
    (
      deps.multiServiceBookingsService.resolveSettingsFromBusiness as jest.Mock
    ).mockReturnValueOnce({
      maxServiceCount: 1,
      turnoverBufferMinutes: 5,
    });
    expect(
      (
        await handleAddServicesToCartLogic(deps, 'biz-1', {
          serviceNames: ['Massage', 'Facial'],
        })
      ).success,
    ).toBe(false);

    expect(
      (await handleRemoveServiceFromCartLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
    expect(
      (
        await handleRemoveServiceFromCartLogic(deps, 'biz-1', {
          cartServiceIds: 'svc-1',
          serviceNames: ['Massage'],
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleRemoveServiceFromCartLogic(deps, 'biz-1', {
          cartServiceIds: 'svc-1',
        })
      ).success,
    ).toBe(false);

    expect(
      (await handleShowCartTotalDurationLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
    expect(
      (
        await handleShowCartTotalDurationLogic(deps, 'biz-1', {
          cartServiceIds: 'svc-1,svc-2',
        })
      ).success,
    ).toBe(true);
    (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
    expect(
      (
        await handleShowCartTotalDurationLogic(deps, 'biz-1', {
          cartServiceIds: 'svc-1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleShowCartTotalDurationLogic(deps, 'biz-1', {
          cartServiceIds: '',
        })
      ).success,
    ).toBe(false);
    expect(
      (
        await handleReschedulePackageVisitSelfLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
          bookingId: 'book-1',
          lines: [
            {
              bookingId: 'book-1',
              startTime: '2026-06-11T10:00:00Z',
              employeeId: 'emp-1',
            },
          ],
        })
      ).success,
    ).toBe(true);
    (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
    expect(
      (
        await handleCancelPackageVisitSelfLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
        })
      ).success,
    ).toBe(false);
  });

  it('merges compound context and runs full compound matrix', async () => {
    const ctx = mergeCustomerBookingCompoundContext(
      {},
      { action: 'list_my_appointments', params: {}, segment: 'x' },
      {
        success: true,
        action: 'list_my_appointments',
        summary: 'ok',
        details: {
          bookings: [{ id: 'book-1', status: BookingStatus.CONFIRMED }],
          sessionContext: { cartServiceIds: 'svc-1' },
          manageUrl: 'https://app.test/manage',
        },
      },
    );
    expect(ctx.bookingId).toBe('book-1');
    expect(ctx.cartServiceIds).toBe('svc-1');

    const allActions = [
      'book_package',
      'book_multi_service',
      'check_package_availability',
      'check_multi_service_availability',
      'select_subscription_plan',
      'use_subscription_credit',
      'cancel_my_booking',
      'reschedule_my_booking',
      'cancel_package_visit_self',
      'reschedule_package_visit_self',
      'list_my_appointments',
      'get_manage_link',
      'explain_cancel_policy',
      'book_with_cash',
      'book_with_gift_card',
      'change_provider_on_reschedule',
      'add_services_to_cart',
      'remove_service_from_cart',
      'show_cart_total_duration',
    ] as const;

    for (const action of allActions) {
      const result = await handleCustomerBookingCompoundLogic(
        deps,
        'biz-1',
        'compound',
        {
          sessionCustomerId: 'cust-1',
          cartServiceIds: 'svc-1',
          compoundSteps: [
            {
              action,
              params: {
                packageName: 'Spa Day',
                serviceNames: ['Massage'],
                giftCardCode: 'G1',
              },
              segment: action,
            },
            { action: 'explain_cancel_policy', params: {}, segment: 'policy' },
          ],
        },
      );
      expect(result.success).toBe(true);
    }

    expect(
      (await handleCustomerBookingCompoundLogic(deps, 'biz-1', 'only one', {}))
        .success,
    ).toBe(false);

    const stopped = await handleCustomerBookingCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'explain_cancel_policy', params: {}, segment: 'policy' },
          { action: 'cancel_my_booking', params: {}, segment: 'cancel' },
        ],
      },
    );
    expect(stopped.success).toBe(false);
    expect((stopped.details as any).failedStep).toBe('cancel_my_booking');

    const unsupported = await handleCustomerBookingCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'explain_cancel_policy', params: {}, segment: 'a' },
          { action: 'unsupported_action' as any, params: {}, segment: 'b' },
        ],
      },
    );
    expect(unsupported.success).toBe(false);

    const viaPrompt = await handleCustomerBookingCompoundLogic(
      deps,
      'biz-1',
      'Add massage to cart and explain cancel policy',
      { sessionCustomerId: 'cust-1' },
    );
    expect(viaPrompt.success).toBe(true);
  });

  describe('remaining logic branches', () => {
    it('covers resolve helpers, slug failures, and error fallbacks', async () => {
      (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      expect(
        (
          await handleBookMultiServiceLogic(deps, 'missing', {
            serviceNames: ['Massage'],
          })
        ).success,
      ).toBe(false);

      (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      expect(
        (
          await handleCancelMyBookingLogic(deps, 'missing', {
            sessionCustomerId: 'cust-1',
          })
        ).success,
      ).toBe(false);

      (
        deps.publicCustomerBookingService.cancelBooking as jest.Mock
      ).mockRejectedValueOnce({});
      expect(
        (
          await handleCancelMyBookingLogic(deps, 'biz-1', {
            sessionCustomerId: 'cust-1',
            bookingId: 'book-1',
          })
        ).summary,
      ).toBe('Could not cancel this booking.');

      (
        deps.publicCustomerBookingService.rescheduleBooking as jest.Mock
      ).mockRejectedValueOnce({});
      expect(
        (
          await handleRescheduleMyBookingLogic(deps, 'biz-1', {
            sessionCustomerId: 'cust-1',
            bookingId: 'book-1',
            date: '2026-06-12',
            timeSlot: '10:30',
          })
        ).summary,
      ).toBe('Could not reschedule.');

      (
        deps.publicBookingService.suggestPackageLineSlots as jest.Mock
      ).mockResolvedValueOnce({ lines: [] });
      expect(
        (
          await handleCheckPackageAvailabilityLogic(deps, 'biz-1', {
            packageName: 'Spa Day',
          })
        ).summary,
      ).toContain('No package blocks');

      (
        deps.publicBookingService.suggestPackageLineSlots as jest.Mock
      ).mockRejectedValueOnce({});
      expect(
        (
          await handleCheckPackageAvailabilityLogic(deps, 'biz-1', {
            packageName: 'Spa Day',
          })
        ).summary,
      ).toBe('No package availability found.');

      (
        deps.publicBookingService.getMultiServiceBlockDaySlots as jest.Mock
      ).mockResolvedValueOnce({ slots: [] });
      expect(
        (
          await handleCheckMultiServiceAvailabilityLogic(deps, 'biz-1', {
            serviceNames: ['Massage'],
            date: '2026-06-03',
          })
        ).summary,
      ).toContain('No block slots on');

      (
        deps.publicBookingService.suggestMultiServiceBlock as jest.Mock
      ).mockRejectedValueOnce({});
      expect(
        (
          await handleCheckMultiServiceAvailabilityLogic(deps, 'biz-1', {
            serviceNames: ['Massage'],
          })
        ).summary,
      ).toBe('No multi-service blocks available.');

      (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      expect(
        (
          await handleListMyAppointmentsLogic(deps, 'missing', {
            sessionCustomerId: 'cust-1',
          })
        ).success,
      ).toBe(false);

      (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      expect(
        (
          await handleCancelPackageVisitSelfLogic(deps, 'missing', {
            sessionCustomerId: 'cust-1',
          })
        ).success,
      ).toBe(false);

      (
        deps.publicCustomerBookingService.cancelPackageVisit as jest.Mock
      ).mockRejectedValueOnce({});
      expect(
        (
          await handleCancelPackageVisitSelfLogic(deps, 'biz-1', {
            sessionCustomerId: 'cust-1',
            bookingId: 'book-1',
          })
        ).summary,
      ).toBe('Could not cancel package visit.');

      (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      expect(
        (
          await handleReschedulePackageVisitSelfLogic(deps, 'missing', {
            sessionCustomerId: 'cust-1',
          })
        ).success,
      ).toBe(false);

      (
        deps.publicCustomerBookingService.reschedulePackageVisit as jest.Mock
      ).mockRejectedValueOnce({});
      expect(
        (
          await handleReschedulePackageVisitSelfLogic(deps, 'biz-1', {
            sessionCustomerId: 'cust-1',
            bookingId: 'book-1',
            lines: [
              {
                bookingId: 'book-1',
                startTime: '2026-06-11T10:00:00Z',
              },
            ],
          })
        ).summary,
      ).toBe('Could not reschedule package visit.');

      (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      expect((await handleBookWithCashLogic(deps, 'missing', {})).success).toBe(
        false,
      );

      (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      expect(
        (await handleChangeProviderOnRescheduleLogic(deps, 'missing', {}))
          .success,
      ).toBe(false);
    });

    it('covers service resolution, policy variants, and cart edge cases', async () => {
      (deps.serviceRepo.find as jest.Mock).mockResolvedValueOnce([
        {
          id: 'svc-1',
          name: 'Swedish Massage',
          durationMinutes: 60,
          isActive: true,
        },
      ]);
      expect(
        (
          await handleBookMultiServiceLogic(deps, 'biz-1', {
            serviceName: 'massage',
          })
        ).success,
      ).toBe(true);

      (deps.serviceRepo.find as jest.Mock).mockResolvedValueOnce([
        {
          id: 'svc-1',
          name: 'Swedish Massage',
          durationMinutes: 60,
          isActive: true,
        },
      ]);
      expect(
        (
          await handleAddServicesToCartLogic(deps, 'biz-1', {
            serviceNames: ['Swedish'],
          })
        ).success,
      ).toBe(true);

      (
        deps.subscriptionsService.listCustomerSubscriptions as jest.Mock
      ).mockResolvedValueOnce([
        { id: 'sub-1', status: 'active', appointmentsRemaining: 1, plan: null },
      ]);
      expect(
        (
          await handleUseSubscriptionCreditLogic(deps, 'biz-1', {
            customerId: 'cust-1',
          })
        ).summary,
      ).toContain('membership');

      (deps.bookingRepo.find as jest.Mock).mockResolvedValueOnce([
        {
          id: 'book-1',
          businessId: 'biz-1',
          customerId: 'cust-1',
          status: BookingStatus.CONFIRMED,
          startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          service: null,
          employee: { name: 'Maria' },
        },
      ]);
      expect(
        (
          await handleRescheduleMyBookingLogic(deps, 'biz-1', {
            sessionCustomerId: 'cust-1',
          })
        ).summary,
      ).toContain('appointment');

      (deps.bookingRepo.findOne as jest.Mock).mockResolvedValueOnce({
        id: 'book-1',
        businessId: 'biz-1',
        customerId: 'cust-1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        service: null,
        employee: { name: 'Maria' },
      });
      expect(
        (
          await handleCancelMyBookingLogic(deps, 'biz-1', {
            sessionCustomerId: 'cust-1',
            bookingId: 'book-1',
          })
        ).summary,
      ).toContain('appointment');

      (
        deps.publicCustomerAuthService.listBookings as jest.Mock
      ).mockResolvedValueOnce({
        bookings: [
          {
            id: 'book-2',
            startTime: '2026-06-10T10:00:00Z',
            status: BookingStatus.CONFIRMED,
            serviceName: 'Facial',
            employeeName: 'Anna',
            canCancel: false,
            canReschedule: false,
          },
        ],
      });
      const listed = await handleListMyAppointmentsLogic(deps, 'biz-1', {
        sessionCustomerId: 'cust-1',
      });
      expect((listed.details as any).summaryLines[0]).toContain(
        'policy restricted',
      );

      (
        deps.publicCustomerAuthService.listBookings as jest.Mock
      ).mockResolvedValueOnce({ bookings: [] });
      expect(
        (
          await handleListMyAppointmentsLogic(deps, 'biz-1', {
            sessionCustomerId: 'cust-1',
          })
        ).summary,
      ).toContain('no upcoming');

      (
        deps.publicCustomerAuthService.listBookings as jest.Mock
      ).mockResolvedValueOnce({
        bookings: [
          {
            id: 'book-p1',
            packagePurchaseId: 'purchase-1',
            packageId: 'pkg-1',
            packageName: 'Spa Day',
            serviceName: 'Massage',
            employeeName: 'Anna',
            startTime: '2026-07-01T10:00:00.000Z',
            status: 'confirmed',
          },
          {
            id: 'book-p2',
            packagePurchaseId: 'purchase-1',
            packageId: 'pkg-1',
            packageName: 'Spa Day',
            serviceName: 'Facial',
            employeeName: 'Anna',
            startTime: '2026-07-08T10:00:00.000Z',
            status: 'confirmed',
          },
        ],
      });
      const packageVisits = await handleListMyPackageVisitsLogic(
        deps,
        'biz-1',
        { sessionCustomerId: 'cust-1' },
        'Visits left on my package',
      );
      expect(packageVisits.success).toBe(true);
      expect((packageVisits.details as any).packageVisits).toEqual([
        expect.objectContaining({
          packagePurchaseId: 'purchase-1',
          visitsTotal: 2,
          visitsRemaining: 2,
        }),
      ]);

      (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce({
        id: 'biz-1',
        slug: 'salon',
        settings: {
          publicBooking: {
            customerSelfService: {
              allowCancel: false,
              allowReschedule: false,
              minimumNoticeHours: 48,
              maxReschedulesPerBooking: 1,
              allowProviderChangeOnReschedule: false,
            },
          },
        },
      });
      (deps.bookingRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      const policy = await handleExplainCancelPolicyLogic(deps, 'biz-1', {
        sessionCustomerId: 'cust-1',
        bookingId: 'missing-booking',
      });
      expect(policy.summary).toContain('disabled');
      expect((policy.details as any).bookingPolicy).toBeUndefined();

      (deps.configService.get as jest.Mock).mockReturnValueOnce(undefined);
      expect(
        (await handleGetManageLinkLogic(deps, 'biz-1', { bookingId: 'book-1' }))
          .details.manageUrl,
      ).toContain('localhost:3000');

      expect(
        (
          await handleRemoveServiceFromCartLogic(deps, 'biz-1', {
            cartServiceIds: 'svc-1',
            serviceId: 'svc-1',
          })
        ).summary,
      ).toBe('Service removed from cart.');

      expect(
        (
          await handleShowCartTotalDurationLogic(deps, 'biz-1', {
            cartServiceIds: 'svc-1',
          })
        ).details.totalMinutes,
      ).toBe(60);

      (
        deps.packagesService.listPublicPackages as jest.Mock
      ).mockResolvedValueOnce([{ id: 'pkg-1', name: 'Spa Day' }]);
      expect(
        (await handleBookPackageLogic(deps, 'biz-1', { packageId: 'pkg-1' }))
          .success,
      ).toBe(true);

      expect(
        (await handleSelectSubscriptionPlanLogic(deps, 'biz-1', {})).success,
      ).toBe(true);

      (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      expect(
        (
          await handleCheckMultiServiceAvailabilityLogic(deps, 'missing', {
            serviceNames: ['Massage'],
          })
        ).success,
      ).toBe(false);

      (
        deps.publicBookingService.getMultiServiceBlockDaySlots as jest.Mock
      ).mockResolvedValueOnce({});
      expect(
        (
          await handleCheckMultiServiceAvailabilityLogic(deps, 'biz-1', {
            serviceNames: ['Massage'],
            date: '2026-06-03',
          })
        ).summary,
      ).toContain('No block slots on');

      expect(
        (await handleRescheduleMyBookingLogic(deps, 'biz-1', {})).summary,
      ).toContain('Sign in');
      (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      expect(
        (
          await handleRescheduleMyBookingLogic(deps, 'missing', {
            sessionCustomerId: 'cust-1',
          })
        ).success,
      ).toBe(false);

      expect(
        (
          await handleRescheduleMyBookingLogic(deps, 'biz-1', {
            sessionCustomerId: 'cust-1',
            bookingId: 'book-1',
            date: '2026-06-12',
            timeSlot: '14:00',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleRescheduleMyBookingLogic(deps, 'biz-1', {
            sessionCustomerId: 'cust-1',
            bookingId: 'book-1',
            date: '2026-06-13',
          })
        ).success,
      ).toBe(true);

      expect(
        (await handleCancelPackageVisitSelfLogic(deps, 'biz-1', {})).summary,
      ).toContain('Sign in');

      (
        deps.publicCustomerAuthService.listBookings as jest.Mock
      ).mockResolvedValueOnce({
        bookings: [
          {
            id: 'book-3',
            startTime: '2026-06-10T10:00:00Z',
            status: BookingStatus.CONFIRMED,
            serviceName: 'Massage',
            employeeName: 'Maria',
            canCancel: true,
            canReschedule: true,
          },
        ],
      });
      const openList = await handleListMyAppointmentsLogic(deps, 'biz-1', {
        sessionCustomerId: 'cust-1',
      });
      expect((openList.details as any).summaryLines[0]).not.toContain(
        'policy restricted',
      );

      expect(
        (
          await handleGetManageLinkLogic(deps, 'biz-1', {
            sessionCustomerId: 'cust-1',
          })
        ).success,
      ).toBe(true);

      const policyWithBooking = await handleExplainCancelPolicyLogic(
        deps,
        'biz-1',
        {
          sessionCustomerId: 'cust-1',
          bookingId: 'book-1',
        },
      );
      expect((policyWithBooking.details as any).bookingPolicy).toBeDefined();

      expect(
        (
          await handleRemoveServiceFromCartLogic(deps, 'biz-1', {
            cartServiceIds: 'svc-1,svc-2',
            serviceNames: ['Massage'],
          })
        ).summary,
      ).toContain('Removed Massage');

      const multiDuration = await handleShowCartTotalDurationLogic(
        deps,
        'biz-1',
        {
          cartServiceIds: 'svc-1,svc-2',
        },
      );
      expect((multiDuration.details as any).totalMinutes).toBe(60 + 45 + 5);

      (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      expect(
        (
          await handleGetManageLinkLogic(deps, 'missing', {
            bookingId: 'book-1',
          })
        ).success,
      ).toBe(false);

      (deps.serviceRepo.find as jest.Mock).mockResolvedValueOnce([
        {
          id: 'svc-3',
          name: 'Wax',
          durationMinutes: 30,
          bufferMinutes: 10,
          isActive: true,
        },
      ]);
      const singleDuration = await handleShowCartTotalDurationLogic(
        deps,
        'biz-1',
        { cartServiceIds: 'svc-3' },
      );
      expect((singleDuration.details as any).totalMinutes).toBe(40);

      (
        deps.multiServiceBookingsService
          .resolveSettingsFromBusiness as jest.Mock
      ).mockReturnValueOnce({});
      (deps.serviceRepo.find as jest.Mock).mockResolvedValueOnce([
        { id: 'svc-1', name: 'Massage', durationMinutes: 60, isActive: true },
        {
          id: 'svc-2',
          name: 'Facial',
          durationMinutes: 45,
          bufferMinutes: 8,
          isActive: true,
        },
      ]);
      const bufferedMulti = await handleShowCartTotalDurationLogic(
        deps,
        'biz-1',
        {
          cartServiceIds: 'svc-1,svc-2',
        },
      );
      expect((bufferedMulti.details as any).totalMinutes).toBe(60 + 45 + 8 + 5);
    });

    it('covers mergeCustomerBookingCompoundContext branches', () => {
      const packageCtx = mergeCustomerBookingCompoundContext(
        {},
        { action: 'book_package', params: {}, segment: 'x' },
        {
          success: true,
          action: 'book_package',
          summary: 'ok',
          details: { packageId: 'pkg-1' },
        },
      );
      expect(packageCtx.packageId).toBe('pkg-1');

      const noUpcoming = mergeCustomerBookingCompoundContext(
        {},
        { action: 'list_my_appointments', params: {}, segment: 'x' },
        {
          success: true,
          action: 'list_my_appointments',
          summary: 'ok',
          details: {
            bookings: [{ id: 'b2', status: BookingStatus.CANCELLED }],
          },
        },
      );
      expect(noUpcoming.bookingId).toBeUndefined();

      const plain = mergeCustomerBookingCompoundContext(
        { keep: true },
        { action: 'explain_cancel_policy', params: {}, segment: 'x' },
        {
          success: true,
          action: 'explain_cancel_policy',
          summary: 'ok',
          details: {},
        },
      );
      expect(plain.keep).toBe(true);
    });
  });
});
