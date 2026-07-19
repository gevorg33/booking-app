import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiConsumerAdoptionService } from './ai-consumer-adoption.service.js';
import { Business } from '../business/entities/business.entity.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import { AiPushNotificationsService } from './ai-push-notifications.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ConsumerPushTokenService } from '../notifications/consumer-push-token.service.js';
import { GROWTH_LOOPS_CUSTOMER_PROMPTS } from './ai-growth-loops-customer.fixtures.js';
import { rescueGrowthLoopsCustomerIntent } from './ai-growth-loops-customer.util.js';

describe('ai-growth-loops-customer integration (ai-cmd-customer-4.0 P3)', () => {
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
              referrerRewardSummary: '100 points',
            })),
            getCustomerShareRewards: jest.fn(async () => ({
              salonShareEnabled: true,
              salonRewardSummary: '50 points',
              bookingShareEnabled: true,
              bookingRewardSummary: '25 points',
            })),
          },
        },
        {
          provide: PublicCustomerAuthService,
          useValue: {},
        },
        {
          provide: AiPushNotificationsService,
          useValue: {},
        },
        {
          provide: NotificationsService,
          useValue: {},
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

  it.each(GROWTH_LOOPS_CUSTOMER_PROMPTS.map((row) => [row.id, row]))(
    'rescues growth loops action for $0',
    (_id, row) => {
      expect(
        rescueGrowthLoopsCustomerIntent(row.prompt, 'unknown')?.action,
      ).toBe(row.expectedAction);
    },
  );

  it('returns referral code for refer_a_friend', async () => {
    const result = await service.handleIntent('biz-1', 'refer_a_friend', {
      sessionCustomerId: 'cust-1',
      slug: 'demo-salon',
    });
    expect(result?.success).toBe(true);
    expect(result?.details?.referralCode).toBe('ABC12345');
    expect(result?.details?.shareUrl).toContain('ref=ABC12345');
  });

  // e2e-bug.125
  it('returns referral code without params.slug via businessId lookup', async () => {
    const result = await service.handleIntent('biz-1', 'refer_a_friend', {
      sessionCustomerId: 'cust-1',
    });
    expect(result?.success).toBe(true);
    expect(result?.details?.referralCode).toBe('ABC12345');
  });

  it('returns growth navigation for share_salon_link', async () => {
    const result = await service.handleIntent('biz-1', 'share_salon_link', {
      sessionCustomerId: 'cust-1',
      slug: 'demo-salon',
    });
    expect(result?.success).toBe(true);
    expect(result?.details?.navigate).toMatchObject({
      path: 'account',
      query: { section: 'growth' },
    });
    expect(result?.details?.salonShareEnabled).toBe(true);
  });

  it('returns share_salon_link without params.slug via businessId lookup', async () => {
    const result = await service.handleIntent('biz-1', 'share_salon_link', {
      sessionCustomerId: 'cust-1',
    });
    expect(result?.success).toBe(true);
    expect(result?.details?.navigate).toMatchObject({
      path: 'account',
      query: { section: 'growth' },
    });
  });
});
