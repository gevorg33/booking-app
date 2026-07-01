import { Test } from '@nestjs/testing';
import { AiConsumerAdoptionService } from './ai-consumer-adoption.service.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import { AiPushNotificationsService } from './ai-push-notifications.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ConsumerPushTokenService } from '../notifications/consumer-push-token.service.js';
import {
  EXPLAIN_HOME_SCREEN_WIDGET_PROMPTS,
  EXPLAIN_HOME_SCREEN_WIDGET_RESCUE_SCENARIOS,
} from './ai-explain-home-screen-widget.fixtures.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';

describe('ai-explain-home-screen-widget integration (ai-cmd-customer-4.13.6)', () => {
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
    EXPLAIN_HOME_SCREEN_WIDGET_PROMPTS.slice(0, 3).map((row) => [
      row.id,
      row.prompt,
    ]),
  )('handles explain_home_screen_widget for $0', async (_id, prompt) => {
    const result = await service.handleIntent(
      'biz-1',
      'explain_home_screen_widget',
      { nativePlatform: 'ios' },
      prompt,
    );
    expect(result?.success).toBe(true);
    expect(result?.action).toBe('explain_home_screen_widget');
  });

  it.each(EXPLAIN_HOME_SCREEN_WIDGET_RESCUE_SCENARIOS)(
    'pipeline rescues explain_home_screen_widget for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueConsumerAdoptionIntent(prompt, misclassifiedAction)?.action,
      ).toBe('explain_home_screen_widget');
    },
  );
});
