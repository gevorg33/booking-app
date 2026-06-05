import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiProviderBookingService } from './ai-provider-booking.service.js';
import {
  Booking,
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { BookingService } from '../booking/booking.service.js';

describe('Sprint 37 provider booking AI scenarios', () => {
  const bookings = [
    {
      id: 'book-pkg-1',
      businessId: 'biz-1',
      employeeId: 'emp-1',
      packagePurchaseId: 'purchase-1',
      multiServiceGroupId: null,
      startTime: new Date(),
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PENDING,
      metadata: { payAtVenue: true },
      customer: { name: 'Anna' },
      service: { name: 'Massage' },
      employee: { name: 'Maria' },
    },
    {
      id: 'book-ms-1',
      businessId: 'biz-1',
      employeeId: 'emp-1',
      packagePurchaseId: null,
      multiServiceGroupId: 'group-1',
      startTime: new Date(),
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PENDING,
      metadata: {},
      customer: { name: 'John' },
      service: { name: 'Haircut' },
      employee: { name: 'Maria' },
    },
    {
      id: 'book-other',
      businessId: 'biz-1',
      employeeId: 'emp-2',
      packagePurchaseId: 'purchase-2',
      multiServiceGroupId: null,
      startTime: new Date(),
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PENDING,
      metadata: {},
      customer: { name: 'Sofia' },
      service: { name: 'Facial' },
      employee: { name: 'Anna' },
    },
  ];

  const bookingRepo = {
    find: jest.fn(async () => bookings),
    findOne: jest.fn(
      async ({ where }: { where: { id?: string } }) =>
        bookings.find((b) => b.id === where.id) ?? null,
    ),
  };

  let providerBooking: AiProviderBookingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    bookingRepo.find.mockImplementation(async () => bookings);
    bookingRepo.findOne.mockImplementation(
      async ({ where }: { where: { id?: string } }) =>
        bookings.find((b) => b.id === where.id) ?? null,
    );

    const module = await Test.createTestingModule({
      providers: [
        AiProviderBookingService,
        {
          provide: BookingService,
          useValue: {
            update: jest.fn(async (id, patch) => ({ id, ...patch })),
          },
        },
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
      ],
    }).compile();

    providerBooking = module.get(AiProviderBookingService);
  });

  describe('rescue routing', () => {
    it('rescues all providerBooking intents', () => {
      const intents = [
        'Show my package appointments today',
        'List my package visits this week',
        'List my multi-service groups',
        'Mark booking paid',
      ];
      for (const prompt of intents) {
        expect(
          providerBooking.rescueProviderBookingIntent(prompt, 'unknown')
            ?.action,
        ).toBeTruthy();
      }
    });

    it('leaves dashboard package list phrasing unrescued', () => {
      expect(
        providerBooking.rescueProviderBookingIntent(
          'List package visits this week',
          'unknown',
        ),
      ).toBeNull();
    });

    it('rescues mark_paid over update_bookings', () => {
      expect(
        providerBooking.rescueProviderBookingIntent(
          'Mark booking paid',
          'update_bookings',
        )?.action,
      ).toBe('mark_paid');
    });
  });

  describe('scoped list handlers', () => {
    it('lists package appointments today for provider scope', async () => {
      const result = await providerBooking.handleListPackageAppointmentsToday(
        'biz-1',
        { sessionEmployeeId: 'emp-1' },
      );
      expect(result.success).toBe(true);
      expect((result.details as any).count).toBe(1);
    });

    it('lists package visits and multi-service groups', async () => {
      expect(
        (
          await providerBooking.handleListMyPackageVisits(
            'biz-1',
            'my package visits',
            { sessionEmployeeId: 'emp-1' },
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await providerBooking.handleListMyMultiServiceGroups(
            'biz-1',
            'my multi-service groups',
            {
              sessionEmployeeId: 'emp-1',
            },
          )
        ).success,
      ).toBe(true);
    });

    it('returns empty scoped results', async () => {
      bookingRepo.find.mockResolvedValueOnce([]);
      expect(
        (
          await providerBooking.handleListPackageAppointmentsToday('biz-1', {
            sessionEmployeeId: 'emp-1',
          })
        ).summary,
      ).toContain('No package appointments');
    });

    it('allows manager view without employee scope', async () => {
      const result = await providerBooking.handleListPackageAppointmentsToday(
        'biz-1',
        {},
      );
      expect((result.details as any).count).toBe(2);
    });
  });

  describe('mark_paid', () => {
    it('marks own booking paid', async () => {
      expect(
        (
          await providerBooking.handleMarkPaid(
            'biz-1',
            { bookingId: 'book-pkg-1', sessionEmployeeId: 'emp-1' },
            'user-1',
          )
        ).success,
      ).toBe(true);
    });

    it('blocks mark paid for another provider calendar', async () => {
      expect(
        (
          await providerBooking.handleMarkPaid('biz-1', {
            bookingId: 'book-other',
            sessionEmployeeId: 'emp-1',
          })
        ).success,
      ).toBe(false);
    });

    it('requires booking id', async () => {
      expect(
        (
          await providerBooking.handleMarkPaid('biz-1', {
            sessionEmployeeId: 'emp-1',
          })
        ).success,
      ).toBe(false);
    });
  });

  describe('compound flows', () => {
    it('executes list + mark paid compound', async () => {
      const flow = await providerBooking.handleProviderBookingCompound(
        'biz-1',
        'Show my package appointments today and mark booking book-pkg-1 paid',
        { sessionEmployeeId: 'emp-1', userId: 'user-1' },
      );
      expect(flow.success).toBe(true);
      expect((flow.details as any).providerBookingCompound).toBe(true);
      expect(
        (flow.details as any).steps.map((s: { action: string }) => s.action),
      ).toEqual(['list_package_appointments_today', 'mark_paid']);
    });

    it('executes package visits + multi-service compound', async () => {
      const flow = await providerBooking.handleProviderBookingCompound(
        'biz-1',
        'List my package visits this week and list my multi-service groups',
        { sessionEmployeeId: 'emp-1' },
      );
      expect(flow.success).toBe(true);
      expect((flow.details as any).steps).toHaveLength(2);
    });

    it('executes three-step compound via then split', async () => {
      const flow = await providerBooking.handleProviderBookingCompound(
        'biz-1',
        'Show my package appointments today then list my multi-service groups then mark booking book-pkg-1 paid',
        { sessionEmployeeId: 'emp-1', userId: 'user-1' },
      );
      expect(flow.success).toBe(true);
      expect((flow.details as any).steps).toHaveLength(3);
    });

    it('rejects single-step compound prompts', async () => {
      const single = await providerBooking.handleProviderBookingCompound(
        'biz-1',
        'Show my package appointments today',
        {
          sessionEmployeeId: 'emp-1',
        },
      );
      expect(single.success).toBe(false);
    });

    it('stops compound on failed mark_paid step', async () => {
      const stopped = await providerBooking.handleProviderBookingCompound(
        'biz-1',
        'compound',
        {
          sessionEmployeeId: 'emp-1',
          compoundSteps: [
            {
              action: 'list_package_appointments_today',
              params: {},
              segment: 'list',
            },
            {
              action: 'mark_paid',
              params: { bookingId: 'missing-booking' },
              segment: 'pay',
            },
          ],
        },
      );
      expect(stopped.success).toBe(false);
      expect((stopped.details as any).failedStep).toBe('mark_paid');
    });

    it('stops compound on scope violation', async () => {
      const stopped = await providerBooking.handleProviderBookingCompound(
        'biz-1',
        'compound',
        {
          sessionEmployeeId: 'emp-1',
          compoundSteps: [
            {
              action: 'list_package_appointments_today',
              params: {},
              segment: 'list',
            },
            {
              action: 'mark_paid',
              params: { bookingId: 'book-other' },
              segment: 'pay',
            },
          ],
        },
      );
      expect(stopped.success).toBe(false);
      expect((stopped.details as any).failedStep).toBe('mark_paid');
    });
  });
});
