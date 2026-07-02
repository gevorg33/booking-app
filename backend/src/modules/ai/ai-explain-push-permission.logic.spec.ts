import { handleExplainPushPermissionLogic } from './ai-explain-push-permission.logic.js';
import {
  EXPLAIN_PUSH_PERMISSION_PROMPTS,
  EXPLAIN_PUSH_PERMISSION_RESCUE_SCENARIOS,
} from './ai-explain-push-permission.fixtures.js';
import { rescueExplainPushPermissionIntent } from './ai-explain-push-permission.util.js';

describe('ai-explain-push-permission.logic (ai-cmd-customer-4.13.2)', () => {
  const deps = {
    consumerPushTokenService: {
      getNativePushStatus: jest.fn(async () => ({
        registered: false,
        platform: 'ios',
      })),
    },
    publicCustomerAuthService: {
      getCustomerById: jest.fn(async () => ({
        metadata: { notificationPreferences: { pushReminders: true } },
      })),
    },
  };

  it.each(
    EXPLAIN_PUSH_PERMISSION_PROMPTS.slice(0, 4).map((row) => [
      row.id,
      row.prompt,
    ]),
  )('handles explain_push_permission for $0', async (_id, prompt) => {
    const result = await handleExplainPushPermissionLogic(
      deps as any,
      'biz-1',
      {
        sessionCustomerId: 'cust-1',
        slug: 'salon',
        pushPermissionState: 'denied',
      },
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_push_permission');
    expect(result.details?.aspect).toBeTruthy();
  });

  it('returns clientAction for open settings', async () => {
    const result = await handleExplainPushPermissionLogic(
      deps as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Open notification settings',
    );
    expect(result.details?.clientAction).toBe(
      'openConsumerNotificationSettings',
    );
    expect(result.details?.navigate).toEqual({
      path: 'account',
      query: { section: 'notifications', openPushSettings: '1' },
    });
  });

  it('clarifies on unrecognized prompt', async () => {
    const result = await handleExplainPushPermissionLogic(
      deps as any,
      'biz-1',
      {},
      'book a haircut',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('loads push reminders when missing from params', async () => {
    const result = await handleExplainPushPermissionLogic(
      deps as any,
      'biz-1',
      {
        sessionCustomerId: 'cust-1',
        pushPermissionState: 'provisional',
        platform: 'ios',
      },
      'What does provisional push mean on iPhone?',
    );
    expect(result.details?.pushRemindersEnabled).toBe(true);
  });

  it('uses default push reminders when customer lookup fails', async () => {
    deps.publicCustomerAuthService.getCustomerById.mockRejectedValueOnce(
      new Error('missing'),
    );
    const result = await handleExplainPushPermissionLogic(
      deps as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      "Why didn't I get a notification?",
    );
    expect(result.success).toBe(true);
  });
});
