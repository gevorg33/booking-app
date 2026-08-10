import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiConsumerAdoptionService } from './ai-consumer-adoption.service.js';
import { Business } from '../business/entities/business.entity.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import { AiPushNotificationsService } from './ai-push-notifications.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ConsumerPushTokenService } from '../notifications/consumer-push-token.service.js';
import { FIND_MY_SAVED_SALONS_PROMPTS } from './ai-find-my-saved-salons.fixtures.js';
import { SWITCH_SALON_TENANT_PROMPTS } from './ai-switch-salon-tenant.fixtures.js';
import { DEFAULT_BUSINESS_NOTIFICATION_SETTINGS } from '../notifications/notification.types.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';

describe('Sprint adopt-6.6 — consumer adoption AI scenarios', () => {
  let service: AiConsumerAdoptionService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiConsumerAdoptionService,
        {
          provide: PublicBookingService,
          useValue: {
            getCustomerReferralProgram: jest.fn(async () => ({
              referralCode: 'ABC12345',
              shareUrl: 'https://book.example/s/demo?ref=ABC12345',
              enabled: true,
              referrerBonusPoints: 100,
              refereeBonusPoints: 50,
              refereePromoCode: null,
              conversionsCount: 0,
            })),
          },
        },
        {
          provide: PublicCustomerAuthService,
          useValue: {
            listBookings: jest.fn(async () => ({
              bookings: [
                {
                  id: 'b1',
                  serviceId: 'svc-1',
                  serviceName: 'Haircut',
                  employeeId: 'emp-1',
                  employeeName: 'Alex',
                  startTime: '2026-05-01T10:00:00.000Z',
                  status: 'completed',
                },
              ],
            })),
          },
        },
        {
          provide: AiPushNotificationsService,
          useValue: {
            handleEnableNotifications: jest.fn(async () => ({
              success: true,
              action: 'enable_notifications',
              summary: 'Appointment notifications enabled.',
              details: {},
            })),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            getBusinessSettings: jest.fn(async () => ({
              ...DEFAULT_BUSINESS_NOTIFICATION_SETTINGS,
            })),
          },
        },
        {
          provide: ConsumerPushTokenService,
          useValue: {
            getNativePushStatus: jest.fn(async () => ({
              registered: false,
              platform: null,
            })),
          },
        },
        {
          provide: getRepositoryToken(Business),
          useValue: {
            findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'demo-salon' })),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AiConsumerAdoptionService);
  });

  it.each(
    [...FIND_MY_SAVED_SALONS_PROMPTS, ...SWITCH_SALON_TENANT_PROMPTS].map(
      (scenario) => [scenario.id, scenario] as const,
    ),
  )('rescues classifier action for $0', (_id, scenario) => {
    expect(
      rescueConsumerAdoptionIntent(scenario.prompt, 'unknown')?.action,
    ).toBe(scenario.expectedAction);
  });

  it('returns referral code for refer_a_friend', async () => {
    const result = await service.handleIntent('biz-1', 'refer_a_friend', {
      sessionCustomerId: 'cust-1',
      slug: 'demo-salon',
    });
    expect(result?.success).toBe(true);
    expect(result?.details?.referralCode).toBe('ABC12345');
  });

  // e2e-bug.125 — natural language never supplies params.slug
  it('returns referral code without params.slug via businessId lookup', async () => {
    const result = await service.handleIntent('biz-1', 'refer_a_friend', {
      sessionCustomerId: 'cust-1',
    });
    expect(result?.success).toBe(true);
    expect(result?.details?.referralCode).toBe('ABC12345');
  });

  it('returns rebook navigation for rebook_last_appointment', async () => {
    const result = await service.handleIntent(
      'biz-1',
      'rebook_last_appointment',
      { sessionCustomerId: 'cust-1', slug: 'demo-salon' },
      'Rebook my last appointment',
    );
    expect(result?.success).toBe(true);
    expect(result?.details?.navigate).toMatchObject({
      path: 'checkout',
      query: expect.objectContaining({
        serviceId: 'svc-1',
        rebook: '1',
        rebookSource: 'account',
      }),
    });
  });
});
