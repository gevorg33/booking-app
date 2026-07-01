import { Test } from '@nestjs/testing';
import { AiConsumerAdoptionService } from './ai-consumer-adoption.service.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import { AiPushNotificationsService } from './ai-push-notifications.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ConsumerPushTokenService } from '../notifications/consumer-push-token.service.js';
import {
  EXPLAIN_APP_UPDATE_REQUIRED_PROMPTS,
  EXPLAIN_APP_UPDATE_REQUIRED_RESCUE_SCENARIOS,
} from './ai-explain-app-update-required.fixtures.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';

describe('ai-explain-app-update-required integration (ai-cmd-customer-4.13.4)', () => {
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
      ],
    }).compile();

    service = moduleRef.get(AiConsumerAdoptionService);
  });

  it.each(
    EXPLAIN_APP_UPDATE_REQUIRED_PROMPTS.slice(0, 3).map((row) => [
      row.id,
      row.prompt,
    ]),
  )('handles explain_app_update_required for $0', async (_id, prompt) => {
    const result = await service.handleIntent(
      'biz-1',
      'explain_app_update_required',
      { appVersion: '1.0.0', nativePlatform: 'ios' },
      prompt,
    );
    expect(result?.success).toBe(true);
    expect(result?.action).toBe('explain_app_update_required');
  });

  it.each(EXPLAIN_APP_UPDATE_REQUIRED_RESCUE_SCENARIOS)(
    'pipeline rescues explain_app_update_required for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueConsumerAdoptionIntent(prompt, misclassifiedAction)?.action,
      ).toBe('explain_app_update_required');
    },
  );
});
