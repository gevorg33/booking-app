import {
  CUSTOMER_ADOPT_6_GROWTH_INTENTS,
  PROVIDER_ADOPT_6_GROWTH_INTENTS,
} from './ai-adopt-6-growth-loops.fixtures.js';
import {
  handleEnablePushNotificationsLogic,
  handleExplainMyNotificationsLogic,
  handleExplainPushSetupLogic,
  handleFindMySavedSalonsLogic,
  handleManageNotificationPreferencesLogic,
  handleRebookLastAppointmentLogic,
  handleReferAFriendLogic,
} from './ai-adopt-6-growth-loops.logic.js';

describe('ai-adopt-6-growth-loops.logic (adopt-6.6)', () => {
  const baseDeps = {
    configService: { get: () => 'https://app.test' },
    businessRepo: { findOne: async () => ({ slug: 'demo-salon', name: 'Demo' }) },
    bookingRepo: { findOne: async () => null },
    customerRepo: { findOne: async () => null },
    notificationsService: {},
    employeeRepo: {},
    notificationLogRepo: {},
  } as never;

  it.each(CUSTOMER_ADOPT_6_GROWTH_INTENTS)('handles %s when signed out with clarify', async (action) => {
    let result;
    switch (action) {
      case 'explain_my_notifications':
        result = await handleExplainMyNotificationsLogic(baseDeps, 'biz-1', {});
        break;
      case 'manage_notification_preferences':
        result = await handleManageNotificationPreferencesLogic(baseDeps, 'biz-1', {}, 'prefs');
        break;
      case 'refer_a_friend':
        result = await handleReferAFriendLogic(baseDeps, 'biz-1', {});
        break;
      case 'rebook_last_appointment':
        result = await handleRebookLastAppointmentLogic(baseDeps, 'biz-1', {});
        break;
      case 'find_my_saved_salons':
        result = await handleFindMySavedSalonsLogic(baseDeps, 'biz-1', {});
        break;
    }
    expect(result?.success).toBe(false);
    expect(result?.action).toBe(action);
    expect(result?.details?.clarify).toBe(true);
  });

  it('explains notification preferences for signed-in customer', async () => {
    const result = await handleExplainMyNotificationsLogic(
      {
        ...baseDeps,
        customerRepo: {
          findOne: async () => ({
            id: 'cust-1',
            metadata: { notifications: { pushReminders: true, pushOffers: false } },
          }),
        },
      } as never,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Push reminders: on');
    expect(result.summary).toContain('Offers & rebook tips: off');
  });

  it('returns referral share url for signed-in customer', async () => {
    const result = await handleReferAFriendLogic(
      baseDeps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
    );
    expect(result.success).toBe(true);
    expect(result.details?.shareUrl).toContain('ref=');
  });

  it('returns one-tap rebook deep link from last completed visit', async () => {
    const result = await handleRebookLastAppointmentLogic(
      {
        ...baseDeps,
        bookingRepo: {
          findOne: async () => ({
            id: 'bk-1',
            serviceId: 'svc-1',
            employeeId: 'emp-1',
            startTime: new Date('2026-05-01T14:00:00.000Z'),
            service: { name: 'Haircut' },
            employee: { name: 'Anna' },
          }),
        },
      } as never,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
    );
    expect(result.success).toBe(true);
    expect(result.details?.deepLink).toContain('rebook=1');
    expect(result.summary).toContain('Haircut');
  });

  it('lists saved salons from customer metadata', async () => {
    const result = await handleFindMySavedSalonsLogic(
      {
        ...baseDeps,
        customerRepo: {
          findOne: async () => ({
            id: 'cust-1',
            metadata: { savedSalons: ['salon-a', 'salon-b'] },
          }),
        },
      } as never,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
    );
    expect(result.success).toBe(true);
    expect(result.details?.count).toBe(2);
  });

  it('returns enable push navigation hint for providers', () => {
    const result = handleEnablePushNotificationsLogic();
    expect(result.success).toBe(true);
    expect(result.action).toBe('enable_push_notifications');
    expect(result.details?.navigationHint).toBe('settings/notifications');
  });

  it.each(PROVIDER_ADOPT_6_GROWTH_INTENTS)(
    'provider intent %s returns actionable guidance',
    (action) => {
      const result =
        action === 'explain_push_setup'
          ? handleExplainPushSetupLogic()
          : handleEnablePushNotificationsLogic();
      expect(result.action).toBe(action);
      expect(result.success).toBe(true);
    },
  );
});
