import {
  rescuePushNotificationsIntent,
  isPushNotificationsCompoundPrompt,
  decomposePushNotificationsCompoundPrompt,
  isExplainLastPushPrompt,
  isOpenBookingFromPushPrompt,
  isOfflineQueueStatusPrompt,
  isRetryOfflineActionPrompt,
  isDismissPushPrompt,
  isEndOfDaySummaryPrompt,
  isNewBookingPushActionsPrompt,
  isConfigurePushRecipientsPrompt,
  isTestPushPrompt,
  isNotificationHistoryPrompt,
  isToggleBusinessEmailOnCustomerChangePrompt,
  isEnableNotificationsPrompt,
  isAppointmentReminderPreferencesPrompt,
  isSummarizeDayOnlyPrompt,
  isMarkAllNotificationsReadPrompt,
  isMarkBookingNotificationsReadPrompt,
  isListPushNotificationsPrompt,
  resolveCommandPromptText,
  extractBookingIdFromPushPrompt,
  extractPushRecipientNamesFromPrompt,
  extractNotificationToggleFromPrompt,
  resolveNotificationEnabledFromPrompt,
  resolveSmsRemindersWhenEnabling,
  extractReminderHoursFromPrompt,
  parseProviderLastPushPayload,
  explainLastPushSummary,
  buildNewBookingPushActionsGuide,
  buildOfflineQueueStatusSummary,
  buildRetryOfflineActionGuidance,
  summarizeProviderPushNotificationCenter,
  PUSH_NOTIFICATIONS_INTENTS,
  isPushNotificationsIntent,
} from './ai-push-notifications.util.js';

describe('ai-push-notifications.util', () => {
  describe('prompt classifiers', () => {
    it('detects provider push and offline prompts', () => {
      expect(
        isExplainLastPushPrompt('Explain the last push notification I got'),
      ).toBe(true);
      expect(
        isOpenBookingFromPushPrompt('Open booking from push notification'),
      ).toBe(true);
      expect(
        isOfflineQueueStatusPrompt('What is my offline queue status'),
      ).toBe(true);
      expect(isRetryOfflineActionPrompt('Retry offline queued actions')).toBe(
        true,
      );
      expect(isDismissPushPrompt('Dismiss this push alert')).toBe(true);
      expect(isEndOfDaySummaryPrompt('Show end of day summary push')).toBe(
        true,
      );
      expect(
        isNewBookingPushActionsPrompt(
          'What can I do from the new booking push',
        ),
      ).toBe(true);
      expect(isSummarizeDayOnlyPrompt('Summarize my day today')).toBe(true);
      expect(isEndOfDaySummaryPrompt('Summarize my day today')).toBe(false);
    });

    it('detects mark_all/mark_booking/list_push_notifications prompts (ai-cmd-provider-6.8)', () => {
      expect(
        isMarkAllNotificationsReadPrompt('Mark all notifications as read'),
      ).toBe(true);
      expect(
        isMarkAllNotificationsReadPrompt('Mark everything as read'),
      ).toBe(true);
      expect(isMarkAllNotificationsReadPrompt('Clear all notifications')).toBe(
        false,
      );

      expect(
        isMarkBookingNotificationsReadPrompt(
          "Mark this booking's notifications as read",
        ),
      ).toBe(true);
      expect(
        isMarkBookingNotificationsReadPrompt(
          'Mark all notifications as read',
        ),
      ).toBe(false);

      expect(isListPushNotificationsPrompt('Show my notifications')).toBe(
        true,
      );
      expect(isListPushNotificationsPrompt('Open notification center')).toBe(
        true,
      );
      expect(
        isListPushNotificationsPrompt('What notifications do I have?'),
      ).toBe(true);
      expect(
        isListPushNotificationsPrompt('Open booking from push notification'),
      ).toBe(false);
      expect(
        isListPushNotificationsPrompt('Explain the last push notification'),
      ).toBe(false);
    });

    it('formats provider push notification center summary', () => {
      expect(
        summarizeProviderPushNotificationCenter({ unreadCount: 0, items: [] }),
      ).toContain('No notifications');
      expect(
        summarizeProviderPushNotificationCenter({
          unreadCount: 1,
          items: [
            { title: 'New booking', body: 'Anna — Cut', isRead: false },
            { title: 'Confirmed', body: 'Sam — Color', isRead: true },
          ],
        }),
      ).toContain('1 unread of 2 notifications');
    });

    it('detects dashboard and customer notification prompts', () => {
      expect(
        isConfigurePushRecipientsPrompt(
          'Configure push recipients for managers',
        ),
      ).toBe(true);
      expect(isTestPushPrompt('Send test push to my phone')).toBe(true);
      expect(isTestPushPrompt('Test webhook delivery')).toBe(false);
      expect(isNotificationHistoryPrompt('Show notification history')).toBe(
        true,
      );
      expect(
        isNotificationHistoryPrompt('Enable order status notifications'),
      ).toBe(false);
      expect(
        isToggleBusinessEmailOnCustomerChangePrompt(
          'Enable email when customers cancel',
        ),
      ).toBe(true);
      expect(
        isEnableNotificationsPrompt('Enable appointment notifications'),
      ).toBe(true);
      expect(
        isEnableNotificationsPrompt(
          'Configure notification settings — enable email and WhatsApp, disable SMS',
        ),
      ).toBe(false);
      expect(
        rescuePushNotificationsIntent(
          'Configure WhatsApp integration for the salon',
          'unknown',
        )?.action,
      ).toBe('configure_whatsapp_integration');
      expect(
        isEnableNotificationsPrompt('Enable order status notifications'),
      ).toBe(false);
      expect(
        isAppointmentReminderPreferencesPrompt(
          'Set appointment reminder preferences',
        ),
      ).toBe(true);
      expect(
        isEnableNotificationsPrompt('Turn off appointment reminders'),
      ).toBe(false);
      expect(
        isAppointmentReminderPreferencesPrompt(
          'Why is the reminder amount in dram wrong?',
        ),
      ).toBe(false);
    });
  });

  describe('extractors and helpers', () => {
    it('extracts push, toggle, and recipient fields', () => {
      expect(
        resolveCommandPromptText('from prompt', { _prompt: 'ignored' }),
      ).toBe('from prompt');
      expect(resolveCommandPromptText('', { _prompt: 'from params' })).toBe(
        'from params',
      );
      expect(resolveCommandPromptText(undefined, {})).toBe('');
      expect(
        extractBookingIdFromPushPrompt(
          'open booking 11111111-1111-4111-8111-111111111111',
        ),
      ).toBe('11111111-1111-4111-8111-111111111111');
      expect(
        extractPushRecipientNamesFromPrompt(
          'add push recipients for Maria Torgomyan',
        ),
      ).toEqual(['Maria Torgomyan']);
      expect(
        extractNotificationToggleFromPrompt('enable manager push alerts'),
      ).toBe(true);
      expect(extractNotificationToggleFromPrompt('disable alerts')).toBe(false);
      expect(extractReminderHoursFromPrompt('remind me 24 hours before')).toBe(
        24,
      );

      const payload = parseProviderLastPushPayload({
        title: 'New appointment',
        body: 'Anna — haircut',
        pushType: 'booking_created',
        bookingId: 'b1',
        actions: [{ id: 'confirm', label: 'Confirm' }],
      });
      expect(payload?.pushType).toBe('booking_created');
      expect(explainLastPushSummary(payload!)).toContain('Confirm');

      expect(
        explainLastPushSummary({ pushType: 'end_of_day', title: 'EOD' }),
      ).toContain('End-of-day');
      expect(explainLastPushSummary({ pushType: 'booking_updated' })).toContain(
        'Booking update',
      );
      expect(explainLastPushSummary({ pushType: 'custom_type' })).toContain(
        'custom_type',
      );
      expect(explainLastPushSummary({})).toContain('No push details');

      expect(buildNewBookingPushActionsGuide().actions).toHaveLength(3);
      expect(
        buildOfflineQueueStatusSummary({ online: false, queuedCount: 2 }),
      ).toContain('offline');
      expect(
        buildOfflineQueueStatusSummary({ online: false, queuedCount: 0 }),
      ).toContain('will queue');
      expect(
        buildOfflineQueueStatusSummary({ online: true, queuedCount: 3 }),
      ).toContain('syncing');
      expect(
        buildOfflineQueueStatusSummary({ online: true, queuedCount: 0 }),
      ).toContain('no offline');
      expect(
        buildRetryOfflineActionGuidance({ online: false, queuedCount: 1 })
          .canRetry,
      ).toBe(false);
      expect(
        buildRetryOfflineActionGuidance({ online: true, queuedCount: 2 })
          .canRetry,
      ).toBe(true);
      expect(
        buildRetryOfflineActionGuidance({ online: true, queuedCount: 0 })
          .canRetry,
      ).toBe(false);

      expect(parseProviderLastPushPayload(null)).toBeNull();
      expect(
        parseProviderLastPushPayload({ actions: [{ id: '', label: 'x' }] })
          ?.actions,
      ).toEqual([]);
    });
  });

  describe('rescuePushNotificationsIntent', () => {
    it('rescues all push/notification intents from unknown', () => {
      expect(
        rescuePushNotificationsIntent('Explain last push', 'unknown')?.action,
      ).toBe('explain_last_push');
      expect(
        rescuePushNotificationsIntent('Open booking from push', 'unknown')
          ?.action,
      ).toBe('open_booking_from_push');
      expect(
        rescuePushNotificationsIntent('Offline queue status', 'unknown')
          ?.action,
      ).toBe('offline_queue_status');
      expect(
        rescuePushNotificationsIntent('Retry offline queue', 'unknown')?.action,
      ).toBe('retry_offline_action');
      expect(
        rescuePushNotificationsIntent('Dismiss push banner', 'unknown')?.action,
      ).toBe('dismiss_push');
      expect(
        rescuePushNotificationsIntent('End of day summary push', 'unknown')
          ?.action,
      ).toBe('end_of_day_summary');
      expect(
        rescuePushNotificationsIntent('New booking push actions', 'unknown')
          ?.action,
      ).toBe('new_booking_push_actions');
      expect(
        rescuePushNotificationsIntent('Configure push recipients', 'unknown')
          ?.action,
      ).toBe('configure_push_recipients');
      expect(
        rescuePushNotificationsIntent('Send test push', 'unknown')?.action,
      ).toBe('test_push');
      expect(
        rescuePushNotificationsIntent('Notification history', 'unknown')
          ?.action,
      ).toBe('notification_history');
      expect(
        rescuePushNotificationsIntent(
          'Disable email when customers reschedule',
          'unknown',
        )?.action,
      ).toBe('toggle_business_email_on_customer_change');
      expect(
        rescuePushNotificationsIntent('Enable notifications', 'unknown')
          ?.action,
      ).toBe('enable_notifications');
      expect(
        rescuePushNotificationsIntent(
          'Appointment reminder preferences',
          'unknown',
        )?.action,
      ).toBe('appointment_reminder_preferences');
      expect(
        rescuePushNotificationsIntent(
          'Mark all notifications as read',
          'unknown',
        )?.action,
      ).toBe('mark_all_notifications_read');
      expect(
        rescuePushNotificationsIntent(
          "Mark this booking's notifications as read",
          'unknown',
        )?.action,
      ).toBe('mark_booking_notifications_read');
      expect(
        rescuePushNotificationsIntent('Show my notifications', 'unknown')
          ?.action,
      ).toBe('list_push_notifications');
    });

    it('skips rescue for compounds and collisions', () => {
      expect(
        rescuePushNotificationsIntent('Explain last push', 'explain_last_push'),
      ).toBeNull();
      expect(
        rescuePushNotificationsIntent(
          'Explain last push and show offline queue status',
          'compound_intent',
        ),
      ).toBeNull();
      expect(
        rescuePushNotificationsIntent('Book a haircut tomorrow', 'unknown'),
      ).toBeNull();
    });
  });

  describe('compound decomposition', () => {
    it('detects and decomposes push/notification compound prompts', () => {
      expect(
        isPushNotificationsCompoundPrompt(
          'Explain last push and show offline queue status',
        ),
      ).toBe(true);
      expect(isPushNotificationsCompoundPrompt('Explain last push')).toBe(
        false,
      );
      expect(isPushNotificationsCompoundPrompt('short')).toBe(false);

      const explainQueue = decomposePushNotificationsCompoundPrompt(
        'Explain last push and show offline queue status',
      );
      expect(explainQueue.map((s) => s.action)).toEqual([
        'explain_last_push',
        'offline_queue_status',
      ]);

      const historyTest = decomposePushNotificationsCompoundPrompt(
        'Show notification history and send test push',
      );
      expect(historyTest.map((s) => s.action)).toEqual([
        'notification_history',
        'test_push',
      ]);

      const customer = decomposePushNotificationsCompoundPrompt(
        'Enable notifications and set appointment reminder preferences',
      );
      expect(customer.map((s) => s.action)).toEqual([
        'enable_notifications',
        'appointment_reminder_preferences',
      ]);

      const eodActions = decomposePushNotificationsCompoundPrompt(
        'End of day summary push and new booking push actions',
      );
      expect(eodActions.map((s) => s.action)).toEqual([
        'end_of_day_summary',
        'new_booking_push_actions',
      ]);

      expect(PUSH_NOTIFICATIONS_INTENTS.length).toBe(18);
      expect(isPushNotificationsIntent('test_push')).toBe(true);
      expect(isPushNotificationsIntent('not_real')).toBe(false);
      expect(decomposePushNotificationsCompoundPrompt('')).toEqual([]);
      expect(
        decomposePushNotificationsCompoundPrompt(
          'unrelated gibberish only here',
        ),
      ).toEqual([]);
      expect(
        decomposePushNotificationsCompoundPrompt(
          'explain last push; dismiss push',
        ),
      ).toHaveLength(2);
      expect(
        decomposePushNotificationsCompoundPrompt(
          'retry offline queue and dismiss push',
        )[0].action,
      ).toBe('retry_offline_action');
      expect(
        extractPushRecipientNamesFromPrompt('configure for Anna, Bob'),
      ).toEqual(['Anna', 'Bob']);
      expect(
        isOpenBookingFromPushPrompt(
          'Navigate to appointment from the push alert',
        ),
      ).toBe(true);
      expect(isDismissPushPrompt('Clear notification banner')).toBe(true);
      expect(
        decomposePushNotificationsCompoundPrompt(
          'reminder 12 hours before appointment',
        )[0].params.reminderHoursBefore,
      ).toBe(12);
      expect(
        decomposePushNotificationsCompoundPrompt(
          'explain last push; random only segment',
        ).length,
      ).toBe(1);
    });

    it('covers remaining util branches', () => {
      expect(isOfflineQueueStatusPrompt('offline queue status please')).toBe(
        true,
      );
      expect(
        isOfflineQueueStatusPrompt('how many queued actions offline'),
      ).toBe(true);
      expect(
        extractPushRecipientNamesFromPrompt('add Zoe to push recipients'),
      ).toEqual(['Zoe']);
      expect(extractNotificationToggleFromPrompt('activate alerts')).toBe(true);
      expect(extractNotificationToggleFromPrompt('deactivate alerts')).toBe(
        false,
      );
      expect(resolveNotificationEnabledFromPrompt('activate alerts')).toBe(
        true,
      );
      expect(resolveNotificationEnabledFromPrompt('deactivate alerts')).toBe(
        false,
      );
      expect(resolveNotificationEnabledFromPrompt('notifications only')).toBe(
        true,
      );
      expect(
        resolveSmsRemindersWhenEnabling(true, { smsReminders: true }),
      ).toBe(true);
      expect(
        resolveSmsRemindersWhenEnabling(true, { smsReminders: false }),
      ).toBe(false);
      expect(
        resolveSmsRemindersWhenEnabling(false, { smsReminders: true }),
      ).toBe(false);
      expect(extractReminderHoursFromPrompt('no hours')).toBeNull();

      const fullPayload = parseProviderLastPushPayload({
        title: 'T',
        body: 'B',
        pushType: 'booking_created',
        bookingId: 'b1',
        businessId: 'biz-1',
        url: '/today',
        aiPrompt: 'Add buffer',
        foregroundHint: 'hint',
        actions: [
          { id: 'confirm', label: 'Confirm' },
          null,
          { id: '', label: 'x' },
        ],
      });
      expect(fullPayload?.url).toBe('/today');
      expect(fullPayload?.aiPrompt).toBe('Add buffer');
      expect(
        explainLastPushSummary({
          title: 'T',
          body: 'B',
          bookingId: 'b1',
          aiPrompt: 'follow up',
        }),
      ).toContain('follow up');

      expect(
        buildOfflineQueueStatusSummary({ online: false, queuedCount: 1 }),
      ).toContain('action.');
      expect(
        buildRetryOfflineActionGuidance({ online: false, queuedCount: 3 })
          .summary,
      ).toContain('Reconnect');

      expect(
        isToggleBusinessEmailOnCustomerChangePrompt(
          'notify business email when customers reschedule',
        ),
      ).toBe(true);
      expect(isEnableNotificationsPrompt('disable reminders')).toBe(true);
      expect(
        isAppointmentReminderPreferencesPrompt(
          'reminder settings hours before',
        ),
      ).toBe(true);
      expect(
        isEndOfDaySummaryPrompt('what does the end of day push mean'),
      ).toBe(true);
      expect(
        isNewBookingPushActionsPrompt('booking push buttons confirm'),
      ).toBe(true);
      expect(
        isConfigurePushRecipientsPrompt('manage provider push recipients'),
      ).toBe(true);
      expect(isExplainLastPushPrompt('understand this push notification')).toBe(
        true,
      );
      expect(isRetryOfflineActionPrompt('flush pending actions offline')).toBe(
        true,
      );
      expect(isDismissPushPrompt('ignore alert')).toBe(true);
      expect(parseProviderLastPushPayload('bad')).toBeNull();
      expect(
        rescuePushNotificationsIntent('offline queue status', 'unknown')
          ?.action,
      ).toBe('offline_queue_status');
      expect(
        rescuePushNotificationsIntent('retry offline queue', 'unknown')?.action,
      ).toBe('retry_offline_action');
      expect(
        rescuePushNotificationsIntent('dismiss push', 'unknown')?.action,
      ).toBe('dismiss_push');
      expect(
        rescuePushNotificationsIntent('open booking from push', 'unknown')
          ?.action,
      ).toBe('open_booking_from_push');
      expect(
        rescuePushNotificationsIntent('End of day summary push', 'unknown')
          ?.action,
      ).toBe('end_of_day_summary');
      expect(
        rescuePushNotificationsIntent('New booking push actions', 'unknown')
          ?.action,
      ).toBe('new_booking_push_actions');
      expect(isOfflineQueueStatusPrompt('pending sync while offline')).toBe(
        true,
      );
      expect(
        parseProviderLastPushPayload({
          actions: [{ label: 'No id' }, { id: 'ok', label: 'OK' }],
        })?.actions,
      ).toEqual([{ id: 'ok', label: 'OK' }]);
      expect(
        decomposePushNotificationsCompoundPrompt(
          'end of day summary push; new booking push actions',
        ).map((s) => s.action),
      ).toEqual(['end_of_day_summary', 'new_booking_push_actions']);
      expect(
        decomposePushNotificationsCompoundPrompt('; explain last push'),
      ).toHaveLength(1);
      expect(isOfflineQueueStatusPrompt("what's queued offline")).toBe(true);
      expect(isOfflineQueueStatusPrompt('sync status offline')).toBe(true);
      expect(
        decomposePushNotificationsCompoundPrompt(
          'explain last push;; dismiss push',
        ),
      ).toHaveLength(2);
      expect(
        decomposePushNotificationsCompoundPrompt(
          'open booking 11111111-1111-4111-8111-111111111111 from push and disable manager push alerts',
        )[0].params,
      ).toMatchObject({ bookingId: '11111111-1111-4111-8111-111111111111' });
      expect(
        decomposePushNotificationsCompoundPrompt(
          'configure push recipients for Maria and enable manager push alerts',
        )[0].params.recipientNames,
      ).toEqual(['Maria']);
      expect(
        parseProviderLastPushPayload({ actions: [{ id: 'x' }] })?.actions?.[0]
          .label,
      ).toBe('');
    });
  });
});
