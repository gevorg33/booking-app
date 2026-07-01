import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AiSelfServiceBookingService } from './ai-self-service-booking.service.js';
import { Booking } from '../booking/entities/booking.entity.js';
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

describe('AiSelfServiceBookingService', () => {
  let service: AiSelfServiceBookingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AiSelfServiceBookingService,
        {
          provide: PublicBookingService,
          useValue: {
            suggestPackageLineSlots: jest.fn(async () => ({ lines: [] })),
            suggestMultiServiceBlock: jest.fn(),
          },
        },
        {
          provide: PublicCustomerBookingService,
          useValue: { cancelBooking: jest.fn(), rescheduleBooking: jest.fn() },
        },
        {
          provide: PublicCustomerAuthService,
          useValue: { listBookings: jest.fn(async () => ({ bookings: [] })) },
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
        {
          provide: ServicePackagesService,
          useValue: {
            listPublicPackages: jest.fn(async () => [
              { id: 'pkg-1', name: 'Spa Day' },
            ]),
          },
        },
        {
          provide: ServiceSubscriptionsService,
          useValue: {
            listPlans: jest.fn(async () => []),
            listCustomerSubscriptions: jest.fn(async () => []),
          },
        },
        {
          provide: MultiServiceBookingsService,
          useValue: {
            resolveSettingsFromBusiness: jest.fn(() => ({
              maxServiceCount: 5,
              turnoverBufferMinutes: 5,
            })),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => 'https://app.test') },
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: { findOne: jest.fn(), find: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(Business),
          useValue: {
            findOne: jest.fn(async () => ({
              id: 'biz-1',
              slug: 'salon',
              settings: {
                publicBooking: {
                  acceptCashPayments: true,
                  customerSelfService: {},
                },
              },
            })),
          },
        },
        {
          provide: getRepositoryToken(Service),
          useValue: {
            find: jest.fn(async () => [
              { id: 'svc-1', name: 'Massage', durationMinutes: 60 },
            ]),
          },
        },
      ],
    }).compile();

    service = module.get(AiSelfServiceBookingService);
  });

  it('rescues customer booking intents', () => {
    expect(
      service.rescueCustomerBookingIntent('Cancel my booking', 'unknown')
        ?.action,
    ).toBe('cancel_my_booking');
  });

  it('detects compound prompts', () => {
    expect(
      service.isCustomerBookingCompound(
        'Add massage to cart and show cart total duration',
      ),
    ).toBe(true);
  });

  it('delegates book package handler', async () => {
    const result = await service.handleBookPackage('biz-1', {
      packageName: 'Spa Day',
    });
    expect(result.success).toBe(true);
    expect(result.action).toBe('book_package');
  });
});
