import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';

describe('provider AI push notification inbox actions (ai-cmd-provider-6.8)', () => {
  const businessId = 'biz-68';
  const userId = 'user-68';
  const employeeId = 'emp-68';

  let service: ReturnType<typeof createProviderAiCommandHarness>;
  let llm: { isAvailableForBusiness: jest.Mock; completeJson: jest.Mock<any> };
  let pushNotifications: {
    isPushNotificationsCompound: jest.Mock<any>;
    handlePushNotificationsCompound: jest.Mock<any>;
    rescuePushNotificationsIntent: jest.Mock<any>;
    handleOpenBookingFromPush: jest.Mock<any>;
    handleExplainLastPush: jest.Mock<any>;
    handleListPushNotifications: jest.Mock<any>;
    handleMarkAllNotificationsRead: jest.Mock<any>;
    handleMarkBookingNotificationsRead: jest.Mock<any>;
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
      handleListPushNotifications: jest.fn(async () => ({
        success: true,
        action: 'list_push_notifications',
        summary: '1 unread of 1 notification: New booking.',
        details: { unreadCount: 1, items: [{ id: 'n1' }] },
      })),
      handleMarkAllNotificationsRead: jest.fn(async () => ({
        success: true,
        action: 'mark_all_notifications_read',
        summary: 'Marked 2 notifications as read.',
        details: { updated: 2 },
      })),
      handleMarkBookingNotificationsRead: jest.fn(async () => ({
        success: true,
        action: 'mark_booking_notifications_read',
        summary: 'Marked notifications for that booking as read.',
        details: { bookingId: 'b1' },
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

  it('dispatches list_push_notifications with businessId and userId', async () => {
    mockIntent('list_push_notifications', {});

    const result = await service.executeCommand(
      businessId,
      userId,
      'Show my notifications',
      [],
    );

    expect(result.action).toBe('list_push_notifications');
    expect(pushNotifications.handleListPushNotifications).toHaveBeenCalledWith(
      businessId,
      userId,
    );
  });

  it('dispatches mark_all_notifications_read with businessId and userId', async () => {
    mockIntent('mark_all_notifications_read', {});

    const result = await service.executeCommand(
      businessId,
      userId,
      'Mark all notifications as read',
      [],
    );

    expect(result.action).toBe('mark_all_notifications_read');
    expect(
      pushNotifications.handleMarkAllNotificationsRead,
    ).toHaveBeenCalledWith(businessId, userId);
  });

  it('dispatches mark_booking_notifications_read with bookingId from context.lastPush', async () => {
    mockIntent('mark_booking_notifications_read', {});

    const result = await service.executeCommand(
      businessId,
      userId,
      "Mark this booking's notifications as read",
      [],
      { lastPush: { bookingId: 'b1', pushType: 'booking_created' } },
    );

    expect(result.action).toBe('mark_booking_notifications_read');
    expect(
      pushNotifications.handleMarkBookingNotificationsRead,
    ).toHaveBeenCalledWith(
      businessId,
      userId,
      expect.objectContaining({
        lastPush: { bookingId: 'b1', pushType: 'booking_created' },
      }),
      "Mark this booking's notifications as read",
    );
  });
});
