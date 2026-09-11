import { Test } from '@nestjs/testing';
import { makeBusiness } from '../business/entities/business.test-fixture.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiConsumerAdoptionService } from './ai-consumer-adoption.service.js';
import { Business } from '../business/entities/business.entity.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import { AiPushNotificationsService } from './ai-push-notifications.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ConsumerPushTokenService } from '../notifications/consumer-push-token.service.js';
import {
  EXPLAIN_PUSH_PERMISSION_PROMPTS,
  EXPLAIN_PUSH_PERMISSION_RESCUE_SCENARIOS,
} from './ai-explain-push-permission.fixtures.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';

describe('ai-explain-push-permission integration (ai-cmd-customer-4.13.2)', () => {
  let service: AiConsumerAdoptionService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiConsumerAdoptionService,
        { provide: PublicBookingService, useValue: {} },
        {
          provide: PublicCustomerAuthService,
          useValue: {
            getCustomerById: jest.fn(async () => ({
              metadata: { notificationPreferences: { pushReminders: true } },
            })),
          },
        },
        { provide: AiPushNotificationsService, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        {
          provide: ConsumerPushTokenService,
          useValue: {
            getNativePushStatus: jest.fn(async () => ({
              registered: false,
              platform: 'android',
            })),
          },
        },
        {
          provide: getRepositoryToken(Business),
          useValue: {
            findOne: jest.fn(async () =>
              makeBusiness({ id: 'biz-1', slug: 'demo-salon' }),
            ),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AiConsumerAdoptionService);
  });

  it.each(
    EXPLAIN_PUSH_PERMISSION_PROMPTS.slice(0, 3).map((row) => [
      row.id,
      row.prompt,
    ]),
  )('handles explain_push_permission for $0', async (_id, prompt) => {
    const result = await service.handleIntent(
      'biz-1',
      'explain_push_permission',
      {
        sessionCustomerId: 'cust-1',
        slug: 'demo-salon',
        pushPermissionState: 'denied',
        platform: 'android',
      },
      prompt,
    );
    expect(result?.success).toBe(true);
    expect(result?.action).toBe('explain_push_permission');
  });

  it.each(EXPLAIN_PUSH_PERMISSION_RESCUE_SCENARIOS)(
    'pipeline rescues explain_push_permission for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueConsumerAdoptionIntent(prompt, misclassifiedAction)?.action,
      ).toBe('explain_push_permission');
    },
  );
});
