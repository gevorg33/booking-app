import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiPushNotificationsService } from './ai-push-notifications.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { NotificationLog } from '../notifications/entities/notification-log.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PushService } from '../provider-mobile/push.service.js';
import { ProviderMobileService } from '../provider-mobile/provider-mobile.service.js';

describe('Sprint 35 push/offline/notifications AI scenarios', () => {
  const notificationsService = {
    getBusinessSettings: jest.fn(async () => ({
      notifyBusinessOnCustomerBookingChange: false,
      pushManagerAlertsEnabled: true,
      pushAdditionalRecipientUserIds: [],
      allowCustomerReminderChoice: true,
      customerReminderOptionsHours: [24, 1],
      defaultCustomerReminderHours: 24,
    })),
    updateBusinessSettings: jest.fn(async (_, patch) => ({
      notifyBusinessOnCustomerBookingChange: false,
      pushManagerAlertsEnabled: true,
      pushAdditionalRecipientUserIds: ['user-2'],
      ...patch,
    })),
  };

  const pushService = {
    isConfigured: true,
    sendToUser: jest.fn(async () => 1),
  };
  const providerMobileService = {};

  let pushNotifications: AiPushNotificationsService;
  let rescue: AiIntentRescueService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AiPushNotificationsService,
        AiIntentRescueService,
        { provide: NotificationsService, useValue: notificationsService },
        { provide: PushService, useValue: pushService },
        { provide: ProviderMobileService, useValue: providerMobileService },
        {
          provide: getRepositoryToken(Booking),
          useValue: {
            findOne: jest.fn(async () => ({
              id: 'b1',
              businessId: 'biz-1',
              customer: { name: 'Anna' },
              service: { name: 'Cut' },
              startTime: new Date('2026-06-02T10:00:00Z'),
            })),
            find: jest.fn(async () => []),
          },
        },
        {
          provide: getRepositoryToken(Business),
          useValue: {
            findOne: jest.fn(async () => ({
              id: 'biz-1',
              settings: { notifications: {} },
            })),
          },
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: {
            findOne: jest.fn(async () => ({
              id: 'cust-1',
              businessId: 'biz-1',
              metadata: {},
            })),
            save: jest.fn(async (c) => c),
          },
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: {
            find: jest.fn(async () => [
              { id: 'emp-1', name: 'Maria', userId: 'user-2', isActive: true },
            ]),
          },
        },
        {
          provide: getRepositoryToken(NotificationLog),
          useValue: {
            find: jest.fn(async () => [
              {
                id: 'log-1',
                businessId: 'biz-1',
                bookingId: 'b1',
                channel: 'email',
                kind: 'confirmation',
                status: 'sent',
                recipient: 'a@b.com',
                sentAt: new Date(),
                error: null,
              },
            ]),
          },
        },
      ],
    }).compile();

    pushNotifications = module.get(AiPushNotificationsService);
    rescue = module.get(AiIntentRescueService);
  });

  describe('rescue routing', () => {
    it('rescues pushNotifications intents before marketing growth', () => {
      expect(
        pushNotifications.rescuePushNotificationsIntent(
          'Explain last push',
          'unknown',
        )?.action,
      ).toBe('explain_last_push');
      expect(
        rescue.rescue({
          prompt: 'Explain last push',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('explain_last_push');
    });

    it('does not steal integrations test webhook or giftFulfillment order status', () => {
      expect(
        pushNotifications.rescuePushNotificationsIntent(
          'Test webhook delivery',
          'unknown',
        ),
      ).toBeNull();
      expect(
        pushNotifications.rescuePushNotificationsIntent(
          'Enable order status notifications',
          'unknown',
        ),
      ).toBeNull();
    });

    it('rescues all provider push and offline intents', () => {
      expect(
        rescue.rescue({
          prompt: 'Open booking from push notification',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('open_booking_from_push');
      expect(
        rescue.rescue({
          prompt: 'Offline queue status',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('offline_queue_status');
      expect(
        rescue.rescue({
          prompt: 'Retry offline queued actions',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('retry_offline_action');
      expect(
        rescue.rescue({
          prompt: 'Dismiss push alert',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('dismiss_push');
      expect(
        rescue.rescue({
          prompt: 'End of day summary push',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('end_of_day_summary');
      expect(
        rescue.rescue({
          prompt: 'What can I do from the new booking push',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('new_booking_push_actions');
      expect(
        pushNotifications.isPushNotificationsCompound(
          'Explain last push and show offline queue status',
        ),
      ).toBe(true);
      expect(
        rescue.rescue({
          prompt: 'Explain plan limits',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('explain_plan_limits');
    });

    it('rescues all dashboard and customer notification intents', () => {
      expect(
        rescue.rescue({
          prompt: 'Configure push recipients',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('configure_push_recipients');
      expect(
        rescue.rescue({
          prompt: 'Send test push',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('test_push');
      expect(
        rescue.rescue({
          prompt: 'Show notification history',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('notification_history');
      expect(
        rescue.rescue({
          prompt: 'Enable email when customers cancel',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('toggle_business_email_on_customer_change');
      expect(
        rescue.rescue({
          prompt: 'Enable appointment notifications',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('enable_notifications');
      expect(
        rescue.rescue({
          prompt: 'Appointment reminder preferences',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('appointment_reminder_preferences');
    });
  });

  describe('provider handlers', () => {
    it('runs provider push and offline intents', async () => {
      const lastPush = {
        title: 'New',
        pushType: 'booking_created',
        bookingId: 'b1',
      };
      expect(
        (await pushNotifications.handleExplainLastPush({ lastPush })).success,
      ).toBe(true);
      expect(
        (
          await pushNotifications.handleOpenBookingFromPush('biz-1', {
            bookingId: 'b1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await pushNotifications.handleOfflineQueueStatus({
            offlineQueueCount: 2,
            online: false,
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await pushNotifications.handleRetryOfflineAction({
            offlineQueueCount: 1,
            online: true,
          })
        ).success,
      ).toBe(true);
      expect(
        (await pushNotifications.handleDismissPush({ lastPush })).success,
      ).toBe(true);
      expect(
        (
          await pushNotifications.handleEndOfDaySummary('biz-1', {
            sessionEmployeeId: 'emp-1',
          })
        ).success,
      ).toBe(true);
      expect(
        (await pushNotifications.handleNewBookingPushActions()).success,
      ).toBe(true);
    });
  });

  describe('dashboard and customer handlers', () => {
    it('runs notification settings and customer prefs', async () => {
      expect(
        (
          await pushNotifications.handleConfigurePushRecipients('biz-1', {
            recipientNames: ['Maria'],
          })
        ).success,
      ).toBe(true);
      expect(
        (await pushNotifications.handleTestPush('biz-1', { userId: 'user-1' }))
          .success,
      ).toBe(true);
      expect(
        (await pushNotifications.handleNotificationHistory('biz-1', {}))
          .success,
      ).toBe(true);
      expect(
        (
          await pushNotifications.handleToggleBusinessEmailOnCustomerChange(
            'biz-1',
            {},
            'enable email when customers cancel',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await pushNotifications.handleEnableNotifications(
            'biz-1',
            { sessionCustomerId: 'cust-1' },
            'enable notifications',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await pushNotifications.handleAppointmentReminderPreferences(
            'biz-1',
            { sessionCustomerId: 'cust-1' },
            'appointment reminder preferences',
          )
        ).success,
      ).toBe(true);
    });
  });

  describe('compound flows', () => {
    it('executes provider push and offline compound commands', async () => {
      const explainQueue =
        await pushNotifications.handlePushNotificationsCompound(
          'biz-1',
          'Explain last push and show offline queue status',
          {
            lastPush: { title: 'New booking', pushType: 'booking_created' },
            offlineQueueCount: 1,
            online: true,
          },
        );
      expect(explainQueue.success).toBe(true);
      expect((explainQueue.details as any).pushNotificationsCompound).toBe(
        true,
      );
      expect((explainQueue.details as any).steps.length).toBe(2);

      const retryDismiss =
        await pushNotifications.handlePushNotificationsCompound(
          'biz-1',
          'Retry offline queue and dismiss push',
          {
            offlineQueueCount: 2,
            online: true,
            lastPush: { pushType: 'booking_created' },
          },
        );
      expect(retryDismiss.success).toBe(true);

      const eodActions =
        await pushNotifications.handlePushNotificationsCompound(
          'biz-1',
          'End of day summary push and new booking push actions',
          { sessionEmployeeId: 'emp-1' },
        );
      expect(eodActions.success).toBe(true);
    });

    it('executes dashboard and customer compound commands', async () => {
      const historyTest =
        await pushNotifications.handlePushNotificationsCompound(
          'biz-1',
          'Show notification history and send test push',
          { userId: 'user-1' },
        );
      expect(historyTest.success).toBe(true);

      const configureTest =
        await pushNotifications.handlePushNotificationsCompound(
          'biz-1',
          'Configure push recipients for Maria and send test push',
          { userId: 'user-1', recipientNames: ['Maria'] },
        );
      expect(configureTest.success).toBe(true);
      expect(notificationsService.updateBusinessSettings).toHaveBeenCalled();

      const toggleHistory =
        await pushNotifications.handlePushNotificationsCompound(
          'biz-1',
          'Enable email when customers cancel and show notification history',
          {},
        );
      expect(toggleHistory.success).toBe(true);

      const customer = await pushNotifications.handlePushNotificationsCompound(
        'biz-1',
        'Enable notifications and set appointment reminder preferences',
        { sessionCustomerId: 'cust-1' },
      );
      expect(customer.success).toBe(true);
    });

    it('stops compound on failure with failedStep', async () => {
      const stopped = await pushNotifications.handlePushNotificationsCompound(
        'biz-1',
        'compound',
        {
          compoundSteps: [
            {
              action: 'explain_last_push',
              params: { lastPush: { title: 'x' } },
              segment: 'a',
            },
            { action: 'open_booking_from_push', params: {}, segment: 'b' },
          ],
        },
      );
      expect(stopped.success).toBe(false);
      expect((stopped.details as any).failedStep).toBe(
        'open_booking_from_push',
      );
      expect((stopped.details as any).steps.length).toBe(2);

      pushService.sendToUser.mockResolvedValueOnce(0);
      const testPushFail =
        await pushNotifications.handlePushNotificationsCompound(
          'biz-1',
          'compound',
          {
            compoundSteps: [
              {
                action: 'notification_history',
                params: {},
                segment: 'history',
              },
              { action: 'test_push', params: {}, segment: 'test' },
            ],
          },
        );
      expect(testPushFail.success).toBe(false);
      expect((testPushFail.details as any).failedStep).toBe('test_push');
    });
  });
});
