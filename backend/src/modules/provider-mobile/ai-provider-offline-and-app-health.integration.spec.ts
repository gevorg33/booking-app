import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';

describe('provider AI offline queue & app health (ai-cmd-provider-5.13)', () => {
  const businessId = 'biz-513';
  const userId = 'user-513';
  const employeeId = 'emp-513';

  let service: ReturnType<typeof createProviderAiCommandHarness>;
  let llm: { isAvailableForBusiness: jest.Mock; completeJson: jest.Mock<any> };
  let pushNotifications: {
    isPushNotificationsCompound: jest.Mock<any>;
    handlePushNotificationsCompound: jest.Mock<any>;
    rescuePushNotificationsIntent: jest.Mock<any>;
    handleOpenBookingFromPush: jest.Mock<any>;
    handleExplainLastPush: jest.Mock<any>;
    handleOfflineQueueStatus: jest.Mock<any>;
    handleRetryOfflineAction: jest.Mock<any>;
    handleProviderExplainOfflineMode: jest.Mock<any>;
    handleProviderExplainAppUpdateGate: jest.Mock<any>;
  };

  const staffAccess = {
    viewMode: 'provider' as const,
    membershipRole: MemberRole.STAFF,
    employee: { id: employeeId, name: 'Alex Provider' },
  };

  beforeEach(() => {
    llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(),
    };
    pushNotifications = {
      isPushNotificationsCompound: jest.fn(() => false),
      handlePushNotificationsCompound: jest.fn(),
      rescuePushNotificationsIntent: jest.fn(() => null),
      handleOpenBookingFromPush: jest.fn(),
      handleExplainLastPush: jest.fn(),
      handleOfflineQueueStatus: jest.fn(async () => ({
        success: true,
        action: 'offline_queue_status',
        summary: 'You are offline with 2 queued actions.',
        details: { online: false, queuedCount: 2, providerOffline: true },
      })),
      handleRetryOfflineAction: jest.fn(async () => ({
        success: true,
        action: 'retry_offline_action',
        summary: 'Replay started for 2 queued actions.',
        details: { canRetry: true, steps: [], providerOffline: true },
      })),
      handleProviderExplainOfflineMode: jest.fn(async () => ({
        success: true,
        action: 'explain_offline_mode',
        summary: 'The provider app shows offline when your device loses network connectivity.',
        details: { online: false, queuedCount: 0, providerOffline: true },
      })),
      handleProviderExplainAppUpdateGate: jest.fn(async () => ({
        success: true,
        action: 'explain_app_update_gate',
        summary: 'The provider app checks your installed build against the platform minimum version.',
        details: { providerAppGate: true },
      })),
    };
    service = createProviderAiCommandHarness({
      llm,
      providerMobile: {
        resolveMobileAccess: jest.fn(async () => staffAccess),
        getScopedEmployeeId: jest.fn(() => employeeId),
      },
      pushNotifications,
    });
  });

  function mockIntent(action: string, params: Record<string, unknown>) {
    llm.completeJson.mockResolvedValue({ action, params, reasoning: 'test' });
  }

  it('dispatches offline_queue_status with offline context', async () => {
    mockIntent('offline_queue_status', {});

    const result = await service.executeCommand(
      businessId,
      userId,
      "What's queued offline?",
      [],
      { offlineQueueCount: 2, online: false },
    );

    expect(result.action).toBe('offline_queue_status');
    expect(pushNotifications.handleOfflineQueueStatus).toHaveBeenCalledWith(
      expect.objectContaining({ offlineQueueCount: 2, online: false }),
    );
  });

  it('dispatches retry_offline_action with offline context', async () => {
    mockIntent('retry_offline_action', {});

    const result = await service.executeCommand(
      businessId,
      userId,
      'Retry failed sync',
      [],
      { offlineQueueCount: 2, online: true },
    );

    expect(result.action).toBe('retry_offline_action');
    expect(pushNotifications.handleRetryOfflineAction).toHaveBeenCalledWith(
      expect.objectContaining({ offlineQueueCount: 2, online: true }),
    );
  });

  it('dispatches explain_offline_mode to the provider-surface handler', async () => {
    mockIntent('explain_offline_mode', {});

    const result = await service.executeCommand(
      businessId,
      userId,
      'Why does the provider app say offline?',
      [],
      { offlineQueueCount: 0, online: false },
    );

    expect(result.action).toBe('explain_offline_mode');
    expect(
      pushNotifications.handleProviderExplainOfflineMode,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ offlineQueueCount: 0, online: false }),
    );
  });

  it('dispatches explain_app_update_gate to the provider-surface handler', async () => {
    mockIntent('explain_app_update_gate', {});

    const result = await service.executeCommand(
      businessId,
      userId,
      'Why must I update the provider app?',
      [],
    );

    expect(result.action).toBe('explain_app_update_gate');
    expect(
      pushNotifications.handleProviderExplainAppUpdateGate,
    ).toHaveBeenCalledWith(expect.objectContaining({}));
  });
});
