import {
  handleExplainLastPushLogic,
  handleOpenBookingFromPushLogic,
  handleOfflineQueueStatusLogic,
  handleRetryOfflineActionLogic,
  handleDismissPushLogic,
  handleEndOfDaySummaryLogic,
  handleNewBookingPushActionsLogic,
  handleConfigurePushRecipientsLogic,
  handleTestPushLogic,
  handleNotificationHistoryLogic,
  handleToggleBusinessEmailOnCustomerChangeLogic,
  handleEnableNotificationsLogic,
  handleAppointmentReminderPreferencesLogic,
  handleListPushNotificationsLogic,
  handleMarkAllNotificationsReadLogic,
  handleMarkBookingNotificationsReadLogic,
  handlePushNotificationsCompoundLogic,
  mergePushNotificationsCompoundContext,
  type PushNotificationsLogicDeps,
} from './ai-push-notifications.logic.js';
import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import * as eodUtil from '../provider-mobile/provider-end-of-day-summary.util.js';

function buildDeps(
  overrides: Partial<PushNotificationsLogicDeps> = {},
): PushNotificationsLogicDeps {
  return {
    notificationsService: {
      getBusinessSettings: jest.fn(async () => ({
        notifyBusinessOnCustomerBookingChange: false,
        pushManagerAlertsEnabled: true,
        pushAdditionalRecipientUserIds: [],
      })),
      updateBusinessSettings: jest.fn(async (_, patch) => ({
        notifyBusinessOnCustomerBookingChange:
          patch.notifyBusinessOnCustomerBookingChange ?? false,
        pushManagerAlertsEnabled: patch.pushManagerAlertsEnabled ?? true,
        pushAdditionalRecipientUserIds:
          patch.pushAdditionalRecipientUserIds ?? [],
      })),
      getProviderStatus: jest.fn(),
    } as any,
    whatsappIntegrationService: {
      getPublicSettings: jest.fn(async () => ({
        configured: false,
        usingPlatformDefault: false,
      })),
      updateSettings: jest.fn(async (_businessId: string, patch: object) => ({
        configured: true,
        ...patch,
      })),
    } as any,
    pushService: {
      isConfigured: true,
      sendToUser: jest.fn(async () => 1),
    } as any,
    providerMobileService: {} as any,
    pushHistoryService: {
      listNotificationCenter: jest.fn(async () => ({
        days: 3,
        unreadCount: 0,
        items: [],
      })),
      markAllNotificationsRead: jest.fn(async () => ({ updated: 0 })),
      markLatestBookingNotificationRead: jest.fn(async () => undefined),
    } as any,
    bookingRepo: {
      findOne: jest.fn(async () => ({
        id: 'b1',
        businessId: 'biz-1',
        customer: { name: 'Anna' },
        service: { name: 'Cut' },
        startTime: new Date('2026-06-02T10:00:00Z'),
      })),
      find: jest.fn(async () => [
        {
          businessId: 'biz-1',
          employeeId: 'emp-1',
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PENDING,
        },
      ]),
    } as any,
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        settings: {
          notifications: {
            allowCustomerReminderChoice: true,
            customerReminderOptionsHours: [24, 1],
            defaultCustomerReminderHours: 24,
          },
        },
      })),
    } as any,
    customerRepo: {
      findOne: jest.fn(async () => ({
        id: 'cust-1',
        businessId: 'biz-1',
        metadata: { notifications: { emailReminders: true } },
      })),
      save: jest.fn(async (c) => c),
    } as any,
    employeeRepo: {
      find: jest.fn(async () => [
        { id: 'emp-1', name: 'Maria', userId: 'user-2', isActive: true },
      ]),
    } as any,
    notificationLogRepo: {
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
    } as any,
    ...overrides,
  };
}

describe('ai-push-notifications.logic', () => {
  it('handles provider push explain/open/offline flows', async () => {
    expect((await handleExplainLastPushLogic(buildDeps(), {})).success).toBe(
      false,
    );
    expect(
      (
        await handleExplainLastPushLogic(buildDeps(), {
          lastPush: {
            title: 'New',
            pushType: 'booking_created',
            bookingId: 'b1',
          },
        })
      ).success,
    ).toBe(true);

    expect(
      (await handleOpenBookingFromPushLogic(buildDeps(), 'biz-1', {}, 'open'))
        .success,
    ).toBe(false);
    expect(
      (
        await handleOpenBookingFromPushLogic(buildDeps(), 'biz-1', {
          bookingId: 'b1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleOpenBookingFromPushLogic(
          buildDeps({
            bookingRepo: { findOne: jest.fn(async () => null) } as any,
          }),
          'biz-1',
          { bookingId: 'missing' },
        )
      ).success,
    ).toBe(false);

    expect(
      (
        await handleOfflineQueueStatusLogic(buildDeps(), {
          offlineQueueCount: 2,
          online: false,
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleRetryOfflineActionLogic(buildDeps(), {
          offlineQueueCount: 1,
          online: true,
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleDismissPushLogic(buildDeps(), {
          lastPush: { pushType: 'booking_created' },
        })
      ).success,
    ).toBe(true);
    expect((await handleNewBookingPushActionsLogic(buildDeps())).success).toBe(
      true,
    );
  });

  it('handles end of day summary', async () => {
    expect(
      (await handleEndOfDaySummaryLogic(buildDeps(), 'biz-1', {})).success,
    ).toBe(false);
    expect(
      (
        await handleEndOfDaySummaryLogic(buildDeps(), 'biz-1', {
          sessionEmployeeId: 'emp-1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleEndOfDaySummaryLogic(
          buildDeps({ bookingRepo: { find: jest.fn(async () => []) } as any }),
          'biz-1',
          { sessionEmployeeId: 'emp-1' },
        )
      ).details.appointmentCount,
    ).toBe(0);
  });

  it('handles dashboard notification settings', async () => {
    expect(
      (await handleConfigurePushRecipientsLogic(buildDeps(), 'biz-1', {}))
        .success,
    ).toBe(true);
    expect(
      (
        await handleConfigurePushRecipientsLogic(
          buildDeps(),
          'biz-1',
          {},
          'disable manager push alerts',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleConfigurePushRecipientsLogic(
          buildDeps({
            employeeRepo: {
              find: jest.fn(async () => [
                {
                  id: 'emp-1',
                  name: 'Maria Torgomyan',
                  userId: 'user-2',
                  isActive: true,
                },
              ]),
            } as any,
          }),
          'biz-1',
          { recipientNames: ['Maria'] },
          'add push recipients for Maria',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleConfigurePushRecipientsLogic(
          buildDeps({ employeeRepo: { find: jest.fn(async () => []) } as any }),
          'biz-1',
          { recipientNames: ['Ghost'] },
        )
      ).success,
    ).toBe(false);
    expect(
      (
        await handleConfigurePushRecipientsLogic(
          buildDeps({
            businessRepo: { findOne: jest.fn(async () => null) } as any,
          }),
          'biz-1',
          {},
        )
      ).success,
    ).toBe(false);

    expect((await handleTestPushLogic(buildDeps(), 'biz-1', {})).success).toBe(
      false,
    );
    expect(
      (await handleTestPushLogic(buildDeps(), 'biz-1', { userId: 'user-1' }))
        .success,
    ).toBe(true);
    expect(
      (
        await handleTestPushLogic(
          buildDeps({
            pushService: { isConfigured: false, sendToUser: jest.fn() } as any,
          }),
          'biz-1',
          { userId: 'user-1' },
        )
      ).success,
    ).toBe(false);
    expect(
      (
        await handleTestPushLogic(
          buildDeps({
            pushService: {
              isConfigured: true,
              sendToUser: jest.fn(async () => 0),
            } as any,
          }),
          'biz-1',
          { userId: 'user-1' },
        )
      ).success,
    ).toBe(false);

    expect(
      (await handleNotificationHistoryLogic(buildDeps(), 'biz-1', {})).success,
    ).toBe(true);
    expect(
      (
        await handleNotificationHistoryLogic(
          buildDeps({
            notificationLogRepo: { find: jest.fn(async () => []) } as any,
          }),
          'biz-1',
          {},
        )
      ).summary,
    ).toContain('No notification logs');

    expect(
      (
        await handleToggleBusinessEmailOnCustomerChangeLogic(
          buildDeps(),
          'biz-1',
          {},
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleToggleBusinessEmailOnCustomerChangeLogic(
          buildDeps(),
          'biz-1',
          {},
          'enable email when customers cancel',
        )
      ).success,
    ).toBe(true);

    // e2e-bug.159 — "Notify me whenever…" enables owner alert, not customer notify.
    const notifyMe = await handleToggleBusinessEmailOnCustomerChangeLogic(
      buildDeps(),
      'biz-1',
      {},
      'Notify me whenever a customer cancels a booking today',
    );
    expect(notifyMe.success).toBe(true);
    expect(notifyMe.details?.notifyBusinessOnCustomerBookingChange).toBe(true);
    expect(notifyMe.summary).toMatch(/emailed when a customer cancels/i);
    expect(notifyMe.summary).toMatch(/does not message the customer/i);
    expect(notifyMe.summary).not.toMatch(/pending your approval/i);
  });

  it('handles customer notification preferences', async () => {
    expect(
      (await handleEnableNotificationsLogic(buildDeps(), 'biz-1', {})).success,
    ).toBe(false);
    expect(
      (
        await handleEnableNotificationsLogic(
          buildDeps(),
          'biz-1',
          { sessionCustomerId: 'cust-1' },
          'enable notifications',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleEnableNotificationsLogic(
          buildDeps({
            customerRepo: {
              findOne: jest.fn(async () => null),
              save: jest.fn(),
            } as any,
          }),
          'biz-1',
          { sessionCustomerId: 'cust-1' },
        )
      ).success,
    ).toBe(false);
    expect(
      (
        await handleEnableNotificationsLogic(
          buildDeps(),
          'biz-1',
          { sessionCustomerId: 'cust-1' },
          'disable notifications',
        )
      ).summary,
    ).toContain('disabled');

    expect(
      (
        await handleAppointmentReminderPreferencesLogic(
          buildDeps(),
          'biz-1',
          {},
        )
      ).success,
    ).toBe(false);
    expect(
      (
        await handleAppointmentReminderPreferencesLogic(buildDeps(), 'biz-1', {
          sessionCustomerId: 'cust-1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleAppointmentReminderPreferencesLogic(
          buildDeps(),
          'biz-1',
          { sessionCustomerId: 'cust-1', reminderHoursBefore: 24 },
          '24 hours before',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleAppointmentReminderPreferencesLogic(buildDeps(), 'biz-1', {
          sessionCustomerId: 'cust-1',
          reminderHoursBefore: 99,
        })
      ).success,
    ).toBe(false);
    expect(
      (
        await handleAppointmentReminderPreferencesLogic(
          buildDeps({
            businessRepo: {
              findOne: jest.fn(async () => ({
                settings: {
                  notifications: { allowCustomerReminderChoice: false },
                },
              })),
            } as any,
          }),
          'biz-1',
          { sessionCustomerId: 'cust-1' },
        )
      ).summary,
    ).toContain('fixed reminders');
    expect(
      (
        await handleAppointmentReminderPreferencesLogic(
          buildDeps({
            businessRepo: { findOne: jest.fn(async () => null) } as any,
          }),
          'biz-1',
          { sessionCustomerId: 'cust-1' },
        )
      ).success,
    ).toBe(false);
    expect(
      (
        await handleAppointmentReminderPreferencesLogic(
          buildDeps({
            customerRepo: {
              findOne: jest.fn(async () => ({
                id: 'cust-1',
                businessId: 'biz-1',
                metadata: { reminderHoursBefore: null },
              })),
              save: jest.fn(async (c) => c),
            } as any,
          }),
          'biz-1',
          { sessionCustomerId: 'cust-1' },
        )
      ).details.selectedHours,
    ).toBeNull();
    expect(
      (
        await handleAppointmentReminderPreferencesLogic(
          buildDeps({
            customerRepo: {
              findOne: jest.fn(async () => ({
                id: 'cust-1',
                businessId: 'biz-1',
                metadata: { reminderHoursBefore: 1 },
              })),
              save: jest.fn(async (c) => c),
            } as any,
          }),
          'biz-1',
          { sessionCustomerId: 'cust-1' },
        )
      ).details.selectedHours,
    ).toBe(1);
  });

  it('runs compound orchestration and context merge', async () => {
    expect(
      (
        await handlePushNotificationsCompoundLogic(
          buildDeps(),
          'biz-1',
          'single step only',
          {},
        )
      ).success,
    ).toBe(false);

    const compound = await handlePushNotificationsCompoundLogic(
      buildDeps(),
      'biz-1',
      'Explain last push and show offline queue status',
      {
        lastPush: { title: 'New', pushType: 'booking_created' },
        offlineQueueCount: 1,
        online: true,
      },
    );
    expect(compound.success).toBe(true);
    expect((compound.details as any).pushNotificationsCompound).toBe(true);

    const stopped = await handlePushNotificationsCompoundLogic(
      buildDeps(),
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
    expect((stopped.details as any).failedStep).toBe('open_booking_from_push');

    const merged = mergePushNotificationsCompoundContext(
      {},
      { action: 'explain_last_push', params: {}, segment: 'a' },
      {
        success: true,
        action: 'explain_last_push',
        summary: 'ok',
        details: { payload: { bookingId: 'b1' } },
      },
    );
    expect(merged.lastPush).toBeDefined();
    expect(
      mergePushNotificationsCompoundContext(
        {},
        { action: 'open_booking_from_push', params: {}, segment: 'b' },
        {
          success: true,
          action: 'open_booking_from_push',
          summary: 'ok',
          details: { bookingId: 'b1' },
        },
      ).bookingId,
    ).toBe('b1');
    expect(
      mergePushNotificationsCompoundContext(
        {},
        { action: 'offline_queue_status', params: {}, segment: 'c' },
        {
          success: true,
          action: 'offline_queue_status',
          summary: 'ok',
          details: { queuedCount: 2, online: true },
        },
      ).offlineQueueCount,
    ).toBe(2);
    expect(
      mergePushNotificationsCompoundContext(
        {},
        { action: 'configure_push_recipients', params: {}, segment: 'd' },
        {
          success: true,
          action: 'configure_push_recipients',
          summary: 'ok',
          details: { settings: {} },
        },
      ).pushRecipientsConfigured,
    ).toBe(true);

    const unsupported = await handlePushNotificationsCompoundLogic(
      buildDeps(),
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'not_valid' as any, params: {}, segment: 'x' },
          { action: 'dismiss_push', params: {}, segment: 'y' },
        ],
      },
    );
    expect(unsupported.success).toBe(false);

    const fullCompound = await handlePushNotificationsCompoundLogic(
      buildDeps(),
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'retry_offline_action',
            params: { offlineQueueCount: 1, online: true },
            segment: 'retry',
          },
          { action: 'dismiss_push', params: {}, segment: 'dismiss' },
          {
            action: 'end_of_day_summary',
            params: { sessionEmployeeId: 'emp-1' },
            segment: 'eod',
          },
          {
            action: 'new_booking_push_actions',
            params: {},
            segment: 'actions',
          },
        ],
      },
    );
    expect(fullCompound.success).toBe(true);

    const dashboardCompound = await handlePushNotificationsCompoundLogic(
      buildDeps(),
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'configure_push_recipients',
            params: {},
            segment: 'recipients',
          },
          {
            action: 'configure_notification_settings',
            params: {},
            segment: 'Turn on email notifications for the salon',
          },
          {
            action: 'configure_whatsapp_integration',
            params: {},
            segment: 'Use platform default WhatsApp connection',
          },
          {
            action: 'test_push',
            params: { userId: 'user-1' },
            segment: 'test',
          },
          { action: 'notification_history', params: {}, segment: 'history' },
          {
            action: 'toggle_business_email_on_customer_change',
            params: { enabled: true },
            segment: 'toggle',
          },
        ],
      },
    );
    expect(dashboardCompound.success).toBe(true);

    const customerCompound = await handlePushNotificationsCompoundLogic(
      buildDeps(),
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'enable_notifications',
            params: { sessionCustomerId: 'cust-1' },
            segment: 'enable',
          },
          {
            action: 'appointment_reminder_preferences',
            params: { sessionCustomerId: 'cust-1' },
            segment: 'prefs',
          },
        ],
      },
    );
    expect(customerCompound.success).toBe(true);
  });

  it('covers remaining logic branches', async () => {
    expect(
      (
        await handleExplainLastPushLogic(buildDeps(), {
          lastPushPayload: {
            title: 'Via payload',
            pushType: 'booking_updated',
          },
        })
      ).success,
    ).toBe(true);

    expect(
      (
        await handleOpenBookingFromPushLogic(
          buildDeps({
            bookingRepo: {
              findOne: jest.fn(async () => ({
                id: 'b1',
                businessId: 'biz-1',
                customer: null,
                service: null,
                startTime: new Date('2026-06-02T10:00:00Z'),
              })),
            } as any,
          }),
          'biz-1',
          { lastPush: { url: '/custom', bookingId: 'b1' } },
        )
      ).summary,
    ).toContain('appointment');

    expect(
      (
        await handleOfflineQueueStatusLogic(buildDeps(), {
          isOnline: false,
          queuedCount: 'bad',
        })
      ).details.queuedCount,
    ).toBe(0);
    expect(
      (
        await handleOfflineQueueStatusLogic(buildDeps(), {
          online: false,
          queuedCount: 2,
        })
      ).details.online,
    ).toBe(false);

    expect(
      (
        await handleConfigurePushRecipientsLogic(
          buildDeps({
            employeeRepo: {
              find: jest.fn(async () => [
                { id: 'emp-1', name: 'NoUser', userId: null, isActive: true },
              ]),
            } as any,
          }),
          'biz-1',
          { recipientNames: ['NoUser'] },
        )
      ).success,
    ).toBe(false);
    expect(
      (
        await handleConfigurePushRecipientsLogic(buildDeps(), 'biz-1', {
          recipientNames: [],
        })
      ).success,
    ).toBe(true);

    expect(
      (
        await handleToggleBusinessEmailOnCustomerChangeLogic(
          buildDeps(),
          'biz-1',
          { enabled: false },
        )
      ).details.notifyBusinessOnCustomerBookingChange,
    ).toBe(false);

    expect(
      (
        await handleAppointmentReminderPreferencesLogic(
          buildDeps(),
          'biz-1',
          { sessionCustomerId: 'cust-1' },
          'remind 24 hours before',
        )
      ).success,
    ).toBe(true);

    expect(
      (
        await handleEnableNotificationsLogic(
          buildDeps({
            customerRepo: {
              findOne: jest.fn(async () => ({
                id: 'cust-1',
                businessId: 'biz-1',
                metadata: { notifications: { smsReminders: true } },
              })),
              save: jest.fn(async (c) => c),
            } as any,
          }),
          'biz-1',
          { sessionCustomerId: 'cust-1' },
          'enable notifications',
        )
      ).success,
    ).toBe(true);

    expect(
      (
        await handleOpenBookingFromPushLogic(
          buildDeps(),
          'biz-1',
          {},
          'booking 11111111-1111-4111-8111-111111111111',
        )
      ).success,
    ).toBe(true);

    expect(
      (
        await handleRetryOfflineActionLogic(buildDeps(), {
          online: false,
          queuedCount: 2,
        })
      ).success,
    ).toBe(false);
    expect(
      (
        await handleRetryOfflineActionLogic(buildDeps(), {
          offlineQueueCount: 3,
          online: true,
        })
      ).success,
    ).toBe(true);

    expect(
      (
        await handleConfigurePushRecipientsLogic(
          buildDeps(),
          'biz-1',
          {},
          'enable manager push alerts',
        )
      ).success,
    ).toBe(true);

    expect(
      (
        await handleConfigurePushRecipientsLogic(
          buildDeps({
            businessRepo: {
              findOne: jest.fn(async () => ({
                settings: {
                  notifications: {
                    pushManagerAlertsEnabled: false,
                    pushAdditionalRecipientUserIds: [],
                  },
                },
              })),
            } as any,
          }),
          'biz-1',
          {},
        )
      ).summary,
    ).toContain('disabled');

    const logs = Array.from({ length: 4 }, (_, i) => ({
      id: `log-${i}`,
      businessId: 'biz-1',
      bookingId: 'b1',
      channel: 'email',
      kind: 'confirmation',
      status: 'sent',
      recipient: 'a@b.com',
      sentAt: new Date(),
      error: null,
    }));
    expect(
      (
        await handleNotificationHistoryLogic(
          buildDeps({
            notificationLogRepo: { find: jest.fn(async () => logs) } as any,
          }),
          'biz-1',
          {},
        )
      ).summary,
    ).toContain('…');

    jest.spyOn(eodUtil, 'buildEodPushPayload').mockReturnValueOnce({
      title: 'EOD',
      body: '',
      url: '/provider/today',
      pushType: 'end_of_day',
      aiPrompt: 'summary',
    });
    expect(
      (
        await handleEndOfDaySummaryLogic(buildDeps(), 'biz-1', {
          sessionEmployeeId: 'emp-1',
        })
      ).summary,
    ).toBe('No appointments today.');

    expect(
      (await handleOfflineQueueStatusLogic(buildDeps(), { queuedCount: 2 }))
        .details.queuedCount,
    ).toBe(2);
    expect(
      (await handleOfflineQueueStatusLogic(buildDeps(), { online: false }))
        .details.online,
    ).toBe(false);

    expect(
      (
        await handleToggleBusinessEmailOnCustomerChangeLogic(
          buildDeps({
            notificationsService: {
              getBusinessSettings: jest.fn(async () => ({
                notifyBusinessOnCustomerBookingChange: true,
              })),
              updateBusinessSettings: jest.fn(async (_, patch) => patch),
            } as any,
          }),
          'biz-1',
          {},
        )
      ).summary,
    ).toContain('enabled');

    expect(
      (
        await handleOpenBookingFromPushLogic(buildDeps(), 'biz-1', {
          _prompt: 'booking 11111111-1111-4111-8111-111111111111',
        })
      ).success,
    ).toBe(true);

    expect(
      (
        await handleAppointmentReminderPreferencesLogic(
          buildDeps({
            businessRepo: {
              findOne: jest.fn(async () => ({
                settings: {
                  notifications: {
                    allowCustomerReminderChoice: false,
                    customerReminderOptionsHours: [24],
                    defaultCustomerReminderHours: 24,
                  },
                },
              })),
            } as any,
          }),
          'biz-1',
          { sessionCustomerId: 'cust-1' },
        )
      ).summary,
    ).toContain('fixed reminders');

    expect(
      (
        await handleConfigurePushRecipientsLogic(
          buildDeps({
            employeeRepo: {
              find: jest.fn(async () => [
                {
                  id: 'emp-1',
                  name: 'Maria',
                  userId: undefined,
                  isActive: true,
                },
              ]),
            } as any,
          }),
          'biz-1',
          { recipientNames: ['Maria'] },
        )
      ).success,
    ).toBe(false);

    expect(
      (
        await handleEnableNotificationsLogic(
          buildDeps({
            customerRepo: {
              findOne: jest.fn(async () => ({
                id: 'cust-1',
                businessId: 'biz-1',
                metadata: undefined,
              })),
              save: jest.fn(async (c) => c),
            } as any,
          }),
          'biz-1',
          { sessionCustomerId: 'cust-1' },
          'enable notifications',
        )
      ).success,
    ).toBe(true);

    expect(
      (
        await handleAppointmentReminderPreferencesLogic(
          buildDeps({
            customerRepo: {
              findOne: jest.fn(async () => ({
                id: 'cust-1',
                businessId: 'biz-1',
                metadata: { reminderHoursBefore: 'bad' },
              })),
              save: jest.fn(async (c) => c),
            } as any,
          }),
          'biz-1',
          { sessionCustomerId: 'cust-1', reminderHoursBefore: 1 },
        )
      ).success,
    ).toBe(true);

    expect(
      (
        await handleOpenBookingFromPushLogic(
          buildDeps(),
          'biz-1',
          { lastPush: { title: 'No id' } },
          'booking 11111111-1111-4111-8111-111111111111',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleOpenBookingFromPushLogic(buildDeps(), 'biz-1', {
          lastPush: { bookingId: 'b1' },
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleOpenBookingFromPushLogic(buildDeps(), 'biz-1', {
          bookingId: 'b1',
        })
      ).success,
    ).toBe(true);

    expect(
      (
        await handleEnableNotificationsLogic(
          buildDeps(),
          'biz-1',
          { sessionCustomerId: 'cust-1' },
          'disable notifications',
        )
      ).summary,
    ).toContain('disabled');
    expect(
      (
        await handleEnableNotificationsLogic(
          buildDeps(),
          'biz-1',
          { sessionCustomerId: 'cust-1' },
          'enable notifications',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleEnableNotificationsLogic(buildDeps(), 'biz-1', {
          sessionCustomerId: 'cust-1',
          _prompt: 'enable notifications',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleEnableNotificationsLogic(
          buildDeps({
            customerRepo: {
              findOne: jest.fn(async () => ({
                id: 'cust-1',
                businessId: 'biz-1',
                metadata: { notifications: { smsReminders: true } },
              })),
              save: jest.fn(async (c) => c),
            } as any,
          }),
          'biz-1',
          { sessionCustomerId: 'cust-1', _prompt: 'turn on notifications' },
        )
      ).details.preferences,
    ).toMatchObject({ smsReminders: true });
    expect(
      (
        await handleEnableNotificationsLogic(
          buildDeps({
            customerRepo: {
              findOne: jest.fn(async () => ({
                id: 'cust-1',
                businessId: 'biz-1',
                metadata: { notifications: { smsReminders: false } },
              })),
              save: jest.fn(async (c) => c),
            } as any,
          }),
          'biz-1',
          { sessionCustomerId: 'cust-1' },
          'enable notifications',
        )
      ).details.preferences,
    ).toMatchObject({ smsReminders: false });

    expect(
      (
        await handleAppointmentReminderPreferencesLogic(
          buildDeps({
            customerRepo: {
              findOne: jest.fn(async () => ({
                id: 'cust-1',
                businessId: 'biz-1',
              })),
              save: jest.fn(async (c) => c),
            } as any,
          }),
          'biz-1',
          { sessionCustomerId: 'cust-1', reminderHoursBefore: 1 },
        )
      ).success,
    ).toBe(true);
  });

  describe('ai-cmd-provider-6.8 — push notification inbox actions', () => {
    it('lists the provider push notification center', async () => {
      const deps = buildDeps({
        pushHistoryService: {
          listNotificationCenter: jest.fn(async () => ({
            days: 3,
            unreadCount: 1,
            items: [
              {
                id: 'n1',
                title: 'New booking',
                body: 'Anna — Cut',
                bookingId: 'b1',
                url: null,
                kind: 'booking_created',
                sentAt: '2026-06-02T09:00:00.000Z',
                readAt: null,
                isRead: false,
              },
            ],
          })),
        } as any,
      });

      const result = await handleListPushNotificationsLogic(
        deps,
        'biz-1',
        'user-1',
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('list_push_notifications');
      expect(result.summary).toContain('1 unread of 1 notification');
      expect(deps.pushHistoryService.listNotificationCenter).toHaveBeenCalledWith(
        'biz-1',
        'user-1',
      );
    });

    it('marks all notifications as read', async () => {
      const deps = buildDeps({
        pushHistoryService: {
          markAllNotificationsRead: jest.fn(async () => ({ updated: 3 })),
        } as any,
      });

      const result = await handleMarkAllNotificationsReadLogic(
        deps,
        'biz-1',
        'user-1',
      );

      expect(result.success).toBe(true);
      expect(result.summary).toContain('3 notifications');
      expect(
        deps.pushHistoryService.markAllNotificationsRead,
      ).toHaveBeenCalledWith('biz-1', 'user-1');
    });

    it('reports nothing to mark when inbox is already read', async () => {
      const deps = buildDeps({
        pushHistoryService: {
          markAllNotificationsRead: jest.fn(async () => ({ updated: 0 })),
        } as any,
      });

      const result = await handleMarkAllNotificationsReadLogic(
        deps,
        'biz-1',
        'user-1',
      );

      expect(result.success).toBe(true);
      expect(result.summary).toContain('No unread notifications');
    });

    it('marks booking notifications as read by explicit bookingId', async () => {
      const deps = buildDeps({
        pushHistoryService: {
          markLatestBookingNotificationRead: jest.fn(async () => undefined),
        } as any,
      });

      const result = await handleMarkBookingNotificationsReadLogic(
        deps,
        'biz-1',
        'user-1',
        { bookingId: 'b1' },
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('mark_booking_notifications_read');
      expect(
        deps.pushHistoryService.markLatestBookingNotificationRead,
      ).toHaveBeenCalledWith('biz-1', 'user-1', 'b1');
    });

    it('resolves bookingId from lastPush payload when omitted', async () => {
      const deps = buildDeps({
        pushHistoryService: {
          markLatestBookingNotificationRead: jest.fn(async () => undefined),
        } as any,
      });

      const result = await handleMarkBookingNotificationsReadLogic(
        deps,
        'biz-1',
        'user-1',
        { lastPush: { bookingId: 'b2', pushType: 'booking_created' } },
      );

      expect(result.success).toBe(true);
      expect(
        deps.pushHistoryService.markLatestBookingNotificationRead,
      ).toHaveBeenCalledWith('biz-1', 'user-1', 'b2');
    });

    it('clarifies when no bookingId can be resolved', async () => {
      const deps = buildDeps();
      const result = await handleMarkBookingNotificationsReadLogic(
        deps,
        'biz-1',
        'user-1',
        {},
      );

      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({ clarify: true });
    });
  });
});
