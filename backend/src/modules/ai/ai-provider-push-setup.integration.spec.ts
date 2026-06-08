import { Test } from '@nestjs/testing';
import { AiProviderPushSetupService } from './ai-provider-push-setup.service.js';
import { PushService } from '../provider-mobile/push.service.js';
import { PROVIDER_PUSH_SETUP_PROMPT_SCENARIOS } from './ai-provider-push-setup.fixtures.js';
import { rescueProviderPushSetupIntent } from './ai-provider-push-setup.util.js';

describe('Sprint adopt-6.7 — provider push setup AI scenarios', () => {
  let service: AiProviderPushSetupService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiProviderPushSetupService,
        {
          provide: PushService,
          useValue: {
            getNativePushStatus: jest.fn(async () => ({
              registered: false,
              platform: 'ios',
            })),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AiProviderPushSetupService);
  });

  it.each(PROVIDER_PUSH_SETUP_PROMPT_SCENARIOS.map((scenario) => [scenario.id, scenario]))(
    'rescues classifier action for $0',
    (_id, scenario) => {
      expect(rescueProviderPushSetupIntent(scenario.prompt, 'unknown')?.action).toBe(
        scenario.expectedAction,
      );
    },
  );

  it('returns profile navigation for enable_push_notifications', async () => {
    const result = await service.handleIntent(
      'biz-1',
      'user-1',
      'enable_push_notifications',
      { nativePlatform: 'ios' },
    );
    expect(result?.success).toBe(true);
    expect(result?.details?.navigate).toMatchObject({
      path: '/tabs/profile',
      query: { enablePush: '1' },
    });
  });
});
