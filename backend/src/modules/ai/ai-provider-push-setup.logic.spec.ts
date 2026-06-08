import { describe, expect, it, jest } from '@jest/globals';
import {
  handleEnablePushNotificationsLogic,
  handleExplainPushSetupLogic,
} from './ai-provider-push-setup.logic.js';

describe('ai-provider-push-setup.logic', () => {
  const pushService = {
    getNativePushStatus: jest.fn(async () => ({
      registered: false,
      platform: 'ios' as const,
    })),
  };

  it('explains native FCM setup with profile navigation', async () => {
    const result = await handleExplainPushSetupLogic('biz-1', {
      nativePlatform: 'ios',
    });
    expect(result.action).toBe('explain_push_setup');
    expect(result.details?.navigate).toEqual({
      path: '/tabs/profile',
      query: {},
    });
  });

  it('returns enable navigation when push is not registered', async () => {
    const result = await handleEnablePushNotificationsLogic(
      { pushService: pushService as any },
      'biz-1',
      'user-1',
      { nativePlatform: 'android' },
    );
    expect(result.action).toBe('enable_push_notifications');
    expect(result.details?.navigate).toMatchObject({
      path: '/tabs/profile',
      query: { enablePush: '1' },
    });
    expect(result.details?.clientAction).toBe('enableNativePush');
  });

  it('reports already enabled when token is registered', async () => {
    pushService.getNativePushStatus.mockResolvedValueOnce({
      registered: true,
      platform: 'ios',
    });
    const result = await handleEnablePushNotificationsLogic(
      { pushService: pushService as any },
      'biz-1',
      'user-1',
      {},
    );
    expect(result.success).toBe(true);
    expect(result.details?.registered).toBe(true);
  });
});
