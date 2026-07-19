import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiConsumerAdoptionService } from './ai-consumer-adoption.service.js';
import { Business } from '../business/entities/business.entity.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import { AiPushNotificationsService } from './ai-push-notifications.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ConsumerPushTokenService } from '../notifications/consumer-push-token.service.js';
import {
  CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_PROMPTS,
  CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_RESCUE_SCENARIOS,
} from './ai-customer-enable-push-notifications.fixtures.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';

describe('ai-customer-enable-push-notifications integration (ai-cmd-customer-4.13.1)', () => {
  let service: AiConsumerAdoptionService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiConsumerAdoptionService,
        {
          provide: PublicBookingService,
          useValue: {},
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
              platform: 'ios',
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
    CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_PROMPTS.map((row) => [
      row.id,
      row.prompt,
    ]),
  )('handles enable_push_notifications for $0', async (_id, _prompt) => {
    const result = await service.handleIntent(
      'biz-1',
      'enable_push_notifications',
      { sessionCustomerId: 'cust-1', slug: 'demo-salon' },
    );
    expect(result?.success).toBe(true);
    expect(result?.action).toBe('enable_push_notifications');
    expect(result?.details?.clientAction).toBe('enableConsumerNativePush');
  });

  it.each(CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_RESCUE_SCENARIOS)(
    'pipeline rescues enable_push_notifications for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueConsumerAdoptionIntent(prompt, misclassifiedAction)?.action,
      ).toBe('enable_push_notifications');
    },
  );
});
