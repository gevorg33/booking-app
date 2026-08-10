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
  EXPLAIN_OFFLINE_MODE_PROMPTS,
  EXPLAIN_OFFLINE_MODE_RESCUE_SCENARIOS,
} from './ai-explain-offline-mode.fixtures.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';

describe('ai-explain-offline-mode integration (ai-cmd-customer-4.13.3)', () => {
  let service: AiConsumerAdoptionService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiConsumerAdoptionService,
        { provide: PublicBookingService, useValue: {} },
        { provide: PublicCustomerAuthService, useValue: {} },
        { provide: AiPushNotificationsService, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        {
          provide: ConsumerPushTokenService,
          useValue: {
            getNativePushStatus: jest.fn(async () => ({ registered: false })),
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
    EXPLAIN_OFFLINE_MODE_PROMPTS.slice(0, 3).map((row) => [row.id, row.prompt]),
  )('handles explain_offline_mode for $0', async (_id, prompt) => {
    const result = await service.handleIntent(
      'biz-1',
      'explain_offline_mode',
      { online: false, offlineQueueCount: 1 },
      prompt,
    );
    expect(result?.success).toBe(true);
    expect(result?.action).toBe('explain_offline_mode');
  });

  it.each(EXPLAIN_OFFLINE_MODE_RESCUE_SCENARIOS)(
    'pipeline rescues explain_offline_mode for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueConsumerAdoptionIntent(prompt, misclassifiedAction)?.action,
      ).toBe('explain_offline_mode');
    },
  );
});
