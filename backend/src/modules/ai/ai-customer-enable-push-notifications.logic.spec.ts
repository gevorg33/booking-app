import { handleCustomerEnablePushNotificationsLogic } from './ai-customer-enable-push-notifications.logic.js';
import {
  CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_PROMPTS,
  CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_RESCUE_SCENARIOS,
} from './ai-customer-enable-push-notifications.fixtures.js';
import { rescueCustomerEnablePushNotificationsIntent } from './ai-customer-enable-push-notifications.util.js';

describe('ai-customer-enable-push-notifications.logic (ai-cmd-customer-4.13.1)', () => {
  const deps = {
    consumerPushTokenService: {
      getNativePushStatus: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires sign-in', async () => {
    const result = await handleCustomerEnablePushNotificationsLogic(
      deps as any,
      'biz-1',
      {},
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('enable_push_notifications');
    expect(result.details?.clarify).toBe(true);
  });

  it('returns already registered summary', async () => {
    deps.consumerPushTokenService.getNativePushStatus.mockResolvedValue({
      registered: true,
      platform: 'ios',
    });
    const result = await handleCustomerEnablePushNotificationsLogic(
      deps as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
    );
    expect(result.success).toBe(true);
    expect(result.details?.registered).toBe(true);
    expect(result.details?.navigate).toEqual({
      path: 'account',
      query: { section: 'notifications' },
    });
    expect(result.details?.clientAction).toBeUndefined();
  });

  it('returns client action when not registered', async () => {
    deps.consumerPushTokenService.getNativePushStatus.mockResolvedValue({
      registered: false,
      platform: 'android',
    });
    const result = await handleCustomerEnablePushNotificationsLogic(
      deps as any,
      'biz-1',
      { sessionCustomerId: 'cust-1', platform: 'android' },
    );
    expect(result.success).toBe(true);
    expect(result.details?.registered).toBe(false);
    expect(result.details?.clientAction).toBe('enableConsumerNativePush');
    expect(result.details?.navigate).toEqual({
      path: 'account',
      query: { section: 'notifications', enablePush: '1' },
    });
  });

  it.each(
    CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_PROMPTS.slice(0, 3).map((row) => [
      row.id,
      row.prompt,
    ]),
  )(
    'handles enable_push_notifications for fixture $0',
    async (_id, _prompt) => {
      deps.consumerPushTokenService.getNativePushStatus.mockResolvedValue({
        registered: false,
        platform: null,
      });
      const result = await handleCustomerEnablePushNotificationsLogic(
        deps as any,
        'biz-1',
        { sessionCustomerId: 'cust-1', slug: 'salon' },
      );
      expect(result.action).toBe('enable_push_notifications');
      expect(result.success).toBe(true);
    },
  );

  it.each(CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_RESCUE_SCENARIOS)(
    'pipeline rescues enable_push_notifications for $id',
    ({ prompt, misclassifiedAction }) => {
      const rescued = rescueCustomerEnablePushNotificationsIntent(
        prompt,
        misclassifiedAction,
      );
      expect(rescued?.action).toBe('enable_push_notifications');
    },
  );
});
