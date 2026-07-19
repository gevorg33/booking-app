import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AiSelfServiceBookingService } from './ai-self-service-booking.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { PublicCustomerBookingService } from '../public-booking/public-customer-booking.service.js';
import { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import { PublicConsumerSupportService } from '../public-booking/public-consumer-support.service.js';
import { PublicCustomerWaitlistService } from '../public-booking/public-customer-waitlist.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ServicePackagesService } from '../service-packages/service-packages.service.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';

describe('Sprint 36 customer booking AI scenarios', () => {
  const futureBookingStart = () =>
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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

  const publicBookingService = {
    suggestPackageLineSlots: jest.fn(async () => ({
      lines: [
        {
          serviceId: 'svc-1',
          employeeId: 'emp-1',
          startTime: '2026-06-03T10:00:00Z',
        },
      ],
    })),
    suggestMultiServiceBlock: jest.fn(async () => ({
      startTime: '2026-06-03T11:00:00Z',
      employeeName: 'Maria',
      employeeId: 'emp-1',
    })),
    getMultiServiceBlockDaySlots: jest.fn(async () => ({
      slots: [{ startTime: '2026-06-03T11:00:00Z' }],
    })),
  };

  const publicCustomerBookingService = {
    cancelBooking: jest.fn(async () => ({
      booking: { id: 'book-1', status: BookingStatus.CANCELLED },
    })),
    rescheduleBooking: jest.fn(async () => ({
      booking: { id: 'book-1', startTime: new Date('2026-06-11T10:00:00Z') },
      previousStartTime: '2026-06-10T10:00:00Z',
    })),
    cancelPackageVisit: jest.fn(async () => ({
      bookings: [{ id: 'book-1' }, { id: 'book-2' }],
    })),
    reschedulePackageVisit: jest.fn(async () => ({
      bookings: [{ id: 'book-1' }],
      previousStartTime: 'x',
    })),
  };

  const publicCustomerAuthService = {
    listBookings: jest.fn(async () => ({
      bookings: [
        {
          id: 'book-1',
          startTime: futureBookingStart().toISOString(),
          status: BookingStatus.CONFIRMED,
          serviceName: 'Massage',
          employeeName: 'Maria',
          canCancel: true,
          canReschedule: true,
          packagePurchaseId: 'pkg-purchase-1',
          packageName: 'Spa Day',
        },
      ],
    })),
  };

  const packagesService = {
    listPublicPackages: jest.fn(async () => [{ id: 'pkg-1', name: 'Spa Day' }]),
  };

  const subscriptionsService = {
    listPlans: jest.fn(async () => [{ id: 'plan-1', name: 'Monthly Gold' }]),
    listCustomerSubscriptions: jest.fn(async () => [
      {
        id: 'sub-1',
        status: 'active',
        appointmentsRemaining: 3,
        plan: { name: 'Monthly Gold' },
      },
    ]),
  };

  const multiServiceBookingsService = {
    resolveSettingsFromBusiness: jest.fn(() => ({
      maxServiceCount: 5,
      turnoverBufferMinutes: 5,
      schedulingMode: 'same_visit',
    })),
  };

  const bookingRepo = {
    findOne: jest.fn(async ({ where }: any) => {
      if (where.id === 'book-1') {
        return {
          id: 'book-1',
          businessId: 'biz-1',
          customerId: 'cust-1',
          status: BookingStatus.CONFIRMED,
          startTime: futureBookingStart(),
          metadata: {},
          service: services[0],
          employee: { name: 'Maria' },
        };
      }
      return null;
    }),
    find: jest.fn(async () => [
      {
        id: 'book-1',
        businessId: 'biz-1',
        customerId: 'cust-1',
        status: BookingStatus.CONFIRMED,
        startTime: futureBookingStart(),
      },
    ]),
    save: jest.fn(async (b: any) => {
      b.metadata = { ...b.metadata, manageToken: 'token-abc' };
      return b;
    }),
  };

  let selfServiceBooking: AiSelfServiceBookingService;
  let rescue: AiIntentRescueService;

  beforeEach(async () => {
    jest.clearAllMocks();
    bookingRepo.find.mockReset();
    bookingRepo.findOne.mockReset();
    bookingRepo.save.mockReset();
    bookingRepo.find.mockImplementation(async () => [
      {
        id: 'book-1',
        businessId: 'biz-1',
        customerId: 'cust-1',
        status: BookingStatus.CONFIRMED,
        startTime: futureBookingStart(),
      },
    ]);
    bookingRepo.findOne.mockImplementation(
      async ({ where }: { where: { id?: string } }) => {
        if (where.id === 'book-1') {
          return {
            id: 'book-1',
            businessId: 'biz-1',
            customerId: 'cust-1',
            status: BookingStatus.CONFIRMED,
            startTime: futureBookingStart(),
            metadata: {},
            service: services[0],
            employee: { name: 'Maria' },
          };
        }
        return null;
      },
    );
    const module = await Test.createTestingModule({
      providers: [
        AiSelfServiceBookingService,
        AiIntentRescueService,
        { provide: PublicBookingService, useValue: publicBookingService },
        {
          provide: PublicCustomerBookingService,
          useValue: publicCustomerBookingService,
        },
        {
          provide: PublicCustomerAuthService,
          useValue: publicCustomerAuthService,
        },
        {
          provide: PublicConsumerSupportService,
          useValue: {
            createPostBookingSupportTicket: jest.fn(async () => ({
              ticketId: 'ticket-1',
            })),
          },
        },
        {
          provide: PublicCustomerWaitlistService,
          useValue: {},
        },
        {
          provide: NotificationsService,
          useValue: { sendCustomerRunningLate: jest.fn() },
        },
        { provide: ServicePackagesService, useValue: packagesService },
        {
          provide: ServiceSubscriptionsService,
          useValue: subscriptionsService,
        },
        {
          provide: MultiServiceBookingsService,
          useValue: multiServiceBookingsService,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => 'https://app.test') },
        },
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
        {
          provide: getRepositoryToken(Business),
          useValue: {
            findOne: jest.fn(async () => ({
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
            })),
          },
        },
        {
          provide: getRepositoryToken(Service),
          useValue: { find: jest.fn(async () => services) },
        },
      ],
    }).compile();

    selfServiceBooking = module.get(AiSelfServiceBookingService);
    rescue = module.get(AiIntentRescueService);
  });

  describe('rescue routing', () => {
    it('rescues selfServiceBooking before customerCrm my_appointments for list phrasing', () => {
      expect(
        rescue.rescue({
          prompt: 'List my appointments',
          action: 'unknown',
          params: {},
          surface: 'customer',
        })?.action,
      ).toBe('list_my_appointments');
    });

    it('leaves dashboard package booking to bookingDepth', () => {
      expect(
        rescue.rescue({
          prompt: 'Book spa day package for customer Anna',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('create_package_booking');
      expect(
        selfServiceBooking.rescueCustomerBookingIntent(
          'Book spa day package for customer Anna',
          'unknown',
        ),
      ).toBeNull();
    });

    it('rescues all selfServiceBooking intents', () => {
      const intents = [
        'Book spa day package',
        'Book massage and facial',
        'Is spa package available',
        'Check multi-service availability for massage and facial',
        'Select monthly gold plan',
        'Use subscription credit',
        'Cancel my booking',
        'Reschedule my appointment',
        'Cancel my package visit',
        'Reschedule my spa day visit',
        'Get manage link for my booking',
        'Explain cancel policy',
        'Book with cash',
        'Book with gift card',
        'Change provider on reschedule',
        'Add massage to cart',
        'Remove facial from cart',
        'Show cart total duration',
      ];
      for (const prompt of intents) {
        expect(
          rescue.rescue({
            prompt,
            action: 'unknown',
            params: {},
            surface: 'customer',
          })?.action,
        ).toBeTruthy();
      }
    });
  });

  describe('booking and availability handlers', () => {
    it('runs package and multi-service booking flows', async () => {
      expect(
        (
          await selfServiceBooking.handleBookPackage('biz-1', {
            packageName: 'Spa Day',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await selfServiceBooking.handleCheckPackageAvailability('biz-1', {
            packageName: 'Spa Day',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await selfServiceBooking.handleCheckMultiServiceAvailability(
            'biz-1',
            { serviceNames: ['Massage', 'Facial'] },
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await selfServiceBooking.handleBookMultiService('biz-1', {
            serviceNames: ['Massage', 'Facial'],
          })
        ).success,
      ).toBe(true);
    });

    it('runs subscription plan and credit flows', async () => {
      expect(
        (
          await selfServiceBooking.handleSelectSubscriptionPlan('biz-1', {
            planName: 'Monthly Gold',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await selfServiceBooking.handleUseSubscriptionCredit('biz-1', {
            sessionCustomerId: 'cust-1',
          })
        ).success,
      ).toBe(true);
    });
  });

  describe('self-service handlers', () => {
    it('runs cancel, reschedule, list, manage link, and policy', async () => {
      expect(
        (
          await selfServiceBooking.handleListMyAppointments('biz-1', {
            sessionCustomerId: 'cust-1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await selfServiceBooking.handleCancelMyBooking('biz-1', {
            sessionCustomerId: 'cust-1',
            bookingId: 'book-1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await selfServiceBooking.handleRescheduleMyBooking('biz-1', {
            sessionCustomerId: 'cust-1',
            bookingId: 'book-1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await selfServiceBooking.handleCancelPackageVisitSelf('biz-1', {
            sessionCustomerId: 'cust-1',
            bookingId: 'book-1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await selfServiceBooking.handleGetManageLink('biz-1', {
            sessionCustomerId: 'cust-1',
            bookingId: 'book-1',
          })
        ).success,
      ).toBe(true);
      expect(
        (await selfServiceBooking.handleExplainCancelPolicy('biz-1', {}))
          .success,
      ).toBe(true);
    });
  });

  describe('cart and payment handlers', () => {
    it('runs cart mutations and cash/gift card prefs', async () => {
      const add = await selfServiceBooking.handleAddServicesToCart('biz-1', {
        serviceNames: ['Massage'],
      });
      expect(add.success).toBe(true);
      const cartIds = (add.details as any).cartServiceIds;
      expect(
        (
          await selfServiceBooking.handleShowCartTotalDuration('biz-1', {
            cartServiceIds: cartIds,
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await selfServiceBooking.handleRemoveServiceFromCart('biz-1', {
            cartServiceIds: cartIds,
            serviceNames: ['Massage'],
          })
        ).success,
      ).toBe(true);
      expect(
        (await selfServiceBooking.handleBookWithCash('biz-1', {})).success,
      ).toBe(true);
      expect(
        (
          await selfServiceBooking.handleBookWithGiftCard('biz-1', {
            giftCardCode: 'GIFT1000',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await selfServiceBooking.handleChangeProviderOnReschedule('biz-1', {
            employeeName: 'Maria',
          })
        ).success,
      ).toBe(true);
    });
  });

  describe('compound flows', () => {
    it('executes cart + duration compound', async () => {
      const cart = await selfServiceBooking.handleCustomerBookingCompound(
        'biz-1',
        'Add massage and facial to cart and show cart total duration',
        { sessionCustomerId: 'cust-1' },
      );
      expect(cart.success).toBe(true);
      expect((cart.details as any).customerBookingCompound).toBe(true);
      expect((cart.details as any).steps.length).toBe(2);
    });

    it('executes list + manage link compound with context carry', async () => {
      const listed = await selfServiceBooking.handleCustomerBookingCompound(
        'biz-1',
        'List my appointments and get manage link',
        { sessionCustomerId: 'cust-1' },
      );
      expect(listed.success).toBe(true);
      expect((listed.details as any).steps.map((s: any) => s.action)).toEqual([
        'list_my_appointments',
        'get_manage_link',
      ]);
    });

    it('executes availability + book package compound', async () => {
      const flow = await selfServiceBooking.handleCustomerBookingCompound(
        'biz-1',
        'Check spa day package availability and book spa day package',
        {},
      );
      expect(flow.success).toBe(true);
      expect((flow.details as any).steps.length).toBe(2);
    });

    it('stops compound on failedStep when manage link missing booking', async () => {
      bookingRepo.find.mockImplementationOnce(async () => []);
      const stopped = await selfServiceBooking.handleCustomerBookingCompound(
        'biz-1',
        'compound',
        {
          compoundSteps: [
            { action: 'explain_cancel_policy', params: {}, segment: 'policy' },
            { action: 'get_manage_link', params: {}, segment: 'link' },
          ],
        },
      );
      expect(stopped.success).toBe(false);
      expect((stopped.details as any).failedStep).toBe('get_manage_link');
    });

    it('rejects single-step compound prompts', async () => {
      const single = await selfServiceBooking.handleCustomerBookingCompound(
        'biz-1',
        'Cancel my booking',
        {
          sessionCustomerId: 'cust-1',
        },
      );
      expect(single.success).toBe(false);
      expect(single.summary).toContain('Could not split');
    });

    it('executes subscription + cash compound', async () => {
      const flow = await selfServiceBooking.handleCustomerBookingCompound(
        'biz-1',
        'Select monthly gold plan and book with cash',
        { sessionCustomerId: 'cust-1' },
      );
      expect(flow.success).toBe(true);
      expect((flow.details as any).steps.map((s: any) => s.action)).toEqual([
        'select_subscription_plan',
        'book_with_cash',
      ]);
    });

    it('executes cancel + policy compound', async () => {
      const flow = await selfServiceBooking.handleCustomerBookingCompound(
        'biz-1',
        'Explain cancel policy and cancel my booking',
        { sessionCustomerId: 'cust-1', bookingId: 'book-1' },
      );
      expect(flow.success).toBe(true);
    });
  });

  describe('failure and edge scenarios', () => {
    it('requires sign-in for self-service cancel', async () => {
      expect(
        (await selfServiceBooking.handleCancelMyBooking('biz-1', {})).success,
      ).toBe(false);
    });

    it('returns empty cart error for duration', async () => {
      expect(
        (await selfServiceBooking.handleShowCartTotalDuration('biz-1', {}))
          .success,
      ).toBe(false);
    });

    it('returns clarify when removing from empty cart', async () => {
      expect(
        (await selfServiceBooking.handleRemoveServiceFromCart('biz-1', {}))
          .success,
      ).toBe(false);
    });

    it('handles package availability with no slots', async () => {
      publicBookingService.suggestPackageLineSlots.mockResolvedValueOnce({
        lines: [],
      });
      const result = await selfServiceBooking.handleCheckPackageAvailability(
        'biz-1',
        { packageName: 'Spa Day' },
      );
      expect(result.success).toBe(true);
      expect(result.summary).toContain('No package blocks');
    });

    it('handles multi-service availability failure', async () => {
      publicBookingService.suggestMultiServiceBlock.mockRejectedValueOnce(
        new Error('none'),
      );
      expect(
        (
          await selfServiceBooking.handleCheckMultiServiceAvailability(
            'biz-1',
            { serviceNames: ['Massage'] },
          )
        ).success,
      ).toBe(false);
    });

    it('reschedules with date and time slot', async () => {
      expect(
        (
          await selfServiceBooking.handleRescheduleMyBooking('biz-1', {
            sessionCustomerId: 'cust-1',
            bookingId: 'book-1',
            date: '2026-06-12',
            timeSlot: '11:00',
          })
        ).success,
      ).toBe(true);
    });

    it('resolves manage link via session without explicit booking id', async () => {
      const ownedBooking = {
        id: 'book-1',
        businessId: 'biz-1',
        customerId: 'cust-1',
        status: BookingStatus.CONFIRMED,
        startTime: futureBookingStart(),
        metadata: {},
        service: services[0],
        employee: { name: 'Maria' },
      };
      bookingRepo.find.mockImplementation(async () => [ownedBooking]);
      bookingRepo.findOne.mockImplementation(
        async ({ where }: { where: { id?: string } }) =>
          where.id === 'book-1' ? ownedBooking : null,
      );
      expect(
        (
          await selfServiceBooking.handleGetManageLink('biz-1', {
            sessionCustomerId: 'cust-1',
          })
        ).success,
      ).toBe(true);
    });
  });
});
